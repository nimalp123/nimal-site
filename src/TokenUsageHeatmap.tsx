import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { UsageSnapshot } from "./tokenmaxxing-types";
import { Arrow } from "./icons";
import { aggregateUsage, calendarFor, heatmapBands, heatmapLevel, keyboardTarget, latestRecordedDate, previousDayUsage, shiftDate, todayInZone, usageDelta, weeklyKeyboardTarget, weeklyUsage } from "./token-heatmap-utils.mjs";
import type { CalendarCell, HeatMetric, UsageWeek } from "./token-heatmap-utils.mjs";
import "./token-heatmap.css";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const agents: Record<string, string> = {
  claude: "Claude", codex: "Codex", antigravity: "Antigravity", grok: "Grok", hermes: "Hermes", kimi: "Kimi", opencode: "OpenCode", other: "Other",
};
const parts = [
  { key: "inputTokens", label: "Input" },
  { key: "outputTokens", label: "Output" },
  { key: "cacheCreationTokens", label: "Cache writes" },
  { key: "cacheReadTokens", label: "Cache reads" },
] as const;

function dateLabel(date: string, long = false) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: long ? "long" : "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}

function weekLabel(week: UsageWeek) {
  const format = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
  return format.formatRange(new Date(`${week.start}T12:00:00Z`), new Date(`${week.end}T12:00:00Z`));
}

function Delta({ value, baseline, money = false }: { value: number; baseline: number | undefined; money?: boolean }) {
  if (baseline === undefined) return <span className="th-delta th-delta-empty">No earlier coverage</span>;
  const { difference, percent: change } = usageDelta(value, baseline);
  const direction = difference > 0 ? "+" : difference < 0 ? "−" : "";
  return <span className={`th-delta${difference > 0 ? " th-delta-up" : ""}`}>
    {direction}{money ? usd.format(Math.abs(difference)) : number.format(Math.abs(difference))}
    <small>{change === null ? difference === 0 ? "no change" : "from zero" : `${direction}${percent.format(Math.abs(change))}%`}</small>
  </span>;
}

