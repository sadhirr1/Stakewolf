import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAnimatedCharacter } from '../public/wild/character.js';
import { createFurMaterial } from '../public/wild/fur.js';
import { attachCharacterPortrait } from '../public/wild/portrait.js';
import { applyGladeFog } from '../public/wild/atmosphere.js';

// Load the actual shipped rig without browser image decoding. These checks
// cannot establish shader compilation or portrait quality; browser QA does that.
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
function meshOf(root) {
  let found;
  root.traverse(node => { if (node.isSkinnedMesh && !found) found = node; });
  return found;
}
function pose(root) {
  const values = [];
  root.traverse(node => {
    if (node.isBone) values.push(...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray());
  });
  return values;
}
function shaderFor(material) {
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.physical.vertexShader,
    fragmentShader: THREE.ShaderLib.physical.fragmentShader };
  material.onBeforeCompile(shader);
  return shader;
}

function actorFixture(model, withFog = false) {
  const materials = new Set(), geometries = new Set();
  const ownMaterial = material => { materials.add(material); return withFog ? applyGladeFog(material) : material; };
  const ownGeometry = geometry => { geometries.add(geometry); return geometry; };
  const actor = createAnimatedCharacter(model, { introClipName: 'IdlePant', materialFactory: source => ownMaterial(createFurMaterial(source)) });
  return { actor, body: meshOf(actor.root), materials, geometries, ownMaterial, ownGeometry,
    dispose() { actor.dispose(); materials.forEach(value => value.dispose()); geometries.forEach(value => value.dispose()); } };
}

test('SCRUM-36 portrait: actual face refinement is bounded and preserves source topology, UVs and skin', async t => {
  const model = await characterModel(), fixture = actorFixture(model), source = fixture.body.geometry;
  const snapshots = Object.fromEntries(Object.entries(source.attributes).map(([key, value]) => [key, value.array.slice()]));
  const originalIndex = source.index?.array.slice();
  const portrait = attachCharacterPortrait(fixture.actor.root, fixture);
  t.after(() => { portrait.dispose(); fixture.dispose(); });
  const geometry = fixture.body.geometry;
  assert.notEqual(geometry, source); assert.ok(fixture.geometries.has(geometry));
  assert.equal(geometry.attributes.position.count, source.attributes.position.count);
  assert.deepEqual(geometry.index?.array, originalIndex);
  for (const [name, attribute] of Object.entries(source.attributes)) {
    assert.deepEqual(attribute.array, snapshots[name], `source ${name} stays unchanged`);
    if (!['position', 'normal', '_fur_direction'].includes(name))
      assert.deepEqual(geometry.attributes[name].array, snapshots[name], `${name} retains its authored data`);
  }
  const original = source.attributes.position, positions = geometry.attributes.position;
  const parts = geometry.attributes._fur_part, coordinates = geometry.attributes._portrait_eye;
  const n = new THREE.Vector3(), flow = new THREE.Vector3(), p = new THREE.Vector3(), q = new THREE.Vector3();
  let changed = 0, maximumDisplacement = 0, eyes = 0;
  for (let vertex = 0; vertex < positions.count; vertex++) {
    p.fromBufferAttribute(original, vertex); q.fromBufferAttribute(positions, vertex);
    assert.ok(q.toArray().every(Number.isFinite));
    const displacement = p.distanceTo(q); maximumDisplacement = Math.max(maximumDisplacement, displacement);
    if (displacement > 0) changed++;
    if (p.y >= -0.9) assert.deepEqual(q.toArray(), p.toArray(), 'the posterior body is not reshaped by a face refinement');
    n.fromBufferAttribute(geometry.attributes.normal, vertex); flow.fromBufferAttribute(geometry.attributes._fur_direction, vertex);
    assert.ok(n.toArray().every(Number.isFinite) && Math.abs(n.length() - 1) < 0.001);
    if (geometry.attributes._fur_mask.getX(vertex))
      assert.ok(Math.abs(flow.length() - 1) < 0.001 && Math.abs(flow.dot(n)) < 0.001, 'warped fur flow stays tangent');
    assert.ok(Number.isFinite(coordinates.getX(vertex)) && Number.isFinite(coordinates.getY(vertex)));
    if (parts.getX(vertex) === 3) eyes++;
    else assert.ok(coordinates.getX(vertex) === 0 && coordinates.getY(vertex) === 0, 'only the authored eye surfaces receive iris coordinates');
  }
  assert.ok(changed > 0 && changed < positions.count / 4);
  assert.ok(maximumDisplacement > 0.005 && maximumDisplacement < 0.03, 'refinement remains under three mesh-local centimetres');
  assert.equal(eyes, 420); assert.equal(portrait.metadata.eyeVertices, eyes);
  assert.equal(geometry.userData.portrait.eyeFrames.length, 2);
  for (const frame of geometry.userData.portrait.eyeFrames) {
    assert.ok(frame.radius > 0 && frame.radius < 0.1);
    assert.ok([...frame.center, ...frame.normal].every(Number.isFinite));
    assert.ok(Math.abs(new THREE.Vector3(...frame.normal).length() - 1) < 0.001);
  }
  t.diagnostic(`maximum actual mesh-local muzzle displacement: ${maximumDisplacement.toFixed(6)} metres`);
});

