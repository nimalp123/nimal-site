import { writeFile } from "node:fs/promises";
import { OWNER, publicPortfolioRepos } from "./repo-utils.mjs";

const fetched = [];
for (let page = 1; ; page++) {
  const response = await fetch(
    `https://api.github.com/users/${OWNER}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "nimal-site",
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error(
      `GitHub returned HTTP ${response.status}; existing snapshot was preserved`,
    );
  const repos = await response.json();
  if (!Array.isArray(repos))
    throw new Error("Invalid GitHub response; existing snapshot was preserved");
  fetched.push(...repos);
  if (repos.length < 100) break;
}
const repos = publicPortfolioRepos(fetched);
if (!repos.length)
  throw new Error("Refusing to replace the snapshot with an empty list");
await writeFile(
  new URL("../src/data/repos.json", import.meta.url),
  JSON.stringify({ fetchedAt: new Date().toISOString(), repos }, null, 2) +
    "\n",
);
console.log(
  `Synced ${repos.length} public repositories. No authentication or private metadata used.`,
);