export default function TokenUsageHeatmap({ snapshot }: { snapshot: UsageSnapshot }) {
  const years = Array.from(new Set(snapshot.daily.map((day) => Number(day.date.slice(0, 4))))).sort((a, b) => b - a);
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [metric, setMetric] = useState<HeatMetric>("cost");
  const [scope, setScope] = useState<"day" | "week">("day");
  const [chosenDate, setChosenDate] = useState<string | null>(null);
  const [chosenWeek, setChosenWeek] = useState<number | null>(null);
  const [referenceDate, setReferenceDate] = useState<string | null>(null);
  const [referenceWeek, setReferenceWeek] = useState<string | null>(null);
  const year = chosenYear !== null && years.includes(chosenYear) ? chosenYear : years[0] ?? Number(snapshot.coverage.through.slice(0, 4));
  const calendar = useMemo(() => calendarFor(year, snapshot), [year, snapshot]);
  const weeks = useMemo(() => weeklyUsage(year, calendar), [year, calendar]);
  const yearDays = snapshot.daily.filter((day) => day.date.startsWith(`${year}-`));
  const availableDates = new Set(calendar.cells.filter((cell) => cell.available).map((cell) => cell.date));
  const latest = latestRecordedDate(yearDays, year);
  const shownDate = chosenDate && availableDates.has(chosenDate) ? chosenDate : latest;
  const dayWeek = weeks.find((week) => week.cells.some((cell) => cell.date === shownDate));
  const shownWeek = chosenWeek !== null ? weeks[chosenWeek] : dayWeek;
  const activeWeek = scope === "week" ? shownWeek : dayWeek;
  const shownDay = snapshot.daily.find((day) => day.date === shownDate);
  const dayMetrics = aggregateUsage(shownDay ? [shownDay] : []);
  const weekMetrics = aggregateUsage(shownWeek?.cells.filter((cell) => cell.available && cell.day).map((cell) => cell.day!) ?? []);
  const available = scope === "day" ? !!shownDate : !!shownWeek?.available;
  const metrics = scope === "day" ? dayMetrics : weekMetrics;
  const dayBaseline = referenceDate ? {
    date: referenceDate,
    available: referenceDate >= snapshot.coverage.from && referenceDate <= snapshot.coverage.through,
    metrics: aggregateUsage(snapshot.daily.filter((day) => day.date === referenceDate)),
  } : shownDate ? previousDayUsage(snapshot, shownDate) : null;
  const weekBaseline = referenceWeek ? weeks.find((week) => week.start === referenceWeek) : shownWeek ? weeks[shownWeek.index - 1] : null;
  const baseline = scope === "day" ? dayBaseline?.available ? dayBaseline.metrics : null : weekBaseline?.available ? aggregateUsage(weekBaseline.cells.filter((cell) => cell.available && cell.day).map((cell) => cell.day!)) : null;
  const reference = scope === "day" ? referenceDate : referenceWeek;
  const baselineLabel = scope === "day" ? dayBaseline ? dateLabel(dayBaseline.date) : "previous day" : weekBaseline ? weekLabel(weekBaseline) : "previous week";
  const periodLabel = scope === "day" ? shownDate ? dateLabel(shownDate) : "No recorded days" : shownWeek ? weekLabel(shownWeek) : "No recorded weeks";
  const agentOrder = useMemo(() => new Map(snapshot.agents.toSorted((a, b) => b.totalCost - a.totalCost || a.id.localeCompare(b.id)).map((agent, index) => [agent.id, index])), [snapshot.agents]);
  const agentIds = new Set([...metrics.agents, ...baseline?.agents ?? []].filter((agent) => agent.totalTokens > 0 || agent.totalCost > 0).map((agent) => agent.id));
  const dayAgents = [...agentIds].map((id) => metrics.agents.find((agent) => agent.id === id) ?? {
    id, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, totalCost: 0, models: [],
  })
    .toSorted((a, b) => (agentOrder.get(a.id) ?? Infinity) - (agentOrder.get(b.id) ?? Infinity) || a.id.localeCompare(b.id));
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const weekButtons = useRef(new Map<number, HTMLButtonElement>());
  const scrollContainer = useRef<HTMLDivElement>(null);
  const totals = yearDays.reduce((sum, day) => ({ tokens: sum.tokens + day.totalTokens, cost: sum.cost + day.totalCost }), { tokens: 0, cost: 0 });
  const activeDays = yearDays.filter((day) => day.totalTokens > 0 || day.totalCost > 0).length;
  const weekMaximum = Math.max(...weeks.map((week) => metric === "cost" ? week.totalCost : week.totalTokens), 0);
  const peaks = [...yearDays].sort((a, b) => metric === "tokens" ? b.totalTokens - a.totalTokens : b.totalCost - a.totalCost).filter((day) => (metric === "tokens" ? day.totalTokens : day.totalCost) > 0).slice(0, 3);
  const previousDate = shownDate ? shiftDate(shownDate, -1) : null;
  const nextDate = shownDate ? shiftDate(shownDate, 1) : null;
  const canPrevious = scope === "day" ? !!previousDate && availableDates.has(previousDate) : !!shownWeek && !!weeks[shownWeek.index - 1]?.available;
  const canNext = scope === "day" ? !!nextDate && availableDates.has(nextDate) : !!shownWeek && !!weeks[shownWeek.index + 1]?.available;
  const coveredCells = calendar.cells.filter((cell) => cell.available);
  const dayIndex = coveredCells.findIndex((cell) => cell.date === shownDate);
  const neighborStart = Math.max(0, Math.min(dayIndex - 2, coveredCells.length - 5));
  const nearbyDays = scope === "week" ? shownWeek?.cells.filter((cell) => cell.available) ?? [] : coveredCells.slice(neighborStart, neighborStart + 5);

  function revealDate(date: string | null) {
    const container = scrollContainer.current;
    const button = date ? buttons.current.get(date) : undefined;
    if (!container || !button) return;
    const bounds = container.getBoundingClientRect();
    const cell = button.getBoundingClientRect();
    if (cell.right > bounds.right) container.scrollLeft += cell.right - bounds.right + 8;
    else if (cell.left < bounds.left) container.scrollLeft -= bounds.left - cell.left + 8;
  }

  useEffect(() => { revealDate(latest); }, [latest, year]);

  function inspectDay(date: string) {
    setChosenDate(date); setScope("day"); setChosenWeek(null);
  }

  function inspectWeek(index: number) {
    setChosenWeek(index); setScope("week");
  }

  function movePeriod(direction: -1 | 1) {
    if (scope === "day" && shownDate) {
      const date = shiftDate(shownDate, direction);
      if (availableDates.has(date)) { inspectDay(date); revealDate(date); }
    } else if (shownWeek) {
      const week = weeks[shownWeek.index + direction];
      if (week?.available) { inspectWeek(week.index); revealDate(week.coveredFrom); }
    }
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, cell: CalendarCell) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = keyboardTarget(calendar.cells, cell.date, event.key);
    if (next) { buttons.current.get(next)?.focus({ preventScroll: true }); revealDate(next); }
  }

  function moveWeekFocus(event: KeyboardEvent<HTMLButtonElement>, week: UsageWeek) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = weeklyKeyboardTarget(weeks, week.index, event.key);
    if (next !== null) { weekButtons.current.get(next)?.focus({ preventScroll: true }); revealDate(weeks[next]?.coveredFrom ?? null); }
  }

  function resetSelection(nextYear?: number) {
    if (nextYear !== undefined) setChosenYear(nextYear);
    setChosenDate(null); setChosenWeek(null); setScope("day"); setReferenceDate(null); setReferenceWeek(null);
    revealDate(latest);
  }

  return (
    <section className="th-activity" aria-labelledby="th-activity-title">
      <div className="th-heading">
        <div><span className="th-kicker">01 / THE DAILY PRACTICE</span><h2 id="th-activity-title">Daily compute. <i>Visible.</i></h2></div>
        <div className="th-controls">
          <div className="th-toggle" role="group" aria-label="Heatmap metric">
            <button aria-pressed={metric === "tokens"} onClick={() => setMetric("tokens")}>Tokens</button>
            <button aria-pressed={metric === "cost"} onClick={() => setMetric("cost")}>API value</button>
          </div>
          <label className="th-year"><span className="th-sr-only">Heatmap year</span><select value={year} onChange={(event) => resetSelection(Number(event.target.value))}>{(years.length ? years : [year]).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        </div>
      </div>
      <div className="th-topline"><span><strong>{usd.format(totals.cost)}</strong> API-EQUIVALENT <b>/</b> {number.format(totals.tokens)} TOKENS</span><span>{activeDays} ACTIVE DAYS IN {year}</span></div>
      <div className="th-workspace">
        <div className="th-map-panel">
          <div ref={scrollContainer} className="th-scroll" tabIndex={0} role="region" aria-label={`${year} daily usage heatmap and weekly totals. Scroll horizontally on small screens. Arrow keys navigate days or weeks when focused.`}>
            <div className="th-heatmap" style={{ "--th-weeks": calendar.weeks } as CSSProperties}>
              <div className="th-months" aria-hidden="true">{calendar.months.map((month) => <span key={month.label} style={{ gridColumn: month.week + 1 }}>{month.label}</span>)}</div>
              <div className="th-calendar">
                <div className="th-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
                <div className="th-cells">{weeks.map((week) => <div key={week.index} className={`th-week-column${activeWeek?.index === week.index ? " th-week-highlight" : ""}`} onPointerEnter={(event) => { if (event.target === event.currentTarget && event.pointerType !== "touch") inspectWeek(week.index); }}>
                  {week.cells.map((cell) => cell.available ? <button key={cell.date}
                    ref={(node) => { if (node) buttons.current.set(cell.date, node); else buttons.current.delete(cell.date); }}
                    className={`th-cell th-level-${heatmapLevel(cell.day ? metric === "tokens" ? cell.day.totalTokens : cell.day.totalCost : 0, metric)}${scope === "day" && shownDate === cell.date ? " th-pinned" : ""}${referenceDate === cell.date ? " th-reference" : ""}`}
                    style={{ gridRow: cell.weekday + 1 }}
                    aria-label={`${dateLabel(cell.date, true)}: ${usd.format(cell.day?.totalCost ?? 0)} estimated API value, ${number.format(cell.day?.totalTokens ?? 0)} tokens. Inspect day.`}
                    aria-pressed={scope === "day" && shownDate === cell.date} tabIndex={shownDate === cell.date ? 0 : -1}
                    onPointerEnter={(event) => { if (event.pointerType !== "touch") inspectDay(cell.date); }}
                    onFocus={() => inspectDay(cell.date)} onClick={() => inspectDay(cell.date)} onKeyDown={(event) => moveFocus(event, cell)}
                  /> : <span key={cell.date} className="th-cell th-outside" style={{ gridRow: cell.weekday + 1 }} title={`${dateLabel(cell.date)}: outside snapshot coverage`} />)}
                </div>)}</div>
              </div>
              <div className="th-weekly-bars" aria-label={`Weekly totals by ${metric === "cost" ? "estimated API value" : "tokens"}. Each bar aligns with the daily heatmap column above.`}>
                <span className="th-weekly-axis" aria-hidden="true">Week</span>
                {weeks.map((week) => {
                  const value = metric === "cost" ? week.totalCost : week.totalTokens;
                  const height = weekMaximum > 0 && value > 0 ? Math.max(3, value / weekMaximum * 100) : 0;
                  return week.available ? <button key={week.index}
                    ref={(node) => { if (node) weekButtons.current.set(week.index, node); else weekButtons.current.delete(week.index); }}
                    className={`th-week-bar${activeWeek?.index === week.index ? " th-week-bar-highlight" : ""}${referenceWeek === week.start ? " th-reference" : ""}`}
                    aria-label={`Week ${weekLabel(week)}: ${usd.format(week.totalCost)} estimated API value, ${number.format(week.totalTokens)} tokens.${week.partial ? ` Partial week: ${week.coveredDays} of 7 days covered.` : ""} Inspect week.`}
                    aria-pressed={scope === "week" && shownWeek?.index === week.index} tabIndex={shownWeek?.index === week.index ? 0 : -1}
                    onPointerEnter={(event) => { if (event.pointerType !== "touch") inspectWeek(week.index); }}
                    onFocus={() => inspectWeek(week.index)} onClick={() => inspectWeek(week.index)} onKeyDown={(event) => moveWeekFocus(event, week)}
                  ><span aria-hidden="true" style={{ height: `${height}%` }} /></button> : <span key={week.index} className="th-week-bar th-week-unavailable" title={`Week ${weekLabel(week)}: outside snapshot coverage`} />;
                })}
              </div>
            </div>
          </div>
          <div className="th-caption"><span><span className="th-mouse-hint">Hover to inspect. </span>Tap a day or weekly bar.</span><button onClick={() => resetSelection()}>Latest day <Arrow /></button></div>
          <div className="th-legend" aria-label={`Daily ${metric === "cost" ? "API value in US dollars" : "token usage"} legend. Colors use fixed magnitude bands.`}>
            <span className="th-legend-label">{metric === "cost" ? "USD / DAY" : "TOKENS / DAY"}</span>
            {heatmapBands[metric].map((band, index) => <span className="th-legend-band" key={index}><i className={`th-level-${index}`} aria-hidden="true" />{band.label}</span>)}
            <span className="th-legend-band th-legend-outside"><i className="th-outside" aria-hidden="true" />Outside coverage</span>
          </div>
          <div className="th-neighbors">
            <div className="th-neighbor-heading"><h3>{scope === "week" ? "Inside this week." : "Day by day."}</h3><span>SELECT A ROW TO INSPECT</span></div>
            <div className="th-neighbor-labels" aria-hidden="true"><span>DAY</span><span>API VALUE</span><span>EXACT TOKENS</span></div>
            {nearbyDays.map((cell) => <button key={cell.date} className={`th-neighbor-row${scope === "day" && shownDate === cell.date ? " th-neighbor-current" : ""}`} onClick={() => { inspectDay(cell.date); revealDate(cell.date); }} aria-label={`Inspect ${dateLabel(cell.date)}: ${usd.format(cell.day?.totalCost ?? 0)}, ${number.format(cell.day?.totalTokens ?? 0)} tokens`}><span>{new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${cell.date}T12:00:00Z`))}{referenceDate === cell.date && <small>REF</small>}</span><strong>{usd.format(cell.day?.totalCost ?? 0)}</strong><span>{number.format(cell.day?.totalTokens ?? 0)}</span></button>)}
          </div>
        </div>
        <aside className="th-inspector" aria-label="Usage inspector">
          <div className="th-inspector-summary">
            <div className="th-inspector-toolbar"><div className="th-scope" role="group" aria-label="Receipt period"><button aria-pressed={scope === "day"} onClick={() => { if (scope === "week" && shownWeek?.available && !shownWeek.cells.some((cell) => cell.date === shownDate)) setChosenDate(shownWeek.coveredThrough); setScope("day"); }}>Day</button><button aria-pressed={scope === "week"} onClick={() => setScope("week")}>Week</button></div><div className="th-period-nav"><button aria-label={`Previous ${scope}`} disabled={!canPrevious} onClick={() => movePeriod(-1)}>←</button><button aria-label={`Next ${scope}`} disabled={!canNext} onClick={() => movePeriod(1)}>→</button></div></div>
            <div className="th-period-title" aria-live="polite" aria-atomic="true"><span className="th-kicker">{scope === "day" && shownDate === latest ? "LATEST RECORDED DAY" : scope === "week" ? "WEEKLY RECEIPT" : "DAILY RECEIPT"}</span><h3>{periodLabel}</h3><span>{scope === "week" && shownWeek ? `${shownWeek.partial ? `Partial week · ${shownWeek.coveredDays}/7 days` : "Sunday–Saturday"} · ${shownWeek.activeDays} active ${shownWeek.activeDays === 1 ? "day" : "days"}` : `${shownDate === todayInZone(snapshot.timezone) ? "Today so far · " : ""}Pacific time`}</span></div>
            <div className="th-inspector-values">
              <div className="th-inspector-cost"><span className="th-kicker">API-EQUIVALENT VALUE</span><strong>{available ? usd.format(metrics.totalCost) : "—"}</strong><Delta value={metrics.totalCost} baseline={available ? baseline?.totalCost : undefined} money /></div>
              <div className="th-inspector-tokens"><span className="th-kicker">EXACT TOKENS</span><strong>{available ? number.format(metrics.totalTokens) : "—"}</strong><Delta value={metrics.totalTokens} baseline={available ? baseline?.totalTokens : undefined} /></div>
            </div>
            <div className="th-comparison"><div><span className="th-kicker">{reference ? "FIXED REFERENCE" : `VS. PREVIOUS ${scope.toUpperCase()}`}</span><strong>{baselineLabel}</strong></div><div className="th-baseline-values"><span>{baseline ? usd.format(baseline.totalCost) : "—"}</span><span>{baseline ? `${number.format(baseline.totalTokens)} tokens` : "Outside coverage"}</span></div>{scope === "week" && (shownWeek?.partial || weekBaseline?.partial) && <small>Partial coverage · totals aren’t normalized.</small>}</div>
            <div className="th-reference-actions"><button disabled={!available} onClick={() => { if (scope === "day") setReferenceDate(shownDate); else setReferenceWeek(shownWeek?.start ?? null); }}>{reference ? "Use this as reference" : `Compare from this ${scope}`}</button>{reference && <button className="th-clear-reference" onClick={() => { if (scope === "day") setReferenceDate(null); else setReferenceWeek(null); }}>Clear</button>}</div>
          </div>
          <div className="th-inspector-details">
            <section className="th-day-agents" aria-labelledby="th-day-agents-title">
              <div className="th-day-agent-heading"><h4 id="th-day-agents-title">Agents & models</h4><span>{scope === "week" ? "THIS WEEK" : "THIS DAY"}</span></div>
              {dayAgents.length > 0 ? <ul className="th-day-agent-rows">{dayAgents.map((agent) => {
                const baselineAgent = baseline?.agents.find((item) => item.id === agent.id);
                return <li className="th-day-agent-row" key={agent.id}>
                  <div className="th-day-agent-topline"><span className="th-day-agent-name">{agents[agent.id] ?? agent.id}</span><strong>{usd.format(agent.totalCost)}</strong></div>
                  <div className="th-day-agent-count"><span>{number.format(agent.totalTokens)} tokens</span>{baseline && <Delta value={agent.totalCost} baseline={baselineAgent?.totalCost ?? 0} money />}</div>
                  {agent.models?.length ? <ul className="th-day-agent-models" aria-label={`Models used by ${agents[agent.id] ?? agent.id}`}>{agent.models.map((model) => <li key={model}>{model}</li>)}</ul> : <span className="th-day-agent-models-missing">{agent.totalTokens === 0 && agent.totalCost === 0 ? `No usage this ${scope}` : "Models not recorded"}</span>}
                </li>;
              })}</ul> : <p className="th-day-agent-empty">{available ? `No agent usage recorded for this ${scope}.` : "Outside snapshot coverage."}</p>}
            </section>
            <details className="th-token-detail"><summary>Token breakdown <span>+</span></summary><div className="th-parts">{parts.map((part) => <div key={part.key}><span>{part.label}</span><strong>{number.format(metrics[part.key])}</strong></div>)}</div><p>Includes cache reads. Dollar values are estimates, not invoiced spend.</p></details>
          </div>
        </aside>
      </div>
      {peaks.length > 0 && <div className="th-peaks"><span className="th-kicker">PEAK DAYS / {metric === "tokens" ? "TOKENS" : "API VALUE"}</span><div className="th-peak-list">{peaks.map((day, index) => <button key={day.date} onClick={() => { inspectDay(day.date); revealDate(day.date); }} aria-label={`Inspect peak day ${dateLabel(day.date)}: ${usd.format(day.totalCost)} API value, ${number.format(day.totalTokens)} tokens`}><span className="th-peak-rank">0{index + 1}</span><span className="th-peak-receipt"><span>{dateLabel(day.date)}</span><strong>{metric === "tokens" ? number.format(day.totalTokens) : usd.format(day.totalCost)}</strong></span><Arrow /></button>)}</div></div>}
    </section>
  );
}
