#!/usr/bin/env node
// Writes a plugin export bundle (tokens-export.json) into packages/tokens/src.
//
//   node scripts/split-figma-export.mjs ~/Downloads/tokens-export.json
//
// Each key in the bundle is a src-relative path ("core/color.json"). Files
// not present in the bundle are left untouched. Run `npm run build` after.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const input = process.argv[2];
if (!input) {
  console.error('usage: node scripts/split-figma-export.mjs <tokens-export.json>');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'packages', 'tokens', 'src');
const bundle = JSON.parse(await readFile(input, 'utf8'));

for (const [rel, tree] of Object.entries(bundle)) {
  if (!/^(core|semantic)\/[a-z0-9-]+\.json$/.test(rel)) {
    console.warn(`skipping unexpected key "${rel}"`);
    continue;
  }
  const dest = path.join(srcDir, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, JSON.stringify(tree, null, 2) + '\n');
  console.log(`wrote ${path.relative(root, dest)}`);
}
