// Server-only: auth is an internal schema, so use InsForge's admin REST API.
// The public request cannot supply SQL, a table, or an upstream URL.
const query = "SELECT COUNT(*)::bigint AS registered_users FROM auth.users";
const cacheDuration = 60_000;

export function createRayaboyStatsHandler({
  getCredentials = () => ({
    baseUrl: process.env.RAYABOY_INSFORGE_URL,
    apiKey: process.env.RAYABOY_INSFORGE_API_KEY,
  }),
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  let cached;
  let pending;

  async function readCount() {
    const { baseUrl, apiKey } = getCredentials();
    if (!baseUrl || !apiKey) throw new Error("Counter is not configured");
    const endpoint = new URL("/api/database/advance/rawsql", baseUrl);
    if (endpoint.protocol !== "https:") throw new Error("HTTPS is required");

    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error("Counter upstream unavailable");
    const result = await response.json();
    const value = result.rows?.[0]?.registered_users;
    if (
      result.rows?.length !== 1 ||
      (typeof value !== "number" &&
        (typeof value !== "string" || !/^\d+$/.test(value)))
    )
      throw new Error("Invalid counter response");
    const registeredUsers = Number(value);
    if (!Number.isSafeInteger(registeredUsers) || registeredUsers < 0)
      throw new Error("Invalid counter response");
    cached = { registeredUsers, updatedAt: new Date(now()).toISOString() };
    return cached;
  }

  return async function rayaboyStats(request, response) {
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
      if (!cached || now() - Date.parse(cached.updatedAt) >= cacheDuration) {
        pending ??= readCount().finally(() => {
          pending = undefined;
        });
        await pending;
      }
      response.statusCode = 200;
      response.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
      response.end(
        request.method === "HEAD" ? undefined : JSON.stringify(cached),
      );
    } catch {
      response.statusCode = 503;
      response.setHeader("Cache-Control", "no-store");
      response.end(
        request.method === "HEAD"
          ? undefined
          : JSON.stringify({ error: "User count temporarily unavailable" }),
      );
    }
  };
}
