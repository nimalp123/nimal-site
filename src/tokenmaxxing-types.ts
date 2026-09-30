export type UsageMetrics = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
};

export type UsageAgent = UsageMetrics & { id: string };
export type UsageDay = UsageMetrics & { date: string; agents: UsageAgent[] };
export type UsageSnapshot = {
  schemaVersion: 1;
  generatedAt: string;
  timezone: string;
  source: { tool: string; version: string; scope: string };
  coverage: { from: string; through: string };
  pricingGap: { modelCount: number; totalTokens: number };
  totals: UsageMetrics;
  agents: UsageAgent[];
  daily: UsageDay[];
};
