export const heatmapBands = {
  cost: [
    { lower: 0, label: "$0" },
    { lower: 0, label: "<$10" },
    { lower: 10, label: "$10–99" },
    { lower: 100, label: "$100–499" },
    { lower: 500, label: "$500–999" },
    { lower: 1000, label: "$1,000–1,999" },
    { lower: 2000, label: "$2,000+" },
  ],
  tokens: [
    { lower: 0, label: "0" },
    { lower: 0, label: "<1M" },
    { lower: 1e6, label: "1–9.9M" },
    { lower: 1e7, label: "10–99M" },
    { lower: 1e8, label: "100–999M" },
    { lower: 1e9, label: "1–2.9B" },
    { lower: 3e9, label: "3B+" },
  ],
};

// Absolute bands keep a quiet day quiet even when the selected year changes.
// Zero is separate from the positive first band and from unavailable dates.
export function heatmapLevel(value, metric) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const bands = heatmapBands[metric];
  if (!bands) throw new Error("Unknown heatmap metric");
  for (let index = bands.length - 1; index >= 2; index--) {
    if (value >= bands[index].lower) return index;
  }
  return 1;
}

export function todayInZone(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export function calendarFor(year, snapshot, now = new Date()) {
  const days = new Map(snapshot.daily.map((day) => [day.date, day]));
  const first = new Date(Date.UTC(year, 0, 1));
  const offset = first.getUTCDay();
  const end = Date.UTC(year + 1, 0, 1);
  const today = todayInZone(snapshot.timezone, now);
  const cells = [];
  const months = [];
  let index = 0;
  for (let time = first.getTime(); time < end; time += 86_400_000) {
    const day = new Date(time);
    const date = day.toISOString().slice(0, 10);
    const week = Math.floor((index + offset) / 7);
    if (day.getUTCDate() === 1) {
      months.push({ label: day.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), week });
    }
    cells.push({
      date, weekday: day.getUTCDay(), week, day: days.get(date),
      available: date >= snapshot.coverage.from && date <= snapshot.coverage.through && (date <= today || days.has(date)),
    });
    index++;
  }
  return { cells, months, weeks: Math.ceil((cells.length + offset) / 7) };
}

export function latestRecordedDate(days, year) {
  return days.filter((day) => day.date.startsWith(`${year}-`)).reduce((latest, day) => day.date > latest ? day.date : latest, "") || null;
}

export function keyboardTarget(cells, date, key) {
  if (key === "Home") return cells.find((cell) => cell.available)?.date ?? null;
  if (key === "End") return cells.findLast((cell) => cell.available)?.date ?? null;
  const shifts = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
  if (!Object.hasOwn(shifts, key)) return null;
  const index = cells.findIndex((cell) => cell.date === date);
  const next = cells[index + shifts[key]];
  return next?.available ? next.date : null;
}

export function weeklyUsage(year, calendar) {
  const first = new Date(Date.UTC(year, 0, 1));
  const firstSunday = first.getTime() - first.getUTCDay() * 86_400_000;
  return Array.from({ length: calendar.weeks }, (_, index) => {
    const cells = calendar.cells.filter((cell) => cell.week === index);
    const covered = cells.filter((cell) => cell.available);
    const observed = covered.filter((cell) => cell.day);
    return {
      index,
      start: new Date(firstSunday + index * 7 * 86_400_000).toISOString().slice(0, 10),
      end: new Date(firstSunday + (index * 7 + 6) * 86_400_000).toISOString().slice(0, 10),
      coveredFrom: covered[0]?.date ?? null,
      coveredThrough: covered.at(-1)?.date ?? null,
      coveredDays: covered.length,
      observedDays: observed.length,
      activeDays: observed.filter((cell) => cell.day.totalTokens > 0 || cell.day.totalCost > 0).length,
      available: covered.length > 0,
      partial: covered.length > 0 && covered.length < 7,
      totalTokens: observed.reduce((sum, cell) => sum + cell.day.totalTokens, 0),
      totalCost: observed.reduce((sum, cell) => sum + cell.day.totalCost, 0),
      cells,
    };
  });
}

