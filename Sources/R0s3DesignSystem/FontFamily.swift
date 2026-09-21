import SwiftUI

/// A font family token: the preferred face plus fallbacks, in order.
/// Font files are not bundled with this package; register them in the app
/// (Info.plist `UIAppFonts` or `CTFontManagerRegisterFontsForURL`) and the
/// name here must match the PostScript family name.
public struct FontFamily: Sendable, Hashable {
    public let names: [String]

    public init(_ names: String...) {
        self.names = names
    }

    /// The first family in the stack.
    public var primary: String { names.first ?? "" }

    /// A SwiftUI font using the primary family, falling back to the system
    /// font when the face is not registered.
    public func font(size: CGFloat, weight: SwiftUI.Font.Weight = .regular) -> SwiftUI.Font {
        SwiftUI.Font.custom(primary, size: size).weight(weight)
    }
}
