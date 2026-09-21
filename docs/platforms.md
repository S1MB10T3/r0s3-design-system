# Platforms

## Web: r0s3.me

The site consumes `packages/tokens/dist/css/tokens.css`. It declares every
token as a custom property on `:root`, with the dark semantic set under
`[data-theme='dark']` and under `prefers-color-scheme: dark` when no explicit
`data-theme='light'` is set.

Options to pull it in:

1. **Copy on update** (simplest while the system is young): copy
   `dist/css/tokens.css` into the site's `src/` and import it before
   `global.css`.
2. **Git dependency**: `npm i github:s1mb10t3/r0s3-design-system` and import
   `r0s3-design-system/packages/tokens/dist/css/tokens.css`. Works because
   `dist` is committed.
3. **npm publish** `@r0s3/tokens` later, then `import '@r0s3/tokens/css'`.

`dist/json/tokens.json` holds the same values flat (`core`, `light`, `dark`)
for a Tailwind preset or docs page later.

Note for the site: the inline `html[data-booting]` background literal is not
driven by the CSS variable and has to be updated by hand when
`color.accent` changes.

## iOS: project-mue

Swift Package at the repo root. In Xcode: File → Add Package Dependencies →
`https://github.com/s1mb10t3/r0s3-design-system`, product `R0s3DesignSystem`.
Minimum iOS 17 / macOS 14 (for `UnitCurve`).

```swift
import R0s3DesignSystem

Text("Hello")
    .font(R0s3.Typography.Family.body.font(size: R0s3.Typography.Size.body,
                                           weight: R0s3.Typography.Weight.body))
    .foregroundStyle(R0s3.Color.ink)
    .padding(R0s3.Space.n2)
    .background(R0s3.Color.bg, in: .rect(cornerRadius: R0s3.Radius.sm))
```

Semantic colors resolve light/dark from the current trait collection, so a
single `R0s3.Color.bg` works in both appearances.

Fonts: the package ships names, not files. Register the font files in the app
target and the `FontFamily` primary name must match the PostScript family.
