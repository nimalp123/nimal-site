import { Arrow } from "./icons";
import useUsageSnapshot from "./useUsageSnapshot";
import "./tokenmaxxing-card.css";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" });

export default function TokenMaxxingCard() {
  const { snapshot, error, loading } = useUsageSnapshot();
  const activeDays = snapshot?.daily.filter((day) => day.totalTokens > 0 || day.totalCost > 0).length;
  const activeAgents = snapshot?.agents.filter((agent) => agent.totalTokens > 0 || agent.totalCost > 0).length;

  return (
    <section className="compute-preview" id="compute" aria-labelledby="compute-card-title">
      <a className="compute-card" href="/tokenmaxxing" aria-labelledby="compute-card-title compute-card-link">
        <div className="compute-card-top mono"><span><span className="status-dot" />THE COMPUTE BEHIND THE BUILDS</span><span>BUILD → EVALUATE → ITERATE → SHIP</span></div>
        <div className="compute-card-body">
          <div className="compute-card-copy">
            <h2 id="compute-card-title">token<span className="serif-word">maxxing</span><span className="lime">.</span></h2>
            <p>Experiments. Evaluations. Shipped systems.<br />Sustained iteration, with the receipts.</p>
            <span className="compute-card-link" id="compute-card-link">Open the compute ledger <Arrow /></span>
          </div>
          <div className="compute-card-art" aria-hidden="true"><img src="/images/token-compute.webp" alt="" width="1000" height="1000" loading="lazy" /><span className="mono">FIG. 002 / ITERATION AT SCALE</span></div>
          <div className="compute-card-stats" aria-busy={loading}>
            <span className="compute-card-label mono">ESTIMATED API-EQUIVALENT VALUE</span>
            <strong className="compute-card-value">{snapshot ? currency.format(snapshot.totals.totalCost) : "—"}</strong>
            <div className="compute-card-tokens"><strong>{snapshot ? number.format(snapshot.totals.totalTokens) : "—"}</strong><span className="mono">TOKENS PROCESSED · INCLUDES CACHE READS</span></div>
            <span className="compute-card-note mono">API-rate estimate · not invoiced spend</span>
          </div>
        </div>
        <div className="compute-card-bottom mono">
          <span>{snapshot ? <><strong>{number.format(activeDays ?? 0)}</strong> ACTIVE DAYS <b>/</b> <strong>{number.format(activeAgents ?? 0)}</strong> TOOLS</> : loading ? "OPENING THE LEDGER…" : "FULL LEDGER INSIDE"}</span>
          <span>{snapshot ? <>{error ? "LAST AVAILABLE SNAPSHOT" : "SYNCED FROM MY MACBOOK"} <b>/</b> <time dateTime={snapshot.generatedAt}>{date.format(new Date(snapshot.generatedAt))}</time></> : "DAILY USAGE / AGENTS / MODELS"}</span>
        </div>
      </a>
    </section>
  );
}
