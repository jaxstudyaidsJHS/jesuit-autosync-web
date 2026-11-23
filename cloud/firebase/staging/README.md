# Firebase staging policy — CLOSED until approved

This folder is a **development example**, not the active Firebase production rules.

`database.rules.development-example.json` **denies all reads and writes**. It is a safe starting posture, NOT usable as a functional scoreboard transport. **Never apply this file to the production Firebase project** (doing so would block existing app traffic).

## Before opening staging access

1. Create a separate staging Firebase project or equivalent isolated namespace and unique game IDs.
2. Enable a reviewed authentication method. Pair each iPhone to a single active game, with expiration/revocation.
3. Define explicit roles: owner/operator, camera proposal client, read-only overlay viewer and Mac Bridge.
4. Enforce each role **in Firebase security rules and the Mac authority**, not in JavaScript UI alone.
5. Phone can submit proposed OCR readings or commands but **cannot write authoritative game state or command receipts**.
6. Mac Bridge validates authenticated identity, game ID, expected revision, command ID, expiry and payload before passing to the local Mac service.
7. A cloud-accepted request is not a Mac-accepted request and neither proves OBS rendered the change. Require exact receipts and a human-verifiable OBS indicator.
8. Test denial cases in Firebase Emulator Suite before shipping any rules.

The authenticated Firebase staging connector, database rules and emulator tests will be implemented as a separate reviewed change in GitHub issue #5. There are currently no Firebase config keys or live connections here.
