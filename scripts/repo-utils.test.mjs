import test from "node:test";
import assert from "node:assert/strict";
import { publicPortfolioRepos } from "./repo-utils.mjs";

test("the snapshot drops private repos, unknown visibility, other owners, and the website itself", () => {
  const base = {
    private: false,
    owner: { login: "nimalp123" },
    name: "graph",
    updated_at: "2026-09-29T00:00:00Z",
  };
  const result = publicPortfolioRepos([
    base,
    { ...base, name: "internal", private: true },
    { ...base, name: "unknown", private: undefined },
    { ...base, name: "other", owner: { login: "someone-else" } },
    { ...base, name: "nimal-site" },
  ]);
  assert.deepEqual(
    result.map((repo) => repo.name),
    ["graph"],
  );
});

test("only approved public fields survive and links are constructed from the verified owner", () => {
  const result = publicPortfolioRepos([
    {
      private: false,
      owner: { login: "nimalp123" },
      name: "graph",
      fork: true,
      html_url: "javascript:alert(1)",
      internal_notes: "should never leave",
      credentials: "should never leave",
      updated_at: "2026-09-29T00:00:00Z",
    },
  ]);
  assert.equal(result[0].html_url, "https://github.com/nimalp123/graph");
  assert.equal(result[0].fork, true);
  assert.equal("credentials" in result[0], false);
  assert.equal("internal_notes" in result[0], false);
  assert.equal("owner" in result[0], false);
});

test("malformed responses fail instead of publishing invalid data", () => {
  assert.throws(() => publicPortfolioRepos({ error: "rate-limited" }));
  assert.throws(() =>
    publicPortfolioRepos([
      { private: false, owner: { login: "nimalp123" }, name: "../private" },
    ]),
  );
});
