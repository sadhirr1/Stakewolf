import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, SkinnedMesh, Vector3 } from 'three';
import { createFurRibbonGeometry } from './fur-geometry.js';

// SCRUM-36: static, curved coat ribbons. The actor owns its skeleton; the scene
// owns generated geometry/materials. Texture maps remain shared with the body.
const uniformsByMaterial = new WeakMap();
const VARYINGS = `
varying float vFurMask;
varying float vFurPart;
varying vec2 vFurCoordinates;
varying vec3 vFurFlowView;
`;

export function createFurMaterial(source, { coatMap = source.map, ribbons = false, worldScale = 1 } = {}) {
  const material = new MeshPhysicalMaterial();
  // Keep the creator's normal/roughness maps, UV transforms and face response.
  MeshStandardMaterial.prototype.copy.call(material, source);
  material.defines = { STANDARD: '', PHYSICAL: '' };
  material.map = coatMap;
  material.sheen = 0.24;
  material.sheenColor.set(0xffffff);
  material.sheenRoughness = 0.85;
  const uniforms = {
    uFurDetail: { value: 0 },
    uFurWorldScale: { value: worldScale > 0 ? worldScale : 1 }
  };
  uniformsByMaterial.set(material, uniforms);
  if (ribbons) {
    material.alphaTest = 0.035;
    material.alphaToCoverage = true;
    material.depthWrite = false;
    material.side = DoubleSide;
    // Every ribbon samples the coat at its root. A constant source UV has no
    // tangent frame for the normal map; curved geometry supplies its normal.
    material.normalMap = null;
  }
  material.customProgramCacheKey = () => `stakewolf-ribbon-coat-v3-${ribbons ? 'ribbon' : 'base'}`;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `
attribute float _fur_mask;
attribute vec3 _fur_direction;
${ribbons ? 'attribute vec2 _fur_strand; varying vec2 vFurStrand;' : 'attribute float _fur_part;'}
uniform float uFurWorldScale;
${VARYINGS}
${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <skinnormal_vertex>', `
#include <skinnormal_vertex>
vec3 furAnimatedFlow = _fur_direction;
#ifdef USE_SKINNING
  furAnimatedFlow = (skinMatrix * vec4(furAnimatedFlow, 0.0)).xyz;
#endif
vFurFlowView = normalMatrix * furAnimatedFlow;
`);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
#include <begin_vertex>
// Geometry and its flow are mesh-local. Ribbons are curved before skinning,
// so the authored bone transforms apply once to positions and directions.
vec3 furLocalNormal = normalize(normal);
vec3 furFlow = _fur_direction;
if (dot(furFlow, furFlow) < 0.001) {
  furFlow = cross(furLocalNormal, abs(furLocalNormal.z) > 0.8 ? vec3(1.,0.,0.) : vec3(0.,0.,1.));
}
furFlow = normalize(furFlow);
vec3 furAcross = normalize(cross(furLocalNormal, furFlow));
vFurMask = _fur_mask;
vFurPart = ${ribbons ? '1.0' : '_fur_part'};
vFurCoordinates = vec2(dot(position, furAcross) * 180.0, dot(position, furFlow) * 40.0) * uFurWorldScale;
${ribbons ? 'vFurStrand = _fur_strand;' : ''}
`);
    shader.fragmentShader = `
uniform float uFurDetail;
${ribbons ? 'varying vec2 vFurStrand;' : ''}
${VARYINGS}
float furHash(float value) { return fract(sin(value * 127.1) * 43758.5453); }
${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', `
float furMask = step(0.995, vFurMask);
float furPixelWidth = max(fwidth(vFurCoordinates.x), 0.001);
float furResolved = 1.0 - smoothstep(0.65, 1.4, furPixelWidth);
float furWave = sin((vFurCoordinates.x + sin(vFurCoordinates.y * 2.3) * 0.08) * 6.2831853);
${ribbons ? `
// Ribbons are rooted only in semantically tagged, closed body-coat triangles.
if (vFurMask < 0.995) discard;
// A card is one thin strand: a multi-fiber card collapses to a broad opaque
// patch at this portrait's pixel scale, even with sub-pixel alpha grooves.
float furAcross = abs(vFurStrand.x - 0.5);
float furWidth = 0.44 * (1.0 - smoothstep(0.3, 1.0, vFurStrand.y));
float furAA = max(fwidth(vFurStrand.x), 0.005) * 0.35;
float furCoverage = 1.0 - smoothstep(furWidth - furAA, furWidth + furAA, furAcross);
furCoverage *= smoothstep(0.0, 0.025, vFurStrand.y) * (1.0 - smoothstep(0.8, 1.0, vFurStrand.y));
diffuseColor.a *= furCoverage * uFurDetail;
` : `
// Replace the old detached clumps gradually, using a spatially fixed pattern
// rather than time/noise animation. The underlying body remains closed.
if (vFurPart > 10.5) {
  float furDither = fract(sin(dot(floor(vFurCoordinates * 3.0), vec2(12.9898, 78.233))) * 43758.5453);
  if (furDither < smoothstep(0.15, 0.8, uFurDetail)) discard;
}
`}
diffuseColor.rgb *= 1.0 - furMask * uFurDetail * furResolved * (0.055 + 0.055 * furWave);
#include <alphatest_fragment>
`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `
#include <normal_fragment_maps>
// Retain the normal map but soften the hard carved clump response on fur only.
normal = normalize(mix(normal, nonPerturbedNormal, furMask * 0.38));
vec3 furAcrossView = cross(normal, vFurFlowView);
float furAcrossLength = length(furAcrossView);
if (furAcrossLength > 0.0001) {
  normal = normalize(normal + furAcrossView / furAcrossLength * furWave * 0.10 * furMask * uFurDetail * furResolved);
}
`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_fragment>', `
#include <lights_physical_fragment>
material.roughness = mix(material.roughness, max(material.roughness, 0.92), furMask);
material.specularColor *= mix(1.0, 0.65, furMask);
material.specularColorBlended *= mix(1.0, 0.65, furMask);
material.specularF90 *= mix(1.0, 0.65, furMask);
#ifdef USE_SHEEN
  material.sheenColor *= furMask * sqrt(max(diffuseColor.rgb, vec3(0.0)));
