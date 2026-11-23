# Target architecture (not yet implemented end-to-end)

```text
Native iPhone app (SwiftUI, AVFoundation, Vision)
  | authenticated, revisioned command / camera proposal
  v
Firebase Auth + restricted game-specific transport
  | Firebase delivers; it does NOT prove display
  v
School Mac Bridge (validates source, role, nonce, revision, expiry)
  | ONE authoritative game/clock state
  v
Local scoreboard service -> Browser Source graphic -> OBS output
  ^
  | Mac control page and authorized remote controls
```

## State authority

Only the local Mac service decides whether an action is applied. A phone, OCR engine, or web dashboard may **propose** changes; each source must receive a command acknowledgment referencing an exact command ID and committed state revision. OBS displayed-frame verification is a separate measurement.

## Clocks

A running clock is represented by a monotonic uptime deadline plus remaining milliseconds. A renderer computes time from that deadline, not from setInterval ticks. On service restart, freeze and restore a confirmed remaining duration; never quietly advance based on a stale monotonic epoch. Reconcile client visuals against Mac state.

## Commands

- Use absolute actions: clock.start/clock.stop rather than ambiguous toggle; score.set for corrections.
- Use IDs for deduplication, optimistic expectedRevision, and authenticated game/session authorization.
- A shared revision advances once for each accepted write, not on every rendered clock tick.
- Persist a bounded accepted-command journal durably to prevent double scoring after restart. The prototype in src/ is **memory-only**.
- OCR readings are proposals, not trusted commands. Multiple frames, venue calibration, confidence and timeouts gate acceptance; operator review for uncertain changes.
- Reconnection never automatically replays a non-idempotent action with a new command ID.

## Versioning

An explicit protocol version is required for commands and acknowledgments. A client that is incompatible with the Mac should enter read-only mode and explain the required upgrade. Cloud, phone, and Mac versions are tracked separately.

## Existing broadcasts

The current Mac app uses a local OBS overlay endpoint and remains unchanged. This repository has no bridge to that executable yet. Native adoption must start in a parallel staging environment.
