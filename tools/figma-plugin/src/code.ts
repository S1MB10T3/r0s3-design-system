// Plugin entry. Runs in Figma's sandbox; talks to src/ui.html via postMessage.

import { CONFIG } from './config.ts';
import { exportTokens } from './export.ts';
import { importTokens } from './import.ts';
import type { ExportBundle } from './export.ts';
import type { VariablesApi } from './figma-api.ts';

type UIMessage = { type: 'export' } | { type: 'import'; bundle: ExportBundle } | { type: 'close' };

// `figma.variables` matches VariablesApi structurally.
const api = figma.variables as unknown as VariablesApi;

figma.showUI(__html__, { width: 360, height: 420, themeColors: true });

figma.ui.onmessage = async (msg: UIMessage) => {
  try {
    if (msg.type === 'export') {
      const { bundle, warnings, count } = await exportTokens(api, CONFIG);
      figma.ui.postMessage({
        type: 'export-result',
        filename: 'tokens-export.json',
        json: JSON.stringify(bundle, null, 2),
        warnings,
        count,
      });
      figma.notify(`Exported ${count} tokens`);
    } else if (msg.type === 'import') {
      const report = await importTokens(api, msg.bundle, CONFIG);
      figma.ui.postMessage({ type: 'import-result', ...report });
      figma.notify(`Imported: ${report.created} created, ${report.updated} updated`);
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    figma.ui.postMessage({ type: 'error', message });
    figma.notify(message, { error: true });
  }
};
