# Jesuit Scoreboards — Mac Clock & Command Authority Lab v0.2.0

**Status: OFF-AIR PROTOTYPE, NOT connected to RC2's scoreboard/OBS, Firebase, iPhone or live Netlify.**

This is the first native macOS-side component for two critical work items:
- Single service-owned, monotonic elapsed-time game clock (not dependent on an open browser tab)
- Durable command ID deduplication + atomic revision checks, with paused crash recovery

The off-air service listens **only on 127.0.0.1:8784**. The original Jesuit OBS overlay and original Mac app remain on **127.0.0.1:8780**; no changes are made to them. All scores and clocks changed in this lab stay in its **own separate local state**. It is not yet a production implementation and does not guarantee that OBS reflects its state.

## Installation/testing without Terminal on the school Mac

1. Extract `Jesuit_Authority_Lab_Mac_OffAir_v0_2_0.zip` to a separate folder. There are two Mac apps; choose **Apple Silicon** for an M-series Mac Mini or **Intel** for older Intel Macs.
2. If school policy permits opening the unsigned test app, double-click **Jesuit Authority Lab.app**. A browser should open `http://127.0.0.1:8784/`. If not, enter that URL manually in your regular browser.
3. Choose football (default), reset to 1:00, start the clock, and compare against a stopwatch. Closing the tab should not stop the Go service's clock. Reopen the same local URL to see the current value.
4. Use +1 to test score storage and repeat only when needed. The command processor refuses stale revisions and duplicates.
5. Click **Save & close Authority Lab** before quitting. This pauses the lab clock and saves the state. Restart should restore scores and stopped time.

This app is **not code-signed/notarized**. School-managed macOS may block it. **Do not disable Gatekeeper, bypass school restrictions, or use Terminal to override policy.** Ask school IT/moderator to approve/sign the prototype if blocked. Do not replace the school's existing scoreboard application with this test app.

## Security boundaries

- Mac-only loopback binding, strict Host/Origin and per-process 256-bit write token.
- Every scoring/clock change includes protocol=2, active game ID, unique command ID, expected revision and explicit type. A duplicate ID with another payload is rejected.
- Accepted command IDs and game state are persisted atomically together in `~/Library/Application Support/Jesuit Scoreboards Authority/state-v2.json` (mode 0600). A capacity limit **fails closed** rather than forgetting old accepted IDs during a game.
- Monotonic deadlines are not resurrected after restart; the most recent 1-second checkpoint is restored as **paused**. The discrepancy after unexpected process death can be up to roughly one checkpoint interval, plus storage scheduling.
- This local prototype's operator token is issued to same-origin dashboard HTML; it is NOT an authorization scheme for Firebase or internet clients. iPhones must not connect to it directly.
- There is no bridge authorization from the old compiled Mac server yet; `/api/v2/commands` deliberately cannot be called by the existing port 8780 site.

## Build and test on a development machine

```shell
go test -race ./...
go build ./cmd/jesuit-authority
```

For Apple builds use a correctly configured Go development environment targeting macOS arm64 or amd64. Source and GitHub Actions should undergo code review before school deployment. The school Mac does not need Go or Terminal to try the prebuilt app.

## Integration work still required

- Connect current five sport controls, hosted remote commands and OCR proposals through an authenticated, revisioned Mac Bridge, without letting old direct `/api/{sport}/state` writes bypass command authority.
- Implement sport-specific clocks (shot clock, penalty clocks, soccer extra time) and state migration with tests.
- Keep Firebase Auth/database rules separate and validate them with the official emulator before deployment; no Firebase rules were changed by this prototype.
- Add OBS readback and operator visual verification; never count a cloud ACK as an OBS ACK.
- Validate binary launching, App Nap behavior, browser re-entry and IT compatibility on the actual macOS 14.5 managed machine.
- Create Netlify staging with an isolated Firebase namespace, then verify the iPhone-to-Mac chain off-air before live promotion.

## Known limits

No production integrations. No compiled binary signed or notarized. No native iOS TestFlight app. Only the **generic game clock** is covered; other sport-specific timers and original hotkeys/graphics remain in RC2. This is a separately packaged proof of the P0 architecture.
