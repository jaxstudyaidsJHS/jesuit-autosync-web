# Jesuit Scoreboards 2.0 — implementation framework

## Architecture and boundaries

```text
iPhone (SwiftUI)                  Web fallback (v1.9.9 remote)
  |  authenticated proposals       |  legacy until migrated
  +---------------+----------------+
                  |
           Firebase Auth + restricted RTDB
                  | transport and pairing only
                  v
         Trusted Mac Bridge (not yet integrated)
                  | validates identity, game, revision, expiration
                  v
         ONE Mac authoritative engine (Go prototype)
                  | durable command journal and monotonic clock
                  v
        Original five scoreboard controllers
                  | state snapshots and broadcast graphics
                  v
            OBS Browser Source (existing :8780/overlay)
```

A phone can **propose** changes, never make the cloud itself authoritative. v2 Mac authority currently binds `127.0.0.1:8784` in an off-air lab. The live Mac system still runs `127.0.0.1:8780`; do not start two independent writers for one game.

## What is implemented now

- Native iOS app **XcodeGen project spec** and four-tab SwiftUI shell: Game, Remote, Camera, System.
- Swift 6 game/clock and Protocol v2 wire models. Camera permission UX is real; **no live video or OCR yet**.
- Go authoritative clock and durable idempotent command engine **in separate off-air prototype**. Server tests include replay, revision races and paused recovery.
- Read-only preview transport and explicit disabled remote actions.
- Protocol v2 schemas + JS and Swift tests matching Go JSON field names.
- Archived reusable code from v1.9.8 (remote smooth clock) and v1.9.9 (score protection) in development-only helpers, without unreviewed school HTML.
- CI for Node, Swift, Go and unsigned iOS simulator app.

## Immediate integration order

**Milestone 1 — Safety and ownership:** confirm school developer identity and brand/asset rights; choose public/private; stage an isolated Firebase namespace/project and a separate Netlify preview. Never reuse a live game ID or publish secrets.

**Milestone 2 — Native Mac authority:** integrate the original sport controllers with one authoritative state, preserve exact live graphics and hotkeys; support basketball/lacrosse shot clocks, soccer time modes, penalties and baseball states. Existing compiled Mac server cannot be silently patched by JavaScript.

**Milestone 3 — Transport:** secure iPhone pairing, authenticated role-scoped Firebase command proposals, trusted Mac Bridge receipt/forward/ack logic, paused recovery and operator takeover. Native Mac should verify exact command ID and revision; cloud accepted ≠ native applied ≠ OBS visible.

**Milestone 4 — Native camera:** foreground-only AVFoundation capture, Vision detection, camera venue profiles, anti-flicker multi-frame sampling, confidence threshold, no blind score edits, safe background/reconnection handling.

**Milestone 5 — Complete broadcast test:** original five sports, reliable 1-second clock, start/stop/set, score protection, Firebase outage, Safari/iPhone sleep, Mac disconnect, OBS overlay, rollback.

**Milestone 6 — TestFlight:** authorized Apple Developer account, signed app build, manual release after real hardware testing; no forced midgame updates.

## Non-negotiable protection

- Current GUI-only school Mac setup and original `http://127.0.0.1:8780/overlay` remain unchanged.
- All five approved scoreboard designs, logos, celebrations, sport-specific controls and hotkeys preserved.
- Off-air demos cannot address the production Firebase project or production OBS.
- No new signing material, school roster, photographs, compiled binaries or hidden tokens committed.
- A live game state and score are never automatically reset by an app update.

## Versions

| Component | Current | 2.0 framework |
| --- | --- | --- |
| School Mac | v1.9.9 ZIP | Unchanged |
| Mac authority | v0.2.0 off-air Go lab | Source + CI |
| iPhone | Legacy mobile browser | Unsigned read-only SwiftUI shell |
| Wire protocol | Legacy v1 and RC2 formats | New v2 Mac contract |
| Netlify | Current production deployment | Unchanged |
| Firebase | Existing production project | Unchanged; security review pending |

No repository push automatically deploys to the live system.
