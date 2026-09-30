import { useCallback, useEffect, useRef, useState } from "react";
import type { UsageMetrics as Metrics, UsageAgent as Agent, UsageSnapshot } from "./tokenmaxxing-types";

const metricKeys: (keyof Metrics)[] = ["inputTokens", "outputTokens", "cacheCreationTokens", "cacheReadTokens", "totalTokens", "totalCost"];
const agentNames = { claude: true, codex: true, antigravity: true, grok: true, hermes: true, kimi: true, opencode: true, other: true };
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validMetrics(value: unknown): value is Metrics {
  return typeof value === "object" && value !== null && metricKeys.every((key) => {
    const item = (value as Record<string, unknown>)[key];
    return typeof item === "number" && Number.isFinite(item) && item >= 0;
  });
}

function validAgents(value: unknown): value is Agent[] {
  return Array.isArray(value) && value.every((item) => {
    if (!validMetrics(item)) return false;
    const agent = item as Metrics & { id?: unknown; models?: unknown };
    return typeof agent.id === "string" && Object.hasOwn(agentNames, agent.id) &&
      (agent.models === undefined || (Array.isArray(agent.models) && agent.models.every((model) => typeof model === "string" && model.length > 0)));
  });
}

function readSnapshot(value: unknown): UsageSnapshot {
  const data = value as UsageSnapshot | null;
  if (!data || data.schemaVersion !== 1 || !Number.isFinite(Date.parse(data.generatedAt)) ||
    data.timezone !== "America/Los_Angeles" || !data.source || data.source.tool !== "ccusage" ||
    !data.coverage || !datePattern.test(data.coverage.from) || !datePattern.test(data.coverage.through) ||
    !validMetrics(data.totals) || !validAgents(data.agents) || !Array.isArray(data.daily) ||
    !data.daily.every((day) => validMetrics(day) && datePattern.test(day.date) && validAgents(day.agents)) ||
    !data.pricingGap || !Number.isFinite(data.pricingGap.totalTokens) || data.pricingGap.totalTokens < 0 ||
    !Number.isFinite(data.pricingGap.modelCount) || data.pricingGap.modelCount < 0) {
    throw new Error("Invalid usage snapshot");
  }
  return data;
}

export default function useUsageSnapshot() {
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const activeRequest = useRef<AbortController | null>(null);
  const snapshotRef = useRef<UsageSnapshot | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    if (!snapshotRef.current) setLoading(true);
    try {
      const response = await fetch(`/data/token-usage.json?t=${Math.floor(Date.now() / 60_000)}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Snapshot unavailable");
      const data = readSnapshot(await response.json());
      if (mounted.current && !controller.signal.aborted) {
        snapshotRef.current = data;
        setSnapshot(data);
        setError(false);
      }
    } catch {
      if (mounted.current && !controller.signal.aborted) setError(true);
    } finally {
      if (mounted.current && !controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60_000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { mounted.current = false; activeRequest.current?.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);

  return { snapshot, error, loading, refresh };
}
