import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAnimatedCharacter } from '../public/wild/character.js';
import { createFurMaterial, attachFurLayers } from '../public/wild/fur.js';
import { createFurRibbonGeometry } from '../public/wild/fur-geometry.js';

// Use the actual shipped skin and semantic masks. This CPU import deliberately
// omits image decoding; shader compilation and appearance require browser QA.
let modelPromise;
function characterModel() {
  return modelPromise ??= (async () => {
    const directory = new URL('../public/wild/assets/', import.meta.url);
    const manifest = JSON.parse(await readFile(new URL('manifest.json', directory)));
    const bytes = await readFile(new URL(manifest.character.path, directory));
    let json, binary;
    for (let offset = 12; offset < bytes.length;) {
      const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
      offset += 8;
      if (type === 0x4e4f534a) json = JSON.parse(bytes.toString('utf8', offset, offset + length));
      if (type === 0x004e4942) binary = bytes.subarray(offset, offset + length);
      offset += length;
    }
    json.buffers[0].uri = `data:application/octet-stream;base64,${binary.toString('base64')}`;
    delete json.materials;
    for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material;
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'ProgressEvent');
    if (!previous) globalThis.ProgressEvent = class {
      constructor(type, properties) { this.type = type; Object.assign(this, properties); }
    };
    try { return await new GLTFLoader().parseAsync(JSON.stringify(json), ''); }
    finally { if (!previous) delete globalThis.ProgressEvent; }
  })();
}
function meshes(root) {
  const result = [];
  root.traverse(node => { if (node.isSkinnedMesh) result.push(node); });
  return result;
}
function shaderFor(material) {
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.physical.vertexShader,
    fragmentShader: THREE.ShaderLib.physical.fragmentShader };
  material.onBeforeCompile(shader);
  return shader;
}
function bonePose(root) {
  const values = [];
  root.traverse(node => { if (node.isBone) values.push(...node.position.toArray(), ...node.quaternion.toArray()); });
  return values;
}

test('SCRUM-36 fur: semantic coverage excludes facial surfaces and keeps finite tangent directions on the actual skin', async () => {
  const model = await characterModel(), body = meshes(model.scene)[0], geometry = body.geometry;
  const positions = geometry.attributes.position, normals = geometry.attributes.normal;
  const mask = geometry.attributes._fur_mask, direction = geometry.attributes._fur_direction, part = geometry.attributes._fur_part;
  assert.ok(mask && direction && part, 'the groom includes semantic attributes rather than a guessed UV mask');
  for (const attribute of [mask, direction, part, normals]) assert.equal(attribute.count, positions.count);
  assert.equal(mask.itemSize, 1); assert.equal(part.itemSize, 1); assert.equal(direction.itemSize, 3);
  assert.equal(positions.count / 3, 7071, 'grooming preserves source topology and the covered body');
  assert.equal(geometry.attributes.color, undefined, 'source part labels must not become display vertex colors');
  const counts = {}, n = new THREE.Vector3(), d = new THREE.Vector3();
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const id = part.getX(vertex), coverage = mask.getX(vertex);
    assert.ok([1, 2, 3, 4, 5, 6, 11].includes(id), `known source part at vertex ${vertex}`);
    counts[id] = (counts[id] ?? 0) + 1;
    assert.equal(coverage, id === 1 || id === 11 ? 1 : 0, 'nose, eye, tooth, jaw and tongue cannot grow fur');
    n.fromBufferAttribute(normals, vertex); d.fromBufferAttribute(direction, vertex);
    assert.ok([...n.toArray(), ...d.toArray()].every(Number.isFinite));
    assert.ok(Math.abs(n.length() - 1) < 0.001, 'grooming retains normalized surface normals');
    if (coverage) {
      assert.ok(Math.abs(d.length() - 1) < 0.001, 'fur flow is normalized');
      assert.ok(Math.abs(n.dot(d)) < 0.001, 'fur flow is tangent to its current surface');
    }
  }
  // Independently counted from the creator's FBX before grooming. This catches
  // accidental loss of small eye/mouth pieces and relabeling them as body fur.
  assert.deepEqual(counts, { 1: 12872, 2: 22, 3: 420, 4: 696, 5: 1176, 6: 324, 11: 5703 });
});

