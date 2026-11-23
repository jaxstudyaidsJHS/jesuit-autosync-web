# v1.9.9 — Remote clock editing and Score Protection

**Off-air release candidate.** The complete Mac ZIP updates exactly three locally hosted HTML pages: Advanced Remote, Beginner Mode, and Football Controls. All six macOS executables, original artwork and OBS overlay route remain unchanged. No production Netlify/Firebase deployment is needed.

### Functionality implemented in the Mac ZIP
- Advanced Remote: Edit Game Clock panel; 00:00–99:59, ±1/±10 seconds, explicit approval, paused game clock after set.
- Football: the actual Mac Football Controls page consumes a unique remote clock-set ID, stops its running clock, writes the exact requested time and acknowledges the specific ID. Phone requires matching ID, stopped state and time before clearing pending command. **Football Controls must be open.**
- Basketball, lacrosse, soccer: update paused main-game clock with verified Mac state HTTP readback. Basketball/lacrosse shot clocks remain unchanged. Baseball has no editor.
- Advanced and Beginner scoring: on-by-default Score Protection in v1.9.9, second in-page confirmation for all scoring/corrections (including +1), visible team and before/after, explicit opt-out, shared preference.
- Unconfirmed pending commands cannot falsely report Connected or be blindly retried.

### Verification
- Chromium browser simulations with mocked Mac API: 22 checks Advanced, 7 checks Beginner.
- Actual Football Controller remote sync logic in Node VM: 5 checks.
- Pure helper Node tests: 7 checks in this PR.
- ZIP CRC, executable permissions and byte-for-byte original executables verified.

### Scope limitations
This new `src/client/remote-safety-199.mjs` is a **portable reference module** with regression tests; its logic is implemented inline in the standalone Mac package but this repository is public and therefore does not include the unreviewed legacy pages. No real iPhone/Mac/OBS end-to-end validation or server-side exactly-once enforcement yet. Do not close native authority issue #3 or device acceptance issue #7. Keep the previous ZIP for rollback.
