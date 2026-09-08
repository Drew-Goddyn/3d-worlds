# Follow-up review package: PASS — supersedes preserved initial failure

The corrected timing metadata distinguishes the final native pair with 16 unrelated workers in each run from the earlier pair with no observed workers. Every native and fixed-step run and both profiler recordings now have exact resolvable source commits. Earlier geometry-cache fixed-step snapshots are correctly marked identical; final-contact snapshots are separately marked different. Fixed-step timing explicitly excludes WebGL drawing while retaining scene-state refresh. All original timing samples, inputs, profile metrics and result counts are unchanged.

The corrected ZIP passes CRC, 37 unique-member checks and every manifest/source/member size and SHA-256 check. Only measurements.json and manifest.json changed. References retain their verified included or explicitly source-only targets. No application, dependencies or helper source was added.

All seven movies, six images and offline viewer are byte-identical to the checked initial package. Completed strict decodes, 1,836 exact raw-frame timestamps, screenshot-byte matching, offline play/seek/resume and paired restart checks remain valid. Browser console/errors were empty and the verifier session was closed. These checks were not repeated.

Final ZIP SHA-256: `613564a2d55e80234f39ef01b454f98f450607151083a78f672914a7f122d6f6`.

The initial FAIL report, machine result and ZIP remain preserved under `/tmp/astra-followup-package-verifier/initial-FAIL.md`, `initial-FAIL.json` and `preserved-initial-followup-review.zip`. The corrected ZIP is preserved as `preserved-corrected-followup-review.zip`. An initially overbroad verifier expectation that all profile metadata remain identical rejected the two added source-commit fields; that diagnostic is also preserved. Inspecting those fields confirmed the requested provenance additions, with every original profile field unchanged.

Machine proof: `/tmp/astra-followup-package-independent.json`. No repository edits, app tests, new benchmarks, browser reopening, PR actions, merge or deployment were performed by this correction check. This verifies the evidence package, not owner acceptance or additional runtime/artistic certification.