#endif
`);
  };
  return material;
}

export function attachFurLayers(root, { ownMaterial, ownGeometry } = {}) {
  if (typeof ownMaterial !== 'function' || typeof ownGeometry !== 'function')
    throw new TypeError('Fur materials and generated geometry require a scene owner');
  const sources = [], details = [], controlledMaterials = new Set();
  root.updateWorldMatrix(true, true);
  root.traverse(node => {
    if (node.isSkinnedMesh && !Array.isArray(node.material) &&
      node.geometry.getAttribute('_fur_mask') && node.geometry.getAttribute('_fur_direction') &&
      node.geometry.getAttribute('_fur_part')) sources.push(node);
  });
  // The delivered Warg has one body mesh. Bound additional portrait draws even
  // if a future imported model contains several eligible body meshes.
  for (const source of sources.slice(0, 1)) {
    const scale = source.getWorldScale(new Vector3());
    const largest = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    const smallest = Math.min(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    // This groom is uniformly scaled. Do not invent a thickness for stretched rigs.
    if (!Number.isFinite(largest) || smallest <= 0 || largest - smallest > largest * 0.001) continue;
    const baseUniforms = uniformsByMaterial.get(source.material);
    if (baseUniforms) {
      baseUniforms.uFurWorldScale.value = largest;
      controlledMaterials.add(source.material);
    }
    const geometry = ownGeometry(createFurRibbonGeometry(source.geometry, {
      count: 7000, seed: 36, length: 0.025, width: 0.0032, worldScale: largest
    }));
    const material = ownMaterial(createFurMaterial(source.material, { ribbons: true, worldScale: largest }));
    const detail = new SkinnedMesh(geometry, material);
    detail.name = `${source.name}-portrait-fur`;
    detail.bindMode = source.bindMode;
    detail.bind(source.skeleton, source.bindMatrix);
    detail.bindMatrixInverse.copy(source.bindMatrixInverse);
    // Identity child transform preserves source world placement and the exact
    // actor skeleton; attached bind matrices update together with the body.
    source.add(detail);
    detail.frustumCulled = false;
    detail.castShadow = false;
    detail.receiveShadow = source.receiveShadow;
    detail.renderOrder = 1;
    detail.visible = false;
    details.push(detail); controlledMaterials.add(material);
  }
  let disposed = false;
  return {
    setDetail(value) {
      if (disposed) return;
      let amount = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
      for (let node = root; node; node = node.parent) if (!node.visible) amount = 0;
      controlledMaterials.forEach(material => { uniformsByMaterial.get(material).uFurDetail.value = amount; });
      details.forEach(detail => { detail.visible = amount > 0.01; });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controlledMaterials.forEach(material => { uniformsByMaterial.get(material).uFurDetail.value = 0; });
      details.forEach(detail => { detail.visible = false; detail.removeFromParent(); });
      details.length = 0; controlledMaterials.clear();
      // Scene disposes generated geometry/materials; actor owns its skeleton.
    }
  };
}
