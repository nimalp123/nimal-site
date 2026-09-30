import type { UsageDay, UsageSnapshot } from "./tokenmaxxing-types";
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
export function displayedDate(options: {
  availableDates: Set<string>;
  latest: string | null;
  pinned: string | null;
  preview: string | null;
}): string | null;
export function keyboardTarget(cells: CalendarCell[], date: string, key: string): string | null;
