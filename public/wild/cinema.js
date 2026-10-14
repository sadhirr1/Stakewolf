import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { createAnimatedCharacter } from './character.js';

// Three shares the area-light tables. Each renderer must release its GPU copy
// before teardown; surviving renderers can upload the retained table data again.
let areaLightUsers = 0;
const AREA_LIGHT_TABLES = ['LTC_FLOAT_1', 'LTC_FLOAT_2', 'LTC_HALF_1', 'LTC_HALF_2'];

// SCRUM-36. Real, locally hosted meshes and PBR surfaces; story state stays in state.js.
const ASSETS = {
  ground: '/wild/assets/forest-floor/',
  bark: '/wild/assets/bark/',
  fern: '/wild/assets/fern/fern.gltf',
  rock: '/wild/assets/rock-moss/rock-moss.gltf',
  pine: '/wild/assets/pine/pine.gltf',
  wolf: '/wild/assets/warg/warg.glb',
  ash: '/wild/assets/warg/ash.jpg',
  black: '/wild/assets/warg/black.jpg'
};
const PEOPLE = {
  orin: { x: -5.9, z: 0.5, scale: 1.03, phase: 0 },
  sera: { x: -0.15, z: -2.9, scale: 0.98, phase: 0.31, coat: 'black', introClipName: 'IdlePant' },
  vela: { x: -1.8, z: 3.9, scale: 1.05, phase: 0.67, coat: 'ash' }
};
const MORNING = new Set(['crossing-guided', 'anchor-found', 'trail-checked']);
const PINES = [
  { x: -10.8, z: 4.5, height: 12, angle: 0.4 },
  { x: 0.7, z: -13.5, height: 11, angle: 1.9 },
  { x: 13, z: -9, height: 14, angle: 2.6 },
  { x: -12.2, z: -10.2, height: 13, angle: 4.1 }
];
const STOPS = {
  overlook: { eye: [5.4, 2.15, 13.4], target: [-3.5, 1.45, -3.5] },
  council: { eye: [3.8, 2.65, 7.5], target: [-3.8, 1.15, -0.3] },
  trail: { eye: [5.0, 3.0, -3.4], target: [-0.9, 2.1, -20.5] },
  crossing: { eye: [13.3, 3.2, 3.7], target: [8.0, 0.9, -5.3] }
};
function blocksCameraSightline(x, z, trunkRadius) {
  return Object.values(STOPS).some(({ eye, target }) => {
    const dx = target[0] - eye[0], dz = target[2] - eye[2];
    const lengthSquared = dx * dx + dz * dz;
    const t = lengthSquared ? Math.max(0, Math.min(1, ((x - eye[0]) * dx + (z - eye[2]) * dz) / lengthSquared)) : 0;
    return Math.hypot(x - eye[0] - t * dx, z - eye[2] - t * dz) < 2.3 + trunkRadius;
  });
}
const riverX = z => 8.7 + Math.sin(z * 0.065) * 2.2;
function groundY(x, z) {
  const bank = Math.abs(x - riverX(z)) - 1.85;
  const hill = Math.sin(x * 0.19 + z * 0.13) * 0.12 + Math.cos(z * 0.23) * 0.13;
  return hill + Math.max(0, -z - 14) * 0.019 - Math.max(0, 1 - bank) * 0.5;
}
const ANCHOR = new THREE.Vector3(riverX(-5.2) + 2.4, 0.83, -4.27);

// Pure helpers also make camera framing independently checkable without a GPU.
export function projectCinemaPoint(point, camera, width, height, settled = true) {
  const clip = new THREE.Vector4(point.x, point.y, point.z, 1)
    .applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
  const valid = Number.isFinite(clip.w) && Math.abs(clip.w) > 0.00001;
  return {
    x: valid ? (clip.x / clip.w + 1) * width / 2 : -9999,
    y: valid ? (1 - clip.y / clip.w) * height / 2 : -9999,
    visible: Boolean(settled && valid && width > 0 && height > 0 && clip.w > 0 &&
      Math.abs(clip.x) <= clip.w && Math.abs(clip.y) <= clip.w && Math.abs(clip.z) <= clip.w)
  };
}

