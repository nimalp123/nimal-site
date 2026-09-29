# Nimal — selected work

Personal website for Nimal Periasamy. Public projects, ranked by a deliberately subjective aura order, with Instagram Friendship Graph featured first.

## Branches

- `main`: production.
- `staging`: working preview branch.

The initial website stays local until Nimal reviews the localhost preview.

Only public repository metadata and approved, high-level Rayaboy copy belong here. Never commit private project code, personal graph data, credentials, or internal learnings.

## Local development

Requires Node 24+.

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

Run `npm run sync:repos` before a release to fetch the account's public repositories without a token. It follows pagination, discards private repositories and unapproved fields, and excludes this website, which is linked in the footer. An API failure preserves the existing snapshot. The website renders the saved snapshot with a visible date, so GitHub rate limits cannot take down the portfolio.

Aura order and editorial descriptions are in `src/App.tsx`. Instagram Friendship Graph stays first. Forks are labeled and the empty repositories are described honestly.

## Content and artwork

- The interactive graph is a fictional demo. Its names and connections are synthetic.
- `public/images/actual-graph.png` is the anonymous image already published in the flagship repository. Its counts are the September 2026 observed totals, with the lower-bound limitation displayed.
- The Rayaboy text covers broad product outcomes. The 2,134 passing checks are a recorded September 2026 engineering checkpoint in the research tooling, not a production performance or certification claim. No provider routing, internal methods, private links, or raw private documents are included.
- `public/images/chrome-network.webp` was generated with the built-in image generation tool and optimized as WebP. The complete prompt and art direction are in `DESIGN.md`.
- `public/images/social-card.png` is a rendered screenshot of the site's hero.

## Deployment after preview approval

Vercel settings are prepared: framework **Vite**, build command `npm run build`, output `dist`, production branch `main`, preview branch `staging`. No Vercel connection or domain change has been made.

After Nimal reviews the local preview, push the approved website on `staging` and promote to `main`. The remote is `https://github.com/nimalp123/nimal-site`. Both branches are currently local; the public remote remains empty until that approval.

When the domain is chosen, set canonical URL and absolute social-image URLs in `index.html`. Connect the Vercel project and domain only at that stage.
