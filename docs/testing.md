# Release acceptance checklist

## Automated

- [ ] Node protocol tests pass; conflicts and duplicates are rejected.
- [ ] Swift core tests pass on supported build environment.
- [ ] Repository safety scanner passes; no embedded credentials or school media.
- [ ] Protocol request/ack examples validate against JSON Schemas.

## Off-air physical devices

- [ ] TestFlight app opens with correct camera permission prompts and no crash.
- [ ] iPhone scans a real venue scoreboard: compare 100+ annotated frames, log misreads and false updates.
- [ ] Firebase permissions reject an unpaired or logged-out device.
- [ ] One manually confirmed update reaches the local Mac state and then the OBS output.
- [ ] A 60-second clock matches an independent stopwatch within an agreed tolerance.
- [ ] Closing browser tabs does not change authoritative time.
- [ ] Network loss, phone sleep, Mac Bridge crash, and OBS restart leave safe recoverable state.
- [ ] Duplicate commands and out-of-order updates never double-add score or toggle clocks.
- [ ] All five sports, existing graphics, logos, hotkeys, and remote functions still operate.
- [ ] Restore a known-good version without resetting live scores unexpectedly.

**Never test with the active live-game Firebase ID.**
