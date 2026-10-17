import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// Offline derivative of the CC0 Warg. Reads model data only; never runs source Python.
const [sourceFile, originalFile, outputFile, reportFile] = process.argv.slice(2);
if (!outputFile) throw new Error('Usage: node scripts/asset-prep-warg-groom.mjs Warg.fbx original.glb output.glb [report.json]');
assert.notEqual(path.resolve(originalFile), path.resolve(outputFile), 'Keep the original model intact');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync(sourceFile), original = fs.readFileSync(originalFile);
const manager = new THREE.LoadingManager();
manager.addHandler(/\.(png|jpg|jpeg)$/i, { setPath() { return this; }, load() { return new THREE.Texture(); } });
const fbx = new FBXLoader(manager).parse(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), path.dirname(sourceFile) + '/');
const geometry = fbx.getObjectByName('WargBody').geometry;
assert.equal(geometry.index, null);
const sourcePosition = geometry.attributes.position, colors = geometry.attributes.color;
assert.equal(sourcePosition.count, 21213);
assert.equal(original.readUInt32LE(0), 0x46546c67);
assert.equal(original.readUInt32LE(4), 2);
const jsonLength = original.readUInt32LE(12);
const gltf = JSON.parse(original.subarray(20, 20 + jsonLength).toString());
const binStart = 28 + jsonLength;
const bin = Buffer.from(original.subarray(binStart, binStart + original.readUInt32LE(20 + jsonLength)));
const baselineBin = Buffer.from(bin);
const primitive = gltf.meshes.find(mesh => mesh.primitives.some(p => p.attributes.POSITION !== undefined)).primitives[0];
assert.equal(primitive.indices, undefined, 'Expected the original expanded mesh');
const range = accessorIndex => {
  const accessor = gltf.accessors[accessorIndex], view = gltf.bufferViews[accessor.bufferView];
  const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[accessor.type];
  const width = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType];
  assert.ok(view.byteStride === undefined || view.byteStride === size * width, 'Interleaved data needs explicit handling');
  return { offset: (view.byteOffset || 0) + (accessor.byteOffset || 0), length: accessor.count * size * width, accessor };
};
const posRange = range(primitive.attributes.POSITION), normalRange = range(primitive.attributes.NORMAL);
assert.equal(posRange.accessor.componentType, 5126);
assert.equal(normalRange.accessor.componentType, 5126);
const positions = new Float32Array(bin.buffer, bin.byteOffset + posRange.offset, sourcePosition.count * 3);
const normals = new Float32Array(bin.buffer, bin.byteOffset + normalRange.offset, sourcePosition.count * 3);
for (let i = 0; i < positions.length; i++) assert.equal(positions[i], sourcePosition.array[i], `Source/GLB vertex order differs at ${i}`);

