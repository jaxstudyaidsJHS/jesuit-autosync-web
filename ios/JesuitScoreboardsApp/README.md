# Native iPhone UI starter

This folder is a **SwiftUI source draft**, not an `.xcodeproj`, signed IPA, TestFlight build, or installed app. It intentionally has no live Firebase or OBS connections.

To turn it into an installable app, use a compatible Xcode development environment and add `JesuitScoreboardsCore` as a local Swift package dependency. Create an app target with a school-approved bundle identifier and team signing configuration. Add a camera usage string when AVFoundation capture is introduced.

The core Swift package has runnable tests today. The iPhone app UI still requires an Xcode project and physical iPhone validation.
