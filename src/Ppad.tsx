import { Arrow } from "./icons";
import "./ppad.css";

const receipts = [
  { value: "393", label: "release tests passed", scope: "Recorded release build · 2 intentional skips" },
  { value: "36", label: "compiled-program tests", scope: "Passed against the exact production artifact" },
  { value: "39", label: "reconciled transactions", scope: "Disposable validator · not mainnet volume" },
];

const engineering = [
  { title: "Custody, end to end.", detail: "SOL escrow → collateral → borrow → repay or settle. Rust / Anchor, across SPL Token and Token-2022." },
  { title: "Verify before signing.", detail: "Canonical transaction checks, fresh release evidence, exact fees, and recovery when confirmation is uncertain." },
  { title: "Review → regression → release.", detail: "Adversarial cases, compiled-program tests, reproducible artifact checks, and reconciled transaction receipts." },
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
          <p className="ppad-deck">A Solana launchpad and fixed-term lending system. The product, the protocol, and the verification around both.</p>
          <div className="ppad-tags mono"><span>RUST / ANCHOR</span><span>TYPESCRIPT</span><span>SOLANA</span></div>
          <a className="button button-lime" href="https://ppad.fun" target="_blank" rel="noopener noreferrer">Explore PPAD <Arrow /></a>
          <p className="ppad-status"><span className="status-dot" />Website + verified read API live.<br />Lending program deployed on mainnet; new lending paused.</p>
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

      <div className="ppad-engineering">
        {engineering.map((item, index) => (
          <div key={item.title}><span className="mono lime">0{index + 1}</span><h3>{item.title}</h3><p>{item.detail}</p></div>
        ))}
      </div>
      <div className="ppad-footnote mono">
        <span>OCT 1, 2026 CHECKPOINT · SEPARATE TEST SCOPES</span>
        <span>Public lending + token creation remain pending.</span>
      </div>
    </section>
  );
}
