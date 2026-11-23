# Future update and distribution process

1. Create a feature branch; use pull requests for review.
2. Run Node/Swift CI and off-air physical-device tests.
3. Produce a staging Netlify build and separate Firebase test namespace; do not auto-publish to the current production URL.
4. Create an Xcode archive on a supported development Mac/CI runner, using the school's authorized Apple Developer account and signing credentials stored outside the repo.
5. Offer an approved TestFlight beta, then consider App Store review when ready. Each TestFlight build has a limited test window.
6. Record app build, protocol compatibility, Mac release, and cloud deployment in a release manifest.
7. Roll back by selecting a previously known-good hosted deployment or Mac package. App Store-installed native binaries cannot always be instantly rolled back on devices, so maintain backend backward compatibility and a server-side kill switch for experimental OCR.

**No forced updates in a live game.** App update checks may show an available version but must not control a running clock or interrupt OBS.
