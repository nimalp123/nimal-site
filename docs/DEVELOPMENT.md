# Development notes

Personal website for Nimal Periasamy. Selected public projects, ranked by a deliberately subjective aura order, with Instagram Friendship Graph featured first.

## Branches

- `main`: production.
- `staging`: working preview branch.

The initial website was reviewed locally before publication.

Only public repository metadata and approved, high-level Rayaboy copy belong here. Never commit private project code, personal graph data, credentials, or internal learnings.

## Local development

Requires Node 24+.

The live Rayaboy counter needs `RAYABOY_INSFORGE_URL` and `RAYABOY_INSFORGE_API_KEY` in a local, ignored `.env.local` file. Both stay on the server. Without them, the site shows the counter as unavailable.

```sh
npm ci
npm run dev
```

Open http://localhost:5173/ in Brave. The development server listens on loopback only.

```sh
npm run lint
npm test
npm run build
node scripts/browser-smoke.mjs
```

The browser smoke check uses an isolated Brave session on macOS, then falls back to Chrome or installed Playwright Chromium. Override with `BROWSER_EXECUTABLE` and `PREVIEW_URL` if needed. Screenshots go into ignored `artifacts/`.

## Updating public repositories

Run `npm run sync:repos` before a release to fetch the account's public repositories without a token. It follows pagination, discards private repositories and unapproved fields, and excludes this website, which is linked in the footer. Django server, OpenClaw, Streamlit example, Calpeptides, and Health helper are excluded by the curation policy in `scripts/repo-utils.mjs` and stay excluded after future syncs. An API failure preserves the existing snapshot. The website renders the saved snapshot with a visible date, so GitHub rate limits cannot take down the portfolio.

Aura order and editorial descriptions are in `src/App.tsx`. Instagram Friendship Graph stays first. The current selection contains four repositories. Fork filters appear only when the selection contains forks. Empty repositories are described honestly.

## Content and artwork

- The interactive graph is a fictional demo. Its names and connections are synthetic.
- Instagram Friendship Graph is presented as a completed public mapping experiment and a starting point for future data analysis. Friendship suggestions, shared connections, and other patterns are questions Nimal wants to explore, not implemented recommendation features.
- `public/images/actual-graph.png` is the anonymous image already published in the flagship repository. Its counts are the September 2026 observed totals, with the lower-bound limitation displayed.
- The Rayaboy showcase presents applied AI, research engineering, and the application product as short capabilities, 18 scoped metric cards, and a closed-loop iteration diagram. Its own catalog and live registration figures have a separate outcome strip. An audit of all 68 local scraper branches (including the 29 current GitHub branches), PR55, and newer document research branches informed the content. The public metric scope guide is in [RESEARCH-SNAPSHOTS.md](../RESEARCH-SNAPSHOTS.md). No private code, proprietary execution tactics, private links, student records, or raw internal documents are included.
- `public/images/rayaboy-site.webp` is a real screenshot of the public Rayaboy homepage captured on September 29, 2026 in an isolated Brave session. The public homepage displayed 40+ catalog scholarships and $336k in listed scholarship funding on that date. The image and explicit action link to `https://rayaboy.com` in a new tab. The catalog figures are not revenue, applications completed, or money awarded.
- `public/images/chrome-network.webp` was generated with the built-in image generation tool and optimized as WebP. The complete prompt and art direction are in `DESIGN.md`.
- `public/images/social-card.png` is a rendered screenshot of the site's hero.

The live user counter reads only `COUNT(*)` from Production Main's `auth.users` through a server-side InsForge admin REST request. Profiles are created later, so counting them would miss registrations. The endpoint returns only the aggregate and retrieval timestamp, caches for 60 seconds, and accepts GET/HEAD. The browser refreshes once per minute while visible. It reports registered accounts, including admins, unverified registrations, and retained test accounts; it does not claim active users. No database schema, permissions, or production app code was changed.

## Deployment

Live URL: https://nimalp123.com. Vercel project **nimal-site**: framework **Vite**, Node **24.x**, build command `npm run build`, output `dist`, production branch `main`, preview branch `staging`.

`api/rayaboy-stats.js` provides the counter endpoint. Both server-only variables from `.env.example` are configured for Vercel production and preview; the API key is sensitive. Keep it out of variables starting with `VITE_` and out of Git. `.vercelignore` also excludes local credentials, private data, and test artifacts from CLI uploads.

The public source repository is https://github.com/nimalp123/nimal-site. GitHub Actions checks lint, tests, and the production build on both branches; the workflow can also be dispatched manually.

Vercel is connected to this repository through a personal-account GitHub app installation with **Only select repositories** enabled and exactly `nimalp123/nimal-site` selected. The private organization’s installation and repository permissions were not changed.

Pushes to `main` automatically create production deployments; pushes to `staging` create preview deployments. Review a staging preview before promoting an approved version to `main`. For a manual deployment, use the Vercel CLI from the appropriate branch:

```sh
git switch staging
vercel deploy
# After reviewing and promoting the approved version to main:
git switch main
vercel deploy --prod
```

`nimalp123.com` is connected and redirects to the verified primary host `www.nimalp123.com`. Portfolio links use the custom domain; canonical and absolute social-image URLs use `https://www.nimalp123.com`.

## Tokenmaxxing usage ledger

The separate `/tokenmaxxing` HTML entry shares fonts and design tokens with the portfolio. A small footer link is its only mention on the main page. Its daily heatmap and tool-level totals use `America/Los_Angeles` date grouping.

`npm run sync:usage` runs pinned `ccusage@20.0.26` against this MacBook's local CLI logs and creates the initial public snapshot. Only allowlisted dates, numeric usage totals, and approved agent identifiers survive sanitization. Model identifiers, projects, session details, prompts, filesystem paths, credentials, and raw exports are excluded. Cost figures are API-equivalent usage estimates and unknown-pricing gaps remain visible.

`npm run publish:usage` publishes only `data/token-usage.json` in the existing public `nimalp123/nimalp123` profile repository using the GitHub CLI's existing authentication. It verifies the repository is public and skips unchanged usage. The profile README stays independent. This data file doesn't trigger a website deployment or the profile's shared-asset workflow.

The public `/data/token-usage.json` route reads that sanitized public file through `/api/token-usage`, with a short cache and the initial snapshot as a fallback. No local log access or GitHub secret is present on Vercel.

`npm run install:usage-updater` installs the per-user `com.nimalp123.tokenmaxxing` launch agent to publish hourly while this Mac is awake. Its logs and reviewable plist copy stay in ignored `artifacts/`. Prepare the plist without installing via `node scripts/install-usage-updater.mjs --prepare`; remove only this updater via `node scripts/install-usage-updater.mjs --uninstall`.
