import { createServer as createHttpServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicRoot = fileURLToPath(new URL('./public/', import.meta.url));
const assets = new Map([
  ['/wild/', ['wild/index.html', 'text/html; charset=utf-8']],
  ['/wild/index.html', ['wild/index.html', 'text/html; charset=utf-8']],
  ['/wild/style.css', ['wild/style.css', 'text/css; charset=utf-8']],
  ['/wild/app.js', ['wild/app.js', 'text/javascript; charset=utf-8']],
  ['/wild/state.js', ['wild/state.js', 'text/javascript; charset=utf-8']],
  ['/wild/scene.js', ['wild/scene.js', 'text/javascript; charset=utf-8']],
  ['/wild/cast.js', ['wild/cast.js', 'text/javascript; charset=utf-8']],
  ['/wild/cinema.bundle.js', ['wild/cinema.bundle.js', 'text/javascript; charset=utf-8']],
  ['/wild/credits.html', ['wild/credits.html', 'text/html; charset=utf-8']],
  ['/wild/assets/forest-floor/diffuse.jpg', ['wild/assets/forest-floor/diffuse.jpg', 'image/jpeg']],
  ['/wild/assets/forest-floor/normal.jpg', ['wild/assets/forest-floor/normal.jpg', 'image/jpeg']],
  ['/wild/assets/forest-floor/arm.jpg', ['wild/assets/forest-floor/arm.jpg', 'image/jpeg']],
  ['/wild/assets/bark/diffuse.jpg', ['wild/assets/bark/diffuse.jpg', 'image/jpeg']],
  ['/wild/assets/bark/normal.jpg', ['wild/assets/bark/normal.jpg', 'image/jpeg']],
  ['/wild/assets/bark/arm.jpg', ['wild/assets/bark/arm.jpg', 'image/jpeg']],
  ['/wild/assets/fern/fern.gltf', ['wild/assets/fern/fern.gltf', 'model/gltf+json']],
  ['/wild/assets/fern/fern_02.bin', ['wild/assets/fern/fern_02.bin', 'application/octet-stream']],
  ['/wild/assets/fern/textures/fern_02_diff_1k.jpg', ['wild/assets/fern/textures/fern_02_diff_1k.jpg', 'image/jpeg']],
  ['/wild/assets/fern/textures/fern_02_nor_gl_1k.jpg', ['wild/assets/fern/textures/fern_02_nor_gl_1k.jpg', 'image/jpeg']],
  ['/wild/assets/fern/textures/fern_02_arm_1k.jpg', ['wild/assets/fern/textures/fern_02_arm_1k.jpg', 'image/jpeg']],
  ['/wild/assets/rock-moss/rock-moss.gltf', ['wild/assets/rock-moss/rock-moss.gltf', 'model/gltf+json']],
  ['/wild/assets/rock-moss/rock_moss_set_01.bin', ['wild/assets/rock-moss/rock_moss_set_01.bin', 'application/octet-stream']],
  ['/wild/assets/rock-moss/textures/rock_moss_set_01_diff_1k.jpg', ['wild/assets/rock-moss/textures/rock_moss_set_01_diff_1k.jpg', 'image/jpeg']],
  ['/wild/assets/rock-moss/textures/rock_moss_set_01_nor_gl_1k.jpg', ['wild/assets/rock-moss/textures/rock_moss_set_01_nor_gl_1k.jpg', 'image/jpeg']],
  ['/wild/assets/rock-moss/textures/rock_moss_set_01_rough_1k.jpg', ['wild/assets/rock-moss/textures/rock_moss_set_01_rough_1k.jpg', 'image/jpeg']],
  ['/wild/assets/wolf/wolf.glb', ['wild/assets/wolf/wolf.glb', 'model/gltf-binary']],
  ['/wild/assets/warg/warg.glb', ['wild/assets/warg/warg.glb', 'model/gltf-binary']],
  ['/wild/assets/pine/pine.gltf', ['wild/assets/pine/pine.gltf', 'model/gltf+json']],
  ['/wild/assets/pine/pine.bin', ['wild/assets/pine/pine.bin', 'application/octet-stream']],
  ['/wild/assets/pine/twig-diffuse.jpg', ['wild/assets/pine/twig-diffuse.jpg', 'image/jpeg']],
  ['/wild/assets/pine/twig-normal.jpg', ['wild/assets/pine/twig-normal.jpg', 'image/jpeg']],
  ['/wild/assets/pine/twig-arm.jpg', ['wild/assets/pine/twig-arm.jpg', 'image/jpeg']],
  ['/cover/the-room.webp', ['cover/the-room.webp', 'image/webp']],
  ['/cover/the-pressure.webp', ['cover/the-pressure.webp', 'image/webp']],
  ['/cover/the-aftermath.webp', ['cover/the-aftermath.webp', 'image/webp']],
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/bootstrap.js', ['bootstrap.js', 'text/javascript; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/engine.js', ['engine.js', 'text/javascript; charset=utf-8']],
  ['/scenario.js', ['scenario.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);
const securityHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
};
const wildSecurityPolicy = securityHeaders['Content-Security-Policy']
  .replace("img-src 'self' data:", "img-src 'self' data: blob:")
  .replace("connect-src 'none'", "connect-src 'self' blob:");

// Only the authored public assets are served. Repository files and arbitrary
// filesystem paths are never derived from a request URL.
export function createStaticServer({ root = publicRoot } = {}) {
  return createHttpServer(async (request, response) => {
    const send = (status, body, type = 'text/plain; charset=utf-8', extra = {}) => {
      response.writeHead(status, {
        ...securityHeaders,
        ...((request.url ?? '').startsWith('/wild/') ? { 'Content-Security-Policy': wildSecurityPolicy } : {}),
        'Content-Type': type,
        'Content-Length': Buffer.byteLength(body),
        ...extra,
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      send(405, 'Method not allowed.\n', undefined, { Allow: 'GET, HEAD' });
      return;
    }

    let pathname;
    try {
      // Inspect the raw path before URL normalization could hide traversal.
      pathname = decodeURIComponent((request.url ?? '').split(/[?#]/, 1)[0]);
    } catch {
      send(400, 'Invalid request path.\n');
      return;
    }
    if (!pathname.startsWith('/') || pathname.includes('\\') ||
        /[\u0000-\u001f\u007f]/.test(pathname) ||
        pathname.split('/').some(segment => segment === '.' || segment === '..')) {
      send(400, 'Invalid request path.\n');
      return;
    }

    const asset = assets.get(pathname);
    if (!asset) {
      send(404, 'Not found.\n');
      return;
    }

    try {
      const resolvedRoot = await realpath(root);
      const resolvedFile = await realpath(join(resolvedRoot, asset[0]));
      const fromRoot = relative(resolvedRoot, resolvedFile);
      if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
        send(403, 'Forbidden.\n');
        return;
      }
      send(200, await readFile(resolvedFile), asset[1]);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        send(404, 'Not found.\n');
      } else {
        send(500, 'Unable to read this asset.\n');
      }
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const portText = process.argv[2] ?? '4173';
  const port = Number(portText);
  if (process.argv.length > 3 || !/^\d+$/.test(portText) ||
      !Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Usage: node server.mjs [port from 1 to 65535]');
    process.exitCode = 1;
  } else {
    const server = createStaticServer();
    server.once('error', error => {
      console.error(error.code === 'EADDRINUSE'
        ? `Port ${port} is already in use. Try: node server.mjs ${port < 65535 ? port + 1 : 4173}`
        : `The local server could not start (${error.code ?? 'unknown error'}).`);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      console.log(`Stakewolf: http://127.0.0.1:${port}`);
      console.log('Local development server. Press Ctrl+C to stop.');
    });
  }
}