export function weeklyKeyboardTarget(weeks, index, key) {
  const available = weeks.filter((week) => week.available);
  if (key === "Home") return available[0]?.index ?? null;
  if (key === "End") return available.at(-1)?.index ?? null;
  const offset = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;
  if (!offset) return null;
  const position = available.findIndex((week) => week.index === index);
  return available[position + offset]?.index ?? null;
}

const usageMetricNames = [
  "inputTokens", "outputTokens", "cacheCreationTokens", "cacheReadTokens", "totalTokens", "totalCost",
];

function emptyUsage() {
  return Object.fromEntries(usageMetricNames.map((name) => [name, 0]));
}

function addUsage(target, source) {
  for (const name of usageMetricNames) {
    target[name] += Number.isFinite(source[name]) ? source[name] : 0;
  }
}

// Daily totals stay independent of their agent breakdown. Legacy snapshots may
// omit token components or model names; missing components contribute zero.
export function aggregateUsage(days) {
  const totals = emptyUsage();
  const agents = new Map();
  for (const day of days) {
    addUsage(totals, day);
    for (const agent of day.agents ?? []) {
      let aggregate = agents.get(agent.id);
      if (!aggregate) {
        aggregate = { id: agent.id, ...emptyUsage(), modelNames: new Set() };
        agents.set(agent.id, aggregate);
      }
      addUsage(aggregate, agent);
      for (const model of agent.models ?? []) aggregate.modelNames.add(model);
    }
  }
  return {
    ...totals,
    agents: [...agents.values()].map(({ modelNames, ...agent }) => ({
      ...agent,
      ...(modelNames.size ? { models: [...modelNames].sort() } : {}),
    })).sort((left, right) => right.totalCost - left.totalCost
      || right.totalTokens - left.totalTokens
      || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)),
  };
}

// Calendar arithmetic uses UTC so DST and the browser's timezone cannot shift a
// daily comparison. Reject normalized invalid dates such as February 30.
export function shiftDate(date, offset) {
  const time = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(time.getTime())
    || time.toISOString().slice(0, 10) !== date || !Number.isInteger(offset)) {
    throw new RangeError("Expected a calendar date and integer day offset");
  }
  time.setUTCDate(time.getUTCDate() + offset);
  if (!Number.isFinite(time.getTime()) || !/^\d{4}-\d{2}-\d{2}T/.test(time.toISOString())) {
    throw new RangeError("Shifted date is outside the supported calendar range");
  }
  return time.toISOString().slice(0, 10);
}

// A snapshot taken during a day cannot certify that day's full usage, even if
// it is viewed later. Use three consecutive covered days, including zero days.
export function recentDailyAverage(snapshot, now = new Date()) {
  const syncedDay = todayInZone(snapshot.timezone, new Date(snapshot.generatedAt));
  const today = todayInZone(snapshot.timezone, now);
  const through = [snapshot.coverage.through, shiftDate(syncedDay, -1), shiftDate(today, -1)].sort()[0];
  const from = shiftDate(through, -2);
  if (from < snapshot.coverage.from) return null;
  const days = snapshot.daily.filter((day) => day.date >= from && day.date <= through);
  return {
    from,
    through,
    costPerDay: days.reduce((sum, day) => sum + day.totalCost, 0) / 3,
    tokensPerDay: days.reduce((sum, day) => sum + day.totalTokens, 0) / 3,
  };
}

// A zero baseline has no percentage comparison, including zero versus zero.
// The absolute difference remains usable and never becomes an infinite percent.
export function usageDelta(value, baseline) {
  const difference = value - baseline;
  return { difference, percent: baseline === 0 ? null : difference / baseline * 100 };
}

// Compare to the previous calendar day, not the previous recorded/active day.
// A covered gap is a real zero; outside coverage remains unavailable.
export function previousDayUsage(snapshot, date) {
  const previousDate = shiftDate(date, -1);
  const available = previousDate >= snapshot.coverage.from && previousDate <= snapshot.coverage.through;
  return {
    date: previousDate,
    available,
    metrics: available ? aggregateUsage(snapshot.daily.filter((day) => day.date === previousDate)) : null,
  };
}
