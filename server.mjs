import { createServer as createHttpServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicRoot = fileURLToPath(new URL('./public/', import.meta.url));
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
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

// Only the authored public assets are served. Repository files and arbitrary
// filesystem paths are never derived from a request URL.
export function createStaticServer({ root = publicRoot } = {}) {
  return createHttpServer(async (request, response) => {
    const send = (status, body, type = 'text/plain; charset=utf-8', extra = {}) => {
      response.writeHead(status, {
        ...securityHeaders,
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
