import test from "node:test";
import assert from "node:assert/strict";
import { calendarFor, displayedDate, heatmapLevel, keyboardTarget, latestRecordedDate, todayInZone } from "../src/token-heatmap-utils.mjs";

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
