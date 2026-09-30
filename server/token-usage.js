import { createHash } from "node:crypto";
import { validatePublicUsage } from "../scripts/usage-utils.mjs";

const upstream = "https://raw.githubusercontent.com/nimalp123/nimalp123/main/data/token-usage.json";
const cacheDuration = 60_000;

export function createTokenUsageHandler({
  fetchImpl = fetch, now = Date.now, fallback,
} = {}) {
  const snapshot = fallback ? validatePublicUsage(fallback) : undefined;
  let cached;
  let pending;

  function value(data, source) {
    const body = JSON.stringify(validatePublicUsage(data));
    return {
      body, source, checkedAt: now(),
      etag: `"${createHash("sha256").update(body).digest("hex")}"`,
    };
  }

  async function refresh() {
    try {
      const response = await fetchImpl(upstream, {
        method: "GET", headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error("Usage upstream unavailable");
      cached = value(await response.json(), "live");
    } catch {
      // Keep a previously valid aggregate or the deployment's checked-in snapshot.
      if (cached) cached = { ...cached, source: "snapshot", checkedAt: now() };
      else if (snapshot) cached = value(snapshot, "snapshot");
      else throw new Error("Usage unavailable");
    }
    return cached;
  }

  return async function tokenUsage(request, response) {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.statusCode = 405;
      response.setHeader("Allow", "GET, HEAD");
      response.setHeader("Cache-Control", "no-store");
      response.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    try {
      if (!cached || now() - cached.checkedAt >= cacheDuration) {
        pending ??= refresh().finally(() => { pending = undefined; });
        await pending;
      }
      response.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=60");
      response.setHeader("ETag", cached.etag);
      response.setHeader("X-Usage-Source", cached.source);
      if (request.headers?.["if-none-match"] === cached.etag) {
        response.statusCode = 304;
        response.end();
      } else {
        response.statusCode = 200;
        response.end(request.method === "HEAD" ? undefined : cached.body);
      }
    } catch {
      response.statusCode = 503;
      response.setHeader("Cache-Control", "no-store");
      response.end(request.method === "HEAD" ? undefined : JSON.stringify({ error: "Usage temporarily unavailable" }));
    }
  };
}
