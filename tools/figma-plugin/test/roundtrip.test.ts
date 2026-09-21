// Import the repo's real token files into a fake Figma, export them back, and
// expect the same JSON. This is what keeps the plugin and packages/tokens/src
// honest with each other.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakeVariables } from './fake-figma.ts';
import { CONFIG } from '../src/config.ts';
import { importTokens } from '../src/import.ts';
import { exportTokens, rgbaToHex, type ExportBundle } from '../src/export.ts';
import { hexToRgba } from '../src/import.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../../../packages/tokens/src');

async function loadRepoBundle(): Promise<ExportBundle> {
  const bundle: ExportBundle = {};
  for (const dir of ['core', 'semantic']) {
    for (const file of await readdir(path.join(SRC, dir))) {
      if (!file.endsWith('.json')) continue;
      bundle[`${dir}/${file}`] = JSON.parse(await readFile(path.join(SRC, dir, file), 'utf8'));
    }
  }
  return bundle;
}

// Group-level $description entries are documentation in the repo files, not
// tokens, and do not survive a trip through Figma. Strip them for comparison.
function stripGroupDescriptions(tree: unknown): unknown {
  if (!tree || typeof tree !== 'object' || Array.isArray(tree)) return tree;
  const obj = tree as Record<string, unknown>;
  if ('$value' in obj) return obj;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$description') continue;
    out[k] = stripGroupDescriptions(v);
  }
  return out;
}

test('repo tokens survive import -> export unchanged', async () => {
  const api = new FakeVariables();
  const original = await loadRepoBundle();

  const importReport = await importTokens(api, original, CONFIG);
  assert.deepEqual(importReport.warnings, []);
  assert.ok(importReport.created > 0);

  const { bundle, warnings } = await exportTokens(api, CONFIG);
  assert.deepEqual(warnings, []);

  const expected = Object.fromEntries(
    Object.entries(original).map(([k, v]) => [k, stripGroupDescriptions(v)]),
  );
  // Semantic files carry no descriptions on leaves; the exporter only adds
  // $description when Figma has one, so shapes line up.
  assert.deepEqual(bundle, expected);
});

test('second import updates instead of duplicating', async () => {
  const api = new FakeVariables();
  const original = await loadRepoBundle();
  const first = await importTokens(api, original, CONFIG);
  const second = await importTokens(api, original, CONFIG);
  assert.equal(second.created, 0);
  assert.equal(second.updated, first.created);
  assert.equal(api.variables.size, first.created);
});

test('hex <-> rgba', () => {
  assert.equal(rgbaToHex(hexToRgba('#9e1515')), '#9e1515');
  assert.equal(rgbaToHex(hexToRgba('#302c2ccc')), '#302c2ccc');
  assert.equal(rgbaToHex(hexToRgba('#fff')), '#ffffff');
});
