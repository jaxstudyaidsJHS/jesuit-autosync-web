# 2.0 Milestone 1 — Build verification

**Status:** Portable shared logic verified on Linux. Native iPhone UI not yet compiled on macOS; hardware verification remains pending.

## Findings from GitHub's initial framework run

The November 23, 2026 framework PR #26 check (`45163219158`) reported an overall failure despite both Linux jobs passing. The two macOS-hosted jobs were **cancelled without executing build or test steps**. Do **not** interpret those cancelled jobs as an iPhone compile failure or success.

## Local independent verification

On November 24, 2026, the Swift package's five source/test files from the 2.0 framework were reconstructed in an isolated Swift 6.2.1 Linux environment. Running `swift test` compiled the package and executed **8/8 XCTest cases without failures** (4 clock/state tests + 4 Protocol v2 tests). This checks portable model logic only, **not SwiftUI, camera code, Xcode project generation, code signing or a real device**.

## CI decision

- Regular PR checks now run JavaScript, Go race/cross-build, and portable Swift 6 model tests on **Ubuntu 24.04**, avoiding canceled macOS queues.
- A separate **manual macOS workflow** generates the XcodeGen project and attempts an unsigned iPhone simulator compilation. It will need an available macOS runner or a development Mac.
- A green portable CI run must **never** be used to claim the iPhone UI is buildable, signed, installed, or connected.
- The manual workflow becomes available in the Actions tab after its workflow file is on GitHub's default branch. It can also be run from an approved local development Mac with Xcode and XcodeGen.

## Step 1 acceptance criteria

- [x] Review prior CI job failures and identify cancellations.
- [x] Swift 6 portable core compiles and tests locally (8/8).
- [x] Build portable Swift test job into normal GitHub CI.
- [ ] New GitHub portable CI passes in PR.
- [ ] Native iPhone simulator target compiles on a macOS runner.
- [ ] Confirm school-owned development Mac/signing pathway.

## Production boundary

The Friday v1.9.9 Mac ZIP is unchanged. No Firebase credentials, production Netlify site, macOS :8780 overlay or actual game state were touched.
