// Mirrors the `figma` block of ds.config.json at the repo root. esbuild bundles
// the JSON in so the plugin has no runtime file access.
import dsConfig from '../../../ds.config.json' with { type: 'json' };

export const CONFIG = {
  coreCollection: dsConfig.figma.coreCollection,
  semanticCollection: dsConfig.figma.semanticCollection,
  /** token mode key (file name) -> Figma mode name */
  modes: dsConfig.figma.modes as Record<string, string>,
};

export type PluginConfig = typeof CONFIG;
