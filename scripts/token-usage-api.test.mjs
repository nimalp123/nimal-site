import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicUsage } from "./usage-utils.mjs";
import { createTokenUsageHandler } from "../server/token-usage.js";

function snapshot() {
  return buildPublicUsage({ daily: [{
    date: "2026-09-29", agent: "codex", inputTokens: 10, outputTokens: 5,
    cacheCreationTokens: 3, cacheReadTokens: 20, totalTokens: 40, totalCost: 0.25,
    modelsUsed: ["gpt-6.1-sol"],
  }] }, { generatedAt: "2026-09-30T12:00:00.000Z" });
}
function response() {
  return {
    headers: {}, setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body ? JSON.parse(body) : undefined; },
  };
}

test("usage API fixes its upstream, strips unknown data, coalesces reads, and refreshes after 60 seconds", async () => {
  let clock = 1_000;
  let calls = 0;
  const source = snapshot(); source.privateField = "not public";
  const handler = createTokenUsageHandler({ now: () => clock, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, "https://raw.githubusercontent.com/nimalp123/nimalp123/main/data/token-usage.json");
    assert.equal(options.method, "GET");
    assert.deepEqual(options.headers, { Accept: "application/json" });
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => source };
  } });
  const first = response(); const second = response();
  await Promise.all([
    handler({ method: "GET", url: "/?upstream=https://private.example" }, first),
    handler({ method: "GET" }, second),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(first.body, snapshot());
  assert.deepEqual(first.body.daily[0].agents[0].models, ["gpt-6.1-sol"]);
  assert.equal(first.headers["X-Usage-Source"], "live");
  assert.equal(first.headers["Cache-Control"], "public, max-age=0, s-maxage=60, stale-while-revalidate=60");
  const notModified = response();
  await handler({ method: "GET", headers: { "if-none-match": first.headers.ETag } }, notModified);
  assert.equal(notModified.statusCode, 304);
  assert.equal(notModified.body, undefined);
  const head = response(); await handler({ method: "HEAD" }, head);
  assert.equal(head.statusCode, 200); assert.equal(head.body, undefined);
  clock += 60_001;
  const refreshed = response(); await handler({ method: "GET" }, refreshed);
  assert.equal(calls, 2);
});

test("usage API serves the real dated snapshot on unavailable or invalid upstream", async () => {
  for (const fetchImpl of [
    async () => { throw new Error("private diagnostic with secrets"); },
    async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => ({ private: "not an aggregate" }) }),
  ]) {
    const handler = createTokenUsageHandler({ fallback: snapshot(), fetchImpl });
    const result = response(); await handler({ method: "GET" }, result);
    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["X-Usage-Source"], "snapshot");
    assert.deepEqual(result.body, snapshot());
    assert.equal(result.body.generatedAt, "2026-09-30T12:00:00.000Z");
  }
});

test("usage API retains a validated previous aggregate when a later refresh fails", async () => {
  let clock = 0;
  let calls = 0;
  const handler = createTokenUsageHandler({ now: () => clock, fetchImpl: async () => {
    calls++; if (calls > 1) throw new Error("offline");
    return { ok: true, json: async () => snapshot() };
  } });
  const first = response(); await handler({ method: "GET" }, first);
  clock = 60_001;
  const second = response(); await handler({ method: "GET" }, second);
  assert.equal(second.headers["X-Usage-Source"], "snapshot");
  assert.deepEqual(first.body, second.body);
});

test("usage API refuses writes and does not expose errors when no aggregate is available", async () => {
  let calls = 0;
  const handler = createTokenUsageHandler({ fetchImpl: async () => {
    calls++; throw new Error("private details");
  } });
  const rejected = response(); await handler({ method: "POST" }, rejected);
  assert.equal(rejected.statusCode, 405); assert.equal(calls, 0);
  const failed = response(); await handler({ method: "GET" }, failed);
  assert.equal(failed.statusCode, 503);
  assert.deepEqual(failed.body, { error: "Usage temporarily unavailable" });
});
