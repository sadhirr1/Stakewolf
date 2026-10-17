import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAnimatedCharacter } from '../public/wild/character.js';

// These checks use the packaged geometry, skin and clips. Materials are omitted
// from the CPU import; texture appearance and actual GPU cleanup need a browser.
let modelPromise;
function characterModel() {
  return modelPromise ??= (async () => {
    const directory = new URL('../public/wild/assets/', import.meta.url);
    const manifest = JSON.parse(await readFile(new URL('manifest.json', directory)));
    const bytes = await readFile(new URL(manifest.character.path, directory));
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    let json, binary;
    for (let offset = 12; offset < bytes.length;) {
      const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
      offset += 8;
      assert.ok(offset + length <= bytes.length, 'character chunks stay within the GLB');
      if (type === 0x4e4f534a) json = JSON.parse(bytes.toString('utf8', offset, offset + length));
      if (type === 0x004e4942) binary = bytes.subarray(offset, offset + length);
      offset += length;
    }
    assert.ok(json && binary, 'character contains its JSON and binary data');
    assert.equal(json.buffers.length, 1);
    json.buffers[0].uri = `data:application/octet-stream;base64,${binary.toString('base64')}`;
    delete json.materials;
    for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material;
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'ProgressEvent');
    if (!previous) globalThis.ProgressEvent = class {
      constructor(type, properties) { this.type = type; Object.assign(this, properties); }
    };
    try {
      return await new GLTFLoader().parseAsync(JSON.stringify(json), '');
    } finally {
      if (!previous) delete globalThis.ProgressEvent;
    }
  })();
}
function skinnedMeshes(root) {
  const meshes = [];
  root.traverse(node => { if (node.isSkinnedMesh) meshes.push(node); });
  return meshes;
}
function pose(root) {
  root.updateMatrixWorld(true);
  const values = [];
  root.traverse(node => { if (node.isBone) values.push(...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray()); });
  return values;
}
function sampledSurface(root) {
  root.updateMatrixWorld(true);
  const result = [];
  for (const mesh of skinnedMeshes(root)) {
    const positions = mesh.geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 37) {
      const point = new THREE.Vector3().fromBufferAttribute(positions, index);
      mesh.applyBoneTransform(index, point);
      result.push(point.applyMatrix4(mesh.matrixWorld));
    }
  }
  return result;
}

test('SCRUM-36 character: packaged idle clips bind to a complete, finite skin', async () => {
  const model = await characterModel();
  const meshes = skinnedMeshes(model.scene);
  assert.ok(meshes.length > 0);
  assert.deepEqual(model.animations.map(clip => clip.name).sort(), ['Idle', 'IdlePant']);
  assert.ok(model.scene.getObjectByName('Head')?.isBone);
  for (const mesh of meshes) {
    assert.equal(mesh.geometry.attributes.color, undefined, 'FBX part-mask colors must not multiply the coat texture');
    const indices = mesh.geometry.attributes.skinIndex, weights = mesh.geometry.attributes.skinWeight;
    assert.ok(indices && weights && mesh.skeleton.bones.length > 0);
    assert.equal(indices.count, mesh.geometry.attributes.position.count);
    assert.equal(weights.count, indices.count);
    assert.equal(new Set(mesh.skeleton.bones).size, mesh.skeleton.bones.length);
    for (let vertex = 0; vertex < weights.count; vertex++) {
      let sum = 0;
      for (let axis = 0; axis < 4; axis++) {
        const index = indices.array[vertex * 4 + axis], weight = weights.array[vertex * 4 + axis];
        assert.ok(Number.isInteger(index) && index >= 0 && index < mesh.skeleton.bones.length);
        assert.ok(Number.isFinite(weight) && weight >= 0 && weight <= 1);
        sum += weight;
      }
      assert.ok(Math.abs(sum - 1) < 0.001, 'every vertex has a normalized influence sum');
    }
  }
  for (const clip of model.animations) {
    assert.ok(Number.isFinite(clip.duration) && clip.duration > 0 && clip.tracks.length > 0);
    assert.ok(clip.tracks.some(track => {
      const size = track.getValueSize();
      return track.values.some((value, index) => index >= size && Math.abs(value - track.values[index % size]) > 1e-5);
    }), `${clip.name} contains actual keyed motion`);
    for (const track of clip.tracks) {
      const { nodeName, propertyName } = THREE.PropertyBinding.parseTrackName(track.name);
      const node = model.scene.getObjectByName(nodeName);
      assert.ok(node && propertyName in node, `${clip.name} binds ${track.name}`);
      assert.ok([...track.times, ...track.values].every(Number.isFinite));
    }
  }
});

