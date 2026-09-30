import type { UsageAgent, UsageDay, UsageMetrics, UsageSnapshot } from "./tokenmaxxing-types";
export type HeatMetric = "tokens" | "cost";
export type CalendarCell = { date: string; weekday: number; week: number; day?: UsageDay; available: boolean };
export const heatmapBands: Record<HeatMetric, { lower: number; label: string }[]>;
export function heatmapLevel(value: number, metric: HeatMetric): number;
export function todayInZone(timezone: string, now?: Date): string;
export function calendarFor(year: number, snapshot: UsageSnapshot, now?: Date): {
  cells: CalendarCell[];
  months: { label: string; week: number }[];
  weeks: number;
};
export function latestRecordedDate(days: UsageDay[], year: number): string | null;
export function keyboardTarget(cells: CalendarCell[], date: string, key: string): string | null;
export type UsageWeek = {
  index: number;
  start: string;
  end: string;
  coveredFrom: string | null;
  coveredThrough: string | null;
  coveredDays: number;
  observedDays: number;
  activeDays: number;
  available: boolean;
  partial: boolean;
  totalTokens: number;
  totalCost: number;
  cells: CalendarCell[];
};
export function weeklyUsage(year: number, calendar: { cells: CalendarCell[]; weeks: number }): UsageWeek[];
export function weeklyKeyboardTarget(weeks: UsageWeek[], index: number, key: string): number | null;
export type AggregatedUsage = UsageMetrics & { agents: UsageAgent[] };
export function aggregateUsage(days: UsageDay[]): AggregatedUsage;
export function shiftDate(date: string, offset: number): string;
/** A zero baseline always returns a null percent, including zero versus zero. */
export function usageDelta(value: number, baseline: number): { difference: number; percent: number | null };
export function previousDayUsage(snapshot: UsageSnapshot, date: string): {
  date: string;
  available: boolean;
  metrics: AggregatedUsage | null;
};
