import test from "node:test";
import assert from "node:assert/strict";
import { calendarFor, displayedDate, displayedWeek, heatmapLevel, keyboardTarget, latestRecordedDate, todayInZone, weeklyKeyboardTarget, weeklyUsage } from "../src/token-heatmap-utils.mjs";

test("fixed API value bands keep a quiet day visibly below real burst days", () => {
  assert.equal(heatmapLevel(0, "cost"), 0);
  assert.equal(heatmapLevel(0.01, "cost"), 1);
  for (const [threshold, level] of [[10, 2], [100, 3], [500, 4], [1000, 5], [2000, 6]]) {
    assert.equal(heatmapLevel(threshold - 0.01, "cost"), level - 1);
    assert.equal(heatmapLevel(threshold, "cost"), level);
  }
  assert.equal(heatmapLevel(2474.60, "cost"), 6);
  assert.equal(heatmapLevel(1962.67, "cost"), 5);
  assert.equal(heatmapLevel(1304.71, "cost"), 5);
  assert.ok(heatmapLevel(12, "cost") < heatmapLevel(1304.71, "cost"));
});

test("token bands distinguish small usage, billion-token bursts, and true peaks", () => {
  assert.equal(heatmapLevel(0, "tokens"), 0);
  assert.equal(heatmapLevel(1, "tokens"), 1);
  for (const [threshold, level] of [[1e6, 2], [1e7, 3], [1e8, 4], [1e9, 5], [3e9, 6]]) {
    assert.equal(heatmapLevel(threshold - 1, "tokens"), level - 1);
    assert.equal(heatmapLevel(threshold, "tokens"), level);
  }
  assert.equal(heatmapLevel(5_549_221_683, "tokens"), 6);
  assert.equal(heatmapLevel(2_040_000_000, "tokens"), 5);
  assert.equal(heatmapLevel(80_000_000, "tokens"), 3);
  assert.equal(heatmapLevel(Number.NaN, "tokens"), 0);
});

test("calendar includes leap day, zero-use gaps, and a separate unavailable region", () => {
  const snapshot = {
    timezone: "America/Los_Angeles",
    coverage: { from: "2024-02-28", through: "2024-03-02" },
    daily: [{ date: "2024-02-28", totalTokens: 0 }, { date: "2024-03-02", totalTokens: 200 }],
  };
  const calendar = calendarFor(2024, snapshot, new Date("2024-03-03T12:00:00Z"));
  assert.equal(calendar.cells.length, 366);
  assert.equal(calendar.months.length, 12);
  assert.equal(calendar.cells.find((day) => day.date === "2024-02-29").available, true);
  assert.equal(calendar.cells.find((day) => day.date === "2024-03-01").day, undefined);
  assert.equal(calendar.cells.find((day) => day.date === "2024-02-27").available, false);
  assert.equal(calendar.cells.find((day) => day.date === "2024-03-03").available, false);
  assert.equal(calendar.cells.find((day) => day.date === "2024-02-29").weekday, 4);
  assert.ok(calendar.cells.every((cell) => cell.week >= 0 && cell.week < calendar.weeks));
});

test("Pacific midnight controls unrecorded dates independently of UTC midnight", () => {
  const now = new Date("2026-10-01T02:00:00Z");
  assert.equal(todayInZone("America/Los_Angeles", now), "2026-09-30");
  const snapshot = { timezone: "America/Los_Angeles", coverage: { from: "2026-09-29", through: "2026-10-02" }, daily: [{ date: "2026-09-30" }] };
  const calendar = calendarFor(2026, snapshot, now);
  assert.equal(calendar.cells.find((cell) => cell.date === "2026-09-30").available, true);
  assert.equal(calendar.cells.find((cell) => cell.date === "2026-10-01").available, false);
});