test('SCRUM-36 character: instances animate their own skeleton and deform the actual mesh', async t => {
  const model = await characterModel();
  const first = createAnimatedCharacter(model, { phase: 0 });
  const second = createAnimatedCharacter(model, { phase: 0 });
  t.after(() => { first.dispose(); second.dispose(); });
  const firstMesh = skinnedMeshes(first.root)[0], secondMesh = skinnedMeshes(second.root)[0];
  assert.notEqual(firstMesh.skeleton, secondMesh.skeleton);
  assert.notEqual(firstMesh.skeleton.bones[0], secondMesh.skeleton.bones[0]);
  const sourcePose = pose(model.scene), secondPose = pose(second.root), surface = sampledSurface(first.root);
  for (let frame = 0; frame < 10; frame++) first.update(0.05);
  const moved = sampledSurface(first.root);
  assert.ok(moved.some((point, index) => point.distanceTo(surface[index]) > 0.001), 'skin deformation is visible in vertex positions');
  assert.deepEqual(pose(second.root), secondPose, 'another cast member does not share its clock or bones');
  assert.deepEqual(pose(model.scene), sourcePose, 'the loaded template remains unchanged');
  assert.ok(first.getHeadPosition(new THREE.Vector3()).toArray().every(Number.isFinite));
});

test('SCRUM-36 character: invalid elapsed time and hidden ancestors cannot advance a pose; long gaps are bounded', async t => {
  const model = await characterModel();
  const actor = createAnimatedCharacter(model), reference = createAnimatedCharacter(model);
  t.after(() => { actor.dispose(); reference.dispose(); });
  const initial = pose(actor.root);
  for (const elapsed of [0, -1, NaN, Infinity, undefined]) assert.equal(actor.update(elapsed), 0);
  assert.deepEqual(pose(actor.root), initial);
  const parent = new THREE.Group(); parent.add(actor.root); parent.visible = false;
  assert.equal(actor.update(0.05), 0);
  assert.deepEqual(pose(actor.root), initial);
  parent.visible = true;
  assert.equal(actor.update(60), 0.05);
  assert.equal(reference.update(0.05), 0.05);
  assert.deepEqual(pose(actor.root), pose(reference.root), 'resume does not apply a hidden minute of animation');
  const held = pose(actor.root);
  actor.getHeadPosition(new THREE.Vector3()); actor.getHeadPosition(new THREE.Vector3());
  assert.deepEqual(pose(actor.root), held, 'reading a focus anchor does not advance the clock');
});

test('SCRUM-36 character: disposal releases only owned bone textures once and leaves other actors usable', async () => {
  const model = await characterModel();
  const first = createAnimatedCharacter(model), second = createAnimatedCharacter(model);
  const parent = new THREE.Group(); parent.add(first.root, second.root);
  const skeleton = skinnedMeshes(first.root)[0].skeleton, other = skinnedMeshes(second.root)[0].skeleton;
  skeleton.computeBoneTexture(); other.computeBoneTexture();
  let ownedDisposals = 0, otherDisposals = 0, geometryDisposals = 0;
  skeleton.boneTexture.addEventListener('dispose', () => ownedDisposals++);
  other.boneTexture.addEventListener('dispose', () => otherDisposals++);
  const geometry = skinnedMeshes(first.root)[0].geometry;
  const onGeometryDispose = () => geometryDisposals++;
  geometry.addEventListener('dispose', onGeometryDispose);
  try {
    first.dispose(); first.dispose();
    assert.equal(ownedDisposals, 1); assert.equal(otherDisposals, 0);
    assert.equal(geometryDisposals, 0, 'shared geometry belongs to the scene');
    assert.equal(skeleton.boneTexture, null);
    assert.equal(first.root.parent, null);
    assert.equal(first.update(0.05), 0);
    assert.equal(second.update(0.05), 0.05);
    assert.ok(other.boneTexture && second.root.parent === parent);
  } finally {
    geometry.removeEventListener('dispose', onGeometryDispose);
    second.dispose();
  }
});
