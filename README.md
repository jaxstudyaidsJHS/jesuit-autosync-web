# Jesuit Scoreboards 2.0 — development framework

A real, **reviewable 2.0 code framework** for Jesuit's future native iPhone app, Mac-side game authority, and shared wire protocol. **Not a production broadcast replacement.**

> **Status: OFF-AIR DEVELOPMENT.** No live iPhone/Firebase/OBS connection, no App Store/TestFlight build, and no change to the school Mac's v1.9.9 scoreboard system.

## Repository layout

| Path | Purpose |
| --- | --- |
| [ios/JesuitScoreboardsApp](ios/JesuitScoreboardsApp) | XcodeGen-based iOS app target with working four-tab SwiftUI development shell (game, remote, camera, system) |
| [ios/JesuitScoreboardsCore](ios/JesuitScoreboardsCore) | Swift 6 shared types: five sports, game state, v2 command/readback protocol, monotonic clock model and unit tests |
| [mac/authority](mac/authority) | Actual Go Mac-authority prototype: durable command IDs, revisions, server clock, paused recovery, local dashboard; **off-air port 8784** |
| [protocol/v2](protocol/v2) | Schema and docs for Go Mac protocol 2 (the future iOS transport contract) |
| [src/protocol](src/protocol) | Protocol v2 preflight checks and staged receipt handling; older v1 reference preserved |
| [src/client](src/client) | Reviewed reusable v1.9.8 smooth-remote display and v1.9.9 scoring protection helpers |
| [tests](tests) | JavaScript protocol, remote and safety regression tests |
| [docs](docs) | Architecture, backlog, migration, verification and release gates |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | Automated Node, Go race tests, Swift tests and unsigned iOS simulator build; **NO deployment** |

## Develop on an approved development Mac

A separate development Mac or cloud macOS runner with **Xcode + XcodeGen** can build the iOS app:

```sh
cd ios/JesuitScoreboardsApp
xcodegen generate
open JesuitScoreboardsDev.xcodeproj
```

Run the `JesuitScoreboardsDev` scheme in an iOS simulator. It displays obvious **OFF-AIR DEMO** warnings, sample scores/clock and working local clock-draft controls. Score submission is disabled, camera permission can be requested but camera capture/OCR is not yet implemented.

The **school-managed broadcast Mac needs no Terminal, Xcode, or new development tools**. Keep using the existing Jesuit Scoreboards v1.9.9 package and `http://127.0.0.1:8780/overlay` in OBS.

## Automated tests

```sh
npm test
node scripts/check-repository.mjs
swift test --package-path ios/JesuitScoreboardsCore
(cd mac/authority && go test -race ./...)
```

The GitHub CI workflow additionally generates the Xcode project and compiles an unsigned iPhone simulator app. Build success does **not** establish a signed installable TestFlight app or live device acceptance.

## What is intentionally excluded

- Original private school artwork, rosters, compiled Mac executables, and unreviewed legacy source.
- Production Netlify/Firebase deployment and operator tokens.
- Apple signing credentials, school-owned bundle ID and App Store publishing.
- Remote write operations until authenticated pairing and Mac-server enforcement exist.

**This GitHub repository is public.** Before importing existing RC2/v1.9.9 Mac HTML or publishing school-branded apps, confirm school ownership/permission and whether the repository should be private. See [Security](SECURITY.md) and [2.0 integration decisions](docs/framework-2.0.md).

## Next implementation gates

1. Approve organization ownership, repo privacy, staging accounts and Apple Developer authority.
2. Audit/import permitted legacy source; integrate the local Go authority with all five original scoreboards (no competing writers).
3. Implement verified Firebase staging transport with restricted operator roles and exact acknowledgments.
4. Add native AVFoundation/Vision camera OCR with safe manual fallback.
5. Perform iPhone → Firebase → Mac state → OBS visual verification on actual hardware; then use TestFlight for beta builds.

Development backlog: [GitHub Issues](https://github.com/jaxstudyaidsJHS/jesuit-autosync-web/issues).
