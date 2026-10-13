import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

// Ship a self-contained module: the local preview requires no CDN or npm install.
await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  entryPoints: ['public/wild/cinema.js'],
  outfile: 'public/wild/cinema.bundle.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  banner: { js: `/* Three.js license\n${await readFile(new URL('../node_modules/three/LICENSE', import.meta.url), 'utf8')}\n*/` },
  legalComments: 'eof',
  sourcemap: false,
  logLevel: 'info',
});
