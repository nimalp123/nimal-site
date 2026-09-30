import { useState } from "react";
import type { UsageSnapshot } from "./tokenmaxxing-types";
import RecentUsageRate from "./RecentUsageRate";
import "./tokenmaxxing-hero.css";

type HeroProps = {
  snapshot: UsageSnapshot;
  refreshError?: boolean;
  onRetry?: () => void;
};

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC", month: "short", day: "numeric", year: "numeric",
});

function coverageDate(value: string) {
  return date.format(new Date(`${value}T12:00:00Z`));
}

export default function TokenMaxxingHero({ snapshot, refreshError = false, onRetry }: HeroProps) {
  const [motionPaused, setMotionPaused] = useState(false);
  const activeDays = snapshot.daily.filter((day) => day.totalTokens > 0).length;
  const activeAgents = snapshot.agents.filter((agent) => agent.totalTokens > 0).length;
  const syncTime = new Intl.DateTimeFormat("en-US", {
    timeZone: snapshot.timezone, month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(snapshot.generatedAt));

  return (
    <section className="tm-compute-hero" aria-labelledby="tm-title">
      <div className="tm-compute-intro">
        <div className="tm-compute-copy">
          <span className="tm-compute-kicker"><span aria-hidden="true" />NIMAL / THE COMPUTE BEHIND THE BUILDS</span>
          <h1 id="tm-title">token<i>maxxing</i><span>.</span></h1>
          <p className="tm-compute-description">The daily practice, in numbers.</p>

          <div className="tm-compute-value">
            <span className="tm-compute-label">ESTIMATED API-EQUIVALENT VALUE</span>
            <strong>{currency.format(snapshot.totals.totalCost)}</strong>
            <p>Usage valued at API rates · not invoiced spend</p>
          </div>
          <div className="tm-compute-tokens">
            <span className="tm-compute-label">TOTAL TOKENS PROCESSED</span>
            <strong>{integer.format(snapshot.totals.totalTokens)}</strong>
            <p>Exact count · includes cache reads</p>
          </div>
          <RecentUsageRate snapshot={snapshot} />
        </div>

        <figure className={`tm-compute-art${motionPaused ? " tm-compute-art-paused" : ""}`}>
          <span className="tm-compute-coordinate" aria-hidden="true">LOCAL → AGGREGATED</span>
          <span className="tm-compute-cross tm-compute-cross-one" aria-hidden="true">+</span>
          <img src="/images/token-compute.webp" alt="" width="1000" height="1000" className="tm-compute-sculpture" fetchPriority="high" />
          <span className="tm-compute-cross tm-compute-cross-two" aria-hidden="true">+</span>
          <figcaption className="tm-compute-art-caption">BUILD. MEASURE. ITERATE.</figcaption>
          <button className="tm-compute-motion" aria-pressed={motionPaused} aria-label={motionPaused ? "Resume graphic animation" : "Pause graphic animation"} onClick={() => setMotionPaused((paused) => !paused)}>
            <span aria-hidden="true">{motionPaused ? "▶" : "Ⅱ"}</span>{motionPaused ? "Resume motion" : "Pause motion"}
          </button>
        </figure>
      </div>

      <div className="tm-compute-facts">
        <div><strong>{integer.format(activeDays)}</strong><span>ACTIVE DAYS</span></div>
        <div><strong>{integer.format(activeAgents)}</strong><span>TOOLS IN THE MIX</span></div>
        <span className="tm-compute-range"><time dateTime={snapshot.coverage.from}>{coverageDate(snapshot.coverage.from)}</time><span aria-hidden="true">→</span><time dateTime={snapshot.coverage.through}>{coverageDate(snapshot.coverage.through)}</time></span>
        <span className="tm-compute-synced">LAST SYNCED <time dateTime={snapshot.generatedAt}>{syncTime}</time></span>
      </div>
      {refreshError && <p className="tm-compute-refresh-error" role="status">Showing the last successful snapshot. Latest refresh failed.{onRetry && <button onClick={onRetry}>Retry refresh <span aria-hidden="true">↗</span></button>}</p>}
    </section>
  );
}
