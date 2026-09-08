# Follow-up review package: FAIL — one timing-provenance contradiction

The new follow-up ZIP has one documentation defect: `measurements.json` says the final pair began after unrelated verification workers ended, but its later method text and both selected run records disclose 16 workers. The review's timing table agrees with the 16-worker records. Correct that stale sentence and regenerate the manifest/ZIP; media need no changes.

All other bounded checks pass:

- 37 unique members; CRC passes; exact selected payload sizes/hashes and source/ZIP equality at the initial check. All 91 enumerated references resolve or explicitly identify source-only provenance. No application, dependency tree or helper-source bundle.
- Seven movies strictly decode with demux timebase retained. All 1,836 frame timestamps and raw/portable hashes match exactly. Six PNGs equal their original screenshot bytes.
- Clean-extracted local-file viewer: seven movies load, play, seek to 7 seconds and resume; paired play/restart work; six images load. Console and error collections are empty. Only the verifier's browser session was closed.
- All nine recorded timing summaries independently recompute exactly. The selected native pair's inputs/settings/accepted charges match; reported timing/work counts and fixed-step CPU figures agree with raw records. Runtime/suite source-tree identities match Git.

Original checked ZIP SHA-256: `a2e6573041b50c1b89bff8e614ac4bba74689b1db497e246cdf0bdec12de8e64`. The failed original is preserved at `/tmp/astra-followup-package-verifier/preserved-initial-followup-review.zip`; it was not retried or modified. Parent source corrections began afterward; this verdict refers to the preserved original.

Proof: `/tmp/astra-followup-package-independent.json`, `/tmp/astra-followup-package-verifier/provenance.json`, `/tmp/astra-followup-package-verifier/media.json`, `/tmp/astra-followup-package-verifier/browser.json`, and `/tmp/astra-followup-package-verifier/viewer.png`.

No app tests, code edits, benchmarks, PR changes, merge or deployment were performed. No artistic or runtime-safety certification is added.