test('SCRUM-36 fur: generated ribbons are bounded, deterministic and rooted on covered body triangles', async t => {
  const model = await characterModel(), source = meshes(model.scene)[0].geometry;
  const snapshot = Object.fromEntries(Object.entries(source.attributes).map(([name, attribute]) => [name, attribute.array.slice()]));
  const geometry = createFurRibbonGeometry(source);
  const repeat = createFurRibbonGeometry(source, { count: 32 });
  t.after(() => { geometry.dispose(); repeat.dispose(); });
  assert.equal(geometry.attributes.position.count, 32000); assert.equal(geometry.index.count / 3, 24000);
  for (const [name, attribute] of Object.entries(source.attributes)) assert.deepEqual(attribute.array, snapshot[name], `input ${name} stays unchanged`);
  for (const [name, attribute] of Object.entries(repeat.attributes))
    assert.deepEqual(geometry.attributes[name].array.slice(0, attribute.array.length), attribute.array, `${name} sampling is reproducible`);
  const { position, normal, skinIndex, skinWeight, uv, _fur_direction: flow, _fur_strand: strand } = geometry.attributes;
  const n = new THREE.Vector3(), d = new THREE.Vector3();
  for (let vertex = 0; vertex < position.count; vertex++) {
    assert.ok([position.getX(vertex), position.getY(vertex), position.getZ(vertex)].every(Number.isFinite));
    n.fromBufferAttribute(normal, vertex); d.fromBufferAttribute(flow, vertex);
    assert.ok(Math.abs(n.length() - 1) < 0.001 && Math.abs(d.length() - 1) < 0.001 && Math.abs(n.dot(d)) < 0.001);
    let sum = 0;
    for (let channel = 0; channel < 4; channel++) {
      const weight = skinWeight.getComponent(vertex, channel), joint = skinIndex.getComponent(vertex, channel);
      assert.ok(Number.isFinite(weight) && weight >= 0 && weight <= 1);
      assert.ok(Number.isInteger(joint) && joint >= 0 && joint < 41); sum += weight;
    }
    assert.ok(Math.abs(sum - 1) < 0.001);
    const first = Math.floor(vertex / 8) * 8;
    assert.equal(uv.getX(vertex), uv.getX(first)); assert.equal(uv.getY(vertex), uv.getY(first));
    assert.ok(strand.getX(vertex) >= 0 && strand.getX(vertex) <= 1 && strand.getY(vertex) >= 0 && strand.getY(vertex) <= 1);
  }
  assert.ok(geometry.index.array.every(index => index < position.count));
  assert.ok(geometry.userData.furRibbons.maximumDiscardedSkinWeight <= 0.02);
  assert.ok(geometry.userData.furRibbons.sampledRoots <= 4000 * 20, 'root sampling has a fixed work bound');
  const eligible = [], sourcePosition = source.attributes.position, parts = source.attributes._fur_part;
  for (let i = 0; i < parts.count; i += 3) if ([i, i + 1, i + 2].every(index => parts.getX(index) === 1))
    eligible.push(new THREE.Triangle(...[i, i + 1, i + 2].map(index => new THREE.Vector3().fromBufferAttribute(sourcePosition, index))));
  const closest = new THREE.Vector3();
  for (let card = 0; card < 4000; card += 211) {
    const root = new THREE.Vector3().fromBufferAttribute(position, card * 8)
      .add(new THREE.Vector3().fromBufferAttribute(position, card * 8 + 1)).multiplyScalar(0.5);
    let distance = Infinity;
    for (const triangle of eligible) distance = Math.min(distance, triangle.closestPointToPoint(root, closest).distanceTo(root));
    assert.ok(distance < 0.0002, 'sampled card roots are within the intended 0.15 mm burial of eligible body surfaces');
  }
  assert.throws(() => createFurRibbonGeometry(source, { count: 8001 }), RangeError);
  assert.throws(() => createFurRibbonGeometry(source, { worldScale: Infinity }), RangeError);
});

