import { Float32BufferAttribute, Vector3 } from 'three';

// SCRUM-36: call on an actor with its own material, BEFORE generating fur.
// Geometry is scene-owned; this helper never owns a skeleton, texture or clock.
export function attachCharacterPortrait(root, { ownMaterial, ownGeometry } = {}) {
  if (typeof ownMaterial !== 'function' || typeof ownGeometry !== 'function') throw new TypeError('Portrait resources require scene owners');
  const sources = [];
  root.traverse(node => {
    if (node.isSkinnedMesh && !Array.isArray(node.material) && node.material.isMeshPhysicalMaterial &&
      node.geometry.getAttribute('_fur_part') && !node.geometry.getAttribute('_fur_strand')) sources.push(node);
  });
  const records = [], uniforms = { uPortraitDetail: { value: 1 } };
  let disposed = false;
  const metadata = { meshes: 0, additionalDraws: 0, eyeVertices: 0, changedMuzzleVertices: 0, maximumDisplacement: 0 };
  for (const source of sources.slice(0, 1)) {
    const originalGeometry = source.geometry, geometry = originalGeometry.clone();
    const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal');
    const part = geometry.getAttribute('_fur_part'), flow = geometry.getAttribute('_fur_direction');
    if (!position || !normal || !flow) { geometry.dispose(); continue; }
    const p = new Vector3(), n = new Vector3(), d = new Vector3();
    // Undo a small portion of the creator's deliberately shortened, broad muzzle.
    // The same smooth deformation covers the upper/lower jaws and teeth, keeping
    // their relative closure intact. Bone names, weights, joints and UVs are untouched.
    for (let vertex = 0; vertex < position.count; vertex++) {
      p.fromBufferAttribute(position, vertex);
      const t = Math.max(0, Math.min(1, (-p.y - 1.12) / 0.24));
      if (t <= 0) continue;
      const w = t * t * (3 - 2 * t), derivative = t < 1 ? -6 * t * (1 - t) / 0.24 : 0;
      const a = 1 - 0.08 * w, b = -0.08 * p.x * derivative, c = 1 - 0.018 * derivative;
      const dx = p.x * (a - 1), dy = -0.018 * w;
      position.setXYZ(vertex, p.x + dx, p.y + dy, p.z);
      n.fromBufferAttribute(normal, vertex);
      n.set(n.x / a, (n.y - b * n.x / a) / c, n.z).normalize();
      normal.setXYZ(vertex, n.x, n.y, n.z);
      d.fromBufferAttribute(flow, vertex);
      if (d.lengthSq() > 0) {
        d.set(a * d.x + b * d.y, c * d.y, d.z);
        d.addScaledVector(n, -d.dot(n)).normalize(); flow.setXYZ(vertex, d.x, d.y, d.z);
      }
      metadata.changedMuzzleVertices++; metadata.maximumDisplacement = Math.max(metadata.maximumDisplacement, Math.hypot(dx, dy));
    }
    const eyeCoordinates = new Float32Array(position.count * 2), eyeFrames = [];
    for (const side of [-1, 1]) {
      const vertices = [];
      for (let vertex = 0; vertex < position.count; vertex++) if (part.getX(vertex) === 3 && Math.sign(position.getX(vertex)) === side) vertices.push(vertex);
      if (!vertices.length) continue;
      const center = new Vector3(), outward = new Vector3();
      for (const vertex of vertices) { center.add(p.fromBufferAttribute(position, vertex)); outward.add(n.fromBufferAttribute(normal, vertex)); }
      center.multiplyScalar(1 / vertices.length); outward.normalize();
      // Source eyes are almonds slanting back/up; physical iris coordinates use
      // equal units on both axes so the pupil remains round, not an oval decal.
      const across = new Vector3(0, 1, 0.45); across.addScaledVector(outward, -across.dot(outward)).normalize();
      const up = outward.clone().cross(across).normalize(); if (up.z < 0) up.negate();
      let radius = 0;
      for (const vertex of vertices) { p.fromBufferAttribute(position, vertex).sub(center); radius = Math.max(radius, Math.abs(p.dot(up))); }
      if (radius <= 1e-6) throw new Error('Cannot derive the actual eye surface frame');
      for (const vertex of vertices) {
        p.fromBufferAttribute(position, vertex).sub(center);
        eyeCoordinates[vertex * 2] = p.dot(across) / radius;
        eyeCoordinates[vertex * 2 + 1] = p.dot(up) / radius;
      }
      eyeFrames.push({ side, center: center.toArray(), normal: outward.toArray(), radius, vertices: vertices.length });
      metadata.eyeVertices += vertices.length;
    }
    geometry.setAttribute('_portrait_eye', new Float32BufferAttribute(eyeCoordinates, 2));
    geometry.setAttribute('_portrait_part', part);
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    geometry.userData.portrait = { eyeFrames, muzzleExtension: 0.018, muzzleTaper: 0.08 };
    source.geometry = ownGeometry(geometry);
    const material = source.material;
    const previous = { hook: material.onBeforeCompile, key: material.customProgramCacheKey,
      clearcoat: material.clearcoat, clearcoatRoughness: material.clearcoatRoughness };
    material.clearcoat = 0.8; material.clearcoatRoughness = 0.1;
    material.customProgramCacheKey = () => `${previous.key.call(material)}-portrait-v2`;
    material.onBeforeCompile = function(shader, renderer) {
      previous.hook.call(this, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = `
attribute vec2 _portrait_eye;
attribute float _portrait_part;
varying vec2 vPortraitEye;
varying float vPortraitPart;
varying vec3 vPortraitLocal;
${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
#include <begin_vertex>
vPortraitEye = _portrait_eye;
vPortraitPart = _portrait_part;
vPortraitLocal = position;
`);
      shader.fragmentShader = `
uniform float uPortraitDetail;
varying vec2 vPortraitEye;
varying float vPortraitPart;
varying vec3 vPortraitLocal;
float portraitHash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
#include <map_fragment>
float portraitEye = (step(2.5, vPortraitPart) - step(3.5, vPortraitPart)) * uPortraitDetail;
float portraitNose = (step(1.5, vPortraitPart) - step(2.5, vPortraitPart)) * uPortraitDetail;
float portraitRadius = length(vPortraitEye);
float portraitAA = max(fwidth(portraitRadius), 0.015);
float portraitIris = 1.0 - smoothstep(0.92 - portraitAA, 0.92 + portraitAA, portraitRadius);
float portraitPupil = 1.0 - smoothstep(0.30 - portraitAA, 0.30 + portraitAA, portraitRadius);
float portraitAngle = portraitRadius > 0.00001 ? atan(vPortraitEye.y, vPortraitEye.x) : 0.0;
float portraitFibers = 0.5 + 0.25 * sin(portraitAngle * 37.0 + portraitRadius * 23.0) + 0.25 * sin(portraitAngle * 61.0 - portraitRadius * 31.0);
vec3 portraitIrisColor = mix(vec3(0.16,0.075,0.018), vec3(0.46,0.25,0.068), portraitFibers);
portraitIrisColor *= 0.70 + 0.30 * (1.0 - smoothstep(0.77, 0.92, portraitRadius));
// The upper lid shades the iris; the surrounding exposed eye is dark brown,
// rather than a glowing yellow or white ball. No emissive catchlight is painted.
float portraitLid = 1.0 - 0.30 * smoothstep(0.0, 0.86, vPortraitEye.y);
vec3 portraitEyeColor = mix(vec3(0.028,0.019,0.012), portraitIrisColor, portraitIris);
portraitEyeColor = mix(portraitEyeColor, vec3(0.002,0.003,0.003), portraitPupil) * portraitLid;
diffuseColor.rgb = mix(diffuseColor.rgb, portraitEyeColor, portraitEye);
float portraitPoreFootprint = length(fwidth(vPortraitLocal * 850.0));
float portraitPores = mix(0.5, portraitHash(floor(vPortraitLocal * 850.0)), 1.0 - smoothstep(0.45, 1.3, portraitPoreFootprint));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025,0.020,0.017) * (0.8 + 0.3 * portraitPores), portraitNose);
`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
#include <normal_fragment_maps>
// The existing eye dome supplies corneal curvature. Remove the painted coat
// normal from it, while retaining the authored nose relief at reduced strength.
vec3 portraitCorneaNormal = nonPerturbedNormal;
// Derive the actual animated eye tangent frame, then add a restrained curved
// normal field. Its wet highlight is computed from scene lights, never painted.
vec3 portraitDx = dFdx(-vViewPosition), portraitDy = dFdy(-vViewPosition);
vec2 portraitUvDx = dFdx(vPortraitEye), portraitUvDy = dFdy(vPortraitEye);
float portraitDet = portraitUvDx.x * portraitUvDy.y - portraitUvDx.y * portraitUvDy.x;
if (portraitEye > 0.0 && abs(portraitDet) > 0.0000001) {
  vec3 portraitRight = (portraitDx * portraitUvDy.y - portraitDy * portraitUvDx.y) / portraitDet;
  vec3 portraitUp = (portraitDy * portraitUvDx.x - portraitDx * portraitUvDy.x) / portraitDet;
  portraitRight -= nonPerturbedNormal * dot(nonPerturbedNormal, portraitRight);
  portraitUp -= nonPerturbedNormal * dot(nonPerturbedNormal, portraitUp);
  if (length(portraitRight) > 0.000001 && length(portraitUp) > 0.000001) {
    vec2 portraitDome = clamp(vPortraitEye, vec2(-1.3), vec2(1.3));
    portraitCorneaNormal = normalize(nonPerturbedNormal + 0.42 * (normalize(portraitRight) * portraitDome.x + normalize(portraitUp) * portraitDome.y));
  }
}
normal = normalize(mix(normal, portraitCorneaNormal, portraitEye));
normal = normalize(mix(normal, nonPerturbedNormal, portraitNose * 0.35));
`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <clearcoat_normal_fragment_maps>', `
#include <clearcoat_normal_fragment_maps>
#ifdef USE_CLEARCOAT
clearcoatNormal = normalize(mix(clearcoatNormal, portraitCorneaNormal, portraitEye));
#endif
`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_fragment>', `
#include <lights_physical_fragment>
material.roughness = mix(material.roughness, 0.16, portraitEye);
material.roughness = mix(material.roughness, 0.4 + portraitPores * 0.12, portraitNose);
material.metalness *= 1.0 - max(portraitEye, portraitNose);
#ifdef USE_CLEARCOAT
material.clearcoat *= clamp(portraitEye + portraitNose * 0.14, 0.0, 1.0);
material.clearcoatRoughness = mix(material.clearcoatRoughness, 0.09, portraitEye);
#endif
`);
    };
    material.needsUpdate = true; ownMaterial(material);
    records.push({ source, originalGeometry, geometry, material, previous }); metadata.meshes++;
  }
  return {
    metadata,
    setDetail(value) { if (!disposed) uniforms.uPortraitDetail.value = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; },
    update() { return 0; },
    dispose() {
      if (disposed) return; disposed = true;
      for (const { source, originalGeometry, geometry, material, previous } of records) {
        if (source.geometry === geometry) source.geometry = originalGeometry;
        material.onBeforeCompile = previous.hook; material.customProgramCacheKey = previous.key;
        material.clearcoat = previous.clearcoat; material.clearcoatRoughness = previous.clearcoatRoughness; material.needsUpdate = true;
      }
      records.length = 0;
      // Scene releases the registered geometry/materials; actor releases skeletons.
    }
  };
}
