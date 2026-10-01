# PPAD / the receipts

Pledge Capital is a Solana launchpad and fixed-term lending project I built with my team. These are recorded engineering checkpoints from October 1, 2026.

| Receipt | Measurement scope |
| :--- | :--- |
| **393 release tests passed** | Recorded build of the deployed website/read-API source checkpoint. Two intentional legacy-validator tests skipped. |
| **36 compiled-program tests passed** | Exact production-identity lending artifact: lifecycle, adversarial and bootstrap checks. Separate from the website/API suite. |
| **39 reconciled transactions** | Disposable test-validator rehearsal across SPL Token and Token-2022, including repayment, default and cleanup. Not mainnet activity or customer volume. |
| **2 supported token programs** | SPL Token and Token-2022; support is subject to exact mint admission and the supported extension rules. |
| **12 contract instructions** | Lending v0.2 interface, covering administration, markets, offers, borrowing, settlement and exposure cleanup. |

The suites overlap in scope and are not added into a combined test total. Test counts describe recorded runs, not an independent rerun during this portfolio update.

The work spans Rust/Anchor custody, a typed transaction client, canonical transaction validation, uncertain-confirmation recovery, artifact-pinned release verification, bounded RPC infrastructure and a responsive product interface.

**Release status:** [ppad.fun](https://ppad.fun) hosts the website and verified read API. The [v0.2 lending program is deployed on Solana mainnet](https://solscan.io/account/6tpjRPuCqcoURmXzEPKgoHm16r2HZZZu1btbaPiqK1bm), with new lending paused at this checkpoint. Public lending activation, token creation, automatic valuation and fee routing remain pending. These are internal engineering checks, not an external audit.
