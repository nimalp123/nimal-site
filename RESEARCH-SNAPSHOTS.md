# Research snapshot scope

These are recorded September 2026 development experiments and engineering checkpoints. They are not production-wide accuracy, certified generalization, model training results, or an institutional affiliation. The website keeps each metric's denominator and experimental scope visible.

## AI research engine

| Metric                            | Recorded comparison                                                                    | Interpretation                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 3.3× observed batch throughput    | Same six real development pages: 93 minutes sequentially, 28 minutes in a parallel run | Identical terminal mix: five entries requiring review and one invalid source. This measures batch wall time, not extraction accuracy. |
| 78% fewer invalid AI proposals    | 45 → 10 on the same experimental arm and unchanged 12-case synthetic benchmark         | One recorded before/final pair.                                                                                                       |
| Exact matches 6 → 11 out of 12    | Same before/final pair                                                                 | Validators, expectations, fixtures, and correction budget unchanged.                                                                  |
| Verification passed 10/12 → 12/12 | Same before/final pair                                                                 | Synthetic development outcome, distinct from exact matching.                                                                          |
| 83% fewer output tokens           | 963k baseline → 163k tuned alternative arm                                             | Controlled 12-case comparison including route and implementation changes; not total tokens or a single isolated optimization.         |
| 22% shorter evaluation runtime    | 64 → 50 minutes for that baseline/tuned-arm pair                                       | Distinct from the within-arm quality comparison, which took longer after tuning.                                                      |

## Document intelligence

| Metric                                                            | Scope                                                                                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 20/20 repeated validation trials, 470/470 required fields matched | Ten synthetic documents tested twice. Already-seen validation set, not a fresh holdout.                                                                                        |
| 539/539 selected course cells and 77/77 rows                      | Each of two development trials on one recognized readable real portal template. No claim about arbitrary transcripts, scans, or handwriting.                                   |
| 231 tracked model calls                                           | Original PR55 development, comparison, and validation batches. This is a historical research tally, not a combined lifetime total or deployment volume.                        |
| 3,289 source checks passed                                        | Newer offline experiment checkpoint: 1,834 backend/core tests plus 1,455 app tests, from disjoint suites. Not a claim that whole-app lint/type checks or live accuracy passed. |
| 299 controlled response fixtures                                  | 151 focused source tests, including expected rejection cases. Deterministic/mocked controls, not live model outputs. These tests overlap the source-check total.               |
| 167 frozen replay probes; 79/79 legacy outputs unchanged          | Offline source-contract verification. Not complete-document generalization.                                                                                                    |
| 137 review-driven regression cases                                | Recorded R5 source correction. Existing assertions were preserved; failing intermediate runs were retained. These cases overlap larger test suites.                            |

PR55 and its follow-up branches contain experimental and unreleased work. The newer five-arm pilot was built but had not run at the audited checkpoint. Historical development exactness improved while one held-out comparison regressed; that development score is therefore not presented as general document accuracy.

## Research infrastructure

| Metric                        | Scope                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| 8,419 unit checks passed      | Recorded scraper development checkpoint; 344 skipped. Other gated suites are separate.            |
| 86 discovery research entries | Entries with readable real-web captures, not verified scholarships.                               |
| 133 saved readings            | 117 HTML captures and 16 PDF texts in the research lab.                                           |
| 19,977 source units           | Material cataloged for research and evaluation, not verified facts.                               |
| 95/97 recordings admitted     | 95 passed strict artifact validation; two finalization failures remain in the record.             |
| Zero leaked browser processes | Three repeated controlled isolation cycles exercising crash, cancellation, and deadline behavior. |

## Iteration workflow

The visible loop describes fixed tests, controlled candidates, independent frontier-model review, and failure-to-regression-to-fix verification. Versioned artifacts, held-out evaluation, source-linked checks, and retained failures are supported by the audited work. It does not disclose private prompts, extraction recipes, provider strategy, or domain learnings. Student feedback is reviewed evidence, not automatically a training label.