test('SCRUM-36 portrait: material composition is actor-isolated and cleanup restores the previous fur and haze hooks', async t => {
  const model = await characterModel(), first = actorFixture(model, true), second = actorFixture(model, true);
  const material = first.body.material, sourceMaterial = meshOf(model.scene).material;
  const original = { geometry: first.body.geometry, hook: material.onBeforeCompile, key: material.customProgramCacheKey,
    clearcoat: material.clearcoat, clearcoatRoughness: material.clearcoatRoughness };
  const sourceHook = sourceMaterial.onBeforeCompile;
  const portrait = attachCharacterPortrait(first.actor.root, first), otherPortrait = attachCharacterPortrait(second.actor.root, second);
  t.after(() => { portrait.dispose(); otherPortrait.dispose(); first.dispose(); second.dispose(); });
  const shader = shaderFor(material), otherShader = shaderFor(second.body.material);
  assert.ok(shader.uniforms.uFurDetail && shader.uniforms.uPortraitDetail, 'the portrait extends the real fur hook');
  assert.notEqual(shader.uniforms.uPortraitDetail, otherShader.uniforms.uPortraitDetail);
  assert.notEqual(material, second.body.material); assert.notEqual(material, sourceMaterial);
  assert.equal(sourceMaterial.onBeforeCompile, sourceHook);
  for (const field of ['map', 'normalMap', 'roughnessMap']) assert.equal(material[field], second.body.material[field]);
  assert.notEqual(material.customProgramCacheKey(), original.key.call(material));
  const gladeDeclarations = shader.vertexShader.match(/varying float vGladeHeight;/g) ?? [];
  assert.equal(gladeDeclarations.length, 1, 'composed height haze is emitted once');
  const heldPose = pose(first.actor.root);
  portrait.setDetail(0.4); assert.equal(shader.uniforms.uPortraitDetail.value, 0.4);
  assert.equal(otherShader.uniforms.uPortraitDetail.value, 1);
  for (const value of [NaN, Infinity, -1, undefined]) {
    portrait.setDetail(value); assert.equal(shader.uniforms.uPortraitDetail.value, 0);
  }
  portrait.setDetail(2); assert.equal(shader.uniforms.uPortraitDetail.value, 1);
  assert.equal(portrait.update(10), 0); assert.deepEqual(pose(first.actor.root), heldPose);
  let resourceDisposals = 0;
  for (const resource of [...first.materials, ...first.geometries, original.geometry])
    resource.addEventListener('dispose', () => resourceDisposals++);
  const versionBeforeDispose = material.version;
  portrait.dispose(); portrait.dispose();
  assert.equal(first.body.geometry, original.geometry);
  assert.equal(material.onBeforeCompile, original.hook); assert.equal(material.customProgramCacheKey, original.key);
  assert.equal(material.clearcoat, original.clearcoat); assert.equal(material.clearcoatRoughness, original.clearcoatRoughness);
  assert.ok(material.version > versionBeforeDispose, 'restoring a compiled hook invalidates its old shader program');
  assert.equal(resourceDisposals, 0, 'scene and actor retain their own resource lifetimes');
  const restored = shaderFor(material); assert.ok(restored.uniforms.uFurDetail); assert.equal(restored.uniforms.uPortraitDetail, undefined);
  assert.equal(shaderFor(second.body.material).uniforms.uPortraitDetail, otherShader.uniforms.uPortraitDetail);
  portrait.setDetail(0); assert.equal(shader.uniforms.uPortraitDetail.value, 1, 'disposed controls cannot change stale shader state');
});

