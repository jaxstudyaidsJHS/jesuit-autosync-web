# Legacy RC2 migration plan

The existing v1.9.7 RC2 Mac ZIP and hosted companion ZIP are not automatically imported into this **public** repository.

## Before importing

1. Confirm school approval and whether GitHub visibility should become **private**.
2. Review all HTML/JS/JSON for Firebase project IDs, tokens, credential storage, and debug logs.
3. Review school/team logos, roster information, and compiled binaries for redistribution rights.
4. Exclude the compiled macOS .app, media, extracted ZIPs, and local user data from source history.
5. Import reviewed *source files* in smaller separate changes. Attach test results and diff summaries.
6. Keep the local OBS URL and school Mac workflows unchanged until the live device acceptance test passes.

The RC2 hosted companion is newer than the historically deployed Netlify copy. Do not overwrite production as part of an initial code import. A GitHub connection to Netlify must be configured with explicit branch and deployment rules if ever adopted.