test('SCRUM-36 fur: one ribbon draw shares the actual moving rig and releases no scene-owned resources', async t => {
  const model = await characterModel(), materials = [], geometries = [];
  const ownMaterial = material => { materials.push(material); return material; };
  const ownGeometry = geometry => { geometries.push(geometry); return geometry; };
  const actor = createAnimatedCharacter(model, { introClipName: 'IdlePant', materialFactory: source => ownMaterial(createFurMaterial(source)) });
  const parent = new THREE.Group(); parent.rotation.set(0.08, 0.72, -0.05); parent.scale.setScalar(1.03); parent.add(actor.root);
  const source = meshes(actor.root)[0], originalPose = bonePose(actor.root);
  const fur = attachFurLayers(actor.root, { ownMaterial, ownGeometry }), shells = source.children.filter(node => node.isSkinnedMesh);
  t.after(() => { fur.dispose(); actor.dispose(); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose()); });
  assert.equal(shells.length, 1, 'one focused body adds exactly one ribbon draw');
  assert.equal(materials.length, 2); assert.equal(geometries.length, 1);
  assert.equal(geometries[0].attributes.position.count, 56000);
  assert.equal(geometries[0].index.count / 3, 42000);
  assert.ok(geometries[0].userData.furRibbons.maximumDiscardedSkinWeight <= 0.02);
  for (const shell of shells) {
    assert.equal(shell.geometry, geometries[0]); assert.notEqual(shell.geometry, source.geometry); assert.equal(shell.skeleton, source.skeleton);
    assert.equal(shell.bindMode, source.bindMode);
    assert.deepEqual(shell.bindMatrix.elements, source.bindMatrix.elements);
    assert.deepEqual(shell.bindMatrixInverse.elements, source.bindMatrixInverse.elements);
    assert.equal(shell.castShadow, false); assert.equal(shell.frustumCulled, false);
    assert.equal(shell.visible, false);
  }
  assert.deepEqual(bonePose(actor.root), originalPose, 'attachment does not advance the rig');
  const positions = source.geometry.attributes.position;
  const pointAt = (mesh, index) => mesh.applyBoneTransform(index, new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, index)).applyMatrix4(mesh.matrixWorld);
  const ribbon = shells[0], ribbonPosition = ribbon.geometry.attributes.position;
  const eligible = [], parts = source.geometry.attributes._fur_part;
  for (let i = 0; i < positions.count; i += 3) if ([i, i + 1, i + 2].every(index => parts.getX(index) === 1))
    eligible.push({ first: i, triangle: new THREE.Triangle(...[i, i + 1, i + 2].map(index => new THREE.Vector3().fromBufferAttribute(positions, index))) });
  const anchors = [], closest = new THREE.Vector3();
  for (let card = 0; card < 7000; card += 367) {
    const root = new THREE.Vector3().fromBufferAttribute(ribbonPosition, card * 8)
      .add(new THREE.Vector3().fromBufferAttribute(ribbonPosition, card * 8 + 1)).multiplyScalar(0.5);
    let distance = Infinity, match;
    for (const entry of eligible) {
      entry.triangle.closestPointToPoint(root, closest);
      const next = closest.distanceTo(root);
      if (next < distance) { distance = next; match = { first: entry.first, weights: entry.triangle.getBarycoord(closest, new THREE.Vector3()).clone() }; }
    }
    assert.ok(distance < 0.0002 / 0.895, 'sampled roots remain on the closed body before posing');
    anchors.push({ card, ...match });
  }
  parent.updateMatrixWorld(true);
  const before = pointAt(source, 888);
  fur.setDetail(1);
  actor.setFocus(actor.getHeadPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0, 10)));
  let maximumRootGap = 0;
  for (let frame = 0; frame < 280; frame++) {
    actor.update(0.025);
    if (![19, 79, 159, 239, 279].includes(frame)) continue;
    parent.updateMatrixWorld(true);
    for (const anchor of anchors) {
      const root = pointAt(ribbon, anchor.card * 8).add(pointAt(ribbon, anchor.card * 8 + 1)).multiplyScalar(0.5);
      const expected = new THREE.Vector3();
      for (let side = 0; side < 3; side++) expected.addScaledVector(pointAt(source, anchor.first + side), anchor.weights.getComponent(side));
      maximumRootGap = Math.max(maximumRootGap, root.distanceTo(expected));
    }
  }
  assert.ok(maximumRootGap < 0.006, 'sampled roots stay within 6 mm of the animated body through pant and return to idle');
  t.diagnostic(`maximum sampled animated root gap: ${maximumRootGap.toFixed(6)} metres`);
  parent.updateMatrixWorld(true);
  assert.ok(pointAt(source, 888).distanceTo(before) > 0.0001, 'the body really animates during this check');
  for (const shell of shells) {
    assert.deepEqual(shell.matrixWorld.elements, source.matrixWorld.elements);
    for (let index = 0; index < shell.geometry.attributes.position.count; index += 113) {
      const layerPoint = pointAt(shell, index);
      assert.ok(layerPoint.toArray().every(Number.isFinite));
      assert.ok(layerPoint.length() < 5, 'the bound ribbon vertices stay near this one-metre actor');
    }
  }
  source.skeleton.computeBoneTexture();
  let boneDisposals = 0, geometryDisposals = 0, materialDisposals = 0;
  source.skeleton.boneTexture.addEventListener('dispose', () => boneDisposals++);
  const onGeometryDispose = () => geometryDisposals++;
  source.geometry.addEventListener('dispose', onGeometryDispose);
  geometries.forEach(geometry => geometry.addEventListener('dispose', onGeometryDispose));
  t.after(() => source.geometry.removeEventListener('dispose', onGeometryDispose));
  materials.forEach(material => material.addEventListener('dispose', () => materialDisposals++));
  const held = bonePose(actor.root);
  fur.dispose(); fur.dispose(); fur.setDetail(1);
  assert.equal(boneDisposals + geometryDisposals + materialDisposals, 0, 'fur cleanup does not dispose shared or scene-owned resources');
  assert.ok(shells.every(shell => !shell.visible && shell.parent === null), 'disposed detail cannot be resurrected');
  assert.deepEqual(bonePose(actor.root), held);
  assert.equal(actor.update(0.025), 0.025, 'the base character remains usable after layer cleanup');
  actor.dispose(); assert.equal(boneDisposals, 1, 'the actual actor remains the skeleton owner');
});