test('SCRUM-36 portrait: refined facial surfaces retain the actual rig and stay bounded through pant-to-idle motion', async t => {
  const model = await characterModel(), refined = actorFixture(model), reference = actorFixture(model);
  const source = refined.body.geometry, skeleton = refined.body.skeleton;
  const bind = refined.body.bindMatrix.clone(), inverse = refined.body.bindMatrixInverse.clone();
  const beforePose = pose(refined.actor.root), portrait = attachCharacterPortrait(refined.actor.root, refined);
  t.after(() => { portrait.dispose(); refined.dispose(); reference.dispose(); });
  assert.equal(refined.body.skeleton, skeleton);
  assert.deepEqual(refined.body.bindMatrix.elements, bind.elements); assert.deepEqual(refined.body.bindMatrixInverse.elements, inverse.elements);
  assert.deepEqual(pose(refined.actor.root), beforePose);
  const samples = [];
  for (let vertex = 0; vertex < source.attributes.position.count; vertex++)
    if ([2, 3, 4, 5, 6].includes(source.attributes._fur_part.getX(vertex)) && vertex % 11 === 0) samples.push(vertex);
  const point = (body, vertex) => body.applyBoneTransform(vertex, new THREE.Vector3().fromBufferAttribute(body.geometry.attributes.position, vertex)).applyMatrix4(body.matrixWorld);
  const headTarget = refined.actor.getHeadPosition(new THREE.Vector3()).add(new THREE.Vector3(3, 0, 5));
  refined.actor.setFocus(headTarget); reference.actor.setFocus(headTarget);
  const before = point(refined.body, samples[0]); let maximumGap = 0;
  for (let frame = 0; frame < 280; frame++) {
    refined.actor.update(0.025); reference.actor.update(0.025);
    if (![19, 79, 159, 239, 279].includes(frame)) continue;
    refined.actor.root.updateMatrixWorld(true); reference.actor.root.updateMatrixWorld(true);
    for (const vertex of samples) {
      const a = point(refined.body, vertex), b = point(reference.body, vertex);
      assert.ok([...a.toArray(), ...b.toArray()].every(Number.isFinite));
      maximumGap = Math.max(maximumGap, a.distanceTo(b));
    }
    assert.deepEqual(pose(refined.actor.root), pose(reference.actor.root), 'geometry refinement does not alter authored animation or attention');
  }
  assert.ok(maximumGap > 0.001 && maximumGap < 0.03);
  assert.ok(point(refined.body, samples[0]).distanceTo(before) > 0.0001, 'the facial samples really moved during the check');
  const heldPose = pose(refined.actor.root); portrait.setDetail(0); portrait.update(1);
  assert.deepEqual(pose(refined.actor.root), heldPose);
  t.diagnostic(`maximum sampled world-space facial refinement during motion: ${maximumGap.toFixed(6)} metres`);
});

test('SCRUM-36 atmosphere: haze preserves existing hooks and source resources and safely skips unsupported materials', t => {
  const map = new THREE.Texture(), uniform = { value: 0.25 };
  const materials = [new THREE.MeshBasicMaterial({ map }), new THREE.MeshStandardMaterial({ map }),
    new THREE.MeshBasicMaterial({ map, fog: false }), new THREE.ShaderMaterial()];
  t.after(() => { materials.forEach(material => material.dispose()); map.dispose(); });
  let priorCalls = 0, disposals = 0;
  map.addEventListener('dispose', () => disposals++);
  for (const material of materials) {
    material.onBeforeCompile = function(shader) {
      assert.equal(this, material, 'composed hooks retain their material receiver');
      priorCalls++; shader.uniforms.uExistingDetail = uniform;
    };
    material.customProgramCacheKey = () => 'preexisting-material-treatment';
    const original = { hook: material.onBeforeCompile, key: material.customProgramCacheKey, color: material.color?.clone(), map: material.map };
    material.addEventListener('dispose', () => disposals++);
    assert.equal(applyGladeFog(material), material);
    if (!material.fog || material.isShaderMaterial) {
      assert.equal(material.onBeforeCompile, original.hook); assert.equal(material.customProgramCacheKey, original.key);
      continue;
    }
    const compiledKey = material.customProgramCacheKey(), hook = material.onBeforeCompile;
    assert.notEqual(compiledKey, original.key(), 'haze and baseline cannot reuse the same shader cache entry');
    applyGladeFog(material); applyGladeFog(material);
    assert.equal(material.onBeforeCompile, hook); assert.equal(material.customProgramCacheKey(), compiledKey);
    const lib = material.isMeshBasicMaterial ? THREE.ShaderLib.basic : THREE.ShaderLib.physical;
    const first = { uniforms: {}, vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader };
    const second = { uniforms: {}, vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader };
    const previousCount = priorCalls;
    material.onBeforeCompile(first); material.onBeforeCompile(second);
    assert.equal(priorCalls - previousCount, 2, 'repeated ownership does not wrap the prior hook repeatedly');
    assert.equal(first.uniforms.uExistingDetail, uniform); assert.equal(second.uniforms.uExistingDetail, uniform);
    assert.equal(first.vertexShader, second.vertexShader); assert.equal(first.fragmentShader, second.fragmentShader);
    assert.equal((first.vertexShader.match(/varying float vGladeHeight;/g) ?? []).length, 1);
    assert.equal(material.map, original.map); assert.ok(material.color.equals(original.color));
  }
  assert.equal(disposals, 0, 'adding haze does not take ownership of materials or source textures');
});