test("hover/focus preview is temporary and restores latest or explicitly pinned day", () => {
  const availableDates = new Set(["2026-09-28", "2026-09-29", "2026-09-30"]);
  const base = { availableDates, latest: "2026-09-30", pinned: null, preview: null };
  assert.equal(displayedDate(base), "2026-09-30");
  assert.equal(displayedDate({ ...base, preview: "2026-09-28" }), "2026-09-28");
  assert.equal(displayedDate({ ...base, pinned: "2026-09-29", preview: "2026-09-28" }), "2026-09-28");
  assert.equal(displayedDate({ ...base, pinned: "2026-09-29" }), "2026-09-29");
  assert.equal(displayedDate({ ...base, pinned: "2024-01-01", preview: "2024-01-01" }), "2026-09-30");
});

test("unpinned selection follows the newest recorded day in the selected year", () => {
  const days = [{ date: "2025-12-31" }, { date: "2026-09-29" }, { date: "2026-09-28" }];
  assert.equal(latestRecordedDate(days, 2026), "2026-09-29");
  assert.equal(latestRecordedDate([...days, { date: "2026-09-30" }], 2026), "2026-09-30");
  assert.equal(latestRecordedDate(days, 2025), "2025-12-31");
  assert.equal(latestRecordedDate(days, 2024), null);
});

test("roving keyboard navigation follows week columns without entering unavailable dates", () => {
  const snapshot = { timezone: "America/Los_Angeles", coverage: { from: "2026-09-01", through: "2026-09-30" }, daily: [] };
  const { cells } = calendarFor(2026, snapshot, new Date("2026-10-01T12:00:00Z"));
  assert.equal(keyboardTarget(cells, "2026-09-15", "ArrowRight"), "2026-09-22");
  assert.equal(keyboardTarget(cells, "2026-09-15", "ArrowLeft"), "2026-09-08");
  assert.equal(keyboardTarget(cells, "2026-09-15", "ArrowUp"), "2026-09-14");
  assert.equal(keyboardTarget(cells, "2026-09-15", "ArrowDown"), "2026-09-16");
  assert.equal(keyboardTarget(cells, "2026-09-15", "Home"), "2026-09-01");
  assert.equal(keyboardTarget(cells, "2026-09-15", "End"), "2026-09-30");
  assert.equal(keyboardTarget(cells, "2026-09-30", "ArrowDown"), null);
  assert.equal(keyboardTarget(cells, "2026-09-01", "ArrowLeft"), null);
  assert.equal(keyboardTarget(cells, "2026-09-15", "Tab"), null);
});

test("weekly columns sum observed Sunday–Saturday entries and exclude unavailable dates", () => {
  const snapshot = {
    timezone: "America/Los_Angeles",
    coverage: { from: "2026-09-23", through: "2026-09-30" },
    daily: [
      { date: "2026-09-22", totalTokens: 999, totalCost: 999 },
      { date: "2026-09-23", totalTokens: 100, totalCost: 1.25 },
      { date: "2026-09-26", totalTokens: 200, totalCost: 2.5 },
      { date: "2026-09-27", totalTokens: 1000, totalCost: 10.25 },
      { date: "2026-09-30", totalTokens: 2000, totalCost: 20.5 },
      { date: "2026-10-01", totalTokens: 999, totalCost: 999 },
    ],
  };
  const calendar = calendarFor(2026, snapshot, new Date("2026-10-02T12:00:00Z"));
  const weeks = weeklyUsage(2026, calendar);
  const first = weeks.find((week) => week.start === "2026-09-20");
  assert.equal(first.end, "2026-09-26");
  assert.equal(first.totalTokens, 300);
  assert.equal(first.totalCost, 3.75);
  assert.equal(first.coveredDays, 4);
  assert.equal(first.observedDays, 2);
  assert.equal(first.partial, true);
  assert.equal(first.coveredFrom, "2026-09-23");
  const second = weeks.find((week) => week.start === "2026-09-27");
  assert.equal(second.totalTokens, 3000);
  assert.equal(second.totalCost, 30.75);
  assert.equal(second.activeDays, 2);
  assert.equal(second.coveredThrough, "2026-09-30");
  assert.equal(weeks.reduce((sum, week) => sum + week.totalTokens, 0), 3300);
});

