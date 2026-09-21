# Tokens

Source of truth: `packages/tokens/src/**/*.json`, in the
[W3C Design Tokens (DTCG)](https://tr.designtokens.org/format/) format. Every
other file under `packages/tokens/dist` and `Sources/*/Generated` is produced
by `npm run build:tokens` and must not be edited by hand. CI fails if the
generated output is stale.

## Tiers

| Tier         | Where                      | What                                                     |
| ------------ | -------------------------- | -------------------------------------------------------- |
| **core**     | `src/core/<category>.json` | Raw values. One mode. Never referenced directly by UI.   |
| **semantic** | `src/semantic/<mode>.json` | Roles (`color.bg`, `color.ink`). Aliases into core only. |

Each semantic file is one theme mode and must define the same keys. `light`
is the default; `dark` is emitted as an override.

## Categories and naming

| Token path              | CSS                       | Swift                             | Figma                         |
| ----------------------- | ------------------------- | --------------------------------- | ----------------------------- |
| `color.core.neutral.0`  | `--color-core-neutral-0`  | `R0s3.Color.Core.Neutral.n0`      | `Colors/Core/Neutral/0`       |
| `color.accent`          | `--color-accent`          | `R0s3.Color.accent`               | `Colors/Accent` (Semantic)    |
| `space.3`               | `--space-3` (rem)         | `R0s3.Space.n3` (pt)              | `Space/3`                     |
| `radius.sm`             | `--radius-sm` (px)        | `R0s3.Radius.sm`                  | `Radius/Sm`                   |
| `font.family.body`      | `--font-family-body`      | `R0s3.Typography.Family.body`     | `Typography/Family/Body`      |
| `font.size.body`        | `--font-size-body` (rem)  | `R0s3.Typography.Size.body`       | `Typography/Size/Body`        |
| `font.weight.body-bold` | `--font-weight-body-bold` | `R0s3.Typography.Weight.bodyBold` | `Typography/Weight/Body Bold` |
| `font.line-height.body` | `--font-line-height-body` | `R0s3.Typography.LineHeight.body` | `Typography/Line Height/Body` |
| `duration.hover`        | `--duration-hover`        | `R0s3.Motion.Duration.hover` (s)  | `Motion/Duration/Hover`       |
| `ease.brand`            | `--ease-brand`            | `R0s3.Motion.Ease.brand`          | `Motion/Ease/Brand`           |
| `z.overlay`             | `--z-overlay`             | `R0s3.ZIndex.overlay`             | `Z/Overlay`                   |

Rules:

- Paths are lowercase kebab-case segments. CSS joins them with `-`.
- Swift nests one `enum` per segment (PascalCase). Leaves are camelCase; a
  leaf that starts with a digit gets an `n` prefix.
- The top-level group decides the Swift file and the Figma group. Adding a
  new group means adding it to `SWIFT_GROUPS` in `packages/tokens/build.mjs`
  and to the tables in `tools/figma-plugin/src/naming.ts`.

## Types and units

| `$type`       | Stored as                 | CSS                                           | Swift                  |
| ------------- | ------------------------- | --------------------------------------------- | ---------------------- |
| `color`       | `#rrggbb` / `#rrggbbaa`   | as is                                         | `SwiftUI.Color`        |
| `dimension`   | `Npx`                     | `rem` for space and font.size, `px` otherwise | `CGFloat` points       |
| `number`      | number                    | as is                                         | `Double`               |
| `fontWeight`  | 100–900                   | as is                                         | `Font.Weight`          |
| `fontFamily`  | `["Primary", "fallback"]` | quoted list                                   | `FontFamily`           |
| `duration`    | `Nms`                     | as is                                         | `TimeInterval` seconds |
| `cubicBezier` | `[x1, y1, x2, y2]`        | `cubic-bezier(...)`                           | `UnitCurve`            |

## Adding a token

1. Add it to the right `src/core/*.json` file (or both `src/semantic/*.json`
   files for a role). Use `$description` for intent.
2. `npm run build:tokens`, then commit the regenerated files with it.
3. Or do it in Figma first and export with the plugin (see `figma.md`).

## Placeholders

The current files hold **placeholder values only** so the pipeline builds
end to end. Anything marked `placeholder — replace from Figma` is a stand-in,
not a design decision. Figma is the first real source.
