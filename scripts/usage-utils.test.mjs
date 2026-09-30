import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPublicUsage, validatePublicUsage, sameUsage, publishPublicUsage,
  PUBLIC_USAGE_REPO, PUBLIC_USAGE_PATH,
} from "./usage-utils.mjs";

const time = "2026-09-30T12:00:00.000Z";
const counts = {
  inputTokens: 10, outputTokens: 5, cacheCreationTokens: 3,
  cacheReadTokens: 20, totalTokens: 40, totalCost: 0.25,
};
const breakdown = {
  modelName: "private-model-label", inputTokens: 10, outputTokens: 5,
  cacheCreationTokens: 3, cacheReadTokens: 20, cost: 0,
};
function raw() {
  return {
    daily: [{
      period: "2026-09-29", agent: "all", ...counts,
      metadata: { project: "/private/client-code", prompt: "private prompt", session: "private-id" },
      modelsUsed: ["private-model-label"], modelBreakdowns: [breakdown],
      agents: [{ agent: "codex", ...counts, modelBreakdowns: [breakdown] }],
    }],
    totals: { ...counts, unpricedModels: ["private-model-label"] },
  };
}
function snapshot() { return buildPublicUsage(raw(), { generatedAt: time }); }

test("an allowlisted aggregate removes private metadata and model labels without double-counting", () => {
  const result = snapshot();
  assert.deepEqual(result.totals, counts);
  assert.deepEqual(result.pricingGap, { modelCount: 1, totalTokens: 38 });
  assert.deepEqual(result.coverage, { from: "2026-09-29", through: "2026-09-29" });
  assert.equal(result.agents[0].id, "codex");
  assert.equal(result.source.tool, "ccusage");
  for (const secret of ["private-model-label", "/private/client-code", "private prompt", "private-id", "modelsUsed", "modelBreakdowns", "metadata"]) {
    assert.equal(JSON.stringify(result).includes(secret), false);
  }
  // ccusage totalTokens can include tokens not itemized in its four component columns.
  assert.equal(result.totals.totalTokens, 40);
  assert.deepEqual(validatePublicUsage(result), result);
});

test("legacy daily rows and distinct per-agent rows are grouped and totals are recomputed", () => {
  const result = buildPublicUsage({ daily: [
    { date: "2026-09-30", agent: "claude", ...counts },
    { date: "2026-09-29", agent: "unknown-local-tool", ...counts },
    { date: "2026-09-30", agent: "codex", ...counts },
  ] }, { generatedAt: time });
  assert.equal(result.daily.length, 2);
  assert.equal(result.daily[1].totalTokens, 80);
  assert.equal(result.totals.totalTokens, 120);
  assert.deepEqual(result.agents.map((agent) => agent.id), ["claude", "codex", "other"]);
  assert.equal(JSON.stringify(result).includes("unknown-local-tool"), false);
  assert.deepEqual(result.pricingGap, { modelCount: 0, totalTokens: 0 });
  const legacy = buildPublicUsage({ daily: [{ date: "2026-09-29", ...counts }] }, { generatedAt: time });
  assert.equal(legacy.agents[0].id, "claude");
});

