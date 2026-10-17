import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAnimatedCharacter } from '../public/wild/character.js';

// Exercise the shipped skeleton and animation data without requiring browser
// image decoding. Coat appearance, framing, and renderer cleanup need browser QA.
let modelPromise;
function characterModel() {
  return modelPromise ??= (async () => {
    const bytes = await readFile(new URL('../public/wild/assets/warg/warg.glb', import.meta.url));
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
function tick(actors, frames) {
  for (let frame = 0; frame < frames; frame++) for (const actor of actors) actor.update(0.025);
}

test('SCRUM-36 cast: coat materials are isolated and remain owned by the scene', async t => {
  const loaded = await characterModel();
  // Give the CPU-imported source the same shared map ownership as the browser.
  const source = meshOf(loaded.scene).material;
  const original = { map: source.map, normalMap: source.normalMap, roughnessMap: source.roughnessMap };
  const brown = new THREE.Texture(), ash = new THREE.Texture(), black = new THREE.Texture();
  const normal = new THREE.Texture(), roughness = new THREE.Texture();
  Object.assign(source, { map: brown, normalMap: normal, roughnessMap: roughness });
  const owned = [], factoryCalls = [];
  function make(coat) {
    return createAnimatedCharacter(loaded, { materialFactory(material) {
      factoryCalls.push(material);
      const variant = material.clone(); variant.map = coat; owned.push(variant); return variant;
    } });
  }
  const vela = make(ash), sera = make(black);
  t.after(() => {
    vela.dispose(); sera.dispose(); Object.assign(source, original);
    owned.forEach(material => material.dispose());
    [brown, ash, black, normal, roughness].forEach(texture => texture.dispose());
  });
  const a = meshOf(vela.root).material, b = meshOf(sera.root).material;
  assert.equal(factoryCalls.length, 2, 'one material clone per actor on this actual one-material body');
  assert.notEqual(a, b); assert.notEqual(a, source); assert.notEqual(b, source);
  assert.equal(a.map, ash); assert.equal(b.map, black); assert.equal(source.map, brown);
  for (const material of [a, b]) {
    assert.equal(material.normalMap, normal); assert.equal(material.roughnessMap, roughness);
  }
  a.color.setRGB(0.2, 0.3, 0.4);
  assert.equal(b.color.getHex(), source.color.getHex(), 'changing one coat cannot recolor its peers');
  let disposals = 0;
  for (const resource of [...owned, brown, ash, black, normal, roughness])
    resource.addEventListener('dispose', () => disposals++);
  const seraPose = pose(sera.root);
  vela.dispose(); vela.dispose();
  assert.equal(disposals, 0, 'helper cleanup must leave scene-owned materials and maps alive');
  assert.deepEqual(pose(sera.root), seraPose);
  assert.equal(sera.update(0.025), 0.025);
});

test('SCRUM-36 cast: attention blends about world up, stays bounded, and never accumulates into the authored clip', async t => {
  const model = await characterModel();
  const actor = createAnimatedCharacter(model, { phase: 0.31 });
  const reference = createAnimatedCharacter(model, { phase: 0.31 });
  const untouched = createAnimatedCharacter(model, { phase: 0.31 });
  t.after(() => { actor.dispose(); reference.dispose(); untouched.dispose(); });
  // The real actors are placed in rotated scene groups. Test that coordinate
  // conversion, rather than only an unparented model facing the default axis.
  const parent = new THREE.Group(), referenceParent = new THREE.Group();
  parent.rotation.set(0.08, 0.72, -0.05); referenceParent.rotation.copy(parent.rotation);
  parent.add(actor.root); referenceParent.add(reference.root);
  const head = actor.root.getObjectByName('Head'), referenceHead = reference.root.getObjectByName('Head');
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(parent.quaternion); forward.y = 0; forward.normalize();
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const target = actor.getHeadPosition(new THREE.Vector3()).addScaledVector(right, 100);
  const initial = pose(actor.root), untouchedPose = pose(untouched.root), sourcePose = pose(model.scene);
  actor.setFocus(target);
  assert.deepEqual(pose(actor.root), initial, 'focus changes intent, not the displayed pose');
  const delta = new THREE.Quaternion(), expected = new THREE.Quaternion();
  for (let frame = 0; frame < 480; frame++) {
    actor.setFocus(target); // repeated focus must not restart or compound a turn
    actor.update(0.025); reference.update(0.025);
    const authored = referenceHead.getWorldQuaternion(new THREE.Quaternion());
    delta.copy(head.getWorldQuaternion(new THREE.Quaternion())).multiply(authored.invert()).normalize();
    const angle = delta.angleTo(new THREE.Quaternion());
    assert.ok(angle <= 0.385, `head turn remains within 22 degrees at frame ${frame}`);
    if (frame === 0) assert.ok(angle > 0.001 && angle < 0.10, 'first pose eases in instead of snapping');
    if (frame > 160) {
      expected.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.384);
      assert.ok(delta.angleTo(expected) < 0.002, 'head turns around world up despite its rotated parent');
    }
  }
  assert.deepEqual(pose(untouched.root), untouchedPose, 'another character has no shared pose or attention state');
  assert.deepEqual(pose(model.scene), sourcePose);
  const held = pose(actor.root);
  actor.setFocus(null); actor.getHeadPosition(new THREE.Vector3());
  assert.deepEqual(pose(actor.root), held, 'clearing attention while paused cannot snap the head');
  tick([actor, reference], 120);
  assert.ok(head.quaternion.angleTo(referenceHead.quaternion) < 0.0001, 'the overlay releases back to the authored animation');
});

test('SCRUM-36 cast: focus input is copied and queued through hidden or invalid updates', async t => {
  const model = await characterModel();
  const actor = createAnimatedCharacter(model, { introClipName: 'IdlePant' });
  const reference = createAnimatedCharacter(model, { introClipName: 'IdlePant' });
  t.after(() => { actor.dispose(); reference.dispose(); });
  const target = new THREE.Vector3(20, 2, 20), copied = target.clone();
  actor.setFocus(target); reference.setFocus(copied); target.set(-20, -20, -20);
  const initial = pose(actor.root), parent = new THREE.Group(); parent.add(actor.root); parent.visible = false;
  assert.equal(actor.update(1), 0);
  parent.visible = true;
  for (const elapsed of [0, -1, NaN, Infinity]) assert.equal(actor.update(elapsed), 0);
  actor.getHeadPosition(new THREE.Vector3());
  assert.deepEqual(pose(actor.root), initial, 'neither attention nor the pending pant starts without a valid visible update');
  tick([actor, reference], 100);
  assert.deepEqual(pose(actor.root), pose(reference.root), 'caller changes to the input vector do not change the queued target');
  actor.setFocus(new THREE.Vector3(NaN, 0, 0)); reference.setFocus(null);
  tick([actor, reference], 20);
  assert.deepEqual(pose(actor.root), pose(reference.root), 'a non-finite target safely clears focus');
  assert.ok(pose(actor.root).every(Number.isFinite));
});

test('SCRUM-36 cast: Sera has a bounded first-encounter pant and returns to idle without restarting on refocus', async t => {
  const model = await characterModel();
  const actor = createAnimatedCharacter(model, { phase: 0.31, introClipName: 'IdlePant' });
  const repeated = createAnimatedCharacter(model, { phase: 0.31, introClipName: 'IdlePant' });
  const idle = createAnimatedCharacter(model, { phase: 0.31 });
  t.after(() => { actor.dispose(); repeated.dispose(); idle.dispose(); });
  tick([actor, repeated, idle], 40);
  assert.deepEqual(pose(actor.root), pose(idle.root), 'Sera idles normally before the first encounter');
  const target = actor.getHeadPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0, 100));
  const jaw = actor.root.getObjectByName('Jaw'), idleJaw = idle.root.getObjectByName('Jaw');
  const idleJawPose = idleJaw.quaternion.clone();
  actor.setFocus(target); repeated.setFocus(target);
  let maximumOpening = 0, previous = jaw.quaternion.clone(), maximumStep = 0;
  for (let frame = 0; frame < 280; frame++) {
    repeated.setFocus(target);
    actor.update(0.025); repeated.update(0.025); idle.update(0.025);
    maximumOpening = Math.max(maximumOpening, jaw.quaternion.angleTo(idleJawPose));
    maximumStep = Math.max(maximumStep, jaw.quaternion.angleTo(previous)); previous.copy(jaw.quaternion);
    assert.deepEqual(pose(actor.root), pose(repeated.root), 'repeated focus notifications cannot restart the sequence');
  }
  assert.ok(maximumOpening > 0.05, 'the actual jaw visibly departs from the idle clip');
  assert.ok(maximumStep < 0.10, 'the actual jaw does not snap at either crossfade boundary');
  assert.ok(jaw.quaternion.angleTo(idleJawPose) < 0.0001, 'the jaw has returned to the idle pose after seven seconds');
  actor.setFocus(null); tick([actor], 20); actor.setFocus(target);
  for (let frame = 0; frame < 160; frame++) {
    actor.update(0.025);
    assert.ok(jaw.quaternion.angleTo(idleJawPose) < 0.0001, 'refocusing does not replay the one-time pant');
  }
});
