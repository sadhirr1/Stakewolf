import { BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, Uint8BufferAttribute, Vector3 } from 'three';

// SCRUM-36: deterministic groom cards on the closed body, never on added locks
// or facial parts. The scene owns/disposes the returned geometry; input is read-only.
export function createFurRibbonGeometry(sourceGeometry, {
  count = 4000, seed = 36, length = 0.025, width = 0.012, worldScale = 1
} = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 8000) throw new RangeError('Fur ribbon count must be 1–8000');
  if (![length, width, worldScale].every(value => Number.isFinite(value) && value > 0)) throw new RangeError('Fur dimensions and scale must be positive');
  if (!Number.isInteger(seed)) throw new TypeError('Fur seed must be an integer');
  const required = ['position', 'normal', 'uv', 'skinIndex', 'skinWeight', '_fur_part', '_fur_mask', '_fur_direction'];
  const attributes = Object.fromEntries(required.map(name => {
    const attribute = sourceGeometry.getAttribute(name);
    if (!attribute) throw new TypeError(`Fur geometry requires ${name}`);
    return [name, attribute];
  }));
  const vertexCount = attributes.position.count;
  for (const attribute of Object.values(attributes)) if (attribute.count !== vertexCount) throw new TypeError('Fur input attributes have unequal lengths');
  const at = offset => sourceGeometry.index ? sourceGeometry.index.getX(offset) : offset;
  const inputCount = sourceGeometry.index ? sourceGeometry.index.count : vertexCount;
  if (inputCount % 3) throw new TypeError('Fur geometry requires triangles');
  const triangles = [];
  let area = 0;
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  for (let offset = 0; offset < inputCount; offset += 3) {
    const ids = [at(offset), at(offset + 1), at(offset + 2)];
    if (!ids.every(id => attributes._fur_part.getX(id) === 1 && attributes._fur_mask.getX(id) === 1)) continue;
    a.fromBufferAttribute(attributes.position, ids[0]); b.fromBufferAttribute(attributes.position, ids[1]); c.fromBufferAttribute(attributes.position, ids[2]);
    const triangleArea = b.sub(a).cross(c.sub(a)).length() * 0.5;
    if (!Number.isFinite(triangleArea)) throw new TypeError('Fur input contains non-finite positions');
    if (triangleArea <= 1e-12) continue;
    area += triangleArea; triangles.push({ ids, cumulativeArea: area });
  }
  if (!triangles.length) throw new RangeError('No closed-body coat triangles found');
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
  const pickTriangle = () => {
    const target = random() * area;
    let low = 0, high = triangles.length - 1;
    while (low < high) { const mid = (low + high) >>> 1; if (triangles[mid].cumulativeArea < target) low = mid + 1; else high = mid; }
    return triangles[low].ids;
  };
  const outputCount = count * 8;
  const positions = new Float32Array(outputCount * 3), normals = new Float32Array(outputCount * 3);
  const uv = new Float32Array(outputCount * 2), flow = new Float32Array(outputCount * 3), strand = new Float32Array(outputCount * 2);
  const skinIndex = new Uint16Array(outputCount * 4), skinWeight = new Float32Array(outputCount * 4);
  const mask = new Float32Array(outputCount).fill(1), parts = new Uint8Array(outputCount).fill(1);
  const indices = new Uint16Array(count * 18);
  let maximumDiscardedWeight = 0, rejectedSkinSamples = 0, exactVertexFallbacks = 0, sampledRoots = 0;
  const profileCounts = { body: 0, face: 0, ears: 0, feet: 0 };
  const interpolate3 = (attribute, ids, weights) => {
    const result = new Vector3();
    for (let i = 0; i < 3; i++) result.addScaledVector(new Vector3().fromBufferAttribute(attribute, ids[i]), weights[i]);
    return result;
  };
  const sampleSkin = (ids, barycentric) => {
    const merged = new Map();
    for (let i = 0; i < 3; i++) for (let channel = 0; channel < 4; channel++) {
      const joint = attributes.skinIndex.getComponent(ids[i], channel);
      const weight = attributes.skinWeight.getComponent(ids[i], channel) * barycentric[i];
      if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(joint) || joint < 0 || joint > 65535) throw new TypeError('Invalid source skin data');
      if (weight) merged.set(joint, (merged.get(joint) || 0) + weight);
    }
    const sorted = [...merged].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const selected = sorted.slice(0, 4), retainedWeight = selected.reduce((sum, [, weight]) => sum + weight, 0);
    if (retainedWeight < 1e-8) throw new TypeError('Body sample has no valid skin weight');
    return { selected, retainedWeight, discardedWeight: sorted.slice(4).reduce((sum, [, weight]) => sum + weight, 0) };
  };
  for (let ribbon = 0; ribbon < count; ribbon++) {
    let ids, barycentric, skin;
    // Reject joints where reducing up to twelve interpolated influences to four
    // would shift the strand root. A bounded fallback stays exactly on a coat vertex.
    for (let attempt = 0; attempt < 20; attempt++) {
      ids = pickTriangle(); const sqrt = Math.sqrt(random()), v = random();
      barycentric = [1 - sqrt, sqrt * (1 - v), sqrt * v];
      skin = sampleSkin(ids, barycentric); sampledRoots++;
      if (skin.discardedWeight <= 0.02) break;
      rejectedSkinSamples++;
      if (attempt === 19) {
        const nearest = barycentric.indexOf(Math.max(...barycentric));
        barycentric = [0, 0, 0]; barycentric[nearest] = 1;
        skin = sampleSkin(ids, barycentric); exactVertexFallbacks++;
      }
    }
    const { selected, retainedWeight, discardedWeight } = skin;
    maximumDiscardedWeight = Math.max(maximumDiscardedWeight, discardedWeight);
    const root = interpolate3(attributes.position, ids, barycentric);
    const normal = interpolate3(attributes.normal, ids, barycentric).normalize();
    if (normal.lengthSq() < 0.5) throw new TypeError('Body normal cannot orient fur');
    const direction = interpolate3(attributes._fur_direction, ids, barycentric);
    direction.addScaledVector(normal, -direction.dot(normal));
    if (direction.lengthSq() < 1e-10) { direction.set(0, 1, 0); direction.addScaledVector(normal, -direction.dot(normal)); }
    if (direction.lengthSq() < 1e-10) { direction.set(1, 0, 0); direction.addScaledVector(normal, -direction.dot(normal)); }
    direction.normalize();
    // Small deterministic variation keeps adjacent cards from forming parallel combs.
    direction.applyAxisAngle(normal, (random() - 0.5) * 0.48);
    const across = direction.clone().cross(normal).normalize();
    let profile = 'body', profileLength = 1, profileWidth = 1;
    // This asset is Z-up/front -Y in mesh-local space. Short guard hair protects
    // the head/ear outline and paws from the long, uniform hedgehog appearance.
    if (root.y < -0.88) { profile = 'face'; profileLength = 0.38; profileWidth = 0.6; }
    if (root.z > 1.24 && root.y < -0.82) { profile = 'ears'; profileLength = 0.26; profileWidth = 0.5; }
    if (root.z < 0.22) { profile = 'feet'; profileLength = 0.34; profileWidth = 0.55; }
    profileCounts[profile]++;
    const localLength = length / worldScale * profileLength * (0.8 + random() * 0.4);
    const localWidth = width / worldScale * profileWidth * (0.75 + random() * 0.5);
    const rise = 0.008 / worldScale * profileLength * (0.85 + random() * 0.3);
    const rootUv = [0, 0];
    for (let i = 0; i < 3; i++) {
      rootUv[0] += attributes.uv.getX(ids[i]) * barycentric[i];
      rootUv[1] += attributes.uv.getY(ids[i]) * barycentric[i];
    }
    for (let segment = 0; segment < 4; segment++) {
      const t = segment / 3;
      const center = root.clone().addScaledVector(direction, localLength * t)
        .addScaledVector(normal, rise * Math.sin(t * Math.PI * 0.5) - 0.00015 / worldScale);
      const tangent = direction.clone().multiplyScalar(localLength).addScaledVector(normal, rise * Math.PI * 0.5 * Math.cos(t * Math.PI * 0.5));
      const ribbonNormal = across.clone().cross(tangent).normalize();
      const ribbonFlow = tangent.normalize();
      const widthProfile = [0.8, 1, 0.65, 0.3][segment];
      for (let side = 0; side < 2; side++) {
        const vertex = ribbon * 8 + segment * 2 + side;
        center.clone().addScaledVector(across, (side - 0.5) * localWidth * widthProfile).toArray(positions, vertex * 3);
        ribbonNormal.toArray(normals, vertex * 3); ribbonFlow.toArray(flow, vertex * 3);
        uv.set(rootUv, vertex * 2); strand.set([side, t], vertex * 2);
        selected.forEach(([joint, weight], channel) => { skinIndex[vertex * 4 + channel] = joint; skinWeight[vertex * 4 + channel] = weight / retainedWeight; });
      }
    }
    for (let segment = 0; segment < 3; segment++) {
      const start = ribbon * 8 + segment * 2, offset = ribbon * 18 + segment * 6;
      indices.set([start, start + 1, start + 2, start + 1, start + 3, start + 2], offset);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setIndex(new Uint16BufferAttribute(indices, 1));
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeight, 4));
  geometry.setAttribute('_fur_mask', new Float32BufferAttribute(mask, 1));
  geometry.setAttribute('_fur_direction', new Float32BufferAttribute(flow, 3));
  geometry.setAttribute('_fur_part', new Uint8BufferAttribute(parts, 1));
  geometry.setAttribute('_fur_strand', new Float32BufferAttribute(strand, 2));
  geometry.userData.furRibbons = { count, seed, sourceTriangles: triangles.length, sourceArea: area,
    triangles: count * 6, maximumDiscardedSkinWeight: maximumDiscardedWeight,
    sampledRoots, rejectedSkinSamples, exactVertexFallbacks, profileCounts };
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
