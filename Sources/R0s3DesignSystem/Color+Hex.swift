import SwiftUI

#if canImport(UIKit) && !os(watchOS)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

extension SwiftUI.Color {
    /// Parses `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` (the `#` is optional).
    /// Falls back to `.clear` on malformed input so generated code never traps.
    public init(hex: String) {
        guard let rgba = HexColor.parse(hex) else {
            self = .clear
            return
        }
        self.init(.sRGB, red: rgba.r, green: rgba.g, blue: rgba.b, opacity: rgba.a)
    }

    /// A color that resolves to `light` or `dark` from the current appearance.
    /// Used for semantic tokens, which carry one value per theme mode.
    public init(light: String, dark: String) {
        #if canImport(UIKit) && !os(watchOS)
        self.init(
            uiColor: UIColor { traits in
                traits.userInterfaceStyle == .dark
                    ? UIColor(SwiftUI.Color(hex: dark))
                    : UIColor(SwiftUI.Color(hex: light))
            })
        #elseif canImport(AppKit)
        self.init(
            nsColor: NSColor(name: nil) { appearance in
                let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
                return NSColor(SwiftUI.Color(hex: isDark ? dark : light))
            })
        #else
        self.init(hex: light)
        #endif
    }
}

enum HexColor {
    struct RGBA {
        let r: Double
        let g: Double
        let b: Double
        let a: Double
    }

    static func parse(_ input: String) -> RGBA? {
        var hex = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if hex.hasPrefix("#") { hex.removeFirst() }

        switch hex.count {
        case 3, 4:
            hex = hex.map { "\($0)\($0)" }.joined()
        case 6, 8:
            break
        default:
            return nil
        }

        guard let value = UInt64(hex, radix: 16) else { return nil }
        let hasAlpha = hex.count == 8
        let r = Double((value >> (hasAlpha ? 24 : 16)) & 0xff) / 255
        let g = Double((value >> (hasAlpha ? 16 : 8)) & 0xff) / 255
        let b = Double((value >> (hasAlpha ? 8 : 0)) & 0xff) / 255
        let a = hasAlpha ? Double(value & 0xff) / 255 : 1
        return RGBA(r: r, g: g, b: b, a: a)
    }
}
