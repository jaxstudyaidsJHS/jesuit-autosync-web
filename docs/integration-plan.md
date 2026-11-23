# Integration plan — source of truth, staging, deployment

## System boundaries

1. **GitHub = reviewed source and issue history.** Merge via tested PRs; no direct production releases from a branch push.
2. **Apple native iPhone app = camera and operator client.** Keep SwiftUI/AVFoundation/Vision implementation modular; no trusted commands without authentication.
3. **Firebase = authenticated transport and pairing, not scoreboard authority.** A successful upload is only the cloud-received stage.
4. **Mac service = authoritative game/clock/command engine.** It validates authenticated roles, active game/session, revision and command ID, then persistently applies once.
5. **OBS = visual output.** The Mac's native readback can confirm state; rendered OBS pixels require a separate explicit visual/operator check.
6. **Netlify = hosted fallback/legacy camera and remote UI.** Retain until iPhone parity is demonstrated.

## Work order

**Gate A — ownership and staging:** confirm school/moderator account, make repo private if required, review Firebase Auth/rules, create non-production project/game namespace, preserve production copies. Issues #1, #2, #5, #8.

**Gate B — authoritative engine:** durable state snapshots, monotonic clock deadlines, atomic command ID deduplication with optimistic revisions, restart recovery policies and protocol read-only compatibility. Issues #3, #4, #6, #15.

**Gate C — native MVP:** proper Xcode iPhone target, camera access consent, Vision/Core ML OCR candidate proposals, manual scoring, pairing and receipts. No automatic clock writes from raw OCR. Issues #9–#12.

**Gate D — side-by-side acceptance:** app + hosted fallback against same staging service; live-like LED target and actual scoreboard footage; controlled Wi-Fi/phone sleep/OBS failures; test every sport. Issues #7, #10, #11, #17.

**Gate E — beta and release:** school-approved Apple signing, TestFlight, version compatibility matrix, explicit promotion/rollback, optional PostHog telemetry. Issues #13–#14, #20–#21.

## Update protocol

Every client sends `protocol`, `gameId`, `id`, `expectedRevision`, `type`, `payload`. Current reference schema uses protocol 1 and will need an approved schema revision before a live `gameId` addition. State revisions increment only after accepted state changes. Non-idempotent commands cannot be silently replayed with a fresh ID.

Proof stages are `created`, `cloud_received`, `bridge_received`, `native_applied`, `obs_operator_verified`. Failures and timeouts must surface as uncertain; never equate `native_applied` with visual confirmation.

## Definition of release-ready

- All P0 acceptance tests passed on real target devices, including independently verified 60-second clock.
- Five-sport regression, remote and OCR failure modes checked.
- Moderator signoff for app ownership and brand assets.
- Staging test report and documented rollback.
- No unexpected Netlify, Firebase or Mac production changes.
