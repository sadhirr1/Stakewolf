import { buildCharacter } from './cast.js';

/** SCRUM-35 — original, asset-free wilderness scene. Native WebGL 1. */
export function createForestScene(canvas, options = {}) {
  const noop = () => {};
  const inert = { travelTo: noop, focusPerson: noop, setDawn: noop, setMorning: noop, setPaused: noop, setReducedMotion: noop, setOutcome: noop, dispose: noop };
  let gl;
  try {
    gl = canvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
  } catch { /* The readable DOM experience remains available without a GPU. */ }
  if (!gl) {
    options.onFailure?.('The forest view is unavailable on this device.');
    return inert;
  }

  let disposed = false, failed = false, paused = false, reducedMotion = Boolean(options.reducedMotion);
  let frame = 0, lastTime = 0, elapsed = 0, ready = false, outcome = 0, selectedOutcome = null, selectedMorning = null;
  let width = 1, height = 1, cssWidth = 1, cssHeight = 1, location = 'overlook', focusedPerson = null, orbitPerson = null, dawn = false;
  const resources = { programs: [], buffers: [] };
  let resizeObserver;
  const seed = { value: 32771 };
  const random = () => { seed.value = (Math.imul(seed.value, 1664525) + 1013904223) >>> 0; return seed.value / 4294967296; };
  const between = (a, b) => a + random() * (b - a);
  const mix = (a, b, t) => a + (b - a) * t;
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const mul = (a, n) => a.map(v => v * n);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = a => mul(a, 1 / (Math.hypot(...a) || 1));
  const dot = (a, b) => a.reduce((v, n, i) => v + n * b[i], 0);
  const riverX = z => 8.7 + Math.sin(z * 0.065) * 2.2;
  const riverWidth = z => 1.6 + Math.sin(z * 0.09 + 1) * 0.28;
  const ground = (x, z) => {
    const bank = Math.abs(x - riverX(z)) - riverWidth(z);
    const rolling = Math.sin(x * 0.19 + z * 0.13) * 0.12 + Math.cos(z * 0.23) * 0.13;
    return rolling + Math.max(0, -z - 14) * 0.019 - Math.max(0, 1 - bank) * 0.5;
  };
  const people = {
    orin: { x: -5.25, z: -0.40, scale: 1.03, color: [0.40,0.22,0.13], fur: [0.48,0.43,0.34], trim: [0.67,0.49,0.25], index: 0 },
    sera: { x: -1.22, z: -1.52, scale: 0.98, color: [0.16,0.31,0.25], fur: [0.56,0.59,0.54], trim: [0.43,0.55,0.39], index: 1 },
    vela: { x: -2.3, z: 2.25, scale: 1.05, color: [0.23,0.23,0.38], fur: [0.27,0.31,0.33], trim: [0.69,0.64,0.46], index: 2 }
  };
  const anchorPosition = [riverX(-5.2) + 2.4, 0.83, -4.27];
  const inspectionLamp = [0.55, ground(0.55,-15.4)+1.0, -15.4];

  function failure(message) {
    if (failed || disposed) return;
    failed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    options.onFailure?.(message);
  }
  function program(vertex, fragment) {
    const shaders = [];
    let result;
    try {
      for (const [kind, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
        const shader = gl.createShader(kind);
        if (!shader) throw new Error('Shader allocation failed');
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(`Shader compilation failed: ${gl.getShaderInfoLog(shader) || 'no diagnostic'}`);
      }
      result = gl.createProgram();
      if (!result) throw new Error('Program allocation failed');
      shaders.forEach(shader => gl.attachShader(result, shader));
      gl.linkProgram(result);
      if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(`Shader linking failed: ${gl.getProgramInfoLog(result) || 'no diagnostic'}`);
      resources.programs.push(result);
      return result;
    } catch (error) {
      if (result) gl.deleteProgram(result);
      throw error;
    } finally {
      shaders.forEach(shader => gl.deleteShader(shader));
    }
  }
  function buffer(data) {
    const result = gl.createBuffer();
    if (!result) throw new Error('Buffer allocation failed');
    resources.buffers.push(result);
    gl.bindBuffer(gl.ARRAY_BUFFER, result);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return result;
  }
  const vertexShader = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;
    attribute float aKind;
    uniform mat4 uViewProjection;
    uniform mediump float uTime;
    uniform mediump vec3 uEye;
    uniform mediump float uFocusPerson;
    uniform vec4 uOrinPose;
    uniform vec4 uSeraPose;
    uniform vec4 uVelaPose;
    varying mediump vec3 vWorld;
    varying mediump vec3 vNormal;
    varying mediump vec3 vColor;
    varying mediump float vKind;
    void main() {
      vec3 p = aPosition;
      vec3 normal = aNormal;
      if (aKind > 0.5 && aKind < 1.5) {
        p.x += sin(p.z * 0.31 + uTime * 0.32 + p.y) * 0.035 * min(p.y, 5.0);
      }
      // Height-weighted motion keeps feet planted; this is a restrained idle, not a skeletal rig.
      if (aKind >= 4.0 && aKind < 7.0) {
        float person = floor(aKind);
        float localHeight = fract(aKind) / 0.12;
        float phase = person * 1.8;
        vec4 pose = person < 4.5 ? uOrinPose : person < 5.5 ? uSeraPose : uVelaPose;
        vec2 relative = p.xz-pose.xz;
        float localRight = (relative.x*cos(pose.w)-relative.y*sin(pose.w))/pose.y;
        // Sera's outer walking staff remains planted and rigid while her head attends.
        float bodyMotion = 1.0-step(0.56,localRight)*(1.0-step(0.4,abs(person-5.0)));
        float faceAngle = atan(uEye.x-pose.x,uEye.z-pose.z)-pose.w;
        float attention = clamp(atan(sin(faceAngle),cos(faceAngle)),-0.22,0.22);
        float selected = 1.0-step(0.4,abs(person-uFocusPerson));
        float headTurn = (attention*selected+sin(uTime*0.45+phase)*0.018)*smoothstep(1.53,1.93,localHeight)*bodyMotion;
        float c = cos(headTurn),s = sin(headTurn);
        p.xz = pose.xz+vec2(relative.x*c+relative.y*s,relative.y*c-relative.x*s);
        normal.xz = vec2(normal.x*c+normal.z*s,normal.z*c-normal.x*s);
        float sway = sin(uTime*0.41+phase)*0.018*smoothstep(0.20,1.3,localHeight)*bodyMotion;
        p.x += cos(pose.w)*sway;
        p.z -= sin(pose.w)*sway;
        p.y += sin(uTime*1.4+phase)*0.018*min(fract(aKind)*3.0,1.0)*bodyMotion;
      }
      vWorld = p; vNormal = normal; vColor = aColor; vKind = aKind;
      gl_Position = uViewProjection * vec4(p, 1.0);
    }
  `;
  const fragmentShader = `
    precision mediump float;
    uniform vec3 uEye;
    uniform mediump float uTime;
    uniform float uOutcome;
    uniform float uDawn;
    uniform mediump float uFocusPerson;
    uniform float uTrailInspection;
    uniform vec3 uInspectionLamp;
    varying mediump vec3 vWorld;
    varying mediump vec3 vNormal;
    varying mediump vec3 vColor;
    varying mediump float vKind;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec3 n = normalize(vNormal);
      if (!gl_FrontFacing) n = -n;
      vec3 moon = normalize(mix(vec3(-0.5, 0.8, -0.38), vec3(0.74, 0.36, -0.58), uDawn));
      float diffuse = max(0.0, dot(n, moon));
      float sky = n.y * 0.5 + 0.5;
      vec3 lighting = mix(vec3(0.15, 0.21, 0.26), vec3(0.43, 0.43, 0.36), uDawn);
      lighting += mix(vec3(0.54, 0.76, 0.91), vec3(1.15, 0.79, 0.41), uDawn) * diffuse;
      lighting += vec3(0.10, 0.16, 0.17) * sky;
      vec3 fireDelta = vec3(-3.0, 0.85, 0.0) - vWorld;
      float fireDistance = length(fireDelta);
      float flicker = 0.95 + sin(uTime * 4.3) * 0.04 + sin(uTime * 7.1) * 0.03;
      float fire = (5.8 + uOutcome * 0.25) / (1.0 + fireDistance * fireDistance * 0.26);
      fire *= max(0.16, dot(n, fireDelta/max(fireDistance,0.01))) * flicker * mix(1.0, 0.21, uDawn);
      if (vKind >= 4.0 && vKind < 7.0) fire *= 0.68;
      lighting += vec3(1.0, 0.53, 0.20) * fire;
      vec3 tentDelta = vec3(-7.7, 1.0, -4.0) - vWorld;
      lighting += vec3(0.62, 0.24, 0.07) / (1.0 + dot(tentDelta, tentDelta) * 0.3);
      vec3 tableDelta = vec3(-7.52,1.15,-0.12)-vWorld;
      lighting += vec3(0.92,0.51,0.22) * mix(1.0,0.35,uDawn) / (1.0+dot(tableDelta,tableDelta)*0.7);
      vec3 canopyDelta = vec3(-5.0,2.7,-4.2)-vWorld;
      lighting += vec3(0.55,0.33,0.15) * mix(1.0,0.35,uDawn) / (1.0+dot(canopyDelta,canopyDelta)*0.55);
      if (uTrailInspection > 0.5) {
        vec3 inspectionDelta = uInspectionLamp - vWorld;
        float inspectionLight = 2.8 / (1.0 + dot(inspectionDelta,inspectionDelta) * 1.2);
        lighting += vec3(0.88,0.51,0.19) * inspectionLight * max(0.2,dot(n,inspectionDelta/max(0.01,length(inspectionDelta))));
      }
      vec3 col = vColor * lighting;
      // Soft fabric texture and brighter sky fill keep faces legible at close range.
      if (vKind >= 4.0 && vKind < 7.0) {
        float selected = 1.0-step(0.4,abs(floor(vKind)-uFocusPerson));
        vec3 toEye = normalize(uEye-vWorld);
        vec3 shotRight = vec3(toEye.z,0.0,-toEye.x)/max(0.01,length(toEye.xz));
        vec3 sideFill = normalize(toEye*0.24-shotRight*0.95+vec3(0.0,0.55,0.0));
        float faceFill = max(0.0,dot(n,sideFill));
        col += vColor * (vec3(0.055,0.075,0.095)+vec3(0.10,0.23,0.34)*faceFill*selected);
        col *= 0.985 + 0.015 * sin(vWorld.y * 82.0) * sin(vWorld.x * 71.0 + vWorld.z * 67.0);
      }
      float rim = pow(1.0 - max(0.0, dot(n, normalize(uEye - vWorld))), 2.6) * (0.18+diffuse);
      col += mix(vec3(0.09,0.18,0.23),vec3(0.16,0.14,0.10),uDawn) * rim;
      float dist = length(uEye - vWorld);
      if (vKind > 1.5 && vKind < 2.5) col = vColor * 1.45;
      if (vKind > 2.5 && vKind < 3.5) {
        float ripple = sin(vWorld.z * 7.0 + vWorld.x * 2.5 - uTime * 1.3);
        ripple += sin(vWorld.z * 15.0 - vWorld.x * 3.0 + uTime * 0.7) * 0.25;
        vec3 eyeDirection = normalize(uEye - vWorld);
        float fresnel = pow(1.0 - max(0.0, eyeDirection.y), 3.0);
        col = mix(mix(vec3(0.019, 0.083, 0.088),vec3(0.07,0.13,0.12),uDawn), mix(vec3(0.17, 0.30, 0.30),vec3(0.52,0.40,0.25),uDawn), fresnel);
        float glimmer = pow(max(0.0, ripple * 0.78), 14.0);
        float reflection = exp(-pow((vWorld.x - 8.2 - vWorld.z * 0.08) * 0.6, 2.0));
        col += vec3(0.32, 0.44, 0.40) * glimmer * reflection * 0.4;
      }
      // Compress fire highlights while keeping fur and cloth midtones readable.
      col = clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
      float fog = 1.0 - exp(-dist * 0.018);
      fog += max(0.0, 1.7 - vWorld.y) * 0.016 * min(dist * 0.025, 1.0);
      vec3 fogColor = mix(vec3(0.095, 0.176, 0.185), vec3(0.37, 0.34, 0.25), uDawn);
      col = mix(col, fogColor, clamp(fog, 0.0, 0.94));
      col += (hash(mod(gl_FragCoord.xy, vec2(64.0))) - 0.5) / 255.0;
      gl_FragColor = vec4(col, 1.0);
    }
  `;
  const skyVertex = `
    attribute vec2 aPosition;
    varying mediump vec2 vUv;
    void main() { vUv = aPosition; gl_Position = vec4(aPosition, 0.9999, 1.0); }
  `;
  const skyFragment = `
    precision mediump float;
    varying mediump vec2 vUv;
    uniform vec3 uForward;
    uniform vec3 uRight;
    uniform vec3 uUp;
    uniform float uAspect;
    uniform float uFov;
    uniform float uFraming;
    uniform float uDawn;
    float hash(vec3 p) { return fract(sin(dot(p, vec3(17.7, 157.3, 113.5))) * 4375.58); }
    void main() {
      vec3 ray = normalize(uForward + uRight * (vUv.x+uFraming) * uAspect * uFov + uUp * vUv.y * uFov);
      float altitude = smoothstep(-0.08, 0.62, ray.y);
      vec3 color = mix(vec3(0.12, 0.22, 0.23), vec3(0.016, 0.042, 0.065), altitude);
      vec3 morning = mix(vec3(0.69, 0.47, 0.28), vec3(0.16, 0.28, 0.33), altitude);
      color = mix(color, morning, uDawn);
      vec3 moonDirection = normalize(vec3(-0.80, 0.25, -1.0));
      float moonDistance = length(ray - moonDirection);
      color += vec3(0.31, 0.39, 0.36) * exp(-moonDistance * 15.0) * 0.36 * (1.0 - uDawn);
      float disk = (1.0 - smoothstep(0.040, 0.044, moonDistance)) * (1.0 - uDawn);
      float craters = sin(ray.x * 640.0) * sin(ray.y * 460.0) * 0.035;
      color = mix(color, vec3(0.76, 0.84, 0.73) + craters, disk);
      vec3 stars = floor(ray * 260.0);
      float star = step(0.9988, hash(stars)) * pow(max(0.0, 1.0 - length(fract(ray * 260.0) - 0.5) * 2.0), 5.0);
      color += vec3(0.5, 0.66, 0.66) * star * smoothstep(0.08, 0.35, ray.y) * (1.0 - uDawn);
      float sunDistance = length(ray - normalize(vec3(0.74, 0.22, -0.58)));
      color += vec3(0.64, 0.32, 0.09) * exp(-sunDistance * 6.0) * uDawn;
      color = mix(color, vec3(1.0,0.79,0.44), (1.0-smoothstep(0.031,0.039,sunDistance))*uDawn);
      color *= 1.0 - 0.12 * dot(vUv, vUv);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  const particleVertex = `
    precision highp float;
    attribute vec3 aPosition;
    attribute float aSize;
    attribute vec4 aColor;
    attribute float aKind;
    attribute float aPhase;
    uniform mat4 uViewProjection;
    uniform vec3 uEye;
    uniform mediump float uTime;
    uniform float uScale;
    uniform float uMaxSize;
    uniform float uDawn;
    varying mediump vec4 vColor;
    varying mediump float vKind;
    varying mediump float vPhase;
    void main() {
      vec3 p = aPosition;
      float opacity = 1.0;
      if (aKind < 0.5) p.x += sin(uTime * 0.055 + aPhase) * 1.0;
      if (aKind > 2.5 && aKind < 3.5) {
        float age = fract(uTime * 0.12 + aPhase);
        p.y += age * 4.5;
        p.x += sin(age * 8.0 + aPhase * 23.0) * age * 0.7;
        p.z += cos(age * 6.0 + aPhase * 12.0) * age * 0.45;
        opacity = sin(age * 3.14159);
      }
      if (aKind > 3.5 && aKind < 4.5) {
        float age = fract(uTime * 0.075 + aPhase);
        p.y += age * 5.5;
        p.x += age * age * 1.9;
        opacity = sin(age * 3.14159) * 0.65;
      }
      if (aKind > 5.5) {
        p.x += sin(uTime * 0.2 + aPhase * 6.0) * 0.2;
        p.y += cos(uTime * 0.3 + aPhase * 8.0) * 0.12;
        opacity = 0.45 + 0.55 * pow(sin(uTime * 0.4 + aPhase * 25.0), 2.0);
      }
      if (aKind > 1.5 && aKind < 4.5) opacity *= mix(1.0, 0.20, uDawn);
      if (aKind > 0.5 && aKind < 1.5) opacity *= mix(1.0, 0.35, uDawn);
      if (aKind > 5.5) opacity *= 1.0 - uDawn;
      vec4 clip = uViewProjection * vec4(p, 1.0);
      gl_Position = clip;
      gl_PointSize = clamp(aSize * uScale / max(0.1, clip.w), 1.0, uMaxSize);
      vec3 tint = aKind < 0.5 || (aKind > 4.5 && aKind < 5.5) ? mix(aColor.rgb, vec3(0.76,0.61,0.38),uDawn) : aColor.rgb;
      vColor = vec4(tint, aColor.a * opacity);
      vKind = aKind; vPhase = aPhase;
    }
  `;
  const particleFragment = `
    precision mediump float;
    uniform mediump float uTime;
    varying mediump vec4 vColor;
    varying mediump float vKind;
    varying mediump float vPhase;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float alpha = 0.0;
      vec3 color = vColor.rgb;
      if (vKind < 0.5) {
        p.y *= 3.8;
        float shape = dot(p, p);
        alpha = exp(-shape * 2.8) * (1.0 - smoothstep(0.3, 1.0, abs(p.x)));
      } else if (vKind > 1.5 && vKind < 2.5) {
        float vertical = 1.0 - gl_PointCoord.y;
        float sway = sin(vertical * 8.0 - uTime * 5.5 + vPhase) * 0.13 * vertical;
        float taper = max(0.04, (1.0 - vertical) * 0.64);
        float shape = abs(p.x - sway) / taper;
        alpha = (1.0 - smoothstep(0.0, 1.0, shape)) * sin(vertical * 3.14159);
        color = mix(vec3(1.0, 0.14, 0.015), vec3(1.0, 0.82, 0.26), alpha);
        alpha *= 1.9;
      } else if (vKind > 4.5 && vKind < 5.5) {
        vec2 q = vec2(p.x * 0.9 + p.y * 0.36, p.y);
        alpha = exp(-q.x * q.x * 160.0) * pow(max(0.0, 1.0 - abs(q.y)), 1.1);
      } else {
        alpha = exp(-dot(p, p) * (vKind > 3.5 && vKind < 4.5 ? 3.5 : 6.0));
        alpha *= 1.0 - smoothstep(0.6, 1.0, length(p));
      }
      float result = alpha * vColor.a;
      if (result < 0.002) discard;
      gl_FragColor = vec4(color, result);
    }
  `;

  // All opaque objects share a single static buffer and one draw call.
  const vertices = [];
  function triangle(a, b, c, color, kind = 0, normals) {
    const normal = unit(cross(sub(b, a), sub(c, a)));
    [a, b, c].forEach((p, i) => vertices.push(...p, ...(normals ? normals[i] : normal), ...color, kind));
  }
  function quad(a, b, c, d, color, kind = 0) {
    triangle(a, b, c, color, kind); triangle(a, c, d, color, kind);
  }
  function ellipsoid(center, scale, color, detail = 7, kind = 0, roughness = 0.09) {
    const rings = Math.max(4, Math.floor(detail * 0.7));
    const points = [];
    for (let j = 0; j <= rings; j++) {
      const row = [];
      for (let i = 0; i < detail; i++) {
        const phi = j / rings * Math.PI, theta = i / detail * Math.PI * 2;
        const noise = 1 + (random() - 0.5) * roughness;
        row.push(add(center, [Math.sin(phi) * Math.cos(theta) * scale[0] * noise,
          Math.cos(phi) * scale[1] * noise, Math.sin(phi) * Math.sin(theta) * scale[2] * noise]));
      }
      points.push(row);
    }
    for (let j = 0; j < rings; j++) for (let i = 0; i < detail; i++) {
      const next = (i + 1) % detail;
      const shade = mul(color, between(0.89, 1.11));
      quad(points[j][i], points[j + 1][i], points[j + 1][next], points[j][next], shade, kind);
    }
  }
  function tube(path, radii, color, sides = 7, kind = 0, bark = 0.1) {
    const rings = path.map((p, j) => {
      const tangent = unit(sub(path[Math.min(j + 1, path.length - 1)], path[Math.max(0, j - 1)]));
      const axis = unit(cross(tangent, Math.abs(tangent[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]));
      const axis2 = unit(cross(tangent, axis));
      return Array.from({ length: sides }, (_, i) => {
        const a = i / sides * Math.PI * 2;
        const radius = radii[j] * (1 + Math.sin(i * 14.3 + j * 0.7) * bark);
        return add(p, add(mul(axis, Math.cos(a) * radius), mul(axis2, Math.sin(a) * radius)));
      });
    });
    for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < sides; i++) {
      const k = (i + 1) % sides;
      const stripe = 0.8 + Math.sin(i * 2.9) * 0.14 + random() * 0.18;
      quad(rings[j][i], rings[j][k], rings[j + 1][k], rings[j + 1][i], mul(color, stripe), kind);
    }
    for (let i = 1; i < sides - 1; i++) {
      triangle(rings[0][0], rings[0][i + 1], rings[0][i], color, kind);
      const end = rings[rings.length - 1];
      triangle(end[0], end[i], end[i + 1], mul(color, 0.8), kind);
    }
  }
  function beam(a, b, radius, color, sides = 6) { tube([a, b], [radius, radius * 0.92], color, sides); }
  function box(center, size, color, angle = 0) {
    const transform = (x, y, z) => add(center, [x * Math.cos(angle) + z * Math.sin(angle), y, z * Math.cos(angle) - x * Math.sin(angle)]);
    const x = size[0] / 2, y = size[1] / 2, z = size[2] / 2;
    const p = [[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]].map(v => transform(...v));
    [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]].forEach(face => quad(...face.map(i => p[i]), color));
  }
  function terrain() {
    const step = 1.7;
    for (let z = -74; z < 27; z += step) for (let x = -44; x < 43; x += step) {
      const color = [0.125, 0.19, 0.155].map(v => v * between(0.88, 1.12));
      const p = [[x,z],[x,z+step],[x+step,z+step],[x+step,z]].map(([px,pz]) => [px,ground(px,pz),pz]);
      quad(...p, color);
    }
    for (let z = -73; z < 27; z += 1) {
      const a = riverX(z), b = riverX(z + 1), wa = riverWidth(z), wb = riverWidth(z + 1);
      quad([a-wa,-0.27,z],[b-wb,-0.27,z+1],[b+wb,-0.27,z+1],[a+wa,-0.27,z], [0.08,0.2,0.23], 3);
    }
  }
  function path(points, width = 0.8) {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i+1], direction = unit([b[0]-a[0],0,b[1]-a[1]]);
      const normal = [direction[2], 0, -direction[0]];
      const p = (v,s) => [v[0]+normal[0]*s,ground(v[0]+normal[0]*s,v[1]+normal[2]*s)+0.028,v[1]+normal[2]*s];
      quad(p(a,-width),p(b,-width),p(b,width),p(a,width),[0.215,0.228,0.176]);
      for (let k = 0; k < 3; k++) {
        const t = random(), x = mix(a[0],b[0],t)+between(-width,width), z = mix(a[1],b[1],t)+between(-width,width);
        ellipsoid([x,ground(x,z)+0.02,z],[between(0.08,0.22),0.025,between(0.12,0.25)],[0.27,0.29,0.24],5);
      }
    }
  }
  function tree(x, z, h, radius, hero = false) {
    const y = ground(x,z), leanX = between(-1.4,1.4), leanZ = between(-0.7,0.7);
    const bark = [0.14,0.185,0.17];
    const trunk = Array.from({length:7},(_,i) => {
      const t = i/6;
      return [x+leanX*t*t+Math.sin(t*4)*radius*0.25,y+h*t,z+leanZ*t];
    });
    tube(trunk,[radius*1.6,radius*0.91,radius*0.78,radius*0.66,radius*0.51,radius*0.31,0.05],bark,hero?11:7,0,0.19);
    if (z > -30) {
      for (let i = 0; i < 5; i++) {
        const angle = i / 5 * Math.PI * 2 + random()*0.4;
        const tipX = x + Math.cos(angle) * radius * between(2.5,4), tipZ = z + Math.sin(angle) * radius * between(2.5,4);
        tube([[x,y+radius*1.6,z],[mix(x,tipX,0.35),y+radius*0.28,mix(z,tipZ,0.35)],[tipX,ground(tipX,tipZ)+0.04,tipZ]],
          [radius*0.45,radius*0.31,0.04],mul(bark,0.88),5);
      }
    }
    const count = hero ? 7 : 5;
    for (let i = 0; i < count; i++) {
      const t = 0.39+i/count*0.48, a = i*2.4+random()*0.7;
      const spread = (1-t)*h*between(0.33,0.52);
      const start = [x+leanX*t*t,y+h*t,z+leanZ*t];
      const tip = [start[0]+Math.cos(a)*spread,start[1]+spread*0.55,start[2]+Math.sin(a)*spread];
      const elbow = [mix(start[0],tip[0],0.65),start[1]+spread*0.08,mix(start[2],tip[2],0.65)];
      tube([start,elbow,tip],[radius*(1-t)*0.78,radius*0.18,0.024],bark,5);
      if (hero || i%2===0) {
        const split = [elbow[0]+Math.cos(a+0.8)*spread*0.55,elbow[1]+spread*0.66,elbow[2]+Math.sin(a+0.8)*spread*0.55];
        tube([elbow,split],[radius*0.14,0.01],mul(bark,0.8),4);
      }
      const foliage = [0.105+random()*0.02,0.205+random()*0.025,0.168];
      ellipsoid(add(tip,[0,0.5,0]),[spread*0.68+0.5,0.65+spread*0.23,spread*0.56+0.5],foliage,hero?9:7,1,0.35);
      if (hero) ellipsoid(add(tip,[0.5,0.6,-0.4]),[spread*0.45+0.6,1.1,spread*0.47+0.4],mul(foliage,0.85),7,1,0.3);
    }
    ellipsoid([x+leanX,y+h*0.95,z+leanZ],[radius*2.2+0.5,h*0.08,radius*2+0.6],[0.10,0.20,0.165],7,1,0.3);
    if (hero) {
      // Thin strips of moss follow the shaded side of the bark.
      for (let i = 0; i < 4; i++) {
        const a = i*0.6+0.2;
        tube([[x+Math.cos(a)*radius,y+0.2,z+Math.sin(a)*radius],[x+Math.cos(a)*radius*0.94,y+2.5,z+Math.sin(a)*radius*0.94]],
          [radius*0.065,radius*0.02],[0.20,0.28,0.13],4);
      }
    }
  }
  function fern(x,z,scale=1) {
    const y=ground(x,z)+0.04;
    for(let k=0;k<6;k++) {
      const angle=k/6*Math.PI*2+0.2, dx=Math.cos(angle), dz=Math.sin(angle);
      const tip=[x+dx*scale*0.65,y+scale*between(0.32,0.7),z+dz*scale*0.65];
      const middle=[x+dx*scale*0.26,y+scale*0.64,z+dz*scale*0.26];
      tube([[x,y,z],middle,tip],[0.013*scale,0.01*scale,0.002],[0.19,0.31,0.15],3,1);
      for(let j=1;j<6;j++) {
        const t=j/6, p=add(mul([x,y,z],(1-t)*(1-t)),add(mul(middle,2*t*(1-t)),mul(tip,t*t)));
        const leaf=scale*0.19*(1-t*0.65);
        for(const side of [-1,1]) {
          const edge=[p[0]-dz*leaf*side-dx*leaf*0.3,p[1]+leaf*0.07,p[2]+dx*leaf*side-dz*leaf*0.3];
          triangle(p,edge,[p[0]+dx*scale*0.14,p[1]+0.025,p[2]+dz*scale*0.14],[0.18,0.32,0.19],1);
        }
      }
    }
  }
  const mist=[], lights=[];
  function particle(list,position,size,color,kind,phase=random()) { list.push(...position,size,...color,kind,phase); }
  function lantern(x,y,z,scale=1) {
    const dark=[0.18,0.17,0.11];
    box([x,y,z],[0.20*scale,0.31*scale,0.20*scale],[0.9,0.5,0.13]);
    box([x,y+0.19*scale,z],[0.3*scale,0.055*scale,0.3*scale],dark);
    box([x,y-0.19*scale,z],[0.28*scale,0.055*scale,0.28*scale],dark);
    for(const dx of [-1,1]) for(const dz of [-1,1]) beam([x+dx*0.11*scale,y-0.19*scale,z+dz*0.11*scale],[x+dx*0.11*scale,y+0.19*scale,z+dz*0.11*scale],0.018*scale,dark,4);
    ellipsoid([x,y,z],[0.07*scale,0.12*scale,0.07*scale],[1,0.55,0.12],5,2,0);
    particle(lights,[x,y,z],1.6*scale,[1,0.43,0.10,0.24],1);
  }
  function tent(x,z,angle,scale=1) {
    const y=ground(x,z), cos=Math.cos(angle),sin=Math.sin(angle);
    const p=(a,b,c)=>[x+(a*cos+c*sin)*scale,y+b*scale,z+(c*cos-a*sin)*scale];
    const wood=[0.24,0.19,0.12];
    // Cloth panels sag between ridge and stakes; alternating strips catch moonlight.
    for(const side of [-1,1]) for(let j=0;j<6;j++) for(let k=0;k<7;k++) {
      const point=(u,v)=>p(side*u*1.6,2.35*(1-u)-Math.sin(u*Math.PI)*0.19+Math.sin(v*Math.PI)*0.05,v*3.7-1.85);
      const u=j/6,v=k/7,c=[0.40,0.37,0.255].map(n=>n*(k%2?0.95:1));
      quad(point(u,v),point((j+1)/6,v),point((j+1)/6,(k+1)/7),point(u,(k+1)/7),c);
    }
    triangle(p(-1.6,0,1.85),p(0,2.35,1.85),p(1.6,0,1.85),[0.26,0.25,0.16]);
    triangle(p(-0.64,0,1.87),p(0,1.85,1.87),p(0.55,0,1.87),[0.055,0.046,0.028]);
    triangle(p(-1.6,0,-1.85),p(1.6,0,-1.85),p(0,2.35,-1.85),[0.32,0.32,0.21]);
    beam(p(0,0,1.92),p(0,2.65,1.92),0.06*scale,wood);
    beam(p(0,0,-1.92),p(0,2.65,-1.92),0.06*scale,wood);
    beam(p(0,2.37,-2.06),p(0,2.37,2.06),0.065*scale,wood);
    for(const side of [-1,1]) for(const end of [-1,1]) {
      beam(p(side*1.50,0.15,end*1.7),p(side*2.1,0.05,end*2.05),0.013,[0.4,0.35,0.23],3);
      beam(p(side*2.1,0,end*2.05),p(side*2.12,0.28,end*2.04),0.045,wood,4);
    }
    const lamp=p(-0.52,0.34,2.01); lantern(...lamp,0.85*scale);
    const post=p(0.16,2.66,1.91);
    triangle(post,add(post,[0.72*scale,-0.14,0.08]),add(post,[0.06,-0.48,0]),[0.53,0.24,0.11],1);
  }
  function figure(id) {
    const {x,z,color,fur,trim,scale,index}=people[id];
    const y=ground(x,z),angle=Math.atan2(-3-x,-z),cos=Math.cos(angle),sin=Math.sin(angle);
    // A soft contact patch seats the detailed, separately authored character in the clearing.
    ellipsoid([x,y+0.015,z],[0.64,0.016,0.55],[0.070,0.095,0.082],12,0,0);
    const local=buildCharacter(id,{color,fur,trim,index});
    for(let i=0;i<local.length;i+=10) {
      const a=local[i],b=local[i+1],c=local[i+2],nx=local[i+3],ny=local[i+4],nz=local[i+5];
      vertices.push(x+(a*cos+c*sin)*scale,y+b*scale,z+(c*cos-a*sin)*scale,
        nx*cos+nz*sin,ny,nz*cos-nx*sin,local[i+6],local[i+7],local[i+8],local[i+9]);
    }
  }
  function camp() {
    const y=ground(-3,0);
    // Worn earth, scattered leaves and a scorched center make a clearing, not a flat lawn.
    const floorPoint=(radius,a)=>{
      const x=-3+Math.cos(a)*radius,z=Math.sin(a)*radius*0.90;
      return [x,ground(x,z)+0.020,z];
    };
    for(let ring=0;ring<3;ring++)for(let i=0;i<28;i++) {
      const a=i/28*Math.PI*2,b=(i+1)/28*Math.PI*2;
      const r0=[0.25,1.0,2.45][ring],r1=[1.0,2.45,4.25][ring];
      const colors=[[0.11,0.13,0.105],[0.20,0.225,0.175],[0.165,0.205,0.155]];
      quad(floorPoint(r0,a),floorPoint(r0,b),floorPoint(r1,b),floorPoint(r1,a),mul(colors[ring],0.95+Math.sin(i*2.8)*0.055));
    }
    ellipsoid([-3,y+0.025,0],[0.72,0.04,0.62],[0.072,0.082,0.062],14,0,0.05);
    for(let i=0;i<12;i++) {
      const a=i/12*Math.PI*2;
      ellipsoid([-3+Math.cos(a)*0.79,y+0.17,Math.sin(a)*0.68],[0.22,0.18,0.20],[0.30,0.32,0.26],10);
    }
    for(let i=0;i<5;i++) {
      const a=i/5*Math.PI*2,dx=Math.cos(a)*0.64,dz=Math.sin(a)*0.64;
      beam([-3-dx,y+0.13,-dz],[-3+dx,y+0.29,dz],0.095,[0.14,0.105,0.068],7);
    }
    for(let i=0;i<14;i++) {
      const a=i*2.4,r=0.20+(i%4)*0.10;
      ellipsoid([-3+Math.cos(a)*r,y+0.11,Math.sin(a)*r],[0.07,0.025,0.05],[0.88,0.30,0.045],5,2,0.1);
    }
    particle(lights,[-3,0.55,0],5.6,[1,0.29,0.035,0.33],1);
    for(let i=0;i<9;i++) particle(lights,[-3+between(-0.25,0.25),y+0.5+between(0,0.28),between(-0.22,0.22)],between(1.1,1.65),[1,0.5,0.06,0.74],2,between(0,8));
    for(let i=0;i<48;i++) particle(lights,[-3+between(-0.25,0.25),y+0.25,between(-0.23,0.23)],between(0.02,0.05),[1,0.43,0.12,0.85],3);
    for(let i=0;i<13;i++) particle(mist,[-3,1.1,0],between(1.1,2),[0.22,0.28,0.27,0.06],4);
    Object.keys(people).forEach(figure);
    tent(-8.4,-4.5,0.33,1.05);
    tent(-2.7,-8.3,-0.25,0.86);
    tent(-10.4,1.3,0.85,0.8);
    // The council's field table holds a visible map and three wooden markers.
    box([-6.8,0.88,-0.1],[1.95,0.11,1.0],[0.26,0.205,0.135],0.2);
    for(const dx of [-0.78,0.78]) for(const dz of [-0.33,0.33]) beam([-6.8+dx,0.06,-0.1+dz],[-6.8+dx,0.84,-0.1+dz],0.055,[0.18,0.145,0.10]);
    box([-6.72,0.946,-0.1],[1.35,0.015,0.77],[0.60,0.56,0.37],0.2);
    for(let i=0;i<3;i++) ellipsoid([-7.05+i*0.34,1.01,-0.16+i*0.09],[0.04,0.07,0.04],[0.29,0.18,0.10],5);
    lantern(-7.52,1.15,-0.12,0.7);
    box([-9.05,0.35,-0.6],[0.85,0.7,0.75],[0.28,0.23,0.15],0.18);
    box([-9.07,0.72,-0.6],[0.91,0.07,0.81],[0.36,0.30,0.18],0.18);
    // A fallen log gives the clearing a readable, lived-in boundary.
    beam([-6.0,0.34,3.7],[-2.3,0.37,4.7],0.25,[0.18,0.17,0.12],10);
    campDetails();
  }
  function campDetails() {
    const wood=[0.27,0.205,0.12],rope=[0.39,0.35,0.23];
    // Hanging pools of warm light establish a second plane behind the council.
    const cord=[[-8.9,3.70,-3.15],[-7.1,3.02,-3.63],[-5.0,2.93,-4.20],[-2.8,3.12,-4.72],[-1.4,3.64,-5.07]];
    for(const p of [cord[0],cord[4]])beam([p[0],ground(p[0],p[2]),p[2]],p,0.061,wood,7);
    tube(cord,cord.map(()=>0.017),rope,4,0,0);
    for(const p of [cord[1],cord[2],cord[3]]) {
      beam(p,[p[0],p[1]-0.36,p[2]],0.012,rope,4);
      lantern(p[0],p[1]-0.54,p[2],0.78);
    }
    // Split timber and a folded blanket sit outside the routes and close-up cameras.
    for(let row=0;row<3;row++)for(let i=0;i<3-row;i++) {
      const x=-8.40+i*0.34+row*0.17,z=1.53,y=ground(x,z)+0.14+row*0.23;
      beam([x,y,z-0.55],[x+0.08,y,z+0.55],0.15,wood,8);
      ellipsoid([x+0.08,y,z+0.57],[0.123,0.125,0.018],[0.45,0.35,0.20],8,0,0.04);
    }
    box([-5.70,0.64,3.73],[0.81,0.15,0.68],[0.27,0.32,0.29],0.30);
    box([-5.70,0.725,3.73],[0.79,0.033,0.62],[0.44,0.43,0.31],0.30);
    // A blackened kettle and curved handle bring human scale to the fire ring.
    const kettle=[-2.33,ground(-2.33,-0.70)+0.34,-0.70];
    ellipsoid(kettle,[0.25,0.25,0.23],[0.12,0.15,0.14],12,0,0.02);
    ellipsoid(add(kettle,[0,0.22,0]),[0.21,0.045,0.20],[0.29,0.31,0.27],10,0,0.01);
    const handle=Array.from({length:9},(_,i)=>add(kettle,[Math.cos(i/8*Math.PI)*0.26,0.13+Math.sin(i/8*Math.PI)*0.34,0]));
    tube(handle,handle.map(()=>0.022),[0.29,0.30,0.26],5,0,0);
    // Tools and rolled paper make the council map feel used without adding textual UI.
    tube([[-7.20,1.0,-0.38],[-6.42,1.0,-0.22]],[0.065,0.065],[0.65,0.60,0.41],10,0,0);
    ellipsoid([-6.2,1.01,0.12],[0.15,0.08,0.15],[0.24,0.20,0.13],9,0,0.02);
    ellipsoid([-6.2,1.065,0.12],[0.11,0.014,0.11],[0.085,0.10,0.075],9,0,0);
    for(let i=0;i<24;i++) {
      const a=i*2.39,r=2.75+(i%5)*0.31,x=-3+Math.cos(a)*r,z=Math.sin(a)*r;
      const p=[x,ground(x,z)+0.028,z],t=0.12+(i%3)*0.04;
      triangle(add(p,[-t,0,-0.04]),add(p,[0,0.012,0.10]),add(p,[t,0,0.01]),i%2?[0.27,0.25,0.12]:[0.18,0.255,0.14]);
    }
    for(const [x,z,s] of [[-7.8,4.7,0.95],[1.9,4.3,0.78],[-8.2,-1.4,0.67]])fern(x,z,s);
  }
  function crossing() {
    const z=-5.2,x=riverX(z),wood=[0.27,0.26,0.195];
    for(const dz of [-0.76,0.76]) beam([x-2.55,0.07,z+dz],[x+2.55,0.04,z+dz],0.11,[0.15,0.175,0.14],7);
    for(let i=0;i<18;i++) {
      const px=x-2.55+i*0.3;
      box([px,0.15+Math.sin(i*0.7)*0.018,z],[0.265,0.12,1.82],mul(wood,between(0.85,1.08)),between(-0.012,0.012));
    }
    for(const side of [-1,1]) {
      for(const end of [-1,1]) beam([x+end*2.4,0,z+side*0.93],[x+end*2.4,1.28,z+side*0.93],0.065,[0.26,0.23,0.16],6);
      const rope=Array.from({length:13},(_,i)=>[x-2.4+i*0.4,1.19-Math.sin(i/12*Math.PI)*0.30,z+side*0.93]);
      tube(rope,rope.map(()=>0.027),[0.37,0.33,0.22],4);
    }
    const base=ground(x-3.1,z+1.1);
    beam([x-3.1,base,z+1.1],[x-3.1,base+2.1,z+1.1],0.065,[0.23,0.20,0.13],6);
    beam([x-3.1,base+2.05,z+1.1],[x-2.55,base+2.05,z+1.1],0.04,[0.23,0.20,0.13],5);
    lantern(x-2.6,base+1.65,z+1.1,0.8);
    box([x+3.4,0.48,z-0.5],[0.7,0.68,0.58],[0.28,0.28,0.215],0.11);
    box([x+3.4,0.83,z-0.5],[0.56,0.02,0.42],[0.55,0.54,0.39],0.12);
    for(let i=0;i<8;i++) {
      const px=x+3.3+Math.sin(i)*0.15,pz=z+1.0+i*0.28;
      ellipsoid([px,ground(px,pz)+0.025,pz],[0.07,0.022,0.13],[0.10,0.15,0.13],5);
    }
  }

  const outcomeMeshes={},outcomeLights={},anchorMeshes={},morningMeshes={},morningLights={};
  function fastening(repaired) {
    const [x,y,z]=anchorPosition,rope=repaired?[0.69,0.56,0.35]:[0.58,0.46,0.27];
    for(let i=0;i<3;i++) {
      const ring=[[x-0.085,y+i*0.05,z-0.085],[x+0.09,y+i*0.05,z-0.085],[x+0.10,y+i*0.05,z+0.085],[x-0.085,y+i*0.05,z+0.085],[x-0.085,y+i*0.05,z-0.085]];
      tube(ring,Array(5).fill(repaired?0.029:0.022),rope,5);
    }
    if(repaired) {
      // A secured binding replaces the slip loop after the bounded dawn repair check.
      beam([x-0.11,y-0.02,z+0.10],[x+0.12,y+0.15,z+0.10],0.028,rope,5);
      beam([x+0.11,y-0.02,z+0.10],[x-0.12,y+0.15,z+0.10],0.028,rope,5);
      beam([x+0.11,y+0.06,z+0.08],[x+0.11,y-0.12,z+0.09],0.025,rope,5);
      box([x,y-0.06,z+0.11],[0.20,0.04,0.05],[0.34,0.39,0.36]);
    } else {
      tube([[x+0.10,y+0.10,z+0.085],[x+0.31,y-0.10,z+0.14],[x+0.27,y-0.43,z+0.20],[x+0.09,y-0.28,z+0.16]],[0.026,0.024,0.022,0.014],[0.57,0.43,0.25],5);
    }
  }
  function fieldPennant(x,z,color,height=1.1,direction=1) {
    const y=ground(x,z);
    beam([x,y,z],[x,y+height,z],0.027,[0.42,0.32,0.19],5);
    // Cloth folds face the existing approach cameras without adding texture assets.
    quad([x,y+height-0.07,z],[x+0.44*direction,y+height-0.10,z+0.04],[x+0.35*direction,y+height-0.48,z+0.11],[x,y+height-0.40,z],color);
    triangle([x+0.44*direction,y+height-0.10,z+0.04],[x+0.58*direction,y+height-0.17,z+0.16],[x+0.35*direction,y+height-0.48,z+0.11],mul(color,0.8));
  }
  function traveler(x,z,color,scale=1) {
    const y=ground(x,z),p=(a,b,c)=>[x+c*scale,y+b*scale,z-a*scale];
    // Small anonymous travelers face toward the council-side bank.
    tube([p(0,0.13,0),p(0,1.03,0),p(0,1.26,0)],[0.32*scale,0.25*scale,0.13*scale],color,8,0,0.04);
    ellipsoid(p(0,1.49,0),[0.19*scale,0.22*scale,0.19*scale],[0.45,0.47,0.40],8,0,0.025);
    ellipsoid(p(0,1.43,-0.20),[0.19*scale,0.07*scale,0.10*scale],[0.62,0.61,0.49],6,0,0);
    for(const side of [-1,1]) {
      triangle(p(side*0.19,1.60,0),p(side*0.16,1.86,0.015),p(side*0.05,1.64,-0.04),[0.39,0.41,0.34]);
      ellipsoid(p(side*0.12,0.08,-0.08),[0.18*scale,0.09*scale,0.10*scale],[0.11,0.13,0.105],5);
    }
    box(p(0,0.97,0.27),[0.20*scale,0.43*scale,0.36*scale],[0.40,0.31,0.18]);
    beam(p(0.34,0.05,-0.16),p(0.34,1.16,-0.19),0.022*scale,[0.40,0.29,0.15],5);
  }
  function morningConsequence(value) {
    const z=-5.2,x=riverX(z);
    if(value==='crossing-guided') {
      // One small party has reached the council bank; this is not a general opening.
      traveler(x-3.45,z+0.33,[0.48,0.34,0.22],1.04);
      traveler(x-4.06,z+0.82,[0.31,0.40,0.34],0.73);
      traveler(x-2.84,z-0.12,[0.29,0.34,0.45],0.96);
      for(const [px,pz] of [[x-4.75,z+0.35],[x-2.84,z+1.35]]) {
        const y=ground(px,pz);
        beam([px,y,pz],[px,y+0.86,pz],0.04,[0.38,0.29,0.17],5);
        lantern(px,y+1.02,pz,0.68);
      }
      fieldPennant(x-4.35,z-0.9,[0.57,0.61,0.42],0.94);
    } else if(value==='anchor-found') {
      // Mark the observed fastening for follow-up; the hold barrier remains separate.
      const [ax,ay,az]=anchorPosition;
      fieldPennant(ax+0.20,az+0.32,[0.78,0.40,0.13],1.62,-1);
      beam([ax+0.03,ay+0.11,az+0.12],[ax-0.31,ay+0.02,az+0.35],0.014,[0.75,0.58,0.27],4);
      quad([ax-0.40,ay+0.07,az+0.35],[ax-0.18,ay+0.07,az+0.35],[ax-0.20,ay-0.24,az+0.36],[ax-0.41,ay-0.24,az+0.36],[0.80,0.65,0.36]);
      beam([ax-0.40,ay+0.01,az+0.365],[ax-0.21,ay-0.18,az+0.365],0.018,[0.29,0.22,0.12],4);
      beam([ax-0.20,ay+0.01,az+0.365],[ax-0.40,ay-0.18,az+0.365],0.018,[0.29,0.22,0.12],4);
    } else if(value==='trail-checked') {
      fieldPennant(-0.88,-14.7,[0.83,0.73,0.48],1.28);
      fieldPennant(-1.40,-19.8,[0.83,0.73,0.48],1.12);
      // Undated impressions accompany inspection markers; they identify no intruder.
      for(let i=0;i<7;i++) {
        const px=-0.42+(i%2?0.16:-0.16),pz=-15.5-i*0.48,y=ground(px,pz);
        ellipsoid([px,y+0.027,pz],[0.105,0.022,0.20],[0.065,0.09,0.07],6,0,0.02);
      }
      const [lx,ly,lz]=inspectionLamp;
      beam([lx,ground(lx,lz),lz],[lx,ly-0.13,lz],0.038,[0.43,0.33,0.19],5);
      lantern(lx,ly,lz,0.86);
      box([-0.86,ground(-0.86,-14.9)+0.055,-14.9],[0.30,0.07,0.24],[0.40,0.32,0.19],0.16);
      box([-0.86,ground(-0.86,-14.9)+0.095,-14.9],[0.25,0.015,0.20],[0.70,0.62,0.39],0.16);
    }
  }
  function consequence(choice) {
    const z=-5.2,x=riverX(z),wood=[0.38,0.29,0.17];
    if(choice==='repair') {
      // A work party's lamps and staged timber mark the chosen repair route.
      for(const [px,pz] of [[2.8,-2.8],[4.2,-4.0],[x-2.6,z-1.2],[x+2.6,z-1.2]]) {
        const y=ground(px,pz);
        beam([px,y,pz],[px,y+1.20,pz],0.048,wood,5);
        lantern(px,y+1.31,pz,0.8);
      }
      for(let i=0;i<5;i++)box([x-3.35,0.24+i*0.09,z-1.35],[1.8,0.08,0.27],[0.46,0.38,0.25],0.22);
    } else {
      // The hold decision closes the near end of the crossing with a field barrier.
      const px=x-2.8;
      for(const side of [-1,1]) {
        beam([px,ground(px,z+side*1.05),z+side*1.05],[px,1.50,z+side*1.05],0.105,wood,7);
        beam([px-0.48,0.04,z+side*1.05],[px+0.48,0.04,z+side*1.05],0.095,wood,6);
      }
      beam([px,0.83,z-1.17],[px,0.83,z+1.17],0.12,[0.43,0.29,0.15],7);
      beam([px,1.31,z-1.15],[px,1.31,z+1.15],0.09,[0.43,0.29,0.15],7);
      quad([px+0.03,1.32,z-0.39],[px+0.03,0.46,z-0.30],[px+0.03,0.58,z+0.32],[px+0.03,1.32,z+0.39],[0.55,0.19,0.09]);
      lantern(px,1.72,z-1.05,0.85);
    }
  }
  let opaqueProgram, skyProgram, particleProgram, meshBuffer, skyBuffer, mistBuffer, lightBuffer;
  let meshCount=0, mistCount=0, lightCount=0;
  try {
    opaqueProgram=program(vertexShader,fragmentShader);
    skyProgram=program(skyVertex,skyFragment);
    particleProgram=program(particleVertex,particleFragment);
    terrain();
    path([[-2,16],[-2,13],[-3,10],[-2,7],[-3,4],[-3,0],[-3,-3],[-2,-6],[-0.5,-10],[0,-14],[-1,-19],[-1,-25],[-3,-33]],0.86);
    path([[-3,0],[0,-1],[2,-2],[4,-3.5],[6.0,-5.2]],0.67);
    path([[-4,-2],[-6,-3],[-8,-3]],0.65);
    const heroes=[[-12,7,25,1.35],[-14,-4,27,1.55],[-8,-15,23,1.12],[16,6,27,1.5],[16,-10,25,1.2],[6,-18,27,1.25],[-1,-24,25,1.0],[-19,-17,27,1.15],[23,-19,25,1.25]];
    heroes.forEach(t=>tree(...t,true));
    for(let i=0;i<57;i++) {
      const x=between(-36,35),z=between(-68,-12);
      if(Math.abs(x-riverX(z))<2.6 || (Math.abs(x)<3 && z>-34)) continue;
      tree(x,z,between(16,29),between(0.42,0.93));
    }
    for(let i=0;i<95;i++) {
      const x=between(-20,21),z=between(-30,15),distance=Math.abs(x-riverX(z));
      if(distance<riverWidth(z)+0.15 || (x>-6&&x<0&&z>-4&&z<5)) continue;
      if(random()>0.34) fern(x,z,between(0.42,1.0));
      else {
        const radius=between(0.18,0.95),y=ground(x,z);
        ellipsoid([x,y+radius*0.22,z],[radius,radius*0.50,radius*0.68],[0.26,0.31,0.28],8,0,0.28);
        ellipsoid([x-0.05,y+radius*0.59,z],[radius*0.69,radius*0.10,radius*0.49],[0.20,0.31,0.17],7,0,0.2);
      }
    }
    for(let i=0;i<38;i++) {
      const z=between(-42,15),side=random()>0.5?1:-1,x=riverX(z)+side*(riverWidth(z)+between(0.3,0.7));
      for(let k=0;k<3;k++) {
        const xx=x+between(-0.2,0.2),zz=z+between(-0.2,0.2),y=ground(xx,zz);
        tube([[xx,y,zz],[xx+side*0.1,y+0.6,zz],[xx+side*0.21,y+between(0.8,1.2),zz+0.08]], [0.018,0.013,0.002],[0.29,0.34,0.20],3,1);
      }
    }
    camp(); crossing();
    // Hanging lanterns guide the path into the deeper, colder forest.
    for(const [x,z] of [[1.4,-12],[-2.5,-19],[-2.9,-29]]) {
      const y=ground(x,z);
      beam([x,y,z],[x,y+1.6,z],0.055,[0.23,0.24,0.18],5);
      lantern(x,y+1.7,z,0.62);
    }
    for(let i=0;i<48;i++) {
      const z=between(-65,8);
      particle(mist,[between(-28,27),ground(0,z)+between(0.5,1.6),z],between(8,17),[0.36,0.50,0.49,between(0.035,0.08)],0,between(0,7));
    }
    for(const p of [[-7,11,-24],[1,12,-29],[12,10,-22],[-17,11,-33]]) particle(mist,p,28,[0.42,0.57,0.54,0.11],5);
    for(let i=0;i<26;i++) particle(lights,[between(-13,8),between(0.4,2.0),between(-16,8)],between(0.025,0.06),[0.68,0.76,0.28,0.65],6);
    meshBuffer=buffer(vertices);meshCount=vertices.length/10;
    skyBuffer=buffer([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);
    // Transparent atmospheric layers are authored back to front.
    const mistRows=[];
    for(let i=0;i<mist.length;i+=10) mistRows.push(mist.slice(i,i+10));
    mistRows.sort((a,b)=>a[2]-b[2]);
    mistBuffer=buffer(mistRows.flat());mistCount=mist.length/10;
    lightBuffer=buffer(lights);lightCount=lights.length/10;
    vertices.length=0;mist.length=0;lights.length=0;
    for(const choice of ['repair','hold']) {
      consequence(choice);
      outcomeMeshes[choice]={buffer:buffer(vertices),count:vertices.length/10};
      outcomeLights[choice]={buffer:buffer(lights),count:lights.length/10};
      vertices.length=0;lights.length=0;
    }
    for(const repaired of [false,true]) {
      fastening(repaired);
      anchorMeshes[repaired?'repaired':'loose']={buffer:buffer(vertices),count:vertices.length/10};
      vertices.length=0;
    }
    // Small variants are uploaded once; changing a morning assignment never rebuilds the forest.
    for(const value of ['crossing-guided','anchor-found','trail-checked']) {
      morningConsequence(value);
      morningMeshes[value]={buffer:buffer(vertices),count:vertices.length/10};
      morningLights[value]=lights.length?{buffer:buffer(lights),count:lights.length/10}:null;
      vertices.length=0;lights.length=0;
    }
  } catch (error) {
    resources.buffers.forEach(b=>gl.deleteBuffer(b));
    resources.programs.forEach(p=>gl.deleteProgram(p));
    console.warn('Stakewolf forest initialization failed:', error);
    failure('The forest could not be rendered. You can continue with the location controls.');
    return inert;
  }

  const cameraStops={
    overlook:{eye:[13.2,7.5,22.0],target:[-13.2,2.2,-7.0]},
    council:{eye:[3.8,2.9,7.5],target:[-4.0,1.3,-0.8]},
    trail:{eye:[5.0,3.0,-3.4],target:[-0.9,2.1,-20.5]},
    crossing:{eye:[13.3,3.2,3.7],target:[8.0,0.9,-5.3]}
  };
  const eye=[...cameraStops.overlook.eye],target=[...cameraStops.overlook.target];
  const destinationEye=[...eye],destinationTarget=[...target];
  let framing=0,destinationFraming=0,focusAmount=0,destinationFocus=0;
  function retarget(instant=false) {
    const person=focusedPerson?people[focusedPerson]:null,narrow=width/height<0.9;
    let stop=cameraStops[location];
    if(person) {
      const {x,z,scale}=person,angle=Math.atan2(-3-x,-z),distance=narrow?3.75:3.10;
      // A small shoulder offset keeps the council fire out of the face close-up.
      stop={eye:[x+Math.sin(angle)*distance+Math.cos(angle),ground(x,z)+2.15*scale,z+Math.cos(angle)*distance-Math.sin(angle)],target:[x,ground(x,z)+(narrow?1.15:1.80)*scale,z]};
    }
    destinationFraming=person&&!narrow?0.30:0;
    destinationFocus=person?1:0;
    if(instant){framing=destinationFraming;focusAmount=destinationFocus;}
    const overlook=narrow&&!person&&location==='overlook';
    const offset=overlook ? [-7,-0.5,-1.4] : [0,0,0];
    for(let i=0;i<3;i++) {
      destinationEye[i]=stop.eye[i]+offset[i];
      destinationTarget[i]=overlook?[-4.2,1.7,-5.6][i]:stop.target[i];
      if(instant) {eye[i]=destinationEye[i];target[i]=destinationTarget[i];}
    }
  }
  function settleCamera() {
    const eyeDistance=Math.hypot(eye[0]-destinationEye[0],eye[1]-destinationEye[1],eye[2]-destinationEye[2]);
    const targetDistance=Math.hypot(target[0]-destinationTarget[0],target[1]-destinationTarget[1],target[2]-destinationTarget[2]);
    if(Math.max(eyeDistance,targetDistance)>0.025||Math.abs(framing-destinationFraming)>0.002||Math.abs(focusAmount-destinationFocus)>0.002)return false;
    // End easing at an exact destination before exposing stable pointer targets.
    for(let i=0;i<3;i++){eye[i]=destinationEye[i];target[i]=destinationTarget[i];}
    framing=destinationFraming;focusAmount=destinationFocus;
    if(!focusedPerson)orbitPerson=null;
    return true;
  }
  function moveCamera(easing) {
    if(orbitPerson) {
      const person=people[orbitPerson];
      const dx=eye[0]-person.x,dz=eye[2]-person.z;
      const toX=destinationEye[0]-person.x,toZ=destinationEye[2]-person.z;
      const angle=Math.atan2(dx,dz),toAngle=Math.atan2(toX,toZ);
      const turn=Math.atan2(Math.sin(toAngle-angle),Math.cos(toAngle-angle));
      // Keep the same safe arc on departure until the wider camera has settled.
      const radius=Math.max(2.9,mix(Math.hypot(dx,dz),Math.hypot(toX,toZ),easing));
      eye[0]=person.x+Math.sin(angle+turn*easing)*radius;
      eye[2]=person.z+Math.cos(angle+turn*easing)*radius;
      eye[1]=mix(eye[1],destinationEye[1],easing);
    } else {
      for(let i=0;i<3;i++)eye[i]=mix(eye[i],destinationEye[i],easing);
    }
    for(let i=0;i<3;i++)target[i]=mix(target[i],destinationTarget[i],easing);
    framing=mix(framing,destinationFraming,easing);
    focusAmount=mix(focusAmount,destinationFocus,easing);
  }
  function matrix(eyePosition,targetPosition,aspect) {
    const forward=unit(sub(targetPosition,eyePosition)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward);
    const view=new Float32Array([right[0],up[0],-forward[0],0,right[1],up[1],-forward[1],0,right[2],up[2],-forward[2],0,-dot(right,eyePosition),-dot(up,eyePosition),dot(forward,eyePosition),1]);
    const narrow=aspect<0.9,fov=Math.tan(mix(narrow?58:52,narrow?54:42,focusAmount)*Math.PI/360),near=0.12,far=145;
    const projection=new Float32Array([1/(aspect*fov),0,0,0,0,1/fov,0,0,framing,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
    const combined=new Float32Array(16);
    for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)combined[col*4+row]+=projection[k*4+row]*view[col*4+k];
    return {combined,forward,right,up,fov};
  }
  const locations=new Map(),attributeLocations=new Map(),enabledAttributes=new Set();
  function uniform(p,name) {
    let fields=locations.get(p);if(!fields){fields=new Map();locations.set(p,fields);}
    if(!fields.has(name))fields.set(name,gl.getUniformLocation(p,name));
    return fields.get(name);
  }
  function attribute(p,name,size,stride,offset) {
    let fields=attributeLocations.get(p);if(!fields){fields=new Map();attributeLocations.set(p,fields);}
    if(!fields.has(name))fields.set(name,gl.getAttribLocation(p,name));
    const index=fields.get(name);
    if(index<0)return;
    gl.enableVertexAttribArray(index);
    enabledAttributes.add(index);
    gl.vertexAttribPointer(index,size,gl.FLOAT,false,stride,offset);
  }
  function bindProgram(p,data) {
    enabledAttributes.forEach(index=>gl.disableVertexAttribArray(index));enabledAttributes.clear();
    gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,data);
  }
  function drawOpaqueMesh(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
    attribute(opaqueProgram,'aPosition',3,40,0);attribute(opaqueProgram,'aNormal',3,40,12);
    attribute(opaqueProgram,'aColor',3,40,24);attribute(opaqueProgram,'aKind',1,40,36);
    gl.drawArrays(gl.TRIANGLES,0,mesh.count);
  }
  const maxPointSize=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
  function particles(data,count,view,additive=false) {
    bindProgram(particleProgram,data);
    attribute(particleProgram,'aPosition',3,40,0);attribute(particleProgram,'aSize',1,40,12);
    attribute(particleProgram,'aColor',4,40,16);attribute(particleProgram,'aKind',1,40,32);attribute(particleProgram,'aPhase',1,40,36);
    gl.uniformMatrix4fv(uniform(particleProgram,'uViewProjection'),false,view.combined);
    gl.uniform3fv(uniform(particleProgram,'uEye'),eye);
    gl.uniform1f(uniform(particleProgram,'uTime'),elapsed);
    gl.uniform1f(uniform(particleProgram,'uScale'),height/(2*view.fov));
    gl.uniform1f(uniform(particleProgram,'uMaxSize'),maxPointSize);
    gl.uniform1f(uniform(particleProgram,'uDawn'),dawn?1:0);
    gl.blendFunc(gl.SRC_ALPHA,additive?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.POINTS,0,count);
  }
  function projectAnchors(view,cameraSettled) {
    if(typeof options.onProject!=='function')return;
    const project=(id,position)=>{
      const m=view.combined,[x,y,z]=position;
      const w=m[3]*x+m[7]*y+m[11]*z+m[15];
      const clipX=m[0]*x+m[4]*y+m[8]*z+m[12],clipY=m[1]*x+m[5]*y+m[9]*z+m[13],clipZ=m[2]*x+m[6]*y+m[10]*z+m[14];
      const finite=Number.isFinite(w)&&Math.abs(w)>0.00001;
      return {id,x:finite?(clipX/w+1)*cssWidth/2:-9999,y:finite?(1-clipY/w)*cssHeight/2:-9999,
        visible:cameraSettled&&finite&&cssWidth>0&&cssHeight>0&&w>0&&Math.abs(clipX)<=w&&Math.abs(clipY)<=w&&Math.abs(clipZ)<=w};
    };
    const projected=Object.entries(people).map(([id,p])=>{
      const breath=Math.sin(elapsed*1.4+(4+p.index)*1.8)*0.018*Math.min(2.58*0.12*3,1);
      const sway=Math.sin(elapsed*0.41+(4+p.index)*1.8)*0.018,angle=Math.atan2(-3-p.x,-p.z);
      return project(id,[p.x+Math.cos(angle)*sway,ground(p.x,p.z)+2.70*p.scale+breath,p.z-Math.sin(angle)*sway]);
    });
    projected.push(project('anchor',anchorPosition));
    options.onProject(projected);
  }
  function render() {
    if(disposed||failed||document.hidden)return;
    const cameraSettled=settleCamera();
    const view=matrix(eye,target,width/height);
    gl.viewport(0,0,width,height);gl.clearColor(0.05,0.1,0.11,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.depthMask(false);
    bindProgram(skyProgram,skyBuffer);
    attribute(skyProgram,'aPosition',2,8,0);
    gl.uniform3fv(uniform(skyProgram,'uForward'),view.forward);gl.uniform3fv(uniform(skyProgram,'uRight'),view.right);gl.uniform3fv(uniform(skyProgram,'uUp'),view.up);
    gl.uniform1f(uniform(skyProgram,'uAspect'),width/height);gl.uniform1f(uniform(skyProgram,'uFov'),view.fov);
    gl.uniform1f(uniform(skyProgram,'uFraming'),framing);
    gl.uniform1f(uniform(skyProgram,'uDawn'),dawn?1:0);
    gl.drawArrays(gl.TRIANGLES,0,6);
    gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
    bindProgram(opaqueProgram,meshBuffer);
    attribute(opaqueProgram,'aPosition',3,40,0);attribute(opaqueProgram,'aNormal',3,40,12);
    attribute(opaqueProgram,'aColor',3,40,24);attribute(opaqueProgram,'aKind',1,40,36);
    gl.uniformMatrix4fv(uniform(opaqueProgram,'uViewProjection'),false,view.combined);
    gl.uniform3fv(uniform(opaqueProgram,'uEye'),eye);gl.uniform1f(uniform(opaqueProgram,'uTime'),elapsed);gl.uniform1f(uniform(opaqueProgram,'uOutcome'),outcome);
    gl.uniform1f(uniform(opaqueProgram,'uFocusPerson'),focusedPerson?4+people[focusedPerson].index:-1);
    for(const [id,person] of Object.entries(people)) {
      const name=id==='orin'?'uOrinPose':id==='sera'?'uSeraPose':'uVelaPose';
      gl.uniform4fv(uniform(opaqueProgram,name),[person.x,person.scale,person.z,Math.atan2(-3-person.x,-person.z)]);
    }
    gl.uniform1f(uniform(opaqueProgram,'uDawn'),dawn?1:0);
    gl.uniform1f(uniform(opaqueProgram,'uTrailInspection'),selectedMorning==='trail-checked'?1:0);
    gl.uniform3fv(uniform(opaqueProgram,'uInspectionLamp'),inspectionLamp);
    gl.drawArrays(gl.TRIANGLES,0,meshCount);
    drawOpaqueMesh(anchorMeshes[dawn&&selectedOutcome==='repair'?'repaired':'loose']);
    if(selectedOutcome)drawOpaqueMesh(outcomeMeshes[selectedOutcome]);
    if(selectedMorning)drawOpaqueMesh(morningMeshes[selectedMorning]);
    gl.depthMask(false);gl.enable(gl.BLEND);
    particles(mistBuffer,mistCount,view);
    particles(lightBuffer,lightCount,view,true);
    if(selectedOutcome)particles(outcomeLights[selectedOutcome].buffer,outcomeLights[selectedOutcome].count,view,true);
    const morningLight=selectedMorning?morningLights[selectedMorning]:null;
    if(morningLight)particles(morningLight.buffer,morningLight.count,view,true);
    gl.depthMask(true);gl.disable(gl.BLEND);
    projectAnchors(view,cameraSettled);
    if(!ready){ready=true;options.onReady?.();}
  }
  function tick(time) {
    frame=0;
    if(disposed||failed||paused||reducedMotion||document.hidden){lastTime=0;return;}
    const interval=lastTime?Math.max(0,(time-lastTime)/1000):0;
    const delta=Math.min(interval,0.05),cameraDelta=Math.min(interval,1);
    lastTime=time;elapsed+=delta;
    // Camera travel follows wall time even when the atmosphere renders slowly.
    const easing=1-Math.exp(-cameraDelta*2.7);
    moveCamera(easing);
    render();schedule();
  }
  function schedule() {
    if(!frame&&!disposed&&!failed&&!paused&&!reducedMotion&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  function resize() {
    if(disposed||failed)return;
    const bounds=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5);
    cssWidth=bounds.width;cssHeight=bounds.height;
    const oldAspect=width/height;
    // Bound total fill-rate as well as DPR on large external displays.
    const factor=Math.min(dpr,Math.sqrt(2200000/Math.max(1,bounds.width*bounds.height)));
    width=Math.max(1,Math.round(bounds.width*factor));height=Math.max(1,Math.round(bounds.height*factor));
    canvas.width=width;canvas.height=height;
    if((oldAspect<0.9)!==(width/height<0.9)||!ready)retarget(true);
    render();schedule();
  }
  function visibility() {
    lastTime=0;
    if(document.hidden){cancelAnimationFrame(frame);frame=0;}
    else{render();schedule();}
  }
  function contextLost(event) {event.preventDefault();failure('The forest view was interrupted. The story controls are still available.');}
  canvas.addEventListener('webglcontextlost',contextLost);
  document.addEventListener('visibilitychange',visibility);
  if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);}
  else window.addEventListener('resize',resize);
  resize();
  return {
    travelTo(next) {
      if(disposed||failed||typeof next!=='string'||!Object.hasOwn(cameraStops,next))return;
      location=next;focusedPerson=null;retarget(reducedMotion||paused);render();schedule();
    },
    focusPerson(id) {
      if(disposed||failed||(id!==null&&(typeof id!=='string'||!Object.hasOwn(people,id))))return;
      focusedPerson=id;
      if(id!==null)orbitPerson=id;
      retarget(reducedMotion||paused);
      if(orbitPerson)moveCamera(0);
      render();schedule();
    },
    setDawn(value) {if(disposed||failed)return;dawn=Boolean(value);render();},
    setMorning(value) {
      if(disposed||failed||(value!==null&&(typeof value!=='string'||!Object.hasOwn(morningMeshes,value))))return;
      selectedMorning=value;render();
    },
    setPaused(value) {
      if(disposed||failed)return;
      paused=Boolean(value);lastTime=0;
      if(paused){cancelAnimationFrame(frame);frame=0;retarget(true);render();}else schedule();
    },
    setReducedMotion(value) {
      if(disposed||failed)return;
      reducedMotion=Boolean(value);lastTime=0;
      if(reducedMotion){cancelAnimationFrame(frame);frame=0;retarget(true);render();}else schedule();
    },
    setOutcome(choice) {if(disposed||failed)return;selectedOutcome=choice==='repair'||choice==='hold'?choice:null;outcome=selectedOutcome?1:0;render();},
    dispose() {
      if(disposed)return;disposed=true;cancelAnimationFrame(frame);frame=0;
      resizeObserver?.disconnect();window.removeEventListener('resize',resize);
      canvas.removeEventListener('webglcontextlost',contextLost);document.removeEventListener('visibilitychange',visibility);
      resources.buffers.forEach(b=>gl.deleteBuffer(b));resources.programs.forEach(p=>gl.deleteProgram(p));
    }
  };
}
