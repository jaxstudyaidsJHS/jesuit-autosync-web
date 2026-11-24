# Firebase Realtime Database — staging-only handshake

**This is a Firebase Emulator Suite test project**, not a deployed Firebase database. It is intentionally separate from the current Jesuit AutoSync production `rooms/` data and does not modify production rules.

## What we are testing now

- A **trusted server** can seed a read-only game snapshot (using the Admin SDK in the future). No phone may change a score, period, game clock or authoritative receipts.
- An operator or camera client paired to a specific **staging game** can submit an **immutable ping proposal** under `/stagingGames/$gameId/pings/$uid/$pingId`.
- Every ping must be tagged `kind: ping`, include an ID matching its key, and carry a reasonably fresh millisecond timestamp.
- Firebase Auth identity and **trusted custom claims** must identify the staging environment, the game and the role; an ordinary client must not be able to mint/modify these claims.
- The future Mac Bridge may read all ping proposals for its own game but cannot write authoritative state through an unprivileged client SDK.
- Clients are forbidden from listing arbitrary game rooms, writing receipts, submitting commands or accessing the production namespace.

## Emulator test (approved development machine or GitHub CI)

From this folder:

```sh
npm install
npm test
```

Requires Node 22+, Java 21 and the Firebase CLI (installed locally via npm). The test runner creates a `demo-jesuit-scoreboards-2` **emulated** database; no account credentials and no network connection to production Firebase are used at runtime.

GitHub runs these authorization/denial tests automatically in an isolated job. **Do not deploy this example file to the existing production Firebase project.** It intentionally has a different namespace and security model from v1.9.9.

## Using an actual staging Firebase project (later step)

An authorized project owner must create a *separate staging project*, enable Authentication and Realtime Database, then approve a trusted pairing server to assign short-lived roles/game memberships. Only after emulator tests and a security review should we deploy staging rules and attach an iPhone SDK configuration. Never add private Admin SDK keys or Apple signing material to GitHub.

Firebase can also handle **App Distribution** for a signed IPA later. A cloud Mac using Xcode is still required to build it.
