# Off-air authority v0.2.0 test report

- Go `go test -race ./...` passed locally, including durable deduplication, restarted clock recovery, monotonic time, concurrent revision conflicts, local-origin/operator-token enforcement and HTTP input limits.
- Local HTTP smoke test passed direct scoring, duplicate rejection, clock start/reset/pause, safe shutdown and disk recovery.
- Dashboard JS syntax passed `node --check`; browser-based testing of localhost was blocked by the test environment's browser policy.
- Mach-O macOS arm64 and amd64 binaries cross-compiled successfully but **not run on the school Mac**.
- This is isolated. Not yet connected to Firebase, Netlify, the original Mac service, phone remote, or OBS. No production deployment or Firebase rule changes have been made.
