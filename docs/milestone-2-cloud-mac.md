# Cloud Mac build — Jesuit Scoreboards 2.0

GitHub Actions is our **cloud Mac**. The workflow in `.github/workflows/ios-simulator-manual.yml` runs on `macos-15`, generates an Xcode project from `project.yml`, compiles an **unsigned iPhone simulator app**, and (if successful) uploads `JesuitScoreboards2-Simulator-UNSIGNED.zip` as an Actions artifact.

It starts automatically on a pull request that changes `ios/**` or this workflow. It can also be run manually from Actions once GitHub exposes the workflow on the default branch.

### What success proves
- SwiftUI app target compiles with the local Swift package.
- A simulator app is produced without Apple Developer credentials.

### What it does NOT prove
- An unsigned simulator `.app` is **not** an installable iPhone IPA and cannot be distributed through Firebase App Distribution or TestFlight.
- Device camera/OCR, Mac/OBS pairing and Firebase live communication are still disabled.
- An Xcode simulator build passing does not authorize production deployment.

### Firebase relationship
Firebase Realtime Database and Firebase Authentication will provide **staging transport and pairing**. They do **not** replace Xcode or Apple signing. A signed IPA can later be distributed using Firebase App Distribution with approved Apple Developer team credentials; do not add signing credentials to this public repository.

### If GitHub cancels the macOS job
Open the job's run page to distinguish a cancelled/never-started runner from a Swift compile failure. Try another macOS runner or an approved alternative CI provider after confirming the account's macOS runner allowance. Do not use a green Linux-only Swift test to claim an iOS app built.
