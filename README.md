# r0s3-design-system

Design tokens for [r0s3.me](https://r0s3.me) and project-mue (iOS), with a
Figma plugin that moves them in and out of Figma Variables.

Design happens in Figma first. This repo turns the resulting variables into:

- `packages/tokens/dist/css/tokens.css` — CSS custom properties for the web
- `Sources/R0s3DesignSystem/` — a Swift package for SwiftUI
- `packages/tokens/dist/json/tokens.json` — flat JSON for anything else

Token values are currently **placeholders**. Nothing here is a design
decision yet.

## Layout

```
ds.config.json            name, Swift namespace, Figma collection/mode names
packages/tokens/          @r0s3/tokens: DTCG JSON in src/, build.mjs, dist/
Sources/R0s3DesignSystem/ Swift package (Package.swift at root); Generated/ is built
tools/figma-plugin/       @r0s3/figma-plugin: export/import Figma Variables
scripts/                  split-figma-export.mjs writes a plugin export into src/
docs/                     tokens.md · figma.md · platforms.md
```

## Commands

```sh
npm install
npm run build        # tokens → css/json/swift, then bundle the plugin
npm test             # plugin unit tests + round trip of the repo's token files
npm run typecheck
npm run check        # everything CI runs, including a stale-output check
```

## Workflow

1. Edit variables in Figma (collections `Core` and `Semantic`; see `docs/figma.md`).
2. Plugin → Export tokens → `node scripts/split-figma-export.mjs <download>`.
3. `npm run build`, review the diff, commit the JSON and the generated files together.

Or edit `packages/tokens/src/*.json` directly and skip Figma.

## Renaming

The system's name is meant to change. It lives in:

- `ds.config.json` — `name`, `swift.namespace`, `swift.module`. Drives every generated file.
- `Package.swift` and the `Sources/<module>/` folder name (must match `swift.module`).
- `Sources/<module>/R0s3.swift` — the namespace enum (must match `swift.namespace`).
- Package names `@r0s3/tokens` and `@r0s3/figma-plugin` in their `package.json`
  and the root scripts that reference them.
- `tools/figma-plugin/manifest.json` — plugin display name and id.

Then `npm run build` and commit.

## Fonts

Font files are never committed here (the repo is CC0 and Gravitica Mono is a
commercial face). Tokens carry family names and fallbacks; each app hosts its
own font files.

## License

[CC0 1.0](LICENSE).