const parts = Uint8Array.from({ length: sourcePosition.count }, (_, i) => Math.round(colors.getX(i) * 255));
const weld = new Map(), points = [], originalToWeld = [];
for (let i = 0; i < sourcePosition.count; i++) {
  const p = new THREE.Vector3().fromBufferAttribute(sourcePosition, i);
  const key = `${parts[i]}:${p.toArray().map(value => value.toFixed(6)).join(',')}`;
  if (!weld.has(key)) { weld.set(key, points.length); points.push({ p, part: parts[i], vertices: [], edges: new Set() }); }
  const id = weld.get(key); originalToWeld.push(id); points[id].vertices.push(i);
}
const hairTriangles = [];
for (let i = 0; i < sourcePosition.count; i += 3) {
  if (![parts[i], parts[i + 1], parts[i + 2]].every(part => part === 11)) continue;
  const ids = originalToWeld.slice(i, i + 3);
  hairTriangles.push({ start: i, ids });
  for (const a of ids) for (const b of ids) if (a !== b) points[a].edges.add(b);
}
assert.equal(hairTriangles.length, 1901);
const seen = new Set(), islands = [];
for (let i = 0; i < points.length; i++) {
  if (points[i].part !== 11 || seen.has(i)) continue;
  const queue = [i], ids = []; seen.add(i);
  while (queue.length) {
    const id = queue.pop(); ids.push(id);
    for (const next of points[id].edges) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  const idSet = new Set(ids), triangles = hairTriangles.filter(triangle => idSet.has(triangle.ids[0]));
  islands.push({ ids, triangles });
}
assert.equal(islands.length, 127);
const changedVertices = new Set(), flowByVertex = new Map(), groomed = [];
let maximumDisplacement = 0;
for (let islandIndex = 0; islandIndex < islands.length; islandIndex++) {
  const { ids, triangles } = islands[islandIndex];
  const edges = new Map();
  for (const triangle of triangles) for (let i = 0; i < 3; i++) {
    const a = triangle.ids[i], b = triangle.ids[(i + 1) % 3];
    const key = [Math.min(a, b), Math.max(a, b)].join(':'); edges.set(key, (edges.get(key) || 0) + 1);
  }
  if (ids.length !== 9 || triangles.length !== 14) continue;
  // Source clumps have a capped root ring (two triangles), so there are no open edges.
  // The creator's blue semantic channel stores root-relative distance, not display color.
  const byRootDistance = [...ids].sort((a, b) => colors.getZ(points[a].vertices[0]) - colors.getZ(points[b].vertices[0]));
  const roots = new Set(byRootDistance.slice(0, 4));
  const rootCap = triangles.filter(triangle => triangle.ids.every(id => roots.has(id)));
  assert.equal(rootCap.length, 2, `Root mask does not identify the capped base for island ${islandIndex}`);
  assert.ok(colors.getZ(points[byRootDistance[3]].vertices[0]) < colors.getZ(points[byRootDistance[4]].vertices[0]), 'Ambiguous root-distance boundary');
  const anchor = new THREE.Vector3(); for (const id of roots) anchor.add(points[id].p); anchor.multiplyScalar(1 / roots.size);
  const nonRoots = ids.filter(id => !roots.has(id));
  const tip = nonRoots.reduce((a, b) => points[a].p.distanceToSquared(anchor) > points[b].p.distanceToSquared(anchor) ? a : b);
  const axis = points[tip].p.clone().sub(anchor), length = axis.length(); axis.normalize();
  const changed = [];
  for (const id of ids) {
    const point = points[id];
    for (const vertex of point.vertices) flowByVertex.set(vertex, axis);
    if (roots.has(id)) continue;
    const delta = point.p.clone().sub(anchor), along = delta.dot(axis);
    const progress = THREE.MathUtils.clamp(along / length, 0, 1);
    const transverse = delta.clone().addScaledVector(axis, -along).multiplyScalar(1 - 0.12 * progress);
    const groomedPoint = anchor.clone().add(transverse).addScaledVector(axis, along * 0.45);
    maximumDisplacement = Math.max(maximumDisplacement, groomedPoint.distanceTo(point.p));
    for (const vertex of point.vertices) {
      groomedPoint.toArray(positions, vertex * 3); changedVertices.add(vertex); changed.push(vertex);
    }
  }
  // Area weighted normals are averaged only within this lock, never across body/face UV seams.
  const sums = new Map(ids.map(id => [id, new THREE.Vector3()]));
  for (const { start, ids: triangleIds } of triangles) {
    const [a, b, c] = [0, 1, 2].map(index => new THREE.Vector3().fromArray(positions, (start + index) * 3));
    const normal = b.sub(a).cross(c.sub(a));
    assert.ok(normal.lengthSq() > 1e-15 && normal.toArray().every(Number.isFinite), `Degenerate lock ${islandIndex}`);
    for (const id of triangleIds) sums.get(id).add(normal);
  }
  for (const id of ids) {
    const normal = sums.get(id); assert.ok(normal.lengthSq() > 1e-15); normal.normalize();
    for (const vertex of points[id].vertices) normal.toArray(normals, vertex * 3);
  }
  groomed.push({ island: islandIndex, fixedRoots: [...roots].flatMap(id => points[id].vertices), changedVertices: changed,
    tipVertices: points[tip].vertices, anchor: anchor.toArray(), axis: axis.toArray(), originalLength: length, lengthRatio: 0.45 });
}
assert.equal(groomed.length, 119);

const mask = new Float32Array(sourcePosition.count), direction = new Float32Array(sourcePosition.count * 3);
for (let i = 0; i < sourcePosition.count; i++) {
  if (parts[i] !== 1 && parts[i] !== 11) continue;
  mask[i] = 1;
  const normal = new THREE.Vector3().fromArray(normals, i * 3).normalize();
  const p = new THREE.Vector3().fromArray(positions, i * 3);
  const flow = flowByVertex.has(i) ? flowByVertex.get(i).clone() : new THREE.Vector3(0, 1, -0.55 * (1 - Math.max(0, normal.z)));
  if (!flowByVertex.has(i)) {
    if (p.y < -0.88 && Math.abs(p.x) > 0.025 && p.z < 1.23) flow.set(Math.sign(p.x) * 0.6, 1, -0.25);
    if ((p.z < 0.6 && Math.abs(p.x) > 0.055) || (p.y > 0.64 && p.z < 0.93)) flow.set(0, 0.22, -1);
    if (p.z > 1.24 && p.y < -0.82) flow.set(0, 0.1, 1);
  }
  flow.addScaledVector(normal, -flow.dot(normal));
  if (flow.lengthSq() < 1e-10) { flow.set(1, 0, 0); flow.addScaledVector(normal, -flow.dot(normal)); }
  if (flow.lengthSq() < 1e-10) { flow.set(0, 1, 0); flow.addScaledVector(normal, -flow.dot(normal)); }
  flow.normalize().toArray(direction, i * 3);
}
const minMax = (array, size) => {
  const min = Array(size).fill(Infinity), max = Array(size).fill(-Infinity);
  array.forEach((value, index) => { assert.ok(Number.isFinite(value)); min[index % size] = Math.min(min[index % size], value); max[index % size] = Math.max(max[index % size], value); });
  return { min, max };
};
Object.assign(posRange.accessor, minMax(positions, 3));
Object.assign(normalRange.accessor, minMax(normals, 3));
const extraBuffers = [], pad = value => (4 - value % 4) % 4;
let length = bin.length;
function appendAttribute(name, array, size, type, componentType) {
  const padding = Buffer.alloc(pad(length)); extraBuffers.push(padding); length += padding.length;
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const viewIndex = gltf.bufferViews.length;
  gltf.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: bytes.length, target: 34962 });
  const accessorIndex = gltf.accessors.length;
  gltf.accessors.push({ bufferView: viewIndex, componentType, count: sourcePosition.count, type, ...minMax(array, size) });
  primitive.attributes[name] = accessorIndex; extraBuffers.push(bytes); length += bytes.length;
}
appendAttribute('_FUR_MASK', mask, 1, 'SCALAR', 5126);
appendAttribute('_FUR_DIRECTION', direction, 3, 'VEC3', 5126);
appendAttribute('_FUR_PART', parts, 1, 'SCALAR', 5121);
gltf.buffers[0].byteLength = length;
gltf.asset.extras = { ...gltf.asset.extras, groom: 'Stakewolf SCRUM-36: 119 semantic hair locks shortened to 45%; fixed roots; body, UVs, skin, clips and images retained.' };
const jsonBytes = Buffer.from(JSON.stringify(gltf));
const paddedJson = Buffer.concat([jsonBytes, Buffer.alloc(pad(jsonBytes.length), 0x20)]);
const finalBin = Buffer.concat([bin, ...extraBuffers, Buffer.alloc(pad(length))]);
const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + paddedJson.length + finalBin.length, 8);
jsonHeader.writeUInt32LE(paddedJson.length); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
binHeader.writeUInt32LE(finalBin.length); binHeader.writeUInt32LE(0x004e4942, 4);
const output = Buffer.concat([header, jsonHeader, paddedJson, binHeader, finalBin]);

