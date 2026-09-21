// The slice of the Figma Plugin API the exporter/importer touch, as
// structural types. Tests pass fakes; the plugin passes `figma.variables`.

export interface ModeLike {
  modeId: string;
  name: string;
}

export interface AliasLike {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export interface RGBALike {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export type ValueLike = RGBALike | AliasLike | number | string | boolean;

export interface VariableLike {
  id: string;
  name: string;
  description: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, ValueLike>;
  setValueForMode(modeId: string, value: ValueLike): void;
}

export interface CollectionLike {
  id: string;
  name: string;
  modes: ModeLike[];
  variableIds: string[];
  addMode(name: string): string;
  renameMode(modeId: string, name: string): void;
}

export interface VariablesApi {
  getLocalVariableCollectionsAsync(): Promise<CollectionLike[]>;
  getVariableByIdAsync(id: string): Promise<VariableLike | null>;
  createVariableCollection(name: string): CollectionLike;
  createVariable(
    name: string,
    collection: CollectionLike,
    type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN',
  ): VariableLike;
  createVariableAlias(variable: VariableLike): AliasLike;
}

export const isAlias = (v: ValueLike): v is AliasLike =>
  typeof v === 'object' && v !== null && 'type' in v && v.type === 'VARIABLE_ALIAS';

export const isRGBA = (v: ValueLike): v is RGBALike =>
  typeof v === 'object' && v !== null && 'r' in v;
