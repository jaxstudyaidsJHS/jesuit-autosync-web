// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "JesuitScoreboardsCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "JesuitScoreboardsCore", targets: ["JesuitScoreboardsCore"])],
    targets: [
        .target(name: "JesuitScoreboardsCore"),
        .testTarget(name: "JesuitScoreboardsCoreTests", dependencies: ["JesuitScoreboardsCore"])
    ]
)
