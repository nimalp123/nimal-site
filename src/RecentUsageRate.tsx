import type { UsageSnapshot } from "./tokenmaxxing-types";
import { recentDailyAverage } from "./token-heatmap-utils.mjs";
import "./recent-usage-rate.css";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });

export default function RecentUsageRate({ snapshot, compact = false }: { snapshot: UsageSnapshot | null; compact?: boolean }) {
  const rate = snapshot ? recentDailyAverage(snapshot) : null;
  return (
    <div className={`usage-rate${compact ? " usage-rate-compact" : ""}`} role="region" aria-label="Average usage for the latest three full days">
      <span className="usage-rate-label">Daily average of last 3 days</span>
      <div className="usage-rate-metrics">
        <div className="usage-rate-cost"><strong>{rate ? currency.format(rate.costPerDay) : "—"}</strong><span>/ day</span></div>
        <div className="usage-rate-tokens"><strong>{rate ? number.format(rate.tokensPerDay) : "—"}</strong><span>tokens / day</span></div>
      </div>
      <span className="usage-rate-period">{rate ? <><time dateTime={rate.from}>{date.formatRange(new Date(`${rate.from}T12:00:00Z`), new Date(`${rate.through}T12:00:00Z`))}</time> · Pacific time</> : snapshot ? "Waiting for three complete days." : "Most recent three complete Pacific days"}</span>
    </div>
  );
}
