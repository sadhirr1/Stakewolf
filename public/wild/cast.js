/** SCRUM-35 — original sculpted wilderness cast, authored entirely as geometry.
 * Local +z is forward. Each vertex is position3, normal3, color3, kind1.
 * The caller owns world transforms and rendering; no assets or runtime state.
 */
export function buildCharacter(id, spec) {
  if (!['orin', 'sera', 'vela'].includes(id) || !spec ||
      !Number.isInteger(spec.index) || spec.index < 0 || spec.index > 2 ||
      !['color', 'fur', 'trim'].every(key => Array.isArray(spec[key]) && spec[key].length === 3 &&
        spec[key].every(value => Number.isFinite(value) && value >= 0 && value <= 1))) {
    throw new TypeError('A known cast member, RGB palettes, and index 0–2 are required.');
  }
  const vertices = [];
  const { color, fur, trim, index } = spec;
  const tau = Math.PI * 2;
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const mul = (a, s) => a.map(v => v * s);
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = a => mul(a, 1 / Math.hypot(...a));
  const tint = (c, gain) => c.map(v => Math.min(1, v * gain));
  const blend = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);
  const vtx = (p, n) => ({ p, n });
  const leather = [0.235, 0.145, 0.082];
  const darkLeather = [0.105, 0.079, 0.058];
  const metal = [0.47, 0.48, 0.43];
  const pale = blend(fur, [0.88, 0.82, 0.66], 0.51);
  const darkFur = tint(fur, 0.62);
  const nose = [0.041, 0.048, 0.044];
  const broad = id === 'orin' ? 1.12 : id === 'sera' ? 0.91 : 1;

  function triangle(a, b, c, shade) {
    // Smooth surface normals also determine outward winding, including mirrored ears.
    const geometric = cross(sub(b.p, a.p), sub(c.p, a.p));
    if (dot(geometric, add(add(a.n, b.n), c.n)) < 0) [b, c] = [c, b];
    for (const vertex of [a, b, c]) {
      vertices.push(...vertex.p, ...vertex.n, ...shade,
        4 + index + Math.min(0.35, Math.max(0, vertex.p[1]) * 0.12));
    }
  }
  function flat(a, b, c, shade) {
    const n = unit(cross(sub(b, a), sub(c, a)));
    triangle(vtx(a, n), vtx(b, n), vtx(c, n), shade);
  }
  function quad(a, b, c, d, shade) {
    flat(a, b, c, shade); flat(a, c, d, shade);
  }
  function basis(axis) {
    const y = unit(axis);
    const x = unit(cross(Math.abs(y[2]) > 0.9 ? [0, 1, 0] : [0, 0, 1], y));
    return [x, y, cross(x, y)];
  }
  const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const rotate = (p, frame) => add(add(mul(frame[0], p[0]), mul(frame[1], p[1])), mul(frame[2], p[2]));

  function ellipsoid(center, scale, shade, segments = 12, rings = 7, frame = identity) {
    // Reserve dense contours for the cranium and muzzle; tiny sewn/eye details
    // retain smooth normals without consuming full-size sphere tessellation.
    if (segments < 16) {
      segments = Math.max(5, Math.round(segments * 0.68));
      rings = Math.max(3, Math.round(rings * 0.64));
    }
    const at = (i, j) => {
      const theta = i / segments * tau, phi = j / rings * Math.PI;
      const d = [Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi)];
      return vtx(add(center, rotate(d.map((v, k) => v * scale[k]), frame)),
        unit(rotate(d.map((v, k) => v / scale[k]), frame)));
    };
    // Single cap triangles avoid the zero-area faces produced by repeated pole quads.
    for (let j = 0; j < rings; j++) for (let i = 0; i < segments; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      if (j !== 0) triangle(a, b, c, shade);
      if (j !== rings - 1) triangle(a, c, d, shade);
    }
  }
  function ovalSegment(a, b, width, depth, shade, segments = 10, rings = 6) {
    ellipsoid(mul(add(a, b), 0.5), [width, Math.hypot(...sub(b, a)) * 0.61, depth], shade,
      segments, rings, basis(sub(b, a)));
  }
  function sweep(points, radii, shade, sides = 8, capped = true) {
    sides = Math.max(4, Math.round(sides * 0.74));
    const frames = points.map((p, j) => basis(sub(points[Math.min(points.length - 1, j + 1)], points[Math.max(0, j - 1)])));
    const rings = points.map((p, j) => Array.from({ length: sides }, (_, i) => {
      const angle = i / sides * tau;
      const radial = add(mul(frames[j][0], Math.cos(angle)), mul(frames[j][2], Math.sin(angle)));
      const previous = Math.max(0, j - 1), next = Math.min(points.length - 1, j + 1);
      const slope = (radii[next] - radii[previous]) / Math.hypot(...sub(points[next], points[previous]));
      return vtx(add(p, mul(radial, radii[j])), unit(sub(radial, mul(frames[j][1], slope))));
    }));
    for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < sides; i++) {
      const n = (i + 1) % sides;
      triangle(rings[j][i], rings[j + 1][i], rings[j + 1][n], shade);
      triangle(rings[j][i], rings[j + 1][n], rings[j][n], shade);
    }
    if (capped) for (const j of [0, rings.length - 1]) {
      const normal = mul(frames[j][1], j === 0 ? -1 : 1), center = vtx(points[j], normal);
      for (let i = 0; i < sides; i++) triangle(center, vtx(rings[j][i].p, normal),
        vtx(rings[j][(i + 1) % sides].p, normal), shade);
    }
  }
  function rod(a, b, radius, shade, sides = 7) { sweep([a, b], [radius, radius], shade, sides); }
  function box(center, size, shade) {
    const p = (x, y, z) => add(center, [x * size[0] / 2, y * size[1] / 2, z * size[2] / 2]);
    quad(p(-1, -1, 1), p(1, -1, 1), p(1, 1, 1), p(-1, 1, 1), shade);
    quad(p(1, -1, -1), p(-1, -1, -1), p(-1, 1, -1), p(1, 1, -1), tint(shade, 0.85));
    quad(p(-1, -1, -1), p(-1, -1, 1), p(-1, 1, 1), p(-1, 1, -1), tint(shade, 0.92));
    quad(p(1, -1, 1), p(1, -1, -1), p(1, 1, -1), p(1, 1, 1), tint(shade, 0.92));
    quad(p(-1, 1, 1), p(1, 1, 1), p(1, 1, -1), p(-1, 1, -1), tint(shade, 1.14));
    quad(p(-1, -1, -1), p(1, -1, -1), p(1, -1, 1), p(-1, -1, 1), shade);
  }
  function loop(center, radiusX, radiusZ, thickness, shade, count = 16) {
    count = Math.max(8, Math.round(count * 0.72));
    const points = Array.from({ length: count + 1 }, (_, i) => {
      const angle = i / count * tau;
      return add(center, [Math.cos(angle) * radiusX, 0, Math.sin(angle) * radiusZ]);
    });
    sweep(points, points.map(() => thickness), shade, 5, false);
  }
  function loft(layers, shade, segments = 18, start = 0, arc = tau, fold = 0) {
    segments = Math.round(segments * 0.8);
    const point = (j, angle) => {
      const [y, rx, rz, z = 0] = layers[j];
      const drape = 1 + fold * Math.cos(angle * 7 + 0.4) * (1 - j / layers.length);
      return [Math.cos(angle) * rx * drape, y, z + Math.sin(angle) * rz * drape];
    };
    const at = (j, i) => {
      const angle = start + arc * i / segments;
      const around = sub(point(j, angle + 0.001), point(j, angle - 0.001));
      const along = sub(point(Math.min(j + 1, layers.length - 1), angle), point(Math.max(0, j - 1), angle));
      return vtx(point(j, angle), unit(cross(along, around)));
    };
    for (let j = 0; j < layers.length - 1; j++) for (let i = 0; i < segments; i++) {
      const a = at(j, i), b = at(j, i + 1), c = at(j + 1, i + 1), d = at(j + 1, i);
      const tone = tint(shade, 1 + 0.035 * Math.cos((i + 0.5) * 2.3));
      triangle(a, b, c, tone); triangle(a, c, d, tone);
    }
  }
  function panel(rows, shade) {
    // Curved, lightly folded cloth strips follow the torso rather than floating as billboards.
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < 6; i++) {
      const at = (row, u) => {
        const [y, width, z] = rows[row];
        return [u * width, y, z + (1 - u * u) * 0.025 + Math.cos(u * 9) * 0.006];
      };
      const u = i / 3 - 1, next = (i + 1) / 3 - 1;
      quad(at(j, u), at(j, next), at(j + 1, next), at(j + 1, u), tint(shade, 1 + (i % 2) * 0.035));
    }
  }
  function tuft(root, tip, width, shade) {
    const middle = add(mul(add(root, tip), 0.5), [0, 0.02, 0]);
    sweep([root, middle, tip], [width, width * 0.73, 0.004], shade, 6);
  }

  // A planted, articulated stance replaces the old uninterrupted cone silhouette.
  for (const side of [-1, 1]) {
    const x = side * 0.18 * broad, offset = side === -1 ? -0.035 : 0.04;
    ovalSegment([x, 0.87, -0.01], [x + side * 0.025, 0.53, 0.035 + offset], 0.139 * broad, 0.145,
      tint(color, 0.64));
    ovalSegment([x + side * 0.025, 0.56, 0.035 + offset], [x + side * 0.035, 0.23, 0.01 + offset],
      0.104, 0.11, darkLeather);
    ellipsoid([x + side * 0.035, 0.125, 0.105 + offset], [0.147, 0.115, 0.245], leather, 12, 6);
    ellipsoid([x + side * 0.035, 0.049, 0.11 + offset], [0.153, 0.04, 0.251], darkLeather, 12, 4);
    loop([x + side * 0.025, 0.35, 0.03 + offset], 0.109, 0.105, 0.018, tint(leather, 1.4), 10);
    for (let i = 0; i < 2; i++) rod([x - 0.045, 0.26 + i * 0.05, 0.128 + offset],
      [x + 0.045, 0.28 + i * 0.05, 0.128 + offset], 0.007, trim, 4);
  }
  // A fur tail falls behind the coat and curls clear of the left leg.
  sweep([[0, 1.02, -0.19], [-0.15, 0.82, -0.38], [-0.34, 0.59, -0.46], [-0.5, 0.47, -0.35], [-0.55, 0.50, -0.25]],
    [0.095, 0.125, 0.13, 0.105, 0.013], darkFur, 9);
  loft([[0.77, 0.30 * broad, 0.19], [0.94, 0.30 * broad, 0.205], [1.13, 0.27 * broad, 0.19],
    [1.40, 0.35 * broad, 0.23], [1.54, 0.40 * broad, 0.205], [1.66, 0.255, 0.16]], color, 20, 0, tau, 0.026);
  ellipsoid([0, 1.60, -0.015], [0.275, 0.16, 0.17], color, 12, 5);
  ellipsoid([0, 1.76, -0.005], [0.195, 0.21, 0.18], fur, 12, 7);
  loop([0, 1.07, 0], 0.282 * broad, 0.206, 0.047, darkLeather);
  box([0.02, 1.07, 0.245], [0.105, 0.091, 0.025], trim);
  box([0.02, 1.07, 0.26], [0.062, 0.047, 0.01], darkLeather);

  const arms = id === 'sera'
    ? [[[-0.34, 1.47, 0], [-0.42, 1.16, 0.025], [-0.34, 0.93, 0.15]], [[0.34, 1.47, 0], [0.49, 1.23, 0.025], [0.65, 1.23, 0.17]]]
    : id === 'vela'
      ? [[[-0.40, 1.48, 0], [-0.45, 1.20, 0.03], [-0.20, 1.04, 0.34]], [[0.40, 1.48, 0], [0.45, 1.21, 0.04], [0.29, 1.03, 0.37]]]
      : [[[-0.44, 1.48, 0], [-0.53, 1.18, 0.035], [-0.45, 0.99, 0.19]], [[0.44, 1.48, 0], [0.5, 1.20, 0.035], [0.42, 0.98, 0.17]]];
  arms.forEach(([shoulder, elbow, wrist]) => {
    ellipsoid(shoulder, [0.169 * broad, 0.17, 0.178], tint(color, 1.1), 10, 6);
    ovalSegment(shoulder, elbow, 0.148 * broad, 0.14, color);
    ovalSegment(elbow, wrist, 0.115, 0.105, tint(color, 0.88));
    const cuffStart = add(wrist, mul(unit(sub(elbow, wrist)), 0.055));
    rod(cuffStart, wrist, 0.105, tint(leather, 1.18), 10);
    const hand = add(wrist, [0, -0.04, 0.033]);
    ellipsoid(hand, [0.093, 0.108, 0.074], fur, 10, 6);
    ellipsoid(add(hand, [-Math.sign(wrist[0]) * 0.062, 0.015, 0.033]), [0.035, 0.055, 0.043], pale, 7, 4);
    for (let i = -1; i <= 1; i++) rod(add(hand, [i * 0.035, -0.05, 0.054]), add(hand, [i * 0.035, -0.006, 0.069]), 0.0045, darkFur, 4);
  });

  // Adult wolf proportions: a broad cranium, narrowed nose bridge, cheek ruff and long muzzle.
  ellipsoid([0, 2.025, -0.015], [0.291, 0.316, 0.253], fur, 20, 10);
  ellipsoid([0, 2.185, -0.032], [0.214, 0.137, 0.214], tint(fur, 0.90), 14, 6);
  for (const side of [-1, 1]) {
    ellipsoid([side * 0.215, 1.942, 0.095], [0.132, 0.175, 0.181], pale, 12, 7);
    tuft([side * 0.242, 2.036, 0.024], [side * 0.398, 1.936, -0.025], 0.087, fur);
    tuft([side * 0.238, 1.927, 0.036], [side * 0.356, 1.782, -0.018], 0.088, pale);
    tuft([side * 0.15, 1.781, 0.056], [side * 0.232, 1.63, 0.117], 0.067, tint(fur, 0.85));
    ear(side);
  }
  // Intersecting cheek and muzzle volumes have buried joins; the jaw remains attached.
  ellipsoid([0, 1.908, 0.274], [0.162, 0.128, 0.266], pale, 16, 8);
  ellipsoid([0, 1.844, 0.276], [0.144, 0.067, 0.244], tint(pale, 0.82), 12, 6);
  ellipsoid([0, 2.015, 0.251], [0.109, 0.137, 0.182], blend(fur, pale, 0.32), 12, 7);
  ellipsoid([-0.059, 1.908, 0.439], [0.085, 0.066, 0.103], pale, 10, 6);
  ellipsoid([0.059, 1.908, 0.439], [0.085, 0.066, 0.103], pale, 10, 6);
  sweep([[-0.12, 1.867, 0.40], [-0.085, 1.853, 0.484], [0, 1.851, 0.506], [0.085, 1.853, 0.484], [0.12, 1.867, 0.40]],
    [0.005, 0.006, 0.006, 0.006, 0.005], nose, 5);
  ellipsoid([0, 1.965, 0.509], [0.102, 0.064, 0.067], nose, 12, 7);
  ellipsoid([0, 1.995, 0.552], [0.042, 0.011, 0.012], [0.24, 0.26, 0.23], 8, 4);
  for (const side of [-1, 1]) {
    ellipsoid([side * 0.066, 1.959, 0.552], [0.023, 0.014, 0.017], [0.022, 0.025, 0.022], 7, 4);
    // Almond sockets, inset amber irises and enclosing lids share a single attached surface.
    const ex = side * 0.157, ey = 2.10, ez = 0.205;
    ellipsoid([ex, ey, ez], [0.092, 0.052, 0.05], darkFur, 12, 6);
    ellipsoid([ex, ey, ez + 0.027], [0.070, 0.032, 0.038], [0.086, 0.079, 0.051], 10, 6);
    ellipsoid([ex - side * 0.004, ey, ez + 0.059], [0.034, 0.028, 0.01],
      id === 'sera' ? [0.59, 0.67, 0.32] : id === 'vela' ? [0.65, 0.67, 0.55] : [0.86, 0.55, 0.16], 10, 5);
    ellipsoid([ex - side * 0.004, ey, ez + 0.066], [0.013, 0.023, 0.006], nose, 8, 4);
    ellipsoid([ex - 0.012, ey + 0.012, ez + 0.070], [0.009, 0.008, 0.005], [0.95, 0.97, 0.84], 6, 4);
    const lid = Array.from({ length: 7 }, (_, i) => {
      const a = i / 6 * Math.PI;
      return [ex + Math.cos(a) * 0.075, ey + Math.sin(a) * 0.031, ez + 0.031 + Math.sin(a) * 0.012];
    });
    sweep(lid, lid.map(() => 0.011), tint(fur, 0.77), 5);
    ovalSegment([side * 0.087, 2.165, 0.228], [side * 0.242, 2.146, 0.18], 0.028, 0.033, tint(fur, 0.81), 8, 5);
    for (let i = 0; i < 3; i++) ellipsoid([side * (0.059 + i * 0.027), 1.937 - i * 0.013, 0.520 - i * 0.011],
      [0.006, 0.005, 0.006], darkFur, 5, 3);
  }

  function ear(side) {
    const outline = [[0.10, 2.259, 0.082], [0.158, 2.439, 0.062], [0.276, 2.660, -0.016],
      [0.300, 2.625, -0.028], [0.353, 2.421, -0.025], [0.358, 2.274, 0.009], [0.244, 2.228, 0.070]];
    const front = outline.map(p => [p[0] * side, p[1], p[2]]);
    const back = front.map(p => add(p, [0, -0.005, -0.076]));
    const fc = [side * 0.244, 2.389, 0.086], bc = [side * 0.245, 2.387, -0.071];
    for (let i = 0; i < front.length; i++) {
      const n = (i + 1) % front.length;
      triangle(vtx(fc, [0, 0.1, Math.sqrt(0.99)]), vtx(front[i], unit([side * 0.24, 0.10, 1])),
        vtx(front[n], unit([side * 0.24, 0.1, 1])), tint(fur, 1.04));
      flat(bc, back[n], back[i], darkFur);
      quad(front[i], back[i], back[n], front[n], tint(fur, 0.77));
    }
    // The warm recessed ear patch is inset from a substantial fur border.
    const inner = [[0.163, 2.311, 0.094], [0.278, 2.578, 0.012], [0.317, 2.368, 0.060], [0.271, 2.292, 0.087]]
      .map(p => [side * p[0], p[1], p[2]]);
    quad(inner[0], inner[1], inner[2], inner[3], blend(fur, [0.38, 0.21, 0.18], 0.62));
    tuft([side * 0.225, 2.295, 0.095], [side * 0.250, 2.388, 0.089], 0.030, pale);
  }

  if (id === 'orin') {
    // Builder: split work apron, reinforced pocket, tool loop and forged hammer.
    panel([[1.45, 0.195, 0.207], [1.19, 0.228, 0.216], [0.96, 0.292, 0.23], [0.70, 0.304, 0.226], [0.48, 0.278, 0.201]],
      [0.35, 0.195, 0.095]);
    for (const side of [-1, 1]) {
      sweep([[side * 0.20, 1.44, 0.227], [side * 0.25, 1.59, 0.153], [side * 0.23, 1.63, -0.08]],
        [0.027, 0.027, 0.026], tint(leather, 1.4), 5);
      rod([side * 0.268, 0.51, 0.227], [side * 0.290, 0.88, 0.26], 0.009, trim, 4);
      ellipsoid([side * 0.177, 1.40, 0.247], [0.013, 0.015, 0.009], metal, 6, 4);
    }
    box([0.012, 1.21, 0.268], [0.26, 0.154, 0.033], tint(leather, 1.48));
    rod([-0.118, 1.284, 0.29], [0.142, 1.284, 0.29], 0.009, trim, 5);
    rod([-0.115, 1.14, 0.292], [0.14, 1.14, 0.292], 0.006, trim, 4);
    rod([-0.472, 0.52, 0.205], [-0.45, 1.026, 0.223], 0.032, [0.40, 0.25, 0.12]);
    box([-0.454, 1.003, 0.228], [0.253, 0.125, 0.115], metal);
    box([-0.586, 1.003, 0.228], [0.045, 0.143, 0.14], tint(metal, 0.74));
    box([0.317, 1.026, 0.15], [0.075, 0.12, 0.104], leather);
    rod([0.344, 0.863, 0.166], [0.35, 1.139, 0.16], 0.017, tint(trim, 1.15), 6);
  } else if (id === 'sera') {
    // Scout: gathered cowl, long scarf end, strapped satchel, wrapped walking staff.
    loop([0, 1.68, 0], 0.243, 0.19, 0.061, trim, 18);
    loop([0, 1.62, 0.014], 0.273, 0.205, 0.036, tint(trim, 0.8), 18);
    panel([[1.63, 0.16, 0.198], [1.40, 0.19, 0.234], [1.21, 0.12, 0.234], [1.18, 0.095, 0.225]], trim);
    sweep([[0.287, 1.55, 0.133], [0.132, 1.31, 0.254], [-0.11, 1.04, 0.255], [-0.324, 0.828, 0.176]],
      [0.029, 0.029, 0.029, 0.029], leather, 5);
    ellipsoid([-0.365, 0.802, 0.106], [0.165, 0.19, 0.111], leather, 12, 7);
    box([-0.365, 0.852, 0.194], [0.274, 0.171, 0.039], tint(leather, 1.3));
    box([-0.365, 0.824, 0.222], [0.044, 0.102, 0.019], darkLeather);
    box([-0.365, 0.82, 0.236], [0.057, 0.051, 0.013], trim);
    sweep([[0.635, 0.015, 0.16], [0.653, 0.91, 0.174], [0.66, 1.56, 0.176], [0.614, 2.23, 0.147], [0.655, 2.40, 0.157]],
      [0.029, 0.034, 0.029, 0.024, 0.016], [0.31, 0.226, 0.119], 8);
    for (let i = 0; i < 5; i++) loop([0.658, 1.11 + i * 0.042, 0.175], 0.036, 0.036, 0.009, trim, 8);
    ellipsoid([0.657, 2.411, 0.157], [0.031, 0.045, 0.035], tint(leather, 1.55), 8, 5);
  } else {
    // Keeper: open draped mantle over a fitted coat, woven edge, chain and held ledger.
    loft([[0.66, 0.42, 0.266, -0.03], [0.96, 0.423, 0.289, -0.025], [1.32, 0.476, 0.25, -0.035],
      [1.55, 0.435, 0.214, -0.017], [1.70, 0.224, 0.161, -0.01]], tint(color, 0.83), 24, Math.PI * 0.73, Math.PI * 1.54, 0.06);
    for (const side of [-1, 1]) {
      sweep([[side * 0.15, 1.69, 0.135], [side * 0.292, 1.48, 0.169], [side * 0.305, 1.19, 0.19], [side * 0.27, 0.89, 0.221], [side * 0.278, 0.66, 0.186]],
        [0.024, 0.024, 0.023, 0.022, 0.02], trim, 6);
      ellipsoid([side * 0.189, 1.58, 0.225], [0.035, 0.037, 0.017], trim, 8, 5);
    }
    sweep([[-0.185, 1.58, 0.247], [-0.105, 1.49, 0.267], [0, 1.46, 0.271], [0.105, 1.49, 0.267], [0.185, 1.58, 0.247]],
      [0.008, 0.009, 0.009, 0.009, 0.008], [0.72, 0.58, 0.28], 5);
    ellipsoid([0, 1.451, 0.275], [0.038, 0.05, 0.018], trim, 8, 5);
    box([0.046, 1.013, 0.322], [0.43, 0.321, 0.109], [0.118, 0.098, 0.12]);
    box([0.046, 1.015, 0.386], [0.386, 0.279, 0.034], [0.69, 0.625, 0.446]);
    box([0.046, 1.015, 0.411], [0.436, 0.327, 0.023], tint(color, 0.59));
    for (const side of [-1, 1]) rod([0.046 + side * 0.178, 0.886, 0.427], [0.046 + side * 0.178, 1.144, 0.427], 0.006, trim, 4);
    for (const y of [0.886, 1.144]) rod([-0.132, y, 0.427], [0.224, y, 0.427], 0.006, trim, 4);
    box([0.152, 1.015, 0.438], [0.047, 0.326, 0.025], leather);
    box([0.152, 1.017, 0.455], [0.07, 0.074, 0.014], trim);
  }
  return vertices;
}
