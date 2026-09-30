import test from "node:test";
import assert from "node:assert/strict";
import { aggregateUsage, calendarFor, heatmapLevel, keyboardTarget, latestRecordedDate, previousDayUsage, shiftDate, todayInZone, usageDelta, weeklyKeyboardTarget, weeklyUsage } from "../src/token-heatmap-utils.mjs";

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

test("latest recorded date is selected independently for each year", () => {
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

test("weekly keyboard navigation moves through covered columns and stops at coverage boundaries", () => {
  const snapshot = { timezone: "America/Los_Angeles", coverage: { from: "2026-09-01", through: "2026-09-30" }, daily: [] };
  const weeks = weeklyUsage(2026, calendarFor(2026, snapshot, new Date("2026-10-01T12:00:00Z")));
  const latest = weeks.find((week) => week.start === "2026-09-27");
  const earlier = weeks.find((week) => week.start === "2026-09-20");
  const earliest = weeks.find((week) => week.available);
  assert.equal(weeklyKeyboardTarget(weeks, latest.index, "ArrowLeft"), earlier.index);
  assert.equal(weeklyKeyboardTarget(weeks, latest.index, "ArrowRight"), null);
  assert.equal(weeklyKeyboardTarget(weeks, earlier.index, "ArrowRight"), latest.index);
  assert.equal(weeklyKeyboardTarget(weeks, earliest.index, "ArrowLeft"), null);
  assert.equal(weeklyKeyboardTarget(weeks, latest.index, "Home"), earliest.index);
  assert.equal(weeklyKeyboardTarget(weeks, earlier.index, "End"), latest.index);
  assert.equal(weeklyKeyboardTarget(weeks, earlier.index, "Tab"), null);
});

test("usage aggregates sum all token components and cost without mutating daily entries", () => {
  const days = [
    {
      date: "2026-09-28", inputTokens: 10, outputTokens: 20, cacheCreationTokens: 30,
      cacheReadTokens: 40, totalTokens: 100, totalCost: 1.25,
      agents: [{ id: "claude", inputTokens: 10, outputTokens: 20, cacheCreationTokens: 30, cacheReadTokens: 40, totalTokens: 100, totalCost: 1.25, models: ["opus", "sonnet"] }],
    },
    {
      date: "2026-09-29", inputTokens: 1, outputTokens: 2, cacheCreationTokens: 3,
      cacheReadTokens: 4, totalTokens: 10, totalCost: 2.5,
      agents: [{ id: "claude", inputTokens: 1, outputTokens: 2, cacheCreationTokens: 3, cacheReadTokens: 4, totalTokens: 10, totalCost: 2.5, models: ["sonnet", "haiku"] }],
    },
  ];
  const original = structuredClone(days);
  const aggregate = aggregateUsage(days);
  const metrics = { inputTokens: 11, outputTokens: 22, cacheCreationTokens: 33, cacheReadTokens: 44, totalTokens: 110, totalCost: 3.75 };
  assert.deepEqual(aggregate, {
    ...metrics, agents: [{ id: "claude", ...metrics, models: ["haiku", "opus", "sonnet"] }],
  });
  assert.deepEqual(days, original);
  aggregate.agents[0].models.push("changed");
  assert.deepEqual(days, original);
});

test("usage aggregates keep agent model unions separate and sort deterministically", () => {
  const days = [{
    date: "2026-09-29", totalTokens: 1000, totalCost: 12,
    agents: [
      { id: "zeta", totalTokens: 10, totalCost: 4, models: ["z-model"] },
      { id: "beta", totalTokens: 20, totalCost: 4, models: ["b-model"] },
      { id: "alpha", totalTokens: 20, totalCost: 4 },
      { id: "gamma", totalTokens: 9999, totalCost: 3, models: ["g-model"] },
    ],
  }];
  const aggregate = aggregateUsage(days);
  assert.deepEqual(aggregate.agents.map((agent) => agent.id), ["alpha", "beta", "zeta", "gamma"]);
  assert.equal(aggregate.totalTokens, 1000);
  assert.equal(aggregate.totalCost, 12);
  assert.equal(aggregate.inputTokens, 0);
  assert.equal(aggregate.agents[0].models, undefined);
  assert.deepEqual(aggregate.agents[1].models, ["b-model"]);
  assert.deepEqual(aggregateUsage([{ ...days[0], agents: [...days[0].agents].reverse() }]), aggregate);
  assert.deepEqual(aggregateUsage([]), {
    inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
    totalTokens: 0, totalCost: 0, agents: [],
  });
});

test("date shifts follow UTC calendar days across leap days, years, and DST", () => {
  assert.equal(shiftDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDate("2024-03-01", -1), "2024-02-29");
  assert.equal(shiftDate("2025-03-01", -1), "2025-02-28");
  assert.equal(shiftDate("2026-03-08", 1), "2026-03-09");
  assert.equal(shiftDate("2026-11-01", -7), "2026-10-25");
  assert.throws(() => shiftDate("2026-02-30", 1), RangeError);
  assert.throws(() => shiftDate("2026-09-29", 0.5), RangeError);
});

test("usage deltas show signed changes with an unavailable percentage for zero baselines", () => {
  assert.deepEqual(usageDelta(150, 100), { difference: 50, percent: 50 });
  assert.deepEqual(usageDelta(50, 100), { difference: -50, percent: -50 });
  assert.deepEqual(usageDelta(100, 100), { difference: 0, percent: 0 });
  assert.deepEqual(usageDelta(25, 0), { difference: 25, percent: null });
  assert.deepEqual(usageDelta(0, 0), { difference: 0, percent: null });
  assert.deepEqual(usageDelta(0, 100), { difference: -100, percent: -100 });
});

test("previous-day comparison uses the calendar day and distinguishes covered gaps from missing coverage", () => {
  const snapshot = {
    coverage: { from: "2025-12-31", through: "2026-01-03" },
    daily: [
      { date: "2025-12-31", totalTokens: 200, totalCost: 5, agents: [{ id: "codex", totalTokens: 200, totalCost: 5, models: ["gpt"] }] },
      { date: "2026-01-02", totalTokens: 300, totalCost: 10, agents: [] },
    ],
  };
  const crossYear = previousDayUsage(snapshot, "2026-01-01");
  assert.equal(crossYear.date, "2025-12-31");
  assert.equal(crossYear.available, true);
  assert.equal(crossYear.metrics.totalCost, 5);
  assert.deepEqual(crossYear.metrics.agents[0].models, ["gpt"]);
  const gap = previousDayUsage(snapshot, "2026-01-02");
  assert.equal(gap.date, "2026-01-01");
  assert.equal(gap.available, true);
  assert.deepEqual(gap.metrics, aggregateUsage([]));
  assert.deepEqual(previousDayUsage(snapshot, "2025-12-31"), { date: "2025-12-30", available: false, metrics: null });
  assert.deepEqual(previousDayUsage(snapshot, "2026-01-05"), { date: "2026-01-04", available: false, metrics: null });
  assert.equal(previousDayUsage(snapshot, "2026-01-04").available, true);
});
