# v1.9.8 — Smooth remote clock display

The **complete, off-air Mac release archive** was built from v1.9.7 RC2 and contains three modified pages (`remote-control.html`, `beginner.html`, `sports/football/control.html`) plus the new `assets/jesuit-198-remote-clock.js`.

The shared browser helper in `src/client/` is identical in purpose and API to the bundled helper. The original production HTML files are **not being uploaded into this public repository** until school ownership and asset review are complete (issue #2).

## Behavior

- Advanced and Beginner remotes keep the existing HTTP polling rate but draw the clock locally every 100ms using a monotonic baseline.
- Football Controls publishes `__jesuitClockRunning` and `__jesuitClockSampleAt` in confirmed local Mac state. Never infer a running football clock from a static `MM:SS` string.
- Basketball/soccer use their Mac-controller deadline (`game.clock.endAt`); lacrosse interpolates `game.clockMs`.
- A repeated state sample never restarts the countdown. Running clocks freeze with `CHECK SYNC` after 6.5 seconds without fresh data.
- The display is **read-only**. It never sends interpolated time back to the server and does not change remote action acknowledgments or the Mac OBS overlay URL.

## Validation and limits

11 Node model tests and Node syntax checks for the two remote pages and football controller passed in the build environment; browser/device tests on the school Mac and iPhone remain pending. The six compiled Mac binaries remain unchanged. This patch does **not** implement the separate experimental v2 Mac authoritative clock.

This version does **not** require a Netlify or Firebase deployment, because the local Mac scoreboard server hosts its remote controls. Before using in a live broadcast, replace the old Mac app off-air, open Football Controls, pair the phone, and check every second, stop/reset, re-open, and stale connection behavior. Restore v1.9.7 RC2 if the off-air test fails.