export function createForestScene(canvas, options = {}) {
  const noop = () => {};
  const inert = { travelTo: noop, focusPerson: noop, setDawn: noop, setMorning: noop,
    setOutcome: noop, setPaused: noop, setReducedMotion: noop, dispose: noop };
  let renderer;
  // Three installs these listeners before acquiring a context. Capture them so a
  // constructor failure does not leave an unreachable renderer attached to canvas.
  const constructionListeners = [];
  const originalAdd = canvas.addEventListener;
  try {
    canvas.addEventListener = function(type, listener, settings) {
      constructionListeners.push([type, listener, settings]);
      return originalAdd.call(this, type, listener, settings);
    };
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false,
      powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (error) {
    constructionListeners.forEach(args => canvas.removeEventListener?.(...args));
    options.onFailure?.('The detailed forest view is unavailable on this device. The story controls still work.');
    return inert;
  } finally {
    canvas.addEventListener = originalAdd;
  }

  let disposed = false, failed = false, cleaned = false, built = false, ready = false;
  let paused = false, reduced = Boolean(options.reducedMotion), dawn = false;
  let outcome = null, morning = null, location = 'overlook', focused = null, orbit = null;
  let frame = 0, lastTime = 0, elapsed = 0, cssWidth = 1, cssHeight = 1;
  let focusMix = 0, desiredFocus = 0, framing = 0, desiredFraming = 0;
  let resizeObserver, assetTimeout, loadingManager, areaLightLease = false;
  const startedAt = performance.now();
  let loadMs = 0, renderedFrames = 0, intervalSum = 0, intervalCount = 0, metricsWindows = 0, windowStartFrame = 0;
  let currentPixelRatio = 1, pixelRatioLimit = Infinity, pendingResize = false;
  const geometries = new Set(), materials = new Set(), textures = new Set(), bitmaps = new Set();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.10, 150);
  const aim = new THREE.Vector3(...STOPS.overlook.target);
  const destinationEye = new THREE.Vector3(...STOPS.overlook.eye);
  const destinationAim = aim.clone();
  camera.position.copy(destinationEye);
  const actors = new Map(), characters = [], windUniforms = [];
  const fireParts = [], lanterns = [], motes = [];
  const variants = { repair: new THREE.Group(), hold: new THREE.Group(),
    'crossing-guided': new THREE.Group(), 'anchor-found': new THREE.Group(), 'trail-checked': new THREE.Group() };
  const looseAnchor = new THREE.Group(), resetAnchor = new THREE.Group();
  let moonLight, fireLight, sky, stars, water, hemi, inspectionLight, portraitLight;
  const portraitLightPosition = new THREE.Vector3(), portraitLightTarget = new THREE.Vector3();
  let seed = 77139;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const range = (a, b) => a + random() * (b - a);
  const v = (x, y, z) => new THREE.Vector3(x, y, z);

  function ownGeometry(value) {
    if (disposed || failed) value.dispose(); else geometries.add(value);
    return value;
  }
  function ownTexture(value) {
    if (disposed || failed) {
      value.dispose(); const bitmap = value.source?.data;
      if (bitmap?.close && !bitmaps.has(bitmap)) { bitmap.close(); bitmaps.add(bitmap); }
    }
    else textures.add(value);
    return value;
  }
  function ownMaterial(value) {
    const list = Array.isArray(value) ? value : [value];
    for (const material of list) {
      for (const property of Object.values(material)) if (property?.isTexture) ownTexture(property);
      if (disposed || failed) material.dispose(); else materials.add(material);
    }
    return value;
  }
  function registerModel(root) {
    root.traverse(node => {
      if (node.geometry) ownGeometry(node.geometry);
      if (node.material) ownMaterial(node.material);
    });
  }
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    cancelAnimationFrame(frame); frame = 0; clearTimeout(assetTimeout);
    loadingManager?.abort();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', visibility);
    canvas.removeEventListener('webglcontextlost', contextLost);
    characters.forEach(character => character.dispose());
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => {
      texture.dispose();
      const bitmap = texture.source?.data;
      if (bitmap?.close && !bitmaps.has(bitmap)) { bitmap.close(); bitmaps.add(bitmap); }
    });
    scene.traverse(node => { node.shadow?.dispose(); if (node.isInstancedMesh) node.dispose(); });
    scene.clear();
    if (areaLightLease) {
      areaLightLease = false; areaLightUsers--;
      AREA_LIGHT_TABLES.forEach(name => THREE.UniformsLib[name]?.dispose());
    }
    renderer.dispose();
    geometries.clear(); materials.clear(); textures.clear(); actors.clear();
    characters.length = windUniforms.length = fireParts.length = lanterns.length = motes.length = 0;
    Object.values(variants).forEach(group => group.clear()); looseAnchor.clear(); resetAnchor.clear();
    moonLight = fireLight = sky = stars = water = hemi = inspectionLight = portraitLight = null;
  }
  function fail(message, error) {
    if (disposed || failed) return;
    failed = true;
    cleanup();
    options.onProject?.(['orin', 'sera', 'vela', 'anchor'].map(id => ({ id, x: -9999, y: -9999, visible: false })));
    if (error) console.warn('Stakewolf detailed forest:', error);
    options.onFailure?.(message);
  }
  loadingManager = new THREE.LoadingManager();
  // GLTFLoader can resolve a mesh after swallowing an embedded-image failure.
  // Required texture failures must therefore fail the whole visual benchmark.
  loadingManager.onError = () => fail('A required forest texture could not be loaded. The story controls still work; reload to try again.');
  const modelLoader = new GLTFLoader(loadingManager);
  const textureLoader = new THREE.TextureLoader(loadingManager);
  function loadModel(url) {
    return new Promise((resolve, reject) => modelLoader.load(url, model => {
      registerModel(model.scene);
      if (disposed || failed) reject(new Error('Scene ended during asset loading'));
      else resolve(model);
    }, undefined, reject));
  }
  function loadTexture(url, color = false, flipY = true) {
    return new Promise((resolve, reject) => {
      const texture = ownTexture(textureLoader.load(url, loaded => {
        if (disposed || failed) { loaded.dispose(); reject(new Error('Scene ended during texture loading')); return; }
        loaded.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        loaded.wrapS = loaded.wrapT = THREE.RepeatWrapping;
        loaded.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        resolve(loaded);
      }, undefined, reject));
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.flipY = flipY;
    });
  }
  const standard = settings => ownMaterial(new THREE.MeshStandardMaterial(settings));
  const basic = settings => ownMaterial(new THREE.MeshBasicMaterial(settings));
  function mesh(geometry, material, parent = scene, shadow = true) {
    const result = new THREE.Mesh(ownGeometry(geometry), material);
    result.castShadow = shadow; result.receiveShadow = true; parent.add(result); return result;
  }
  function box(position, scale, material, parent = scene, angle = 0) {
    const result = mesh(new THREE.BoxGeometry(...scale), material, parent);
    result.position.set(...position); result.rotation.y = angle; return result;
  }
  function beam(a, b, radius, material, parent = scene, top = radius, segments = 8) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const result = mesh(new THREE.CylinderGeometry(top, radius, delta.length(), segments, 1), material, parent);
    result.position.copy(start.add(end).multiplyScalar(0.5));
    result.quaternion.setFromUnitVectors(v(0, 1, 0), delta.normalize()); return result;
  }
  function cord(points, radius, material, parent = scene) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))),
      Math.max(8, points.length * 4), radius, 5, false), material, parent, false);
  }
  function canvasTexture(size, draw) {
    const surface = document.createElement('canvas'); surface.width = surface.height = size;
    const context = surface.getContext('2d');
    if (!context) throw new Error('Texture drawing context unavailable');
    draw(context, size);
    const result = ownTexture(new THREE.CanvasTexture(surface)); result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }
  function glowTexture() {
    return canvasTexture(128, (ctx, size) => {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, '#ffffffff'); gradient.addColorStop(0.15, '#ffffffc0');
      gradient.addColorStop(0.5, '#ffffff28'); gradient.addColorStop(1, '#ffffff00');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
    });
  }
  function makeSprite(texture, color, opacity, size, position, parent = scene) {
    const material = ownMaterial(new THREE.SpriteMaterial({ map: texture, color, opacity, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending }));
    const sprite = new THREE.Sprite(material); sprite.position.set(...position); sprite.scale.set(size, size, 1);
    parent.add(sprite); return sprite;
  }
  function makeLantern(x, y, z, parent, palette, glow, scale = 1) {
    const group = new THREE.Group(); group.position.set(x, y, z); group.scale.setScalar(scale); parent.add(group);
    box([0, 0, 0], [0.16, 0.27, 0.16], palette.glass, group);
    box([0, 0.16, 0], [0.24, 0.04, 0.24], palette.iron, group);
    box([0, -0.16, 0], [0.22, 0.04, 0.22], palette.iron, group);
    for (const dx of [-1, 1]) for (const dz of [-1, 1])
      beam([dx * 0.09, -0.16, dz * 0.09], [dx * 0.09, 0.16, dz * 0.09], 0.012, palette.iron, group);
    const halo = makeSprite(glow, 0xffbd63, 0.34, 1.35, [0, 0, 0], group);
    lanterns.push(halo); return group;
  }
  function makeTent(x, z, angle, size, palette, glow) {
    const group = new THREE.Group(); group.position.set(x, groundY(x, z), z); group.rotation.y = angle;
    group.scale.setScalar(size); scene.add(group);
    const geometry = new THREE.BufferGeometry();
    const points = [], uvs = [], indices = [];
    for (const side of [-1, 1]) {
      const start = points.length / 3;
      for (let row = 0; row <= 12; row++) for (let column = 0; column <= 12; column++) {
        const u = row / 12, t = column / 12;
        points.push(side * u * 1.45, (1 - u) * 2.20 - Math.sin(u * Math.PI) * 0.16, t * 3.5 - 1.75);
        uvs.push(u, t);
      }
      for (let row = 0; row < 12; row++) for (let column = 0; column < 12; column++) {
        const a = start + row * 13 + column, b = a + 1, c = a + 13, d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    mesh(geometry, palette.canvas, group);
    for (const end of [-1, 1]) beam([0, 0, end * 1.80], [0, 2.4, end * 1.80], 0.045, palette.wood, group);
    beam([0, 2.22, -1.95], [0, 2.22, 1.95], 0.046, palette.wood, group);
    for (const end of [-1, 1]) for (const side of [-1, 1]) {
      cord([[side * 1.33, 0.2, end * 1.6], [side * 1.84, 0.07, end * 1.94]], 0.008, palette.rope, group);
      beam([side * 1.84, 0, end * 1.94], [side * 1.84, 0.23, end * 1.94], 0.023, palette.wood, group);
    }
    makeLantern(-0.4, 0.4, 1.84, group, palette, glow, 0.75);
  }

  function surface(maps, repeats, color = 0xffffff) {
    maps.forEach(map => map.repeat.set(...repeats));
    return standard({ map: maps[0], normalMap: maps[1], aoMap: maps[2], roughnessMap: maps[2],
      metalnessMap: maps[2], metalness: 0, roughness: 1, normalScale: new THREE.Vector2(0.75, 0.75), color });
  }
  function instanced(geometry, material, transforms, shadows = false) {
    const result = new THREE.InstancedMesh(ownGeometry(geometry), material, transforms.length);
    transforms.forEach((matrix, index) => result.setMatrixAt(index, matrix));
    result.instanceMatrix.needsUpdate = true; result.castShadow = shadows; result.receiveShadow = true;
    result.computeBoundingSphere(); scene.add(result); return result;
  }
  const matrixAt = (x, y, z, sx, sy, sz, rotation = 0) => new THREE.Matrix4().compose(
    v(x, y, z), new THREE.Quaternion().setFromAxisAngle(v(0, 1, 0), rotation), v(sx, sy, sz));
  function scatterModel(model, name, placements, nominalHeight, shadow = false) {
    model.scene.updateMatrixWorld(true);
    const nodes = []; model.scene.traverse(node => { if (node.isMesh) nodes.push(node); });
    const source = nodes.find(node => node.name === name) || nodes[0];
    if (!source) throw new Error('Environment mesh contains no usable geometry');
    const bounds = new THREE.Box3().setFromObject(source), dimensions = bounds.getSize(v(0, 0, 0));
    const center = bounds.getCenter(v(0, 0, 0));
    const scale = nominalHeight / Math.max(dimensions.y, 0.001);
    const normalize = new THREE.Matrix4().makeScale(scale, scale, scale)
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z))
      .multiply(source.matrixWorld);
    return instanced(source.geometry, source.material, placements.map(p => matrixAt(p.x, groundY(p.x, p.z), p.z,
      p.size, p.size, p.size, p.angle).multiply(normalize)), shadow);
  }
  function plantPines(model) {
    model.scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model.scene), center = bounds.getCenter(v(0, 0, 0));
    const height = Math.max(0.001, bounds.max.y - bounds.min.y);
    const normalize = new THREE.Matrix4().makeScale(1 / height, 1 / height, 1 / height)
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
    let count = 0;
    model.scene.traverse(source => {
      if (!source.isMesh) return;
      count++;
      instanced(source.geometry, source.material, PINES.map(p => matrixAt(p.x, groundY(p.x, p.z), p.z,
        p.height, p.height, p.height, p.angle).multiply(normalize).multiply(source.matrixWorld)), true);
    });
    if (!count) throw new Error('The pine asset contains no usable geometry');
  }
  function pennant(x, z, parent, palette, size = 1) {
    const y = groundY(x, z);
    beam([x, y, z], [x, y + 1.07 * size, z], 0.024 * size, palette.wood, parent);
    const flag = mesh(new THREE.PlaneGeometry(0.40 * size, 0.24 * size, 3, 1), palette.flag, parent, false);
    flag.position.set(x + 0.18 * size, y + 0.89 * size, z); flag.rotation.y = -0.35;
  }
  function pathRibbon(points, width, material) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => v(x, 0, z)));
    const positions = [], uv = [], indices = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100, p = curve.getPoint(t), tangent = curve.getTangent(t);
      for (const side of [-1, 1]) {
        const x = p.x + tangent.z * width * side / 2, z = p.z - tangent.x * width * side / 2;
        positions.push(x, groundY(x, z) + 0.024, z); uv.push((side + 1) / 2, t * 18);
      }
      if (i < 100) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    mesh(geometry, material, scene, false);
  }
  function makeForest(groundMaps, barkMaps, fern, rock, wolf, pine, ash, black) {
    const coats = { ash, black };
    const groundMaterial = surface(groundMaps, [29, 33], 0x909982);
    const barkMaterial = surface(barkMaps, [1.8, 4.5], 0x9fa39b);
    const glow = glowTexture();
    const clothMap = canvasTexture(128, (ctx, size) => {
      ctx.fillStyle = '#a2a092'; ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < size; i += 2) {
        ctx.fillStyle = i % 4 ? '#969486' : '#b1ac9a'; ctx.fillRect(i, 0, 1, size);
        ctx.fillStyle = '#88887866'; ctx.fillRect(0, i, size, 1);
      }
    });
    clothMap.wrapS = clothMap.wrapT = THREE.RepeatWrapping; clothMap.repeat.set(5, 5);
    const palette = {
      wood: standard({ map: barkMaps[0], normalMap: barkMaps[1], roughness: 0.9, color: 0x82735c }),
      iron: standard({ color: 0x343938, roughness: 0.72, metalness: 0.55 }),
      rope: standard({ color: 0x8d8871, roughness: 0.95 }),
      canvas: standard({ color: 0x8e876d, map: clothMap, roughness: 0.98, side: THREE.DoubleSide }),
      flag: standard({ color: 0xd0b978, roughness: 1, side: THREE.DoubleSide }),
      glass: standard({ color: 0xffb75c, emissive: 0xffa334, emissiveIntensity: 2.8, roughness: 0.45 }),
      soot: standard({ color: 0x191d1b, roughness: 1 }),
      stone: standard({ color: 0x565e58, roughness: 1 })
    };

    const terrain = new THREE.PlaneGeometry(120, 140, 90, 100); terrain.rotateX(-Math.PI / 2);
    const vertices = terrain.attributes.position;
    for (let i = 0; i < vertices.count; i++) vertices.setY(i, groundY(vertices.getX(i), vertices.getZ(i)));
    terrain.computeVertexNormals(); mesh(terrain, groundMaterial, scene, false);
    const pathMap = ownTexture(groundMaps[0].clone()); pathMap.repeat.set(0.7, 1); pathMap.needsUpdate = true;
    const pathMaterial = standard({ map: pathMap, color: 0x655d4b, roughness: 1, side: THREE.DoubleSide });
    pathRibbon([[2, 18], [1, 8], [-3, 0], [-1.3, -9], [-1.7, -23], [0, -45]], 1.3, pathMaterial);
    pathRibbon([[-2, -2], [3, -4.6], [7, -5.2], [15, -5.2]], 1.1, pathMaterial);

    // Bark-covered instanced trunks have flared roots and varying lean. The dense
    // lower planting is made from a scanned fern mesh, not billboard silhouettes.
    const trunks = [], branches = [], foliage = [], roots = [];
    const treePositions = [];
    for (let i = 0; i < 112; i++) {
      const angle = range(0, Math.PI * 2), radius = range(9, 52);
      let x = -3 + Math.cos(angle) * radius, z = Math.sin(angle) * radius - 7;
      if (Math.abs(x - riverX(z)) < 3.2 || (Math.abs(x + 1.5) < 2.5 && z < -7)) continue;
      if (x > -1 && x < 8 && z > 3 && z < 18) continue;
      if (PINES.some(p => Math.hypot(x - p.x, z - p.z) < 3)) continue;
      const y = groundY(x, z), height = range(12, 23), thickness = range(0.30, 0.69);
      // Consume every candidate's canopy samples before exclusion so removing a
      // foreground trunk does not reshuffle any subsequent seeded placements.
      const canopy = [];
      for (let j = 0; j < 6; j++) canopy.push(matrixAt(x + range(-2.9, 2.9), y + height * range(0.63, 1.02),
        z + range(-2.9, 2.9), range(3, 5), 1, range(3, 5), range(0, 6.28)));
      if (blocksCameraSightline(x, z, thickness)) continue;
      treePositions.push({ x, y, z, height, thickness });
      trunks.push(matrixAt(x, y + height / 2, z, thickness, height, thickness, angle));
      roots.push(matrixAt(x, y + 0.45, z, thickness * 1.8, 0.9, thickness * 1.8, angle));
      for (let j = 0; j < 3; j++) {
        const a = angle + j * 2.2, start = v(x, y + height * (0.48 + j * 0.1), z);
        const end = v(x + Math.cos(a) * 3.1, start.y + 1.3, z + Math.sin(a) * 3.1);
        const delta = end.clone().sub(start);
        branches.push(new THREE.Matrix4().compose(start.add(end).multiplyScalar(0.5),
          new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), delta.clone().normalize()), v(0.13, delta.length(), 0.13)));
      }
      foliage.push(...canopy);
    }
    const trunkGeometry = new THREE.CylinderGeometry(0.46, 1, 1, 9, 5);
    instanced(trunkGeometry, barkMaterial, trunks, true);
    instanced(new THREE.CylinderGeometry(0.57, 1, 1, 9, 2), barkMaterial, roots, true);
    instanced(new THREE.CylinderGeometry(0.25, 1, 1, 6), barkMaterial, branches, false);
    const leaves = canvasTexture(128, ctx => {
      ctx.clearRect(0, 0, 128, 128);
      for (let i = 0; i < 75; i++) {
        const x = range(4, 124), y = range(4, 124);
        ctx.fillStyle = ['#4b6544', '#718261', '#354d39', '#829372'][i % 4];
        ctx.beginPath(); ctx.ellipse(x, y, range(5, 12), range(2, 5), range(0, 6.28), 0, 6.28); ctx.fill();
      }
    });
    const foliageMaterial = standard({ map: leaves, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: 0x7b906e });
    const crown = new THREE.PlaneGeometry(2, 2); crown.rotateX(-Math.PI / 2 + 0.2);
    instanced(crown, foliageMaterial, foliage, false);
    plantPines(pine);

    const fernPlaces = [], rockPlaces = [];
    for (let i = 0; i < 175; i++) {
      const x = range(-24, 24), z = range(-36, 20);
      if (Math.abs(x - riverX(z)) < 2.4 || (Math.abs(x + 1.4) < 1.3 && z < -6)) continue;
      if (Math.hypot(x + 3, z) < 4.5) continue;
      fernPlaces.push({ x, z, size: range(0.45, 1.05), angle: range(0, 6.28) });
    }
    for (const p of [[-7, 6], [1, 6.5], [-6, 2.8], [-1.5, 6.5], [-4, -6], [3, -9], [-5, -13], [-3, -18]])
      fernPlaces.push({ x: p[0], z: p[1], size: 1.05, angle: range(0, 6.28) });
    scatterModel(fern, 'fern_02_a', fernPlaces, 0.87);
    for (let i = 0; i < 23; i++) {
      const x = range(-18, 22), z = range(-30, 14);
      if (Math.hypot(x + 3, z) < 5 || Math.abs(x + 1.3) < 1.6) continue;
      rockPlaces.push({ x, z, size: range(0.35, 1.2), angle: range(0, 6.28) });
    }
    rockPlaces.push({ x: -8, z: 4, size: 1.2, angle: 2.1 }, { x: 9.8, z: 2, size: 0.9, angle: 1.2 });
    scatterModel(rock, 'rock_moss_set_01_rock03', rockPlaces, 0.9, true);

    // A low, uneven glint follows the stream; no expensive screen-space reflection.
    const waterGeometry = new THREE.PlaneGeometry(3.5, 120, 8, 80); waterGeometry.rotateX(-Math.PI / 2);
    const waterPositions = waterGeometry.attributes.position;
    for (let i = 0; i < waterPositions.count; i++) {
      const z = waterPositions.getZ(i); waterPositions.setX(i, waterPositions.getX(i) + riverX(z));
      waterPositions.setY(i, -0.49);
    }
    waterGeometry.computeVertexNormals();
    water = mesh(waterGeometry, standard({ color: 0x243d42, metalness: 0.35, roughness: 0.23,
      normalMap: groundMaps[1], normalScale: new THREE.Vector2(0.16, 0.16) }), scene, false);

    makeTent(-9.7, -2.7, 0.5, 1.0, palette, glow);
    makeTent(-5.5, -6.5, -0.2, 0.82, palette, glow);
    const fireY = groundY(-3, 0);
    mesh(new THREE.CylinderGeometry(0.87, 0.91, 0.025, 26), palette.soot).position.set(-3, fireY + 0.04, 0);
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2;
      const stone = mesh(new THREE.DodecahedronGeometry(range(0.16, 0.22), 1), palette.stone);
      stone.position.set(-3 + Math.cos(angle) * 0.82, fireY + 0.13, Math.sin(angle) * 0.82); stone.scale.y = 0.66;
    }
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      beam([-3 + Math.cos(a) * 0.53, fireY + 0.11, Math.sin(a) * 0.53],
        [-3 - Math.cos(a) * 0.5, fireY + 0.15, -Math.sin(a) * 0.5], 0.08, palette.soot);
    }
    for (let i = 0; i < 9; i++) {
      const flame = makeSprite(glow, i % 2 ? 0xff8926 : 0xffcc6c, 0.50, range(0.45, 0.80),
        [-3 + range(-0.31, 0.31), fireY + range(0.28, 0.62), range(-0.22, 0.22)]);
      flame.userData.baseY = flame.position.y; flame.userData.phase = i; fireParts.push(flame);
    }
    for (let i = 0; i < 18; i++) {
      const ember = makeSprite(glow, 0xffad54, 0.5, 0.045, [-3 + range(-0.3, 0.3), fireY + range(0.6, 2.1), range(-0.3, 0.3)]);
      ember.userData.phase = random(); motes.push(ember);
    }
    for (const [x, z, angle] of [[-5, -2.4, -0.4], [-2.2, -4.5, 0.6], [-0.2, 1.7, -0.5]]) {
      const y = groundY(x, z); const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = angle; scene.add(group);
      beam([-0.95, 0.24, 0], [0.95, 0.24, 0], 0.23, palette.wood, group, 0.2, 11);
    }
    box([-7.8, groundY(-7.8, -0.7) + 0.33, -0.7], [0.7, 0.65, 0.7], palette.wood, scene, 0.2);
    box([-7.3, groundY(-7.3, -1.5) + 0.22, -1.5], [0.9, 0.44, 0.55], palette.wood, scene, -0.1);
    makeLantern(-7.8, groundY(-7.8, -0.7) + 0.85, -0.7, scene, palette, glow);
    makeLantern(-0.7, groundY(-0.7, -7.3) + 0.30, -7.3, scene, palette, glow, 0.9);

    const bridgeX = riverX(-5.2), bridgeY = 0.30;
    for (let i = 0; i < 17; i++) box([bridgeX - 2.5 + i * 0.31, bridgeY, -5.2 + Math.sin(i * 1.8) * 0.028],
      [0.27, 0.13, 1.55], palette.wood, scene, range(-0.025, 0.025));
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) beam([bridgeX + end * 2.55, 0.05, -5.2 + side * 0.86],
        [bridgeX + end * 2.55, 1.3, -5.2 + side * 0.86], 0.075, palette.wood);
      cord([[bridgeX - 2.55, 1.15, -5.2 + side * 0.86], [bridgeX, 0.89, -5.2 + side * 0.86],
        [bridgeX + 2.55, 1.15, -5.2 + side * 0.86]], 0.024, palette.rope);
    }
    scene.add(looseAnchor, resetAnchor);
    cord([[ANCHOR.x - 0.55, 1.03, ANCHOR.z], [ANCHOR.x, 0.82, ANCHOR.z], [ANCHOR.x + 0.17, 0.12, ANCHOR.z]], 0.038, palette.rope, looseAnchor);
    cord([[ANCHOR.x - 0.55, 1.03, ANCHOR.z], [ANCHOR.x, 0.93, ANCHOR.z], [ANCHOR.x + 0.06, 0.78, ANCHOR.z],
      [ANCHOR.x - 0.12, 0.85, ANCHOR.z], [ANCHOR.x, 0.97, ANCHOR.z]], 0.04, palette.rope, resetAnchor);
    Object.values(variants).forEach(group => scene.add(group));
    for (const x of [bridgeX - 2.9, bridgeX + 2.9]) makeLantern(x, 0.55, -4.2, variants.repair, palette, glow);
    beam([bridgeX + 2.8, 0.82, -6], [bridgeX + 2.8, 0.82, -4.4], 0.045, palette.wood, variants.hold);
    for (const z of [-6, -4.4]) beam([bridgeX + 2.8, 0, z], [bridgeX + 2.8, 1.13, z], 0.043, palette.wood, variants.hold);
    pennant(ANCHOR.x + 0.25, ANCHOR.z + 0.2, variants['anchor-found'], palette, 1.05);
    const tag = box([ANCHOR.x + 0.10, 0.63, ANCHOR.z + 0.10], [0.24, 0.32, 0.035], palette.flag, variants['anchor-found']); tag.rotation.z = 0.18;
    for (const [x, z] of [[-1.2, -14.8], [-1.8, -20.5]]) pennant(x, z, variants['trail-checked'], palette);
    makeLantern(-0.65, groundY(-0.65, -15.1) + 0.25, -15.1, variants['trail-checked'], palette, glow);
    inspectionLight = new THREE.PointLight(0xffc48a, 7, 6, 2); inspectionLight.position.set(-0.7, 1, -15.1);
    variants['trail-checked'].add(inspectionLight);
    const trackMaterial = standard({ color: 0x373c32, roughness: 1 });
    for (let i = 0; i < 9; i++) {
      const x = -1.6 + (i % 2) * 0.33, z = -14.4 - i * 0.42;
      const pad = mesh(new THREE.SphereGeometry(0.08, 7, 4), trackMaterial, variants['trail-checked'], false);
      pad.scale.set(1, 0.08, 1.3); pad.position.set(x, groundY(x, z) + 0.033, z);
      for (const dx of [-0.055, 0, 0.055]) {
        const toe = mesh(new THREE.SphereGeometry(0.026, 5, 3), trackMaterial, variants['trail-checked'], false);
        toe.scale.y = 0.12; toe.position.set(x + dx, groundY(x, z - 0.10) + 0.033, z - 0.10);
      }
    }
    // This CC0 quadruped is a provisional rig benchmark, not the final cast.
    // Keep expensive forest shadows cached: animated bodies receive them but
    // use a modest terrain-conforming contact patch instead of frozen shadows.
    const contactTexture = canvasTexture(64, (ctx, size) => {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, '#ffffffcc'); gradient.addColorStop(0.42, '#ffffff70'); gradient.addColorStop(1, '#ffffff00');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
    });
    const contactMaterial = basic({ map: contactTexture, color: 0x040607, transparent: true, opacity: 0.48, depthWrite: false });
    function placeWolf(x, z, scale, angle, parent = scene, phase = 0, coat = null, introClipName = null) {
      const group = new THREE.Group(); group.position.set(x, groundY(x, z) + 0.015, z); group.rotation.y = angle;
      const character = createAnimatedCharacter(wolf, { phase, introClipName, materialFactory(source) {
        const variant = source.clone();
        if (coat) variant.map = coats[coat];
        return ownMaterial(variant);
      } }); characters.push(character);
      character.root.scale.multiplyScalar(scale); group.add(character.root); parent.add(group);
      const contactGeometry = new THREE.PlaneGeometry(1.2 * scale, 2.0 * scale, 6, 8);
      contactGeometry.rotateX(-Math.PI / 2); contactGeometry.translate(0, 0, 0.10 * scale);
      const positions = contactGeometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const px = positions.getX(i), pz = positions.getZ(i);
        const worldX = x + Math.cos(angle) * px + Math.sin(angle) * pz;
        const worldZ = z - Math.sin(angle) * px + Math.cos(angle) * pz;
        positions.setY(i, groundY(worldX, worldZ) - group.position.y + 0.025);
      }
      contactGeometry.computeVertexNormals();
      const contact = mesh(contactGeometry, contactMaterial, group, false); contact.receiveShadow = false;
      return { group, character };
    }
    for (const [id, person] of Object.entries(PEOPLE)) {
      const angle = Math.atan2(-3 - person.x, -person.z);
      const { group, character } = placeWolf(person.x, person.z, person.scale, angle, scene, person.phase, person.coat, person.introClipName);
      // Sample the real bone once. A quiet idle should not make the camera
      // chase its breathing motion or move when the player pauses it.
      const head = character.getHeadPosition(v(0, 0, 0));
      actors.set(id, { group, character, head, angle, body: group.position.clone() });
    }
    placeWolf(bridgeX - 3.7, -5.8, 0.75, -Math.PI / 2, variants['crossing-guided'], 0.13);
    placeWolf(bridgeX - 4.7, -4.8, 0.56, -Math.PI / 2 - 0.16, variants['crossing-guided'], 0.54);
    for (const x of [bridgeX - 4.8, bridgeX - 3]) makeLantern(x, 0.28, -6.5, variants['crossing-guided'], palette, glow, 0.8);

    sky = mesh(new THREE.SphereGeometry(115, 32, 16), ownMaterial(new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: { uDawn: { value: 0 } },
      vertexShader: 'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec3 direction;uniform float uDawn;
        void main(){
          float h=clamp(normalize(direction).y,0.,1.);
          vec3 night=mix(vec3(.044,.072,.09),vec3(.005,.013,.031),pow(h,.65));
          vec3 day=mix(vec3(.49,.36,.24),vec3(.15,.24,.29),pow(h,.65));
          gl_FragColor=vec4(mix(night,day,uDawn),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    })), scene, false); sky.renderOrder = -2;
    const starPositions = [];
    for (let i = 0; i < 250; i++) { const p = v(range(-1, 1), range(0.1, 1), range(-1, 1)).normalize().multiplyScalar(100); starPositions.push(...p.toArray()); }
    const starGeometry = ownGeometry(new THREE.BufferGeometry()); starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    stars = new THREE.Points(starGeometry, ownMaterial(new THREE.PointsMaterial({ color: 0xa4bcd1, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false })));
    scene.add(stars);
    makeSprite(glow, 0xb1c9e0, 0.45, 7, [-23, 36, -42]);
    const moonDisc = mesh(new THREE.CircleGeometry(1.35, 32), basic({ color: 0xc2d3dc, fog: false }), scene, false);
    moonDisc.position.set(-23, 36, -42); moonDisc.lookAt(0, 0, 0);
    // Long, translucent shafts occupy the distant trees, away from the encounter face.
    const shaftMaterial = basic({ color: 0x8baeb6, transparent: true, opacity: 0.025, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    for (const [x, z] of [[-10, -17], [4, -24], [-18, -29]]) {
      const shaft = mesh(new THREE.ConeGeometry(2, 23, 14, 1, true), shaftMaterial, scene, false);
      shaft.position.set(x, 10, z); shaft.rotation.z = -0.23;
    }
    hemi = new THREE.HemisphereLight(0x9ab8d0, 0x263023, 0.85); scene.add(hemi);
    moonLight = new THREE.DirectionalLight(0xb5cfeb, 2.4); moonLight.position.set(-12, 20, -12);
    moonLight.target.position.set(-3, 0, -3); scene.add(moonLight, moonLight.target); moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(1024, 1024); moonLight.shadow.camera.left = -18; moonLight.shadow.camera.right = 18;
    moonLight.shadow.camera.top = 18; moonLight.shadow.camera.bottom = -18; moonLight.shadow.camera.near = 1; moonLight.shadow.camera.far = 65;
    moonLight.shadow.normalBias = 0.045; moonLight.shadow.bias = -0.0003; moonLight.shadow.radius = 3;
    fireLight = new THREE.PointLight(0xffa55b, 22, 10, 2); fireLight.position.set(-3, fireY + 0.75, 0); scene.add(fireLight);
    const fireShadow = new THREE.SpotLight(0xffb572, 15, 12, 1.2, 0.65, 1.6);
    fireShadow.position.set(-3, 3.0, 0); fireShadow.target.position.set(-3, 0, 0);
    fireShadow.castShadow = false;
    scene.add(fireShadow, fireShadow.target); fireLight.userData.shadowLight = fireShadow;
    if (areaLightUsers === 0) RectAreaLightUniformsLib.init();
    areaLightUsers++; areaLightLease = true;
    portraitLight = new THREE.RectAreaLight(0xffe2bd, 0, 1.5, 1.8);
    scene.add(portraitLight);
    scene.fog = new THREE.FogExp2(0x1b303b, 0.020);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
    built = true; applyWorldState(); retarget(true);
  }

  function applyWorldState() {
    if (!built) return;
    for (const [name, group] of Object.entries(variants)) group.visible = name === outcome || name === morning;
    looseAnchor.visible = !(dawn && outcome === 'repair'); resetAnchor.visible = !looseAnchor.visible;
    sky.material.uniforms.uDawn.value = dawn ? 1 : 0; stars.visible = !dawn;
    moonLight.color.set(dawn ? 0xffd9a0 : 0xb5cfeb); moonLight.intensity = dawn ? 3.0 : 2.4;
    hemi.color.set(dawn ? 0xb7c8cc : 0x9ab8d0); hemi.intensity = dawn ? 1.15 : 0.85;
    scene.fog.color.set(dawn ? 0x7e8b84 : 0x1b303b); scene.fog.density = dawn ? 0.016 : 0.020;
    fireLight.intensity = dawn ? 5 : 22; fireLight.userData.shadowLight.intensity = dawn ? 3 : 15;
    lanterns.forEach(lamp => { lamp.material.opacity = dawn ? 0.16 : 0.34; });
    fireParts.forEach(flame => { flame.material.opacity = dawn ? 0.13 : 0.50; });
    renderer.shadowMap.needsUpdate = true;
  }
  function retarget(instant = false) {
    const actor = focused && actors.get(focused), portrait = cssWidth / cssHeight < 0.9;
    desiredFocus = actor ? 1 : 0; desiredFraming = actor && !portrait ? 0.30 : 0;
    if (actor) {
      const forward = v(Math.sin(actor.angle), 0, Math.cos(actor.angle));
      const side = v(Math.cos(actor.angle), 0, -Math.sin(actor.angle));
      destinationEye.copy(actor.head).addScaledVector(forward, portrait ? 3.05 : 1.95).addScaledVector(side, portrait ? 0.9 : 1.15);
      destinationEye.y = actor.head.y + (portrait ? 0.4 : 0.12);
      destinationAim.copy(actor.head); destinationAim.y -= portrait ? 0.70 : 0.17;
      // Broad, warm-neutral bounce from the camp side shapes the muzzle while
      // the existing moon remains a cool rim. It does not add a shadow pass.
      portraitLightPosition.copy(actor.head).addScaledVector(forward, 1.5).addScaledVector(side, -1.35);
      portraitLightPosition.y += 0.62; portraitLightTarget.copy(actor.head);
    } else {
      destinationEye.fromArray(STOPS[location].eye); destinationAim.fromArray(STOPS[location].target);
    }
    // Focus intent changes here; bones advance only in the gated animation tick.
    for (const [id, entry] of actors) entry.character.setFocus(id === focused ? destinationEye : null);
    if (instant) {
      camera.position.copy(destinationEye); aim.copy(destinationAim); focusMix = desiredFocus; framing = desiredFraming;
      if (!focused) orbit = null;
    }
  }
  function settled() {
    return camera.position.distanceToSquared(destinationEye) < 0.0016 && aim.distanceToSquared(destinationAim) < 0.0016 &&
      Math.abs(focusMix - desiredFocus) < 0.006 && Math.abs(framing - desiredFraming) < 0.003;
  }
  function moveCamera(easing) {
    const subject = orbit && actors.get(orbit);
    if (subject) {
      // Orbit the body for both entry and departure instead of cutting through it.
      const from = camera.position.clone().sub(subject.body), to = destinationEye.clone().sub(subject.body);
      const fromAngle = Math.atan2(from.x, from.z), toAngle = Math.atan2(to.x, to.z);
      const turn = Math.atan2(Math.sin(toAngle - fromAngle), Math.cos(toAngle - fromAngle));
      const angle = fromAngle + turn * easing;
      const radius = Math.max(2.7, Math.hypot(from.x, from.z) + (Math.hypot(to.x, to.z) - Math.hypot(from.x, from.z)) * easing);
      camera.position.x = subject.body.x + Math.sin(angle) * radius;
      camera.position.z = subject.body.z + Math.cos(angle) * radius;
      camera.position.y += (destinationEye.y - camera.position.y) * easing;
    } else camera.position.lerp(destinationEye, easing);
    aim.lerp(destinationAim, easing); focusMix += (desiredFocus - focusMix) * easing; framing += (desiredFraming - framing) * easing;
    if (settled()) { camera.position.copy(destinationEye); aim.copy(destinationAim); focusMix = desiredFocus; framing = desiredFraming; if (!focused) orbit = null; }
  }
  function projectAnchors(isSettled) {
    if (!options.onProject) return;
    const points = Array.from(actors, ([id, actor]) => ({ id, ...projectCinemaPoint(actor.head, camera, cssWidth, cssHeight, isSettled) }));
    points.push({ id: 'anchor', ...projectCinemaPoint(ANCHOR, camera, cssWidth, cssHeight, isSettled) });
    options.onProject(points);
  }
  function render() {
    if (disposed || failed || !built || document.hidden) return;
    try {
      if (pendingResize) applyDrawingSize();
      moveCamera(0);
      const portrait = cssWidth / cssHeight < 0.9;
      camera.fov = 48 - focusMix * (portrait ? 8 : 14); camera.aspect = cssWidth / cssHeight;
      camera.lookAt(aim); camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
      camera.projectionMatrix.elements[8] = framing; camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      portraitLight.position.copy(portraitLightPosition); portraitLight.lookAt(portraitLightTarget);
      portraitLight.color.set(dawn ? 0xffebd3 : 0xffe2bd);
      // The charcoal coat needs a little more night fill to separate its face
      // from the neck. Reuse the same area light; daylight and other roles stay unchanged.
      portraitLight.intensity = focusMix * (dawn ? 1.8 : focused === 'sera' ? 4.9 : 3.8);
      hemi.intensity = (dawn ? 1.15 : 0.85) * (1 - focusMix * 0.34);
      fireLight.intensity = (dawn ? 5 : 22) * (1 - focusMix * 0.74);
      fireLight.userData.shadowLight.intensity = (dawn ? 3 : 15) * (1 - focusMix * 0.55);
      fireParts.forEach((flame, i) => { flame.position.y = flame.userData.baseY + Math.sin(elapsed * 3.2 + i) * 0.065; });
      motes.forEach(ember => { ember.position.y = 0.55 + ((elapsed * 0.26 + ember.userData.phase) % 1) * 1.65; });
      renderer.render(scene, camera); renderedFrames++;
      projectAnchors(settled());
      if (!ready) { ready = true; loadMs = performance.now() - startedAt; options.onReady?.(); }
      if (metricsWindows < 2 && renderedFrames >= (metricsWindows === 0 ? 120 : 360)) {
        const average = intervalCount ? intervalSum / intervalCount : null;
        const size = renderer.getDrawingBufferSize(new THREE.Vector2());
        if (metricsWindows === 0 && intervalCount >= 30 && average > 32) {
          pixelRatioLimit = Math.min(currentPixelRatio, Math.max(0.75, currentPixelRatio * 0.8));
          pendingResize = pixelRatioLimit < currentPixelRatio;
        }
        metricsWindows++;
        options.onMetrics?.({ loadMs: Math.round(loadMs), renderedFrames, measurementWindow: metricsWindows, windowStartFrame,
          frameIntervalAverageMs: average,
          intervalSamples: intervalCount, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
          drawingBuffer: { width: size.x, height: size.y }, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
          resolutionReductionScheduled: pendingResize });
        intervalSum = 0; intervalCount = 0; windowStartFrame = renderedFrames;
      }
    } catch (error) { fail('The detailed forest view was interrupted. The story controls still work.', error); }
  }
  function tick(time) {
    frame = 0;
    if (disposed || failed || paused || reduced || document.hidden) { lastTime = 0; return; }
    const interval = lastTime ? Math.max(0, (time - lastTime) / 1000) : 0; lastTime = time;
    if (interval > 0) { intervalSum += interval * 1000; intervalCount++; }
    const step = Math.min(interval, 0.05);
    elapsed += step; characters.forEach(character => character.update(step));
    moveCamera(1 - Math.exp(-Math.min(interval, 1) * 3.2));
    render(); schedule();
  }
  function schedule() {
    if (!frame && built && !disposed && !failed && !paused && !reduced && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function applyDrawingSize() {
    const factor = Math.min(pixelRatioLimit, window.devicePixelRatio || 1, 1.25, Math.sqrt(1300000 / (cssWidth * cssHeight)));
    renderer.setPixelRatio(factor); renderer.setSize(cssWidth, cssHeight, false);
    currentPixelRatio = factor; pendingResize = false;
  }
  function resize() {
    if (disposed || failed) return;
    const rect = canvas.getBoundingClientRect(); cssWidth = Math.max(1, rect.width); cssHeight = Math.max(1, rect.height);
    applyDrawingSize();
    retarget(true); render(); schedule();
  }
  function visibility() {
    lastTime = 0;
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else { render(); schedule(); }
  }
  function contextLost(event) { event.preventDefault(); fail('The forest view was interrupted. The story controls still work.'); }
  canvas.addEventListener('webglcontextlost', contextLost);
  document.addEventListener('visibilitychange', visibility);
  if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas); }
  else window.addEventListener('resize', resize);
  resize();
  assetTimeout = setTimeout(() => fail('The detailed forest assets took too long to load. The story controls still work; reload to try again.'), 30000);
  Promise.all([
    Promise.all(['diffuse', 'normal', 'arm'].map((name, i) => loadTexture(`${ASSETS.ground}${name}.jpg`, i === 0))),
    Promise.all(['diffuse', 'normal', 'arm'].map((name, i) => loadTexture(`${ASSETS.bark}${name}.jpg`, i === 0))),
    loadModel(ASSETS.fern), loadModel(ASSETS.rock), loadModel(ASSETS.wolf), loadModel(ASSETS.pine),
    // These variants were flipped during packaging to match glTF UV orientation.
    loadTexture(ASSETS.ash, true, false), loadTexture(ASSETS.black, true, false)
  ]).then(assets => {
    if (disposed || failed) return;
    clearTimeout(assetTimeout);
    makeForest(...assets); resize(); render(); schedule();
  }).catch(error => fail('The detailed forest assets could not be loaded. The story controls still work; reload to try the forest again.', error));

  return {
    travelTo(next) {
      if (disposed || failed || typeof next !== 'string' || !Object.hasOwn(STOPS, next)) return;
      location = next; focused = null; retarget(paused || reduced); render(); schedule();
    },
    focusPerson(id) {
      if (disposed || failed || (id !== null && (typeof id !== 'string' || !Object.hasOwn(PEOPLE, id)))) return;
      focused = id; if (id) orbit = id; retarget(paused || reduced); render(); schedule();
    },
    setDawn(value) { if (disposed || failed) return; dawn = Boolean(value); applyWorldState(); render(); },
    setMorning(value) { if (disposed || failed || (value !== null && !MORNING.has(value))) return; morning = value; applyWorldState(); render(); },
    setOutcome(value) { if (disposed || failed) return; outcome = value === 'repair' || value === 'hold' ? value : null; applyWorldState(); render(); },
    setPaused(value) {
      if (disposed || failed) return; paused = Boolean(value); lastTime = 0;
      if (paused) { cancelAnimationFrame(frame); frame = 0; retarget(true); render(); } else schedule();
    },
    setReducedMotion(value) {
      if (disposed || failed) return; reduced = Boolean(value); lastTime = 0;
      if (reduced) { cancelAnimationFrame(frame); frame = 0; retarget(true); render(); } else schedule();
    },
    dispose() { if (disposed) return; disposed = true; cleanup(); }
  };
}
