# Wire protocol v2 (Mac authority prototype)

This contract is based on the **real Go Mac authority v0.2.0 API**, not the browser-only v1 protocol. It has no authentication credentials and grants no permissions itself.

- `GET http://127.0.0.1:8784/api/v2/health` — local prototype status
- `GET http://127.0.0.1:8784/api/v2/state` — game state; includes `protocol:2`, `gameId`, `revision`, scores and `clock:{remainingMs,running}`
- `POST http://127.0.0.1:8784/api/v2/commands` — localhost-only, exact-origin, operator-token-protected commands; not remotely callable by the iPhone
- `POST .../games` and `POST .../shutdown` — local operator action only

Command IDs and revision checks are durably enforced by the Go prototype. All commands must carry **gameId**, `sport`, `expectedRevision`, `id` and `protocol:2`.

### Warning about v1 and v2
`protocol/v1/` describes older JavaScript reference code and is NOT the new Mac wire API. Do not send v1 commands to v2: they will be rejected. The new iOS Core `AuthorityProtocolV2.swift` models use this contract. The repository has tests for both versions during migration.

### Security
The Mac's localhost origin/token are not reusable as a remote auth token. A future iPhone transport must use verified pairing and authenticated backend roles, then a trusted Bridge validates and forwards proposals. Never expose localhost operator tokens in Firebase or source code.

The **compatibility check** is not authorization; actual operator permissions must still be enforced on the Mac. All current native iPhone app features remain read-only demo.

### Clock semantics
One true monotonic Mac clock, no timer-tick counting. `remainingMs` is a sampled value. When Mac restarts, it restores a **paused** checkpoint. Clients interpolate for display only and must stop displaying confident time when stale.
