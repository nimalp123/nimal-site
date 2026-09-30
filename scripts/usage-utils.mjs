export const USAGE_VERSION = "20.0.26";
export const USAGE_TIMEZONE = "America/Los_Angeles";
export const USAGE_SCOPE = "Local CLI usage on Nimal’s MacBook";
export const PUBLIC_USAGE_REPO = "nimalp123/nimalp123";
export const PUBLIC_USAGE_PATH = "data/token-usage.json";

const agents = new Set([
  "claude", "codex", "antigravity", "grok", "hermes", "kimi", "opencode", "other",
]);
export const USAGE_METRICS = [
  "inputTokens", "outputTokens", "cacheCreationTokens", "cacheReadTokens",
  "totalTokens", "totalCost",
];
const components = USAGE_METRICS.slice(0, 4);

function invalid() {
  throw new Error("Invalid usage data");
}

function number(value, cost = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
      (!cost && !Number.isSafeInteger(value))) invalid();
  return value;
}

function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid();
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) invalid();
  return value;
}

function timestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) invalid();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) invalid();
  return value;
}

function metrics(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return Object.fromEntries(USAGE_METRICS.map((key) => [key, number(
    value[key] ?? (key === "cacheCreationTokens" || key === "cacheReadTokens" ? 0 : undefined),
    key === "totalCost",
  )]));
}

function zero() {
  return Object.fromEntries(USAGE_METRICS.map((key) => [key, 0]));
}

function add(target, value) {
  for (const key of USAGE_METRICS) target[key] = number(target[key] + value[key], key === "totalCost");
}

function equalMetrics(first, second) {
  for (const key of USAGE_METRICS) {
    const tolerance = key === "totalCost" ? Math.max(0.0000001, first[key] * 1e-10) : 0;
    if (Math.abs(first[key] - second[key]) > tolerance) invalid();
  }
}

function agentId(value) {
  return agents.has(value) ? value : "other";
}

function sortedAgents(map) {
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, counts]) => ({ id, ...counts }));
}

function mergeAgent(map, id, counts) {
  if (!map.has(id)) map.set(id, zero());
  add(map.get(id), counts);
}

function unpricedTokens(row, unpriced) {
  // The aggregate and agent breakdowns describe the same usage. Read exactly one.
  const breakdowns = Array.isArray(row.modelBreakdowns)
    ? row.modelBreakdowns
    : Array.isArray(row.agents)
      ? row.agents.flatMap((entry) => entry.modelBreakdowns ?? [])
      : [];
  if (!Array.isArray(breakdowns)) invalid();
  let result = 0;
  for (const breakdown of breakdowns) {
    if (!breakdown || typeof breakdown.modelName !== "string") invalid();
    const tokens = components.reduce((sum, key) => sum + number(breakdown[key] ?? 0), 0);
    number(tokens);
    if (unpriced.has(breakdown.modelName)) result = number(result + tokens);
  }
  return result;
}

/** Build public data from an allowlist. No paths, projects, sessions, or model names survive. */
export function buildPublicUsage(input, {
  generatedAt = new Date().toISOString(),
  version = USAGE_VERSION,
} = {}) {
  if (!input || !Array.isArray(input.daily) || input.daily.length === 0 ||
      typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) invalid();
  timestamp(generatedAt);
  const unpricedNames = input.totals?.unpricedModels ?? [];
  if (!Array.isArray(unpricedNames) || unpricedNames.some((value) => typeof value !== "string")) invalid();
  const unpriced = new Set(unpricedNames);
  const days = new Map();
  let gapTokens = 0;
  for (const row of input.daily) {
    if (!row || typeof row !== "object") invalid();
    const day = date(row.period ?? row.date);
    const counts = metrics(row);
    const grouped = new Map();
    const hasAgents = Array.isArray(row.agents) && row.agents.length > 0;
    if (row.agents !== undefined && !Array.isArray(row.agents)) invalid();
    if (hasAgents) {
      const sum = zero();
      for (const entry of row.agents) {
        const values = metrics(entry);
        add(sum, values);
        mergeAgent(grouped, agentId(entry.agent ?? entry.id), values);
      }
      equalMetrics(counts, sum);
    } else {
      mergeAgent(grouped, agentId(row.agent ?? "claude"), counts);
    }
    const rawAgent = typeof row.agent === "string" ? row.agent : "claude";
    const aggregate = hasAgents || rawAgent === "all";
    if (!days.has(day)) days.set(day, { counts: zero(), agents: new Map(), aggregate: false, rawAgents: new Set() });
    const target = days.get(day);
    // Multiple distinct agent rows are valid; repeated aggregate/agent rows are ambiguous.
    if (target.rawAgents.size && (aggregate || target.aggregate || target.rawAgents.has(rawAgent))) invalid();
    target.rawAgents.add(rawAgent);
    target.aggregate ||= aggregate;
    add(target.counts, counts);
    for (const [id, values] of grouped) mergeAgent(target.agents, id, values);
    gapTokens = number(gapTokens + unpricedTokens(row, unpriced));
  }
  const totals = zero();
  const allAgents = new Map();
  const daily = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, values]) => {
    add(totals, values.counts);
    for (const [id, counts] of values.agents) mergeAgent(allAgents, id, counts);
    return { date: day, ...values.counts, agents: sortedAgents(values.agents) };
  });
  if (input.totals && USAGE_METRICS.every((key) => input.totals[key] !== undefined)) {
    equalMetrics(totals, metrics(input.totals));
  }
  return {
    schemaVersion: 1,
    generatedAt,
    timezone: USAGE_TIMEZONE,
    source: { tool: "ccusage", version, scope: USAGE_SCOPE },
    coverage: { from: daily[0].date, through: daily.at(-1).date },
    pricingGap: { modelCount: unpriced.size, totalTokens: gapTokens },
    totals,
    agents: sortedAgents(allAgents),
    daily,
  };
}