test('SCRUM-36 fur: static detail is bounded, isolated between actors and suppressed for hidden groups', async t => {
  const model = await characterModel(), materials = [], geometries = [], controllers = [], actors = [];
  const ownMaterial = material => { materials.push(material); return material; };
  const ownGeometry = geometry => { geometries.push(geometry); return geometry; };
  function makeActor() {
    const actor = createAnimatedCharacter(model, { materialFactory: source => ownMaterial(createFurMaterial(source)) });
    actors.push(actor);
    const fur = attachFurLayers(actor.root, { ownMaterial, ownGeometry }); controllers.push(fur);
    const body = meshes(actor.root)[0], layers = body.children.filter(node => node.isSkinnedMesh);
    return { actor, fur, body, layers, shaders: [body, ...layers].map(mesh => shaderFor(mesh.material)) };
  }
  const first = makeActor(), second = makeActor();
  t.after(() => { controllers.forEach(controller => controller.dispose()); actors.forEach(actor => actor.dispose()); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose()); });
  assert.notEqual(first.shaders[0].uniforms.uFurDetail, second.shaders[0].uniforms.uFurDetail);
  assert.notEqual(first.shaders[0].uniforms.uFurDetail, first.shaders[1].uniforms.uFurDetail);
  const held = bonePose(first.actor.root);
  first.fur.setDetail(2);
  assert.ok(first.layers.every(layer => layer.visible));
  assert.ok(first.shaders.every(shader => shader.uniforms.uFurDetail.value === 1));
  assert.ok(second.layers.every(layer => !layer.visible));
  assert.ok(second.shaders.every(shader => shader.uniforms.uFurDetail.value === 0));
  assert.equal(first.layers.length, 1);
  // Thickness is bounded in world units even under the imported scale wrapper.
  const worldScale = first.body.getWorldScale(new THREE.Vector3()).x;
  for (const shader of first.shaders) assert.ok(Math.abs(shader.uniforms.uFurWorldScale.value - worldScale) < 1e-8);
  first.fur.setDetail(0.4);
  assert.ok(first.shaders.every(shader => shader.uniforms.uFurDetail.value === 0.4));
  assert.deepEqual(bonePose(first.actor.root), held, 'rendering or changing detail does not advance animation');
  for (const value of [-1, NaN, Infinity, undefined]) {
    first.fur.setDetail(value);
    assert.ok(first.layers.every(layer => !layer.visible));
    assert.ok(first.shaders.every(shader => shader.uniforms.uFurDetail.value === 0));
  }
  const hidden = new THREE.Group(); hidden.add(first.actor.root); hidden.visible = false;
  first.fur.setDetail(1);
  assert.ok(first.layers.every(layer => !layer.visible));
  assert.ok(first.shaders.every(shader => shader.uniforms.uFurDetail.value === 0));
  hidden.visible = true; first.fur.setDetail(1);
  assert.ok(first.layers.every(layer => layer.visible));
  assert.deepEqual(bonePose(first.actor.root), held);
});
