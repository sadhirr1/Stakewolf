import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

// Offline format conversion of the creator's actual coats. No recoloring,
// downloads, installation, geometry changes or creator-script execution.
const [textureDir, outputDir, sharpModule] = process.argv.slice(2);
if (!textureDir || !outputDir || !sharpModule) {
  throw new Error('Usage: node scripts/asset-prep-warg-variants.mjs extracted-texture-dir output-dir sharp-module');
}
const sharp = createRequire(import.meta.url)(sharpModule);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const names = ['T_Warg.png', 'T_Warg_Ash.png', 'T_Warg_Black.png'];
const sources = await Promise.all(names.map(async name => {
  const bytes = fs.readFileSync(path.join(textureDir, name));
  const { data, info } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 1024 || info.height !== 1024 || info.channels !== 4) {
    throw new Error(`${name}: expected 1024x1024 RGBA source`);
  }
  return { name, bytes, data, info };
}));

// The source alpha stores smoothness. Reusing the base roughness map is valid
// only if every alpha sample is identical; otherwise stop before writing.
for (const source of sources.slice(1)) {
  let differences = 0, maximumDifference = 0;
  for (let i = 3; i < source.data.length; i += 4) {
    const difference = Math.abs(source.data[i] - sources[0].data[i]);
    differences += difference !== 0 ? 1 : 0;
    maximumDifference = Math.max(maximumDifference, difference);
  }
  if (differences) {
    throw new Error(`${source.name}: smoothness differs at ${differences} pixels (max ${maximumDifference}); supply its own roughness before integrating`);
  }
}

fs.mkdirSync(outputDir, { recursive: true });
const report = { sharp: sharp.versions.sharp, dimensions: [1024, 1024], alpha: 'Every variant smoothness byte equals the base coat alpha.', variants: [] };
for (let i = 1; i < sources.length; i++) {
  const source = sources[i], name = i === 1 ? 'ash.jpg' : 'black.jpg';
  // Match the existing GLB's row orientation, JPEG quality and 4:4:4 chroma.
  const bytes = await sharp(source.bytes).flip().removeAlpha()
    .jpeg({ quality: 94, chromaSubsampling: '4:4:4' }).toBuffer();
  fs.writeFileSync(path.join(outputDir, name), bytes);
  const decoded = await sharp(bytes).removeAlpha().raw().toBuffer();
  let correctError = 0, unflippedError = 0;
  for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) for (let c = 0; c < 3; c++) {
    const value = decoded[(y * 1024 + x) * 3 + c];
    correctError += Math.abs(value - source.data[((1023 - y) * 1024 + x) * 4 + c]);
    unflippedError += Math.abs(value - source.data[(y * 1024 + x) * 4 + c]);
  }
  const samples = decoded.length;
  report.variants.push({ source: source.name, sourceBytes: source.bytes.length, sourceSha256: hash(source.bytes),
    output: name, bytes: bytes.length, sha256: hash(bytes), smoothnessMatchesBase: true,
    meanAbsoluteRgbErrorAgainstFlippedSource: correctError / samples,
    meanAbsoluteRgbErrorAgainstUnflippedSource: unflippedError / samples });
}
console.log(JSON.stringify(report, null, 2));
