# Security policy (development foundation)

This is not a production-ready service. Please do not post credentials or private scoreboard data in GitHub issues.

- Treat all iPhone and web input as untrusted. Only the authenticated Mac-side authority may accept scoring or clock commands.
- Cloud delivery success is **not** native scoreboard application confirmation, and neither confirms OBS has visibly rendered the update.
- Never commit Firebase Admin SDK keys, service-account files, Apple signing materials, school account credentials, private rosters, or any .env file.
- Firebase web API keys are not by themselves authorization. Enforce roles and data isolation through Firebase Auth plus database rules/server validation.
- Every write should include a unique command ID, expected state revision, active game identifier, and validated permissions.
- The deployed Mac processor must durably persist the command journal and state to make retry behavior safe across restarts. The JavaScript sample only retains IDs in memory and is insufficient for that guarantee.
- Use a distinct staging Firebase project/namespace and Netlify deployment. Never test on a live broadcast game ID.
- Avoid collecting camera images or personally identifying information in telemetry by default. Store only minimal diagnostics with short retention.
- Do not ship an app update that can silently change protocol behavior mid-game. Prefer stopped clocks and manual control on uncertain recovery.

Report a security concern privately to the project owner or school moderator rather than opening a public issue containing sensitive details.
