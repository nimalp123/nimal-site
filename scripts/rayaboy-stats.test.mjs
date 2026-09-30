import assert from "node:assert/strict";
import test from "node:test";
import { createRayaboyStatsHandler } from "../server/rayaboy-stats.js";

function response() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body ? JSON.parse(body) : undefined;
    },
  };
}
const credentials = () => ({
  baseUrl: "https://example.insforge.app",
  apiKey: "server-only-test-value",
});

test("public counter returns only the aggregate, caches concurrent reads, and refreshes", async () => {
  let clock = Date.parse("2026-09-29T12:00:00Z");
  let calls = 0;
  const handler = createRayaboyStatsHandler({
    getCredentials: credentials,
    now: () => clock,
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url.pathname, "/api/database/advance/rawsql");
      assert.equal(options.method, "POST");
      assert.deepEqual(JSON.parse(options.body), {
        query: "SELECT COUNT(*)::bigint AS registered_users FROM auth.users",
      });
      return {
        ok: true,
        json: async () => ({
          rows: [
            {
              registered_users: String(calls === 1 ? 100 : 101),
              private_field: "must not be exposed",
            },
          ],
        }),
      };
    },
  });
  const first = response();
  const simultaneous = response();
  await Promise.all([
    handler({ method: "GET", url: "/?query=SELECT%20*" }, first),
    handler({ method: "GET" }, simultaneous),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(first.body, {
    registeredUsers: 100,
    updatedAt: "2026-09-29T12:00:00.000Z",
  });
  assert.deepEqual(simultaneous.body, first.body);
  const next = response();
  await handler({ method: "GET" }, next);
  assert.equal(calls, 1);
  clock += 60_001;
  const refreshed = response();
  await handler({ method: "GET" }, refreshed);
  assert.equal(calls, 2);
  assert.equal(refreshed.body.registeredUsers, 101);
});

test("zero is valid; malformed, failed, or missing data never becomes a fake count", async () => {
  for (const value of [
    undefined,
    null,
    "",
    -1,
    1.5,
    "12oops",
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    const handler = createRayaboyStatsHandler({
      getCredentials: credentials,
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ rows: [{ registered_users: value }] }),
      }),
    });
    const result = response();
    await handler({ method: "GET" }, result);
    assert.equal(result.statusCode, 503);
    assert.deepEqual(result.body, {
      error: "User count temporarily unavailable",
    });
    assert.equal(result.headers["Cache-Control"], "no-store");
  }
  const handler = createRayaboyStatsHandler({
    getCredentials: credentials,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ rows: [{ registered_users: 0 }] }),
    }),
  });
  const result = response();
  await handler({ method: "GET" }, result);
  assert.equal(result.body.registeredUsers, 0);
});

test("errors stay private and the public API cannot execute writes", async () => {
  let calls = 0;
  const handler = createRayaboyStatsHandler({
    getCredentials: credentials,
    fetchImpl: async () => {
      calls++;
      throw new Error(
        "credential=server-only-test-value private backend details",
      );
    },
  });
  const rejected = response();
  await handler(
    { method: "POST", body: { query: "DELETE FROM auth.users" } },
    rejected,
  );
  assert.equal(rejected.statusCode, 405);
  assert.equal(calls, 0);
  const failed = response();
  await handler({ method: "GET" }, failed);
  assert.equal(failed.statusCode, 503);
  assert.deepEqual(failed.body, {
    error: "User count temporarily unavailable",
  });
  const unconfigured = createRayaboyStatsHandler({
    getCredentials: () => ({}),
    fetchImpl: async () => {
      throw new Error("Should not fetch");
    },
  });
  const missing = response();
  await unconfigured({ method: "GET" }, missing);
  assert.equal(missing.statusCode, 503);
});
