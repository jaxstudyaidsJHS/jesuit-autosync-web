# Legacy RC2 source inventory and controlled migration

Inspected the two existing release-candidate ZIPs before planning GitHub import.

| Local archive | Entries | Contents | GitHub import |
| --- | ---: | --- | --- |
| Jesuit_Scoreboards_v1_9_7_RC2_All_10_Reliability_Upgrades.zip | 114 | Complete Mac .app, native executables, local website, sports, broadcast graphics, logos and roster data | **NOT** imported |
| Jesuit_AutoSync_v1_9_7_RC2_Hosted_Not_Deployed.zip | 12 | Hosted HTML/JS/CSS, Firebase rules file, setup/readme documents | **NOT** imported |

The local Mac package includes compiled `server-arm64`, `server-x86_64`, `StartScoreboards`, and other executables, plus `site/` pages and assets. The hosted companion includes `app.js`, `index.html`, `styles.css`, `database.rules.json` and diagnostics. These are historical release packages, **not audited, reproducible source releases**.

## Safe migration sequence

1. Obtain school approval on repository visibility and branding. Confirm which original code/graphics may be redistributed.
2. Make a **private** staging area for reviewing existing RC2 sources. Keep binaries, logos, roster JSON, photos, account identifiers, service keys, embedded tokens and secret config out of public history.
3. Review the hosted Firebase rules and client auth, then import reviewed code only with documented provenance and redacted config templates.
4. Extract and map all five local sport controllers and OBS overlay renderers; retain behavior tests and the exact legacy OBS URL.
5. Determine whether source code for the compiled native Mac server is available. If not, plan a compatible replacement; do **not** assume browser-side changes deliver native exactly-once semantics.
6. Run syntax, unit, integration, camera and physical Mac/OBS tests before merging imports. Keep v1.9.6/v1.9.7 RC2 backup ZIPs stored outside the public repository.

## Scope of this integration PR

Adds **new generic protocol code**, documentation, and automated tests only. It does not import original scoreboard implementations, promote RC2 to stable, change Netlify, alter Firebase settings, or publish an Apple app.
