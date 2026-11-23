# Jesuit Scoreboards 2.0 — development foundation

A **development repository** for a future native iPhone companion and a reliable scoreboard protocol. The current production Mac/OBS scoreboards and hosted Auto-Sync website are **not deployed from this repository**.

> **Status: FOUNDATION / NOT BROADCAST READY.** No real Firebase, OBS, Mac clock-service, or iPhone camera integration is connected. The code here is testable reference logic, not a replacement for the current broadcast software.

## What's here

- `src/scoreboard-engine.mjs` — reference command processor with revision checks, duplicate ID detection, authorization boundary, and elapsed-time clock calculations.
- `tests/` — automated tests for clock timing, command conflicts, duplicate scoring, and recovery behavior.
- `protocol/v1/` — proposed JSON message schemas for future Mac/iPhone/cloud communication.
- `ios/JesuitScoreboardsCore/` — portable Swift package for clock/state models with unit tests.
- `ios/JesuitScoreboardsApp/` — SwiftUI starter screen for a later Xcode project, **not a compiled app**.
- `.github/workflows/ci.yml` — GitHub Actions JavaScript and Swift checks. It does not publish or deploy anything.
- `docs/` — architecture, security, testing, migration, and release plans.

## Run tests locally (development machine only)

```sh
npm test
node scripts/check-repository.mjs
swift test --package-path ios/JesuitScoreboardsCore
```

Node.js 20+ and Swift 6 are used for these tests. **The school Mac Mini does not need Node, Swift, Terminal, or Xcode to keep using the existing scoreboard app.**

## Scope and safety

The GitHub repository was **public when this foundation was created**. For that reason this commit deliberately excludes:

- school or opposing-team logos, rosters, photos, and compiled macOS executables;
- existing production Firebase configuration and database content;
- Apple Developer account credentials, signing certificates, provisioning profiles, and API keys;
- unreleased legacy source files that have not been reviewed for permissions and secrets.

Before moving existing RC2 code into version control, decide with a school administrator whether the project should be private and confirm permissions for school media. See [security](SECURITY.md) and [migration](docs/migration.md).

## Release policy

**No automatic deployments.** Changes should pass review and automated tests before staging. The production Netlify site, Firebase settings, OBS endpoints, and school Mac remain untouched by this repository. Apple TestFlight releases require an authorized account holder and a real Xcode build.

## Next milestones

1. Confirm the school's Apple Developer account and GitHub ownership/visibility.
2. Establish a separately authenticated staging environment.
3. Adapt the existing local Mac service to become the authoritative clock/command processor; persist accepted command IDs.
4. Build and sign an actual iOS Xcode app using the Swift core and AVFoundation/Vision.
5. Run a device-to-Mac-to-OBS acceptance test before any production rollout.

This repo intentionally has **no license yet**; school ownership and distribution permissions should be settled first.