test("malformed dates, numeric values, duplicate aggregate rows, and mismatched totals are rejected", () => {
  for (const value of ["2026-02-30", "2025-02-29", "2026-9-30", "garbage", null]) {
    const input = raw(); input.daily[0].period = value;
    assert.throws(() => buildPublicUsage(input), /Invalid usage data/);
  }
  for (const value of [-1, Infinity, NaN, "10", 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const input = raw(); input.daily[0].inputTokens = value;
    assert.throws(() => buildPublicUsage(input), /Invalid usage data/);
  }
  const inconsistent = raw(); inconsistent.daily[0].agents[0].totalTokens++;
  assert.throws(() => buildPublicUsage(inconsistent), /Invalid usage data/);
  const duplicate = raw(); duplicate.daily.push(duplicate.daily[0]);
  assert.throws(() => buildPublicUsage(duplicate), /Invalid usage data/);
  const badTotals = raw(); badTotals.totals.totalCost++;
  assert.throws(() => buildPublicUsage(badTotals), /Invalid usage data/);
  assert.throws(() => buildPublicUsage({ daily: [] }), /Invalid usage data/);
});

test("public snapshot validation strips added fields but refuses altered summary integrity", () => {
  const input = snapshot();
  input.privatePath = "/private";
  input.source.token = "secret";
  input.daily[0].session = "secret";
  assert.deepEqual(validatePublicUsage(input), snapshot());
  input.coverage.through = "2026-09-30";
  assert.throws(() => validatePublicUsage(input), /Invalid usage data/);
  const inconsistent = snapshot(); inconsistent.agents[0].totalTokens++;
  assert.throws(() => validatePublicUsage(inconsistent), /Invalid usage data/);
  const gap = snapshot(); gap.pricingGap.totalTokens = 10_000;
  assert.throws(() => validatePublicUsage(gap), /Invalid usage data/);
  const nextTime = snapshot(); nextTime.generatedAt = "2026-09-30T13:00:00.000Z";
  assert.equal(sameUsage(snapshot(), nextTime), true);
});

function publicRepo() {
  return { status: 200, data: { full_name: PUBLIC_USAGE_REPO, private: false, visibility: "public", default_branch: "main" } };
}
function contents(data) {
  return { status: 200, data: {
    type: "file", path: PUBLIC_USAGE_PATH, encoding: "base64", sha: "a".repeat(40),
    content: Buffer.from(JSON.stringify(data)).toString("base64"),
  } };
}

test("publisher writes only the fixed public file with structured content and checks visibility twice", async () => {
  const calls = [];
  const result = await publishPublicUsage(snapshot(), { api: async (endpoint, options) => {
    calls.push({ endpoint, options });
    if (endpoint === `repos/${PUBLIC_USAGE_REPO}`) return publicRepo();
    if (options.method === "GET") return { status: 404 };
    assert.equal(endpoint, `repos/${PUBLIC_USAGE_REPO}/contents/${PUBLIC_USAGE_PATH}`);
    assert.equal(options.body.branch, "main");
    assert.equal(options.body.sha, undefined);
    assert.deepEqual(JSON.parse(Buffer.from(options.body.content, "base64").toString()), snapshot());
    return { status: 201 };
  } });
  assert.deepEqual(result, { changed: true });
  assert.equal(calls.filter((call) => call.endpoint === `repos/${PUBLIC_USAGE_REPO}`).length, 2);
  assert.equal(calls.filter((call) => call.options.method === "PUT").length, 1);
});

test("publisher skips timestamp-only changes and refuses private or unexpected target repositories", async () => {
  const later = snapshot(); later.generatedAt = "2026-09-30T13:00:00.000Z";
  let writes = 0;
  const result = await publishPublicUsage(later, { api: async (endpoint, options) => {
    if (options.method === "PUT") writes++;
    return endpoint === `repos/${PUBLIC_USAGE_REPO}` ? publicRepo() : contents(snapshot());
  } });
  assert.deepEqual(result, { changed: false });
  assert.equal(writes, 0);
  for (const change of [ { private: true }, { visibility: "private" }, { full_name: "nimalp123/private-repo" }, { default_branch: "staging" } ]) {
    let calls = 0;
    await assert.rejects(publishPublicUsage(snapshot(), { api: async () => {
      calls++; const result = publicRepo(); Object.assign(result.data, change); return result;
    } }), /Public usage repository check failed/);
    assert.equal(calls, 1);
  }
});

test("publisher retries one conflicting contents update without forcing a revision", async () => {
  const previous = snapshot(); previous.generatedAt = "2026-09-29T12:00:00.000Z";
  previous.daily[0].totalCost = 0.1; previous.agents[0].totalCost = 0.1;
  previous.daily[0].agents[0].totalCost = 0.1; previous.totals.totalCost = 0.1;
  let attempts = 0;
  await publishPublicUsage(snapshot(), { api: async (endpoint, options) => {
    if (endpoint === `repos/${PUBLIC_USAGE_REPO}`) return publicRepo();
    if (options.method === "GET") return contents(previous);
    assert.equal(options.body.sha, "a".repeat(40));
    attempts++;
    return { status: attempts === 1 ? 409 : 200 };
  } });
  assert.equal(attempts, 2);
});