/** Revalidate public snapshots and reconstruct them instead of forwarding unknown fields. */
export function validatePublicUsage(input) {
  if (!input || input.schemaVersion !== 1 || input.timezone !== USAGE_TIMEZONE ||
      input.source?.tool !== "ccusage" || !Array.isArray(input.agents)) invalid();
  const output = buildPublicUsage({
    daily: input.daily,
    totals: input.totals,
  }, { generatedAt: input.generatedAt, version: input.source.version });
  equalMetrics(output.totals, metrics(input.totals));
  if (input.coverage?.from !== output.coverage.from || input.coverage?.through !== output.coverage.through) invalid();
  const providedAgents = new Map();
  for (const entry of input.agents) {
    if (!entry || !agents.has(entry.id) || providedAgents.has(entry.id)) invalid();
    providedAgents.set(entry.id, metrics(entry));
  }
  if (providedAgents.size !== output.agents.length) invalid();
  for (const entry of output.agents) {
    if (!providedAgents.has(entry.id)) invalid();
    equalMetrics(entry, providedAgents.get(entry.id));
  }
  const modelCount = number(input.pricingGap?.modelCount);
  const totalTokens = number(input.pricingGap?.totalTokens);
  const componentTotal = components.reduce((sum, key) => sum + output.totals[key], 0);
  if (totalTokens > componentTotal || (modelCount === 0 && totalTokens !== 0)) invalid();
  output.pricingGap = { modelCount, totalTokens };
  return output;
}

export function sameUsage(first, second) {
  const { generatedAt: _first, ...a } = validatePublicUsage(first);
  const { generatedAt: _second, ...b } = validatePublicUsage(second);
  return JSON.stringify(a) === JSON.stringify(b);
}

export function serializeUsage(value) {
  return `${JSON.stringify(validatePublicUsage(value), null, 2)}\n`;
}

/** A narrow public-file publisher. Callers cannot override its repository, branch, or path. */
export async function publishPublicUsage(snapshot, { api } = {}) {
  if (typeof api !== "function") throw new Error("GitHub API is not configured");
  const sanitized = validatePublicUsage(snapshot);
  async function verifyPublicTarget() {
    const result = await api(`repos/${PUBLIC_USAGE_REPO}`, { method: "GET" });
    if (result.status !== 200 || result.data?.full_name !== PUBLIC_USAGE_REPO ||
        result.data?.private !== false || result.data?.visibility !== "public" ||
        result.data?.default_branch !== "main") throw new Error("Public usage repository check failed");
  }
  async function existing() {
    const result = await api(`repos/${PUBLIC_USAGE_REPO}/contents/${PUBLIC_USAGE_PATH}?ref=main`, { method: "GET" });
    if (result.status === 404) return undefined;
    if (result.status !== 200 || result.data?.type !== "file" || result.data?.path !== PUBLIC_USAGE_PATH ||
        result.data?.encoding !== "base64" || !/^[a-f0-9]{40}$/.test(result.data?.sha ?? "")) {
      throw new Error("Public usage snapshot could not be read");
    }
    let data;
    try { data = JSON.parse(Buffer.from(result.data.content, "base64").toString("utf8")); }
    catch { throw new Error("Public usage snapshot is invalid"); }
    return { sha: result.data.sha, data: validatePublicUsage(data) };
  }
  await verifyPublicTarget();
  let current = await existing();
  for (let attempt = 0; attempt < 2; attempt++) {
    if (current && sameUsage(current.data, sanitized)) return { changed: false };
    await verifyPublicTarget();
    const body = {
      message: "Update token usage snapshot",
      branch: "main",
      content: Buffer.from(serializeUsage(sanitized)).toString("base64"),
      ...(current ? { sha: current.sha } : {}),
    };
    const result = await api(`repos/${PUBLIC_USAGE_REPO}/contents/${PUBLIC_USAGE_PATH}`, { method: "PUT", body });
    if (result.status === 200 || result.status === 201) return { changed: true };
    if (attempt === 0 && (result.status === 409 || result.status === 422)) {
      await verifyPublicTarget();
      current = await existing();
    } else throw new Error("Public usage snapshot could not be published");
  }
  throw new Error("Public usage snapshot could not be published");
}
