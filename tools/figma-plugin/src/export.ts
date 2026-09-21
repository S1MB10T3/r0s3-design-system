// Figma Variables -> DTCG token JSON, laid out exactly like packages/tokens/src.
//
// Output is a bundle keyed by src-relative file path:
//   { "core/color.json": {...}, "core/space.json": {...}, "semantic/light.json": {...} }
// scripts/split-figma-export.mjs writes a bundle into the repo.

import {
  isAlias,
  isRGBA,
  type CollectionLike,
  type ValueLike,
  type VariableLike,
  type VariablesApi,
} from './figma-api.ts';
import { CORE_FILE_FOR_GROUP, figmaNameToPath, tokenTypeFor, type TokenType } from './naming.ts';
import type { PluginConfig } from './config.ts';

export type TokenLeaf = { $type: TokenType; $value: unknown; $description?: string };
export type TokenTree = { [key: string]: TokenTree | TokenLeaf };
export type ExportBundle = Record<string, TokenTree>;

export interface ExportReport {
  bundle: ExportBundle;
  warnings: string[];
  count: number;
}

export async function exportTokens(api: VariablesApi, config: PluginConfig): Promise<ExportReport> {
  const collections = await api.getLocalVariableCollectionsAsync();
  const core = collections.find((c) => c.name === config.coreCollection);
  const semantic = collections.find((c) => c.name === config.semanticCollection);
  const warnings: string[] = [];
  const bundle: ExportBundle = {};
  let count = 0;

  if (!core) {
    warnings.push(`No "${config.coreCollection}" collection found.`);
  } else {
    const modeId = core.modes[0]?.modeId;
    for (const variable of await variablesOf(api, core)) {
      const path = figmaNameToPath(variable.name);
      const file = CORE_FILE_FOR_GROUP[path[0]];
      if (!file) {
        warnings.push(`Skipped "${variable.name}": unknown group "${path[0]}".`);
        continue;
      }
      const leaf = await toLeaf(api, variable, variable.valuesByMode[modeId], path);
      if (!leaf) {
        warnings.push(`Skipped "${variable.name}": no value for the default mode.`);
        continue;
      }
      insert((bundle[file] ??= {}), path, leaf);
      count++;
    }
  }

  if (!semantic) {
    warnings.push(`No "${config.semanticCollection}" collection found.`);
  } else {
    const fileForMode = new Map<string, string>();
    for (const [key, figmaName] of Object.entries(config.modes)) {
      fileForMode.set(figmaName, `semantic/${key}.json`);
    }
    const variables = await variablesOf(api, semantic);
    for (const mode of semantic.modes) {
      const file = fileForMode.get(mode.name);
      if (!file) {
        warnings.push(
          `Skipped mode "${mode.name}": not listed under figma.modes in ds.config.json.`,
        );
        continue;
      }
      for (const variable of variables) {
        const path = figmaNameToPath(variable.name);
        const leaf = await toLeaf(api, variable, variable.valuesByMode[mode.modeId], path);
        if (!leaf) {
          warnings.push(`Skipped "${variable.name}" in mode "${mode.name}": no value.`);
          continue;
        }
        insert((bundle[file] ??= {}), path, leaf);
        count++;
      }
    }
  }

  return { bundle, warnings, count };
}

async function variablesOf(api: VariablesApi, collection: CollectionLike): Promise<VariableLike[]> {
  const out: VariableLike[] = [];
  for (const id of collection.variableIds) {
    const v = await api.getVariableByIdAsync(id);
    if (v) out.push(v);
  }
  return out;
}

async function toLeaf(
  api: VariablesApi,
  variable: VariableLike,
  value: ValueLike | undefined,
  path: string[],
): Promise<TokenLeaf | null> {
  if (value === undefined || value === null) return null;
  const $type = tokenTypeFor(path, variable.resolvedType);
  const leaf: TokenLeaf = { $type, $value: undefined };
  if (variable.description) leaf.$description = variable.description;

  if (isAlias(value)) {
    const target = await api.getVariableByIdAsync(value.id);
    if (!target) return null;
    leaf.$value = `{${figmaNameToPath(target.name).join('.')}}`;
    return leaf;
  }

  leaf.$value = convertValue($type, value);
  return leaf;
}

export function convertValue(type: TokenType, value: ValueLike): unknown {
  switch (type) {
    case 'color':
      return isRGBA(value) ? rgbaToHex(value) : String(value);
    case 'dimension':
      return `${round(Number(value))}px`;
    case 'duration':
      return `${round(Number(value))}ms`;
    case 'number':
    case 'fontWeight':
      return round(Number(value));
    case 'fontFamily':
      return String(value)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    case 'cubicBezier': {
      const nums = String(value)
        .replace(/^cubic-bezier\(|\)$/g, '')
        .split(',')
        .map((n) => Number(n.trim()));
      return nums.length === 4 && nums.every((n) => !Number.isNaN(n)) ? nums : String(value);
    }
    case 'boolean':
      return Boolean(value);
    default:
      return String(value);
  }
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

export function rgbaToHex({
  r,
  g,
  b,
  a = 1,
}: {
  r: number;
  g: number;
  b: number;
  a?: number;
}): string {
  const h = (n: number) =>
    Math.round(Math.min(1, Math.max(0, n)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a) : ''}`;
}

function insert(tree: TokenTree, path: string[], leaf: TokenLeaf): void {
  let node = tree;
  for (const seg of path.slice(0, -1)) {
    const next = node[seg];
    if (next && !('$value' in next)) {
      node = next as TokenTree;
    } else {
      node = node[seg] = {};
    }
  }
  node[path[path.length - 1]] = leaf;
}
