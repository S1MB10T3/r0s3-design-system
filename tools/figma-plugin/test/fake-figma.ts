// A tiny in-memory stand-in for `figma.variables`, enough for round-trip tests.
import type {
  AliasLike,
  CollectionLike,
  ValueLike,
  VariableLike,
  VariablesApi,
} from '../src/figma-api.ts';

export class FakeVariables implements VariablesApi {
  collections: CollectionLike[] = [];
  variables = new Map<string, VariableLike>();
  private seq = 0;

  private nextId(prefix: string): string {
    return `${prefix}:${++this.seq}`;
  }

  async getLocalVariableCollectionsAsync(): Promise<CollectionLike[]> {
    return this.collections;
  }

  async getVariableByIdAsync(id: string): Promise<VariableLike | null> {
    return this.variables.get(id) ?? null;
  }

  createVariableCollection(name: string): CollectionLike {
    const self = this;
    const collection: CollectionLike = {
      id: this.nextId('collection'),
      name,
      modes: [{ modeId: this.nextId('mode'), name: 'Mode 1' }],
      variableIds: [],
      addMode(modeName) {
        const modeId = self.nextId('mode');
        this.modes.push({ modeId, name: modeName });
        return modeId;
      },
      renameMode(modeId, modeName) {
        const m = this.modes.find((x) => x.modeId === modeId);
        if (m) m.name = modeName;
      },
    };
    this.collections.push(collection);
    return collection;
  }

  createVariable(
    name: string,
    collection: CollectionLike,
    type: VariableLike['resolvedType'],
  ): VariableLike {
    const variable: VariableLike = {
      id: this.nextId('var'),
      name,
      description: '',
      resolvedType: type,
      valuesByMode: {},
      setValueForMode(modeId: string, value: ValueLike) {
        this.valuesByMode[modeId] = value;
      },
    };
    this.variables.set(variable.id, variable);
    collection.variableIds.push(variable.id);
    return variable;
  }

  createVariableAlias(variable: VariableLike): AliasLike {
    return { type: 'VARIABLE_ALIAS', id: variable.id };
  }
}
