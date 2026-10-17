const wrapped = new WeakSet();

// Layer height-aware distance haze onto existing materials, including fur and
// portrait hooks. This is a depth cue in their normal pass, not volumetric fog.
export function applyGladeFog(material) {
  if (wrapped.has(material) || !material.fog || !(material.isMeshStandardMaterial || material.isMeshBasicMaterial)) return material;
  wrapped.add(material);
  const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${previousKey}|hollow-height-haze-v1`;
  material.onBeforeCompile = function(shader, renderer) {
    previous.call(this, shader, renderer);
    // Portrait materials preserve the preceding fur hook when cloned. Avoid
    // adding the same varying twice through that preserved callback chain.
    if (shader.vertexShader.includes('varying float vGladeHeight;')) return;
    shader.vertexShader = `varying float vGladeHeight;\n${shader.vertexShader}`;
    shader.fragmentShader = `varying float vGladeHeight;\n${shader.fragmentShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <fog_vertex>', `
#include <fog_vertex>
vec4 gladePosition = vec4(transformed, 1.0);
#ifdef USE_BATCHING
  gladePosition = batchingMatrix * gladePosition;
#endif
#ifdef USE_INSTANCING
  gladePosition = instanceMatrix * gladePosition;
#endif
vGladeHeight = (modelMatrix * gladePosition).y;
`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
#ifdef USE_FOG
  float gladeDistance = max(vFogDepth, 0.0);
  #ifdef FOG_EXP2
    float gladeAir = 1.0 - exp(-fogDensity * fogDensity * gladeDistance * gladeDistance);
  #else
    float gladeAir = smoothstep(fogNear, fogFar, gladeDistance);
  #endif
  float gladeLow = exp(-max(vGladeHeight - 0.15, 0.0) * 0.32);
  float gladeHaze = (1.0 - exp(-max(gladeDistance - 9.0, 0.0) * 0.036)) * gladeLow;
  float gladeFog = 1.0 - (1.0 - gladeAir) * (1.0 - gladeHaze);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, gladeFog);
#endif
`);
  };
  return material;
}

