import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { UsageMetrics, UsageSnapshot } from "./tokenmaxxing-types";
import { Arrow } from "./icons";
import { calendarFor, displayedDate, displayedWeek, heatmapBands, heatmapLevel, keyboardTarget, latestRecordedDate, weeklyKeyboardTarget, weeklyUsage } from "./token-heatmap-utils.mjs";
import type { CalendarCell, HeatMetric, UsageWeek } from "./token-heatmap-utils.mjs";
import "./token-heatmap.css";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const agents: Record<string, string> = {
  claude: "Claude", codex: "Codex", antigravity: "Antigravity", grok: "Grok", hermes: "Hermes", kimi: "Kimi", opencode: "OpenCode", other: "Other",
};
const zero: UsageMetrics = { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, totalCost: 0 };
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

export default function TokenUsageHeatmap({ snapshot }: { snapshot: UsageSnapshot }) {
  const years = Array.from(new Set(snapshot.daily.map((day) => Number(day.date.slice(0, 4))))).sort((a, b) => b - a);
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const [metric, setMetric] = useState<HeatMetric>("cost");
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [rovingDate, setRovingDate] = useState<string | null>(null);
  const [pinnedWeek, setPinnedWeek] = useState<number | null>(null);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [focusedWeek, setFocusedWeek] = useState<number | null>(null);
  const [rovingWeek, setRovingWeek] = useState<number | null>(null);
  const year = chosenYear !== null && years.includes(chosenYear) ? chosenYear : years[0] ?? Number(snapshot.coverage.through.slice(0, 4));
  const calendar = useMemo(() => calendarFor(year, snapshot), [year, snapshot]);
  const weeks = useMemo(() => weeklyUsage(year, calendar), [year, calendar]);
  const yearDays = snapshot.daily.filter((day) => day.date.startsWith(`${year}-`));
  const availableDates = new Set(calendar.cells.filter((cell) => cell.available).map((cell) => cell.date));
  const latest = latestRecordedDate(yearDays, year);
  const selected = displayedDate({ availableDates, latest, pinned, preview: null });
  const preview = hovered ?? focused;
  const shownDate = displayedDate({ availableDates, latest, pinned, preview });
  const shownDay = yearDays.find((day) => day.date === shownDate);
  const selectedWeek = displayedWeek({ weeks, selectedDate: selected, pinned: pinnedWeek, preview: null });
  const previewWeek = hoveredWeek ?? focusedWeek;
  const shownWeek = displayedWeek({ weeks, selectedDate: selected, pinned: pinnedWeek, preview: previewWeek });
  const focusWeek = rovingWeek !== null && weeks[rovingWeek]?.available ? rovingWeek : selectedWeek?.index;
  const weekMaximum = Math.max(...weeks.map((week) => metric === "cost" ? week.totalCost : week.totalTokens), 0);
  const metrics = shownDay ?? zero;
  const dayAgents = (shownDay?.agents ?? [])
    .filter((agent) => agent.totalTokens > 0 || agent.totalCost > 0)
    .toSorted((a, b) => b.totalCost - a.totalCost || b.totalTokens - a.totalTokens);
  const focusDate = rovingDate && availableDates.has(rovingDate) ? rovingDate : selected;
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const weekButtons = useRef(new Map<number, HTMLButtonElement>());
  const scrollContainer = useRef<HTMLDivElement>(null);
  const totals = yearDays.reduce((sum, day) => ({ tokens: sum.tokens + day.totalTokens, cost: sum.cost + day.totalCost }), { tokens: 0, cost: 0 });
  const activeDays = yearDays.filter((day) => day.totalTokens > 0 || day.totalCost > 0).length;
  const peaks = [...yearDays].sort((a, b) => metric === "tokens" ? b.totalTokens - a.totalTokens : b.totalCost - a.totalCost).filter((day) => (metric === "tokens" ? day.totalTokens : day.totalCost) > 0).slice(0, 3);

  function revealDate(date: string | null) {
    const container = scrollContainer.current;
    const button = date ? buttons.current.get(date) : undefined;
    if (!container || !button) return;
    const bounds = container.getBoundingClientRect();
    const cell = button.getBoundingClientRect();
    if (cell.right > bounds.right) container.scrollLeft += cell.right - bounds.right + 8;
    else if (cell.left < bounds.left) container.scrollLeft -= bounds.left - cell.left + 8;
  }

  useEffect(() => { revealDate(selected); }, [selected]);

  function pinDate(date: string) {
    setPinned(date);
    setRovingDate(date);
    setHovered(null);
    setFocused(null);
    setPinnedWeek(null);
    setHoveredWeek(null);
    setFocusedWeek(null);
    setRovingWeek(null);
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, cell: CalendarCell) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = keyboardTarget(calendar.cells, cell.date, event.key);
    if (next) {
      setRovingDate(next);
      buttons.current.get(next)?.focus({ preventScroll: true });
      revealDate(next);
    }
  }

  function moveWeekFocus(event: KeyboardEvent<HTMLButtonElement>, week: UsageWeek) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = weeklyKeyboardTarget(weeks, week.index, event.key);
    if (next !== null) {
      setRovingWeek(next);
      weekButtons.current.get(next)?.focus({ preventScroll: true });
      revealDate(weeks[next]?.coveredFrom ?? null);
    }
  }

  function resetSelection(nextYear?: number) {
    if (nextYear !== undefined) setChosenYear(nextYear);
    setPinned(null); setHovered(null); setFocused(null); setRovingDate(null);
    setPinnedWeek(null); setHoveredWeek(null); setFocusedWeek(null); setRovingWeek(null);
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
      <div ref={scrollContainer} className="th-scroll" tabIndex={0} role="region" aria-label={`${year} daily usage heatmap and weekly totals. Scroll horizontally on small screens. Arrow keys navigate days or weeks when focused.`}>
        <div className="th-heatmap" style={{ "--th-weeks": calendar.weeks } as CSSProperties}>
          <div className="th-months" aria-hidden="true">{calendar.months.map((month) => <span key={month.label} style={{ gridColumn: month.week + 1 }}>{month.label}</span>)}</div>
          <div className="th-calendar">
            <div className="th-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
            <div className="th-cells">
            {weeks.map((week) => <div key={week.index} className={`th-week-column${shownWeek?.index === week.index ? " th-week-highlight" : ""}`} onPointerEnter={(event) => { if (event.pointerType !== "touch") setHoveredWeek(week.index); }} onPointerLeave={() => setHoveredWeek(null)}>
            {week.cells.map((cell) => cell.available ? (
              <button
                key={cell.date}
                ref={(node) => { if (node) buttons.current.set(cell.date, node); else buttons.current.delete(cell.date); }}
                className={`th-cell th-level-${heatmapLevel(cell.day ? metric === "tokens" ? cell.day.totalTokens : cell.day.totalCost : 0, metric)}${selected === cell.date ? " th-pinned" : ""}${shownDate === cell.date && shownDate !== selected ? " th-preview" : ""}`}
                style={{ gridRow: cell.weekday + 1 }}
                aria-label={`${dateLabel(cell.date, true)}: ${usd.format(cell.day?.totalCost ?? 0)} estimated API value, ${number.format(cell.day?.totalTokens ?? 0)} tokens. Hover or focus to preview; select to pin.`}
                aria-pressed={selected === cell.date}
                tabIndex={focusDate === cell.date ? 0 : -1}
                onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(cell.date); }}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => { setFocused(cell.date); setRovingDate(cell.date); setFocusedWeek(week.index); }}
                onBlur={() => { setFocused(null); setFocusedWeek(null); }}
                onClick={() => pinDate(cell.date)}
                onKeyDown={(event) => moveFocus(event, cell)}
              />
            ) : <span key={cell.date} className="th-cell th-outside" style={{ gridRow: cell.weekday + 1 }} title={`${dateLabel(cell.date)}: outside snapshot coverage`} />)}
            </div>)}
            </div>
          </div>
          <div className="th-weekly-bars" aria-label={`Weekly totals by ${metric === "cost" ? "estimated API value" : "tokens"}. Each bar aligns with the daily heatmap column above.`}>
            <span className="th-weekly-axis" aria-hidden="true">Week</span>
            {weeks.map((week) => {
              const value = metric === "cost" ? week.totalCost : week.totalTokens;
              const height = weekMaximum > 0 && value > 0 ? Math.max(3, value / weekMaximum * 100) : 0;
              return week.available ? <button
                key={week.index}
                ref={(node) => { if (node) weekButtons.current.set(week.index, node); else weekButtons.current.delete(week.index); }}
                className={`th-week-bar${shownWeek?.index === week.index ? " th-week-bar-highlight" : ""}`}
                aria-label={`Week ${weekLabel(week)}: ${usd.format(week.totalCost)} estimated API value, ${number.format(week.totalTokens)} tokens.${week.partial ? ` Partial week: ${week.coveredDays} of 7 days covered.` : ""} Select to pin weekly totals.`}
                aria-pressed={selectedWeek?.index === week.index}
                tabIndex={focusWeek === week.index ? 0 : -1}
                onPointerEnter={(event) => { if (event.pointerType !== "touch") setHoveredWeek(week.index); }}
                onPointerLeave={() => setHoveredWeek(null)}
                onFocus={() => { setFocusedWeek(week.index); setRovingWeek(week.index); }}
                onBlur={() => setFocusedWeek(null)}
                onClick={() => { setPinnedWeek(week.index); setRovingWeek(week.index); setHoveredWeek(null); setFocusedWeek(null); }}
                onKeyDown={(event) => moveWeekFocus(event, week)}
              ><span aria-hidden="true" style={{ height: `${height}%` }} /></button> : <span key={week.index} className={`th-week-bar th-week-unavailable${shownWeek?.index === week.index ? " th-week-bar-highlight" : ""}`} onPointerEnter={(event) => { if (event.pointerType !== "touch") setHoveredWeek(week.index); }} onPointerLeave={() => setHoveredWeek(null)} title={`Week ${weekLabel(week)}: outside snapshot coverage`} />;
            })}
          </div>
        </div>
      </div>
      <div className="th-week-receipt" aria-live="polite" aria-atomic="true">
        <div className="th-week-range"><span className="th-kicker">{previewWeek !== null && shownWeek?.index !== selectedWeek?.index ? "PREVIEWING WEEK" : pinnedWeek !== null && shownWeek?.index === pinnedWeek ? "PINNED WEEK" : "SELECTED DAY’S WEEK"}</span><strong>{shownWeek ? weekLabel(shownWeek) : "No recorded weeks"}</strong><small>{shownWeek?.available ? `${shownWeek.partial ? `Partial week · ${shownWeek.coveredDays}/7 days covered` : "Full week · Sunday–Saturday"} · ${shownWeek.activeDays} active ${shownWeek.activeDays === 1 ? "day" : "days"}` : "Outside snapshot coverage"}</small></div>
        <div className="th-week-value"><span className="th-kicker">WEEKLY API VALUE</span><strong>{shownWeek?.available ? usd.format(shownWeek.totalCost) : "—"}</strong></div>
        <div className="th-week-tokens"><span className="th-kicker">WEEKLY TOKENS</span><strong>{shownWeek?.available ? number.format(shownWeek.totalTokens) : "No usage data"}</strong></div>
      </div>
      <div className="th-caption"><span><span className="th-mouse-hint">Hover a day or week to preview. </span>Tap or click to pin.</span><button onClick={() => resetSelection()}>Latest day <Arrow /></button></div>
      <div className="th-legend" aria-label={`Daily ${metric === "cost" ? "API value in US dollars" : "token usage"} legend. Colors use fixed magnitude bands.`}>
        <span className="th-legend-label">{metric === "cost" ? "USD / DAY" : "TOKENS / DAY"}</span>
        {heatmapBands[metric].map((band, index) => <span className="th-legend-band" key={index}><i className={`th-level-${index}`} aria-hidden="true" />{band.label}</span>)}
        <span className="th-legend-band th-legend-outside"><i className="th-outside" aria-hidden="true" />Outside coverage</span>
      </div>
      <div className="th-detail" aria-live="polite" aria-atomic="true">
        <div className="th-day-title"><span className="th-kicker">{preview && shownDate !== selected ? "PREVIEWING DAY" : pinned && pinned === selected ? "PINNED DAY" : "LATEST RECORDED DAY"}</span><strong>{shownDate ? dateLabel(shownDate) : "No recorded days"}</strong><span>{shownDay?.agents.filter((agent) => agent.totalTokens > 0 || agent.totalCost > 0).map((agent) => agents[agent.id] ?? agent.id).join(" / ") || "No recorded usage"}</span></div>
        <div className="th-day-value"><span className="th-kicker">API-EQUIVALENT VALUE</span><strong>{usd.format(metrics.totalCost)}</strong><small>Estimated · not invoiced spend</small></div>
        <div className="th-day-tokens"><span className="th-kicker">TOTAL TOKENS</span><strong>{number.format(metrics.totalTokens)}</strong><small>Including cache reads</small></div>
        <div className="th-parts">{parts.map((part) => <div key={part.key}><span>{part.label}</span><strong>{number.format(metrics[part.key])}</strong></div>)}</div>
        <section className="th-day-agents" aria-labelledby="th-day-agents-title">
          <div className="th-day-agent-heading"><h3 id="th-day-agents-title">By agent.</h3><span>API VALUE / TOKENS</span></div>
          {dayAgents.length > 0 ? <ul className="th-day-agent-rows">{dayAgents.map((agent) => (
            <li className="th-day-agent-row" key={agent.id}>
              <div className="th-day-agent-identity">
                <span className="th-day-agent-name">{agents[agent.id] ?? agent.id}</span>
                {agent.models?.length ? <ul className="th-day-agent-models" aria-label={`Models used by ${agents[agent.id] ?? agent.id}`}>{agent.models.map((model) => <li key={model}>{model}</li>)}</ul> : <span className="th-day-agent-models-missing">Models not recorded</span>}
              </div>
              <div className="th-day-agent-numbers"><strong>{usd.format(agent.totalCost)}</strong><span>{number.format(agent.totalTokens)} tokens</span></div>
            </li>
          ))}</ul> : <p className="th-day-agent-empty">No agent usage recorded for this day.</p>}
        </section>
      </div>
      {peaks.length > 0 && <div className="th-peaks"><span className="th-kicker">PEAK DAYS / {metric === "tokens" ? "TOKENS" : "API VALUE"}</span><div className="th-peak-list">{peaks.map((day, index) => <button key={day.date} onClick={() => pinDate(day.date)} aria-label={`Inspect peak day ${dateLabel(day.date)}: ${usd.format(day.totalCost)} API value, ${number.format(day.totalTokens)} tokens`}><span className="th-peak-rank">0{index + 1}</span><span className="th-peak-receipt"><span>{dateLabel(day.date)}</span><strong>{metric === "tokens" ? number.format(day.totalTokens) : usd.format(day.totalCost)}</strong></span><Arrow /></button>)}</div></div>}
    </section>
  );
}