test("year boundaries remain partial and do not double-count cross-year entries", () => {
  const snapshot = {
    timezone: "America/Los_Angeles", coverage: { from: "2025-12-28", through: "2026-12-31" },
    daily: [{ date: "2025-12-31", totalTokens: 50, totalCost: 5 }, { date: "2026-01-01", totalTokens: 70, totalCost: 7 }, { date: "2026-12-31", totalTokens: 90, totalCost: 9 }],
  };
  const weeks = weeklyUsage(2026, calendarFor(2026, snapshot, new Date("2027-01-01T12:00:00Z")));
  assert.equal(weeks[0].start, "2025-12-28");
  assert.equal(weeks[0].end, "2026-01-03");
  assert.equal(weeks[0].partial, true);
  assert.equal(weeks[0].coveredDays, 3);
  assert.equal(weeks[0].totalTokens, 70);
  assert.equal(weeks.at(-1).start, "2026-12-27");
  assert.equal(weeks.at(-1).end, "2027-01-02");
  assert.equal(weeks.at(-1).partial, true);
  assert.equal(weeks.at(-1).coveredDays, 5);
  assert.equal(weeks.at(-1).totalTokens, 90);
  assert.equal(weeks.reduce((sum, week) => sum + week.totalTokens, 0), 160);
});

test("zero-use covered weeks remain distinct from unavailable weeks", () => {
  const snapshot = { timezone: "America/Los_Angeles", coverage: { from: "2026-09-20", through: "2026-09-26" }, daily: [] };
  const weeks = weeklyUsage(2026, calendarFor(2026, snapshot, new Date("2026-10-01T12:00:00Z")));
  const covered = weeks.find((week) => week.start === "2026-09-20");
  const unavailable = weeks.find((week) => week.start === "2026-09-27");
  assert.equal(covered.available, true);
  assert.equal(covered.partial, false);
  assert.equal(covered.observedDays, 0);
  assert.equal(covered.totalTokens, 0);
  assert.equal(unavailable.available, false);
  assert.equal(unavailable.coveredDays, 0);
  assert.equal(unavailable.coveredFrom, null);
});

test("weekly hover previews restore the selected day's week or explicit weekly pin", () => {
  const snapshot = { timezone: "America/Los_Angeles", coverage: { from: "2026-09-01", through: "2026-09-30" }, daily: [] };
  const weeks = weeklyUsage(2026, calendarFor(2026, snapshot, new Date("2026-10-01T12:00:00Z")));
  const latest = weeks.find((week) => week.start === "2026-09-27");
  const earlier = weeks.find((week) => week.start === "2026-09-20");
  const outside = weeks[0];
  const base = { weeks, selectedDate: "2026-09-30", pinned: null, preview: null };
  assert.equal(displayedWeek(base).index, latest.index);
  assert.equal(displayedWeek({ ...base, preview: earlier.index }).index, earlier.index);
  assert.equal(displayedWeek({ ...base, pinned: earlier.index }).index, earlier.index);
  assert.equal(displayedWeek({ ...base, pinned: earlier.index, preview: latest.index }).index, latest.index);
  assert.equal(displayedWeek({ ...base, pinned: outside.index }).index, latest.index);
  assert.equal(displayedWeek({ ...base, preview: outside.index }).available, false);
  assert.equal(weeklyKeyboardTarget(weeks, latest.index, "ArrowLeft"), earlier.index);
  assert.equal(weeklyKeyboardTarget(weeks, latest.index, "ArrowRight"), null);
  assert.equal(weeklyKeyboardTarget(weeks, earlier.index, "End"), latest.index);
});
