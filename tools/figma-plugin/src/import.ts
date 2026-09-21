// DTCG token JSON (the same bundle shape the exporter produces) -> Figma
// Variables. Creates the Core and Semantic collections and their modes when
// missing, creates or updates one variable per token, and resolves
// `{path}` aliases to Figma variable aliases. Existing variables with the
// same name are updated in place.

import type { CollectionLike, ValueLike, VariableLike, VariablesApi } from './figma-api.ts';
import { figmaNameToPath, figmaTypeFor, pathToFigmaName, type TokenType } from './naming.ts';
import type { PluginConfig } from './config.ts';
import type { ExportBundle, TokenLeaf, TokenTree } from './export.ts';

export interface ImportReport {
  created: number;
  updated: number;
  warnings: string[];
}

interface FlatToken {
  path: string[];
  leaf: TokenLeaf;
  file: string;
}

export async function importTokens(
  api: VariablesApi,
  bundle: ExportBundle,
  config: PluginConfig,
): Promise<ImportReport> {
  const report: ImportReport = { created: 0, updated: 0, warnings: [] };
  const flat: FlatToken[] = [];
  for (const [file, tree] of Object.entries(bundle)) flatten(tree, [], file, flat);

  const collections = await api.getLocalVariableCollectionsAsync();
  const core = ensureCollection(api, collections, config.coreCollection);
  const semantic = ensureCollection(api, collections, config.semanticCollection);

  // Semantic modes: one per entry in config.modes, named like Figma expects.
  const modeIdFor = new Map<string, string>(); // file -> modeId
  const modeNames = Object.entries(config.modes);
  modeNames.forEach(([key, figmaName], i) => {
    const existing = semantic.modes.find((m) => m.name === figmaName);
    let modeId: string;
    if (existing) {
      modeId = existing.modeId;
    } else if (i === 0 && semantic.modes.length === 1 && semantic.variableIds.length === 0) {
      // A fresh collection comes with one unnamed mode: rename it.
      modeId = semantic.modes[0].modeId;
      semantic.renameMode(modeId, figmaName);
      semantic.modes[0].name = figmaName;
    } else {
      modeId = semantic.addMode(figmaName);
    }
    modeIdFor.set(`semantic/${key}.json`, modeId);
  });

  // Index every existing variable by name, per collection.
  const byName = new Map<string, VariableLike>();
  for (const c of [core, semantic]) {
    for (const id of c.variableIds) {
      const v = await api.getVariableByIdAsync(id);
      if (v) byName.set(`${c.name}/${v.name}`, v);
    }
  }

  // Pass 1: create every variable so aliases can resolve in pass 2. A
  // semantic token appears once per mode file; count each variable once.
  const created = new Map<string, VariableLike>();
  const touched = new Set<string>();
  for (const t of flat) {
    const collection = t.file.startsWith('semantic/') ? semantic : core;
    const name = pathToFigmaName(t.path);
    const key = `${collection.name}/${name}`;
    let variable = byName.get(key) ?? created.get(key);
    if (touched.has(key)) continue;
    touched.add(key);
    if (!variable) {
      variable = api.createVariable(name, collection, figmaTypeFor(t.leaf.$type));
      created.set(key, variable);
      report.created++;
    } else if (variable.resolvedType !== figmaTypeFor(t.leaf.$type)) {
      report.warnings.push(
        `"${name}" exists as ${variable.resolvedType} but the token is ${t.leaf.$type}; value not written.`,
      );
      continue;
    } else {
      report.updated++;
    }
    if (t.leaf.$description !== undefined) variable.description = t.leaf.$description;
  }

  const lookup = (collection: CollectionLike, name: string) =>
    byName.get(`${collection.name}/${name}`) ?? created.get(`${collection.name}/${name}`);

  // Pass 2: values.
  for (const t of flat) {
    const collection = t.file.startsWith('semantic/') ? semantic : core;
    const name = pathToFigmaName(t.path);
    const variable = lookup(collection, name);
    if (!variable || variable.resolvedType !== figmaTypeFor(t.leaf.$type)) continue;
    const modeId = collection === semantic ? modeIdFor.get(t.file) : core.modes[0].modeId;
    if (!modeId) continue;

    const raw = t.leaf.$value;
    if (typeof raw === 'string' && /^\{.+\}$/.test(raw)) {
      const targetPath = raw.slice(1, -1).split('.');
      const target =
        lookup(core, pathToFigmaName(targetPath)) ?? lookup(semantic, pathToFigmaName(targetPath));
      if (!target) {
        report.warnings.push(`"${name}": alias target ${raw} not found.`);
        continue;
      }
      variable.setValueForMode(modeId, api.createVariableAlias(target));
      continue;
    }
    variable.setValueForMode(modeId, toFigmaValue(t.leaf.$type, raw));
  }

  return report;
}

function ensureCollection(api: VariablesApi, all: CollectionLike[], name: string): CollectionLike {
  return all.find((c) => c.name === name) ?? api.createVariableCollection(name);
}

function flatten(tree: TokenTree, prefix: string[], file: string, out: FlatToken[]): void {
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    if (value && typeof value === 'object' && '$value' in value) {
      out.push({ path: [...prefix, key], leaf: value as TokenLeaf, file });
    } else if (value && typeof value === 'object') {
      flatten(value as TokenTree, [...prefix, key], file, out);
    }
  }
}

export function toFigmaValue(type: TokenType, value: unknown): ValueLike {
  switch (type) {
    case 'color':
      return hexToRgba(String(value));
    case 'dimension':
      return parseFloat(String(value));
    case 'duration':
      return parseFloat(String(value));
    case 'number':
    case 'fontWeight':
      return Number(value);
    case 'fontFamily':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'cubicBezier':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'boolean':
      return Boolean(value);
    default:
      return String(value);
  }
}

export function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h.padEnd(8, 'ff'), 16);
  return {
    r: ((n >>> 24) & 0xff) / 255,
    g: ((n >>> 16) & 0xff) / 255,
    b: ((n >>> 8) & 0xff) / 255,
    a: (n & 0xff) / 255,
  };
}

// Re-exported for the UI log: which Figma names a bundle would produce.
export function previewNames(bundle: ExportBundle): string[] {
  const flat: FlatToken[] = [];
  for (const [file, tree] of Object.entries(bundle)) flatten(tree, [], file, flat);
  return flat.map((t) => pathToFigmaName(t.path));
}

// Keep the naming module's inverse reachable for tests.
export { figmaNameToPath };
