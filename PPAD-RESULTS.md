# PPAD / the receipts

Pledge Capital is a Solana launchpad and fixed-term lending project I built with my team. This page combines previously published engineering checkpoints with publicly accessible product and on-chain evidence.

## Published engineering checkpoints

| Receipt | Measurement scope |
| :--- | :--- |
| **393 release tests passed** | Previously published website/read-API checkpoint; two intentional legacy-validator tests skipped. |
| **36 compiled-program tests passed** | Previously published production-identity lending artifact checkpoint; lifecycle, adversarial and bootstrap checks. Separate from the website/API suite. |
| **39 reconciled test transactions** | Previously published disposable-validator rehearsal across SPL Token and Token-2022, including repayment, default and cleanup. Test activity. |

These are historical checkpoints already published in the [portfolio repository](https://github.com/nimalp123/nimal-site/blob/06b2228cbfef8aad9be8498cfafcce9fd7d4cf25/PPAD-RESULTS.md). They are separate recorded runs, overlap in scope, and are not added into a combined total or presented as a current test total.

## On-chain / fees received

| Recorded outcome | Measurement scope |
| :--- | :--- |
| **23.929338253 SOL creator fees** | Creator-fee transfers reported by the public finalized fee ledger. |
| **0.04 SOL launch fees** | Platform launch-fee transfers, tracked separately from creator fees. |
| **24 finalized fee transactions** | Unique signatures contributing positive amounts to those totals. |

Read without authentication from the [public fee ledger](https://ppad.fun/api/launch/fees) on October 1, 2026 at 23:32 Pacific. The returned receipt amounts sum to the reported totals; the scan reported 94 reconciled transactions, zero pending receipts, and complete provider coverage. These figures measure cumulative treasury fee inflows, not current balance, net profit, personal income, or completed lending volume.

## Public product

| Capability | Public evidence |
| :--- | :--- |
| Wallet-approved token creation | The [launch status API](https://ppad.fun/api/launch/status) reports artwork uploads, an optional first buy, and creator fee sharing enabled. |
| Immutable creator fee sharing | [PPAD's Documentation page](https://ppad.fun) explains creator-selected percentages, locked recipients, and direct Pump payouts. |
| Fixed-term collateral-backed lending | The [public product](https://ppad.fun) explains funded SOL offers, repayment to unlock collateral, and delivery of collateral to the lender at default. |
| Inspectable transactions | The public integration guide describes account, term, fee and expiry review, plus reconciliation of uncertain signatures. |
| Public market data | The documentation links read-only status, mint, market, offer, loan and treasury APIs. |
| Deployed release | The [public release evidence](https://ppad.fun/api/production/release-evidence) reports v0.3.0 and matching artifact/deployed-code hashes. |
| Official token | The public documentation names the [official $PPAD mint](https://solscan.io/token/2Pj812u3RsfRT3mirFNNdGXZBMSFFnMjw6EjF7iwc1Ev). |

Release identity and current lending availability are separate signals. The [treasury snapshot](https://ppad.fun/api/production/treasury-snapshot) reported the protocol unpaused with new lending open for admitted collateral at this snapshot; the release manifest separately reports submission disabled until verification. Availability should be checked in the live product rather than inferred from a version number.
