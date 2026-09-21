// swift-tools-version: 5.9
import PackageDescription

// Rename checklist: this product/target name, the Sources/<module> folder,
// and `swift.module` / `swift.namespace` in ds.config.json must agree.
let package = Package(
    name: "R0s3DesignSystem",
    platforms: [.iOS(.v17), .macOS(.v14), .watchOS(.v10), .tvOS(.v17), .visionOS(.v1)],
    products: [
        .library(name: "R0s3DesignSystem", targets: ["R0s3DesignSystem"])
    ],
    targets: [
        .target(name: "R0s3DesignSystem", path: "Sources/R0s3DesignSystem")
    ]
)
