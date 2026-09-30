import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { Arrow, Spark } from "./icons";
import "./tokenmaxxing.css";

type Metrics = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
};

type Agent = Metrics & { id: string };
type Day = Metrics & { date: string; agents: Agent[] };
type UsageSnapshot = {
  schemaVersion: 1;
  generatedAt: string;
  timezone: string;
  source: { tool: string; version: string; scope: string };
  coverage: { from: string; through: string };
  pricingGap: { modelCount: number; totalTokens: number };
  totals: Metrics;
  agents: Agent[];
  daily: Day[];
};

type HeatMetric = "tokens" | "cost";
type CalendarCell = { date: string; weekday: number; week: number; day?: Day; available: boolean };

const zeroMetrics: Metrics = {
  inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0,
  cacheReadTokens: 0, totalTokens: 0, totalCost: 0,
};
const metricKeys = Object.keys(zeroMetrics) as (keyof Metrics)[];
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
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function compact(value: number, precision = 2) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(precision)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(precision)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(precision)}K`;
  return fullNumber.format(value);
}

function validMetrics(value: unknown): value is Metrics {
  return typeof value === "object" && value !== null && metricKeys.every((key) => {
    const item = (value as Record<string, unknown>)[key];
    return typeof item === "number" && Number.isFinite(item) && item >= 0;
  });
}

function validAgents(value: unknown): value is Agent[] {
  return Array.isArray(value) && value.every((item) => {
    if (!validMetrics(item)) return false;
    const id = (item as Metrics & { id?: unknown }).id;
    return typeof id === "string" && Object.hasOwn(agentNames, id);
  });
}

function trackedParts(metrics: Metrics) {
  const parts = tokenParts.map((part) => ({ ...part, value: metrics[part.key] }));
  const remainder = Math.max(0, metrics.totalTokens - parts.reduce((sum, part) => sum + part.value, 0));
  return remainder > 0 ? [...parts, { key: "otherTracked", label: "Other tracked", className: "other", value: remainder }] : parts;
}

function readSnapshot(value: unknown): UsageSnapshot {
  const data = value as UsageSnapshot | null;
  if (!data || data.schemaVersion !== 1 || !Number.isFinite(Date.parse(data.generatedAt)) ||
    data.timezone !== "America/Los_Angeles" || !data.source || data.source.tool !== "ccusage" ||
    !data.coverage || !datePattern.test(data.coverage.from) || !datePattern.test(data.coverage.through) ||
    !validMetrics(data.totals) || !validAgents(data.agents) || !Array.isArray(data.daily) ||
    !data.daily.every((day) => validMetrics(day) && datePattern.test(day.date) && validAgents(day.agents)) ||
    !data.pricingGap || !Number.isFinite(data.pricingGap.totalTokens) || data.pricingGap.totalTokens < 0 ||
    !Number.isFinite(data.pricingGap.modelCount) || data.pricingGap.modelCount < 0) {
    throw new Error("Invalid usage snapshot");
  }
  return data;
}

function dateLabel(date: string, long = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: long ? "long" : "short", day: "numeric", year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

function todayInZone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function calendarFor(year: number, snapshot: UsageSnapshot) {
  const days = new Map(snapshot.daily.map((day) => [day.date, day]));
  const first = new Date(Date.UTC(year, 0, 1));
  const offset = first.getUTCDay();
  const end = Date.UTC(year + 1, 0, 1);
  const today = todayInZone(snapshot.timezone);
  const cells: CalendarCell[] = [];
  const months: { label: string; week: number }[] = [];
  let index = 0;
  for (let time = first.getTime(); time < end; time += 86_400_000) {
    const day = new Date(time);
    const date = day.toISOString().slice(0, 10);
    const week = Math.floor((index + offset) / 7);
    if (day.getUTCDate() === 1) months.push({ label: day.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), week });
    cells.push({
      date, weekday: day.getUTCDay(), week, day: days.get(date),
      available: date >= snapshot.coverage.from && date <= snapshot.coverage.through && (date <= today || days.has(date)),
    });
    index++;
  }
  return { cells, months, weeks: Math.ceil((cells.length + offset) / 7) };
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="tm-page">
      <a className="tm-skip" href="#tm-main">Skip to usage ledger</a>
      <div className="tm-shell">
        <header className="tm-header">
          <a href="/" className="tm-wordmark" aria-label="Nimal — back to portfolio"><Spark /> nimal<span>.</span></a>
          <span className="tm-header-label">THE COMPUTE LEDGER</span>
          <a href="/" className="tm-back">Portfolio <Arrow diagonal={false} /></a>
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

function Heatmap({ snapshot }: { snapshot: UsageSnapshot }) {
  const years = Array.from(new Set(snapshot.daily.map((day) => Number(day.date.slice(0, 4))))).sort((a, b) => b - a);
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [metric, setMetric] = useState<HeatMetric>("cost");
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const year = chosenYear && years.includes(chosenYear) ? chosenYear : years[0] ?? Number(snapshot.coverage.through.slice(0, 4));
  const calendar = useMemo(() => calendarFor(year, snapshot), [year, snapshot]);
  const yearDays = snapshot.daily.filter((day) => day.date.startsWith(`${year}-`));
  const picked = calendar.cells.find((cell) => cell.date === pickedDate && cell.available);
  const selectedDate = picked?.date ?? [...yearDays].sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  const selectedDay = picked?.day ?? yearDays.find((day) => day.date === selectedDate);
  const metrics = selectedDay ?? zeroMetrics;
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const scrollContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollContainer.current;
    const button = selectedDate ? buttons.current.get(selectedDate) : undefined;
    if (!container || !button) return;
    const bounds = container.getBoundingClientRect();
    const cell = button.getBoundingClientRect();
    if (cell.right > bounds.right) container.scrollLeft += cell.right - bounds.right + 8;
    else if (cell.left < bounds.left) container.scrollLeft -= bounds.left - cell.left + 8;
  }, [selectedDate]);
  const positives = yearDays.map((day) => metric === "tokens" ? day.totalTokens : day.totalCost).filter((value) => value > 0).sort((a, b) => a - b);
  const thresholds = [0.25, 0.5, 0.75].map((point) => positives[Math.floor((positives.length - 1) * point)] ?? 0);
  const level = (day?: Day) => {
    const value = day ? metric === "tokens" ? day.totalTokens : day.totalCost : 0;
    return value <= 0 ? 0 : value <= thresholds[0] ? 1 : value <= thresholds[1] ? 2 : value <= thresholds[2] ? 3 : 4;
  };
  const yearTokens = yearDays.reduce((sum, day) => sum + day.totalTokens, 0);
  const yearCost = yearDays.reduce((sum, day) => sum + day.totalCost, 0);
  const activeDays = yearDays.filter((day) => day.totalTokens > 0).length;
  const peaks = [...yearDays].sort((a, b) => metric === "tokens" ? b.totalTokens - a.totalTokens : b.totalCost - a.totalCost).filter((day) => day.totalTokens > 0).slice(0, 3);

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, cell: CalendarCell) {
    const shifts: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    let index = calendar.cells.indexOf(cell);
    if (Object.hasOwn(shifts, event.key)) index += shifts[event.key];
    else if (event.key === "Home") index = calendar.cells.findIndex((entry) => entry.available);
    else if (event.key === "End") index = calendar.cells.findLastIndex((entry) => entry.available);
    else return;
    event.preventDefault();
    const next = calendar.cells[index];
    if (next?.available) {
      setPickedDate(next.date);
      buttons.current.get(next.date)?.focus();
    }
  }

  return (
    <section className="tm-activity" aria-labelledby="tm-activity-title">
      <div className="tm-section-heading">
        <div><span className="tm-kicker">01 / THE DAILY PRACTICE</span><h2 id="tm-activity-title">Daily compute. <i>Visible.</i></h2></div>
        <div className="tm-chart-controls">
          <div className="tm-toggle" role="group" aria-label="Heatmap metric">
            <button aria-pressed={metric === "tokens"} onClick={() => setMetric("tokens")}>Tokens</button>
            <button aria-pressed={metric === "cost"} onClick={() => setMetric("cost")}>API value</button>
          </div>
          <label className="tm-year"><span className="tm-sr-only">Heatmap year</span><select value={year} onChange={(event) => { setChosenYear(Number(event.target.value)); setPickedDate(null); }}>{(years.length ? years : [year]).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        </div>
      </div>
      <div className="tm-chart-topline"><span>{compact(yearTokens)} TOKENS <b>/</b> {usd.format(yearCost)} API-EQUIVALENT</span><span>{activeDays} ACTIVE DAYS IN {year}</span></div>
      <div ref={scrollContainer} className="tm-heatmap-scroll" tabIndex={0} role="region" aria-label={`${year} daily usage heatmap. Scroll horizontally on small screens. Arrow keys navigate days when a day is focused.`}>
        <div className="tm-heatmap" style={{ "--tm-weeks": calendar.weeks } as CSSProperties}>
          <div className="tm-months" aria-hidden="true">{calendar.months.map((month) => <span key={month.label} style={{ gridColumn: month.week + 1 }}>{month.label}</span>)}</div>
          <div className="tm-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
          <div className="tm-cells">
            {calendar.cells.map((cell) => cell.available ? (
              <button
                key={cell.date}
                ref={(node) => { if (node) buttons.current.set(cell.date, node); else buttons.current.delete(cell.date); }}
                className={`tm-cell tm-level-${level(cell.day)}${selectedDate === cell.date ? " tm-cell-selected" : ""}`}
                style={{ gridColumn: cell.week + 1, gridRow: cell.weekday + 1 }}
                aria-label={`${dateLabel(cell.date, true)}: ${fullNumber.format(cell.day?.totalTokens ?? 0)} tokens, ${usd.format(cell.day?.totalCost ?? 0)} estimated API value. Select for details.`}
                aria-pressed={selectedDate === cell.date}
                title={`${dateLabel(cell.date)} · ${compact(cell.day?.totalTokens ?? 0)} tokens · ${usd.format(cell.day?.totalCost ?? 0)} API value`}
                tabIndex={selectedDate === cell.date ? 0 : -1}
                onClick={() => setPickedDate(cell.date)}
                onKeyDown={(event) => moveFocus(event, cell)}
              />
            ) : <span key={cell.date} className="tm-cell tm-cell-outside" style={{ gridColumn: cell.week + 1, gridRow: cell.weekday + 1 }} title={`${dateLabel(cell.date)}: outside snapshot coverage`} />)}
          </div>
        </div>
      </div>
      <div className="tm-chart-caption"><span>Select a day to inspect its receipts.</span><div className="tm-legend" aria-label="Heatmap legend: dimmer squares are lower usage; brighter squares are higher usage"><span>Less</span>{[0, 1, 2, 3, 4].map((intensity) => <span className={`tm-legend-cell tm-level-${intensity}`} key={intensity} />)}<span>More</span></div></div>
      <div className="tm-day-detail" aria-live="polite" aria-atomic="true">
        <div className="tm-day-title"><span className="tm-kicker">SELECTED DAY</span><strong>{selectedDate ? dateLabel(selectedDate) : "No recorded days"}</strong><span>{selectedDay?.agents.filter((agent) => agent.totalTokens > 0).map((agent) => agentNames[agent.id]).join(" / ") || "No recorded usage"}</span></div>
        <div className="tm-day-number"><span>TOTAL TOKENS</span><strong>{compact(metrics.totalTokens)}</strong><small>{fullNumber.format(metrics.totalTokens)} tokens</small></div>
        <div className="tm-day-number"><span>API-EQUIVALENT VALUE</span><strong>{usd.format(metrics.totalCost)}</strong><small>Estimated · not invoiced spend</small></div>
        <div className="tm-day-parts">{trackedParts(metrics).map((part) => <div key={part.key}><span>{part.label}</span><strong>{compact(part.value)}</strong></div>)}</div>
      </div>
      {peaks.length > 0 && <div className="tm-peaks"><span className="tm-kicker">PEAK DAYS / {metric === "tokens" ? "TOKENS" : "API VALUE"}</span>{peaks.map((day, index) => <button key={day.date} onClick={() => setPickedDate(day.date)} aria-label={`Inspect peak day ${dateLabel(day.date)}`}><span className="tm-peak-rank">0{index + 1}</span><span>{dateLabel(day.date)}</span><strong>{metric === "tokens" ? compact(day.totalTokens) : usd.format(day.totalCost)}</strong><Arrow /></button>)}</div>}
    </section>
  );
}

export default function TokenMaxxing() {
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const activeRequest = useRef<AbortController | null>(null);
  const snapshotRef = useRef<UsageSnapshot | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    if (!snapshotRef.current) setLoading(true);
    try {
      const response = await fetch(`/data/token-usage.json?t=${Math.floor(Date.now() / 60_000)}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Snapshot unavailable");
      const data = readSnapshot(await response.json());
      if (mounted.current && !controller.signal.aborted) {
        snapshotRef.current = data;
        setSnapshot(data);
        setError(false);
      }
    } catch {
      if (mounted.current && !controller.signal.aborted) setError(true);
    } finally {
      if (mounted.current && !controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60_000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { mounted.current = false; activeRequest.current?.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);

  if (!snapshot) return <PageFrame><main id="tm-main" className="tm-empty" aria-busy={loading}><span className="tm-kicker">NIMAL / TOKENMAXXING</span><h1>The compute<br /><i>behind the builds.</i></h1>{loading ? <p role="status">Opening the usage ledger<span className="tm-loading-dots" aria-hidden="true">…</span></p> : <><p role="alert">The usage ledger is temporarily unavailable.</p><button className="tm-retry" onClick={() => void refresh()}>Try again <Arrow diagonal={false} /></button></>}</main></PageFrame>;

  const activeDays = snapshot.daily.filter((day) => day.totalTokens > 0).length;
  const activeAgents = snapshot.agents.filter((agent) => agent.totalTokens > 0).sort((a, b) => b.totalTokens - a.totalTokens);
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
        <section className="tm-hero" aria-labelledby="tm-title">
          <div className="tm-hero-eyebrow"><span className="tm-kicker">NIMAL / LOCAL CLI USAGE</span><span className="tm-sync"><span aria-hidden="true" />LAST SYNCED {synced}</span></div>
          <div className="tm-title-row"><h1 id="tm-title">token<i>maxxing.</i></h1><span className="tm-hero-side">THE COMPUTE<br />BEHIND THE BUILDS.<Arrow /></span></div>
          <div className="tm-hero-metrics">
            <div className="tm-primary-metric"><span className="tm-kicker">TOTAL TOKENS PROCESSED</span><strong>{compact(total.totalTokens)}<span aria-hidden="true">↗</span></strong><p>{fullNumber.format(total.totalTokens)} tokens · includes cache reads</p></div>
            <div className="tm-value-metric"><span className="tm-kicker">ESTIMATED API-EQUIVALENT VALUE</span><strong>{usd.format(total.totalCost)}</strong><p>Usage valued at API rates.<br />Not invoiced spend.</p></div>
          </div>
          <div className="tm-hero-facts"><div><strong>{activeDays}</strong><span>ACTIVE DAYS</span></div><div><strong>{activeAgents.length}</strong><span>AGENTS IN THE MIX</span></div><div><strong>{compact(activeDays ? total.totalTokens / activeDays : 0, 1)}</strong><span>TOKENS / ACTIVE DAY</span></div><span className="tm-coverage">{dateLabel(snapshot.coverage.from)}<Arrow diagonal={false} />{dateLabel(snapshot.coverage.through)}</span></div>
          {error && <p className="tm-refresh-error" role="status">Showing the last successful snapshot. Latest refresh failed. <button onClick={() => void refresh()}>Retry refresh <Arrow diagonal={false} /></button></p>}
        </section>

        <Heatmap snapshot={snapshot} />

        <div className="tm-breakdown-grid">
          <section className="tm-token-mix" aria-labelledby="tm-mix-title">
            <span className="tm-kicker">02 / UNDER THE HOOD</span><h2 id="tm-mix-title">What counts<br />as a token.</h2>
            <div className="tm-composition-bar" role="img" aria-label={trackedParts(total).map((part) => `${part.label}: ${shareLabel(part.value)}`).join(". ")}>{trackedParts(total).filter((part) => part.value > 0).map((part) => <span className={`tm-part-${part.className}`} key={part.key} style={{ width: `${tokenShare(part.value)}%` }} />)}</div>
            <div className="tm-composition-rows">{trackedParts(total).map((part) => <div key={part.key}><span><i className={`tm-part-${part.className}`} />{part.label}</span><strong>{compact(part.value)}</strong><small>{shareLabel(part.value)}</small></div>)}</div>
            <p className="tm-section-note">Cache reads are reused context, not newly generated output. The total also preserves any other tokens reported by the usage ledger.</p>
          </section>

          <section className="tm-agent-mix" aria-labelledby="tm-agents-title">
            <div className="tm-agent-heading"><div><span className="tm-kicker">03 / THE TOOLCHAIN</span><h2 id="tm-agents-title">Agent mix.</h2></div><span className="tm-agent-heading-label">TOKENS / API VALUE</span></div>
            <div className="tm-agent-rows">{activeAgents.map((agent, index) => <div className="tm-agent-row" key={agent.id}><div className="tm-agent-name"><span>{String(index + 1).padStart(2, "0")}</span><strong>{agentNames[agent.id]}</strong></div><div className="tm-agent-numbers"><strong>{compact(agent.totalTokens)}</strong><span>{usd.format(agent.totalCost)}</span></div><div className="tm-agent-bar" aria-hidden="true"><span style={{ width: `${activeAgents[0].totalTokens > 0 ? agent.totalTokens / activeAgents[0].totalTokens * 100 : 0}%` }} /></div></div>)}</div>
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
