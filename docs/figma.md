# Figma

Tokens are authored as Figma Variables and moved into this repo with the
plugin in `tools/figma-plugin`. The plugin does the reverse too, so the repo
can seed a fresh Figma file.

## Collections the plugin expects

Names come from `ds.config.json` (`figma` block):

| Collection | Modes           | Holds                                                                                        |
| ---------- | --------------- | -------------------------------------------------------------------------------------------- |
| `Core`     | one (any name)  | Raw values: `Colors/...`, `Space/...`, `Radius/...`, `Typography/...`, `Motion/...`, `Z/...` |
| `Semantic` | `Light`, `Dark` | Roles aliased to Core variables, e.g. `Colors/Bg`                                            |

Variable naming follows `docs/tokens.md`. Variable descriptions become
`$description`.

Type mapping in Figma terms:

- Colors are `COLOR` variables.
- Space, radius, font sizes, weights, line heights, durations (ms) and
  z-index are `FLOAT`.
- Font families are `STRING` (`Courier Prime, ui-monospace, monospace`).
- Easings are `STRING` (`0.4, 0, 0.2, 1`).

## Install the plugin (development)

```sh
npm install
npm run build:plugin        # or: npm run watch -w @r0s3/figma-plugin
```

Figma desktop → Plugins → Development → Import plugin from manifest… →
`tools/figma-plugin/manifest.json`. After code changes: Plugins →
Development → Hot reload plugin.

## Figma → repo

1. Run the plugin, **Export tokens**. It downloads `tokens-export.json`.
2. `node scripts/split-figma-export.mjs ~/Downloads/tokens-export.json`
   writes it into `packages/tokens/src/`.
3. `npm run build`, review the diff, commit.

## Repo → Figma

Build a bundle from the repo files (the test helper in
`tools/figma-plugin/test/roundtrip.test.ts` shows the shape: an object keyed
by `core/color.json` etc.), then run the plugin and **Import tokens**.
Existing variables with the same name are updated; missing ones are created.

## Why not Tokens Studio or the REST API

Figma's Variables REST API is Enterprise-only. Tokens Studio works but adds a
second naming scheme. A small plugin keeps the mapping in one place and under
test.
