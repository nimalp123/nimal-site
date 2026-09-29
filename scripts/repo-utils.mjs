export const OWNER = "nimalp123";
export const WEBSITE_REPO = "nimal-site";
export const EXCLUDED_REPOS = new Set([
  WEBSITE_REPO,
  "django-server",
  "openclaw",
  "streamlit-example",
  "calpeptides",
  "health-helper-v1",
]);

// Explicitly allow only public portfolio fields into the checked-in snapshot.
export function publicPortfolioRepos(input) {
  if (!Array.isArray(input))
    throw new Error("GitHub returned an invalid repository list");
  return input
    .filter(
      (repo) =>
        repo.private === false &&
        repo.owner?.login === OWNER &&
        !EXCLUDED_REPOS.has(repo.name),
    )
    .map((repo) => {
      if (!/^[\w.-]+$/.test(repo.name))
        throw new Error("Invalid repository name");
      return {
        name: repo.name,
        description:
          typeof repo.description === "string" ? repo.description : null,
        html_url: `https://github.com/${OWNER}/${repo.name}`,
        fork: repo.fork === true,
        language: typeof repo.language === "string" ? repo.language : null,
        stargazers_count: Number.isFinite(repo.stargazers_count)
          ? repo.stargazers_count
          : 0,
        size: Number.isFinite(repo.size) ? repo.size : 0,
        updated_at: repo.updated_at,
      };
    });
}
