# Jesuit Scoreboards 2.0 — native iPhone development shell

This is an **actual XcodeGen-defined iOS application target**, backed by the Swift `JesuitScoreboardsCore` package. It is **not** signed, paired, released to TestFlight or connected to a live game.

## Build on a development Mac (NOT the school broadcast Mac)

1. Install a compatible current Xcode and [XcodeGen](https://github.com/yonaskolb/XcodeGen).
2. Open this directory in a development environment and run `xcodegen generate` to create `JesuitScoreboardsDev.xcodeproj`.
3. Open the generated project in Xcode and run the `JesuitScoreboardsDev` scheme on an iPhone simulator.
4. Only when the school approves signing: change placeholder `PRODUCT_BUNDLE_IDENTIFIER`, choose an authorized Apple Developer team, and set distribution permissions.

GitHub Actions builds the unsigned iOS simulator app automatically in the `iOS simulator compile` job. Building requires Xcode: the school-managed Mac Mini continues running its existing Terminal-free v1.9.9 app.

## Safeguards

- **Offline read-only demonstration:** no Firebase, Netlify, direct Mac API writes or OBS changes are possible.
- Sport picker, game preview, score protection preference and clock draft adjustments work only in local state.
- Camera tab requests iOS camera permission if asked but does **not capture or upload frames**. Permission string is in `project.yml`.
- Live command authorizations, pairing, durable receipts and broadcast verification belong to the later integration milestone.

The current broadcast graphics, logos, and Mac executables are intentionally not included.
