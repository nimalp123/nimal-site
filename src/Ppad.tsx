import { Arrow } from "./icons";
import "./ppad.css";

const receipts = [
  { value: "393", label: "recorded release tests", scope: "Previously published checkpoint · 2 skips" },
  { value: "36", label: "compiled-program tests", scope: "Published production-artifact checkpoint" },
  { value: "39", label: "reconciled test transactions", scope: "Published validator run · not mainnet volume" },
];

const engineering = [
  { title: "Launch, end to end.", detail: "Artwork → wallet approval → token creation → optional first buy. Creator fee sharing with an immutable, wallet-approved split." },
  { title: "Capital, on-chain.", detail: "Individually funded SOL offers. Fixed repayment terms. Token collateral returned on repayment or delivered to the lender at default." },
  { title: "Make it inspectable.", detail: "Review accounts, terms, fees and expiry before signing. Public market APIs and linked transaction receipts make the product inspectable." },
];

const buildDetails = [
  { title: "Launch workspace", detail: "Token artwork and metadata, an optional first buy, disclosed costs, and a separate wallet review before submission" },
  { title: "Creator fee sharing", detail: "Creator-selected percentages, locked recipients, and direct Pump payouts to each recipient" },
  { title: "Lending lifecycle", detail: "Fund an offer → pledge tokens → repay to unlock collateral, or settle to the lender at default" },
  { title: "Wallet review", detail: "Verify the accounts, exact terms, fees and expiry; reconcile an uncertain signature before starting another transaction" },
  { title: "Public data", detail: "Read-only APIs for release status, admitted mints, markets, funded offers, loan records and treasury snapshots" },
  { title: "Treasury receipts", detail: "Creator fees and launch fees tracked separately, with exact SOL amounts and public transaction links" },
  { title: "Product", detail: "Launches, Lending and My vault — one interface across token creation, financing and wallet positions" },
  { title: "Published engineering", detail: "Rust / Anchor + TypeScript; 393 recorded release tests, 36 compiled-program tests and 39 validator transactions. Historical checkpoints, separate scopes." },
];

export default function Ppad() {
  return (
    <section className="ppad-section section" id="ppad" aria-labelledby="ppad-title">
      <div className="ppad-heading">
        <div>
          <p className="eyebrow">01 / PPAD — FULL-STACK + PROTOCOL ENGINEERING</p>
          <h2 id="ppad-title">Pledge Capital<span className="lime">.</span></h2>
          <p className="ppad-subtitle">From interface to <span className="serif-word">infrastructure.</span></p>
        </div>
        <span className="ppad-team mono">BUILT WITH MY TEAM</span>
      </div>

      <div className="ppad-feature">
        <div className="ppad-copy">
          <p className="ppad-deck">Token launches. Creator fee sharing. Collateral-backed lending on Solana. Built with my team, from interface to protocol.</p>
          <div className="ppad-tags mono"><span>RUST / ANCHOR</span><span>TYPESCRIPT</span><span>SOLANA</span></div>
          <a className="button button-lime" href="https://ppad.fun" target="_blank" rel="noopener noreferrer">Explore PPAD <Arrow /></a>
          <p className="ppad-status"><span className="status-dot" />Wallet-approved launches + creator fee sharing.<br />Collateral-backed lending on Solana mainnet.<br /><a href="https://solscan.io/token/2Pj812u3RsfRT3mirFNNdGXZBMSFFnMjw6EjF7iwc1Ev" target="_blank" rel="noopener noreferrer">Official $PPAD token ↗</a></p>
        </div>
        <a className="ppad-preview" href="https://ppad.fun" target="_blank" rel="noopener noreferrer" aria-label="Open PPAD at ppad.fun">
          <img src="/images/ppad-preview.webp" alt="Pledge Capital's chrome pi identity on graphite with flowing violet light." width="1200" height="630" loading="lazy" />
          <span className="ppad-preview-caption mono"><span>PPAD.FUN / OPEN THE PRODUCT</span><Arrow /></span>
        </a>
      </div>

      <div className="ppad-receipts">
        {receipts.map((receipt) => (
          <div className="ppad-receipt" key={receipt.label}>
            <strong>{receipt.value}</strong><h3>{receipt.label}</h3><p className="mono">{receipt.scope}</p>
          </div>
        ))}
      </div>

      <div className="ppad-outcomes" aria-label="Recorded on-chain fee outcomes">
        <p className="mono ppad-outcomes-label">ON-CHAIN / FEES RECEIVED</p>
        <dl>
          <div><dt>Creator fees · SOL</dt><dd>23.929338253</dd></div>
          <div><dt>Launch fees · SOL</dt><dd>0.04</dd></div>
          <div><dt>Finalized fee transactions</dt><dd>24</dd></div>
        </dl>
        <p className="mono ppad-outcomes-note">Treasury inflows · Oct 1 snapshot · <a href="https://ppad.fun/api/launch/fees" target="_blank" rel="noopener noreferrer">Open the public receipts ↗</a></p>
      </div>

      <div className="ppad-engineering">
        {engineering.map((item, index) => (
          <div key={item.title}><span className="mono lime">0{index + 1}</span><h3>{item.title}</h3><p>{item.detail}</p></div>
        ))}
      </div>
      <details className="ppad-build">
        <summary className="mono">INSIDE THE BUILD <span aria-hidden="true">+</span></summary>
        <dl>
          {buildDetails.map((item) => (
            <div key={item.title}><dt>{item.title}</dt><dd>{item.detail}</dd></div>
          ))}
        </dl>
      </details>
      <div className="ppad-footnote mono">
        <span>PUBLISHED ENGINEERING CHECKPOINTS · SEPARATE TEST SCOPES</span>
        <span>PUBLIC PRODUCT · PUBLIC ON-CHAIN RECEIPTS</span>
      </div>
    </section>
  );
}
