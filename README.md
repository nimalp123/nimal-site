# Nimal — selected work

Personal website for Nimal Periasamy. Selected public projects, ranked by a deliberately subjective aura order, with Instagram Friendship Graph featured first.

## Branches

- `main`: production.
- `staging`: working preview branch.

The initial website stays local until Nimal reviews the localhost preview.

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
- `public/images/actual-graph.png` is the anonymous image already published in the flagship repository. Its counts are the September 2026 observed totals, with the lower-bound limitation displayed.
- The concise Rayaboy showcase covers the application product, real-web research engine, and recording/replay research tooling. An audit of all 68 local branch names, including all 29 current GitHub branches and newer local research, informed the content. Its measured results are qualified individually: a six-real-page parallel trial finished in 28 minutes vs. 93 sequentially (3.3× observed throughput) with the same terminal outcomes; recorded iterations on the same 12-case synthetic benchmark reduced invalid AI proposals from 45 to 10 (78% fewer) and raised exact matches from 6 to 11. The 8,419 passing unit checks are a recorded development checkpoint, not a claim that every gated test passed. The discovery research lab had 86 entries with readable real-web captures, not 86 verified scholarships. These are research results and development infrastructure, not production-wide performance. Rayaboy’s own public catalog figures remain beside its homepage snapshot. No proprietary execution tactics, private links, or raw private documents are included.
- `public/images/rayaboy-site.webp` is a real screenshot of the public Rayaboy homepage captured on September 29, 2026 in an isolated Brave session. The public homepage displayed 40+ catalog scholarships and $336k in listed scholarship funding on that date. The image and explicit action link to `https://rayaboy.com` in a new tab. The catalog figures are not revenue, applications completed, or money awarded.
- `public/images/chrome-network.webp` was generated with the built-in image generation tool and optimized as WebP. The complete prompt and art direction are in `DESIGN.md`.
- `public/images/social-card.png` is a rendered screenshot of the site's hero.

The live user counter reads only `COUNT(*)` from Production Main's `auth.users` through a server-side InsForge admin REST request. Profiles are created later, so counting them would miss registrations. The endpoint returns only the aggregate and retrieval timestamp, caches for 60 seconds, and accepts GET/HEAD. The browser refreshes once per minute while visible. It reports registered accounts, including admins, unverified registrations, and retained test accounts; it does not claim active users. No database schema, permissions, or production app code was changed.

## Deployment after preview approval

Vercel settings are prepared: framework **Vite**, build command `npm run build`, output `dist`, production branch `main`, preview branch `staging`. No Vercel connection or domain change has been made.

`api/rayaboy-stats.js` provides the production counter endpoint. Add the two server-only variables from `.env.example` to Vercel when connecting the site. Keep the API key out of variables starting with `VITE_` and out of Git.

After Nimal reviews the local preview, push the approved website on `staging` and promote to `main`. The remote is `https://github.com/nimalp123/nimal-site`. Both branches are currently local; the public remote remains empty until that approval.

When the domain is chosen, set canonical URL and absolute social-image URLs in `index.html`. Connect the Vercel project and domain only at that stage.
