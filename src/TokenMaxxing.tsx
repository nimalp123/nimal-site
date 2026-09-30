import type { ReactNode } from "react";
import type { UsageMetrics as Metrics } from "./tokenmaxxing-types";
import useUsageSnapshot from "./useUsageSnapshot";
import TokenMaxxingHero from "./TokenMaxxingHero";
import TokenUsageHeatmap from "./TokenUsageHeatmap";
import { Arrow, Spark } from "./icons";
import "./tokenmaxxing.css";

const agentNames: Record<string, string> = {
  claude: "Claude", codex: "Codex", antigravity: "Antigravity", grok: "Grok",
  hermes: "Hermes", kimi: "Kimi", opencode: "OpenCode", other: "Other",
};
const tokenParts = [
  { key: "cacheReadTokens", label: "Cache reads", className: "cache-read" },
  { key: "outputTokens", label: "Output", className: "output" },
  { key: "cacheCreationTokens", label: "Cache creation", className: "cache-create" },
  { key: "inputTokens", label: "Input", className: "input" },
] as const;
const fullNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function compact(value: number, precision = 2) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(precision)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(precision)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(precision)}K`;
  return fullNumber.format(value);
}

function trackedParts(metrics: Metrics) {
  const parts = tokenParts.map((part) => ({ ...part, value: metrics[part.key] }));
  const remainder = Math.max(0, metrics.totalTokens - parts.reduce((sum, part) => sum + part.value, 0));
  return remainder > 0 ? [...parts, { key: "otherTracked", label: "Other tracked", className: "other", value: remainder }] : parts;
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="tm-page">
      <a className="tm-skip" href="#tm-main">Skip to usage ledger</a>
      <div className="page-shell tm-shell">
        <header className="tm-header">
          <a href="/" className="wordmark tm-wordmark" aria-label="Nimal — back to portfolio"><Spark /><span>NIMAL<span className="wordmark-dot">.</span></span></a>
          <span className="tm-header-label">THE COMPUTE LEDGER</span>
          <nav className="tm-header-nav" aria-label="Compute ledger navigation"><a href="#usage-ledger" className="tm-ledger-link">Usage ledger ↓</a><a href="/" className="tm-back">Portfolio <Arrow diagonal={false} /></a></nav>
        </header>
        {children}
        <footer className="tm-footer">
          <a href="/">Nimal Periasamy <Arrow /></a>
          <span>BUILD. MEASURE. ITERATE.</span>
          <a href="https://github.com/nimalp123" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
        </footer>
      </div>
    </div>
  );
}

export default function TokenMaxxing() {
  const { snapshot, error, loading, refresh } = useUsageSnapshot();

  if (!snapshot) return <PageFrame><main id="tm-main" className="tm-empty" aria-busy={loading}><span className="tm-kicker">NIMAL / TOKENMAXXING</span><h1>The compute<br /><i>behind the builds.</i></h1>{loading ? <p role="status">Opening the usage ledger<span className="tm-loading-dots" aria-hidden="true">…</span></p> : <><p role="alert">The usage ledger is temporarily unavailable.</p><button className="tm-retry" onClick={() => void refresh()}>Try again <Arrow diagonal={false} /></button></>}</main></PageFrame>;

  const activeAgents = snapshot.agents.filter((agent) => agent.totalTokens > 0).sort((a, b) => b.totalCost - a.totalCost);
  const total = snapshot.totals;
  const synced = new Intl.DateTimeFormat("en-US", { timeZone: snapshot.timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(snapshot.generatedAt));
  const tokenShare = (value: number) => total.totalTokens > 0 ? value / total.totalTokens * 100 : 0;
  const shareLabel = (value: number) => {
    const share = tokenShare(value);
    return share > 0 && share < 0.1 ? "<0.1%" : `${share.toFixed(1)}%`;
  };

  return (
    <PageFrame>
      <main id="tm-main">
        <TokenMaxxingHero snapshot={snapshot} refreshError={error} onRetry={() => void refresh()} />

        <TokenUsageHeatmap snapshot={snapshot} />

        <div className="tm-breakdown-grid">
          <section className="tm-token-mix" aria-labelledby="tm-mix-title">
            <span className="tm-kicker">02 / UNDER THE HOOD</span><h2 id="tm-mix-title">What counts<br />as a token.</h2>
            <div className="tm-composition-bar" role="img" aria-label={trackedParts(total).map((part) => `${part.label}: ${shareLabel(part.value)}`).join(". ")}>{trackedParts(total).filter((part) => part.value > 0).map((part) => <span className={`tm-part-${part.className}`} key={part.key} style={{ width: `${tokenShare(part.value)}%` }} />)}</div>
            <div className="tm-composition-rows">{trackedParts(total).map((part) => <div key={part.key}><span><i className={`tm-part-${part.className}`} />{part.label}</span><strong>{fullNumber.format(part.value)}</strong><small>{shareLabel(part.value)}</small></div>)}</div>
            <p className="tm-section-note">Cache reads are reused context, not newly generated output. The total also preserves any other tokens reported by the usage ledger.</p>
          </section>

          <section className="tm-agent-mix" aria-labelledby="tm-agents-title">
            <div className="tm-agent-heading"><div><span className="tm-kicker">03 / THE TOOLCHAIN</span><h2 id="tm-agents-title">Agent mix.</h2></div><span className="tm-agent-heading-label">API VALUE / TOKENS</span></div>
            <div className="tm-agent-rows">{activeAgents.map((agent, index) => <div className="tm-agent-row" key={agent.id}><div className="tm-agent-name"><span>{String(index + 1).padStart(2, "0")}</span><strong>{agentNames[agent.id]}</strong></div><div className="tm-agent-numbers"><strong>{usd.format(agent.totalCost)}</strong><span>{fullNumber.format(agent.totalTokens)} tokens</span></div><div className="tm-agent-bar" aria-hidden="true"><span style={{ width: `${activeAgents[0].totalCost > 0 ? agent.totalCost / activeAgents[0].totalCost * 100 : 0}%` }} /></div></div>)}</div>
          </section>
        </div>

        <section className="tm-source" aria-labelledby="tm-source-title">
          <div><span className="tm-kicker">04 / THE FINE PRINT</span><h2 id="tm-source-title">Real logs.<br /><i>Clear scope.</i></h2></div>
          <div className="tm-source-copy"><p>Aggregated local CLI usage from my MacBook, collected with <strong>ccusage</strong>. The ledger updates as new snapshots arrive from the Mac.</p><p>Dollar figures use recorded usage and API pricing; actual plan charges can differ. Tokens include input, output, cache creation, cache reads, and other reported usage.</p>{snapshot.pricingGap.totalTokens > 0 && <p className="tm-pricing-gap">{compact(snapshot.pricingGap.totalTokens)} tracked tokens across {snapshot.pricingGap.modelCount} unpriced models contribute $0 to the estimate. The dollar total is incomplete.</p>}<div className="tm-source-meta"><span>LAST SYNCED <time dateTime={snapshot.generatedAt}>{synced}</time></span><span>TIMEZONE / PACIFIC</span></div></div>
        </section>
      </main>
    </PageFrame>
  );
}