// Prove that only POSITION/NORMAL bytes changed in the existing binary data.
for (let i = 0; i < bin.length; i++) {
  if ((i >= posRange.offset && i < posRange.offset + posRange.length) || (i >= normalRange.offset && i < normalRange.offset + normalRange.length)) continue;
  assert.equal(bin[i], baselineBin[i], `Unrelated byte changed at ${i}`);
}
let unchangedBodyVertices = 0;
for (let i = 0; i < parts.length; i++) {
  if (parts[i] === 11) continue;
  for (const attributeRange of [posRange, normalRange]) {
    const offset = attributeRange.offset + i * 12;
    assert.ok(bin.subarray(offset, offset + 12).equals(baselineBin.subarray(offset, offset + 12)));
  }
  unchangedBodyVertices++;
}
const report = { source: { sha256: sha(source), bytes: source.length }, original: { sha256: sha(original), bytes: original.length },
  output: { sha256: sha(output), bytes: output.length }, vertices: parts.length, triangles: parts.length / 3,
  hairTriangles: hairTriangles.length, hairIslands: islands.length, groomedLocks: groomed.length, retainedFringes: islands.length - groomed.length,
  changedPositionVertices: changedVertices.size, unchangedBodyAndFaceVertices: unchangedBodyVertices,
  maximumMeshLocalDisplacement: maximumDisplacement, partVertexCounts: Object.fromEntries([...new Set(parts)].map(part => [part, parts.filter(value => value === part).length])),
  originalBinaryOutsidePositionNormalEqual: true, bodyAndFacePositionNormalEqual: true, sourceAndOriginalPositionOrderEqual: true,
  groomed };
fs.mkdirSync(path.dirname(outputFile), { recursive: true }); fs.writeFileSync(outputFile, output);
if (reportFile) { fs.mkdirSync(path.dirname(reportFile), { recursive: true }); fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ ...report, groomed: `${groomed.length} lock records saved in optional report` }, null, 2));
