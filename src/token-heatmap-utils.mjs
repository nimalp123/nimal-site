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

// Preview is transient; pins are explicit. An unpinned view follows a new feed day.
export function displayedDate({ availableDates, latest, pinned, preview }) {
  return [preview, pinned, latest].find((date) => date && availableDates.has(date)) ?? null;
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

export function displayedWeek({ weeks, selectedDate, pinned, preview }) {
  const previewWeek = preview !== null ? weeks.find((week) => week.index === preview) : null;
  if (previewWeek) return previewWeek;
  const pinnedWeek = pinned !== null ? weeks.find((week) => week.index === pinned && week.available) : null;
  if (pinnedWeek) return pinnedWeek;
  return weeks.find((week) => week.cells.some((cell) => cell.date === selectedDate && cell.available)) ?? null;
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
