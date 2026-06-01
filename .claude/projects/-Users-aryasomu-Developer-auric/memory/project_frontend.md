---
name: Auric frontend structure
description: Next.js web app layout with 4 sections (Home/App/About/Docs) and separate Docusaurus docs site
type: project
---

Frontend redesigned June 2026 with 4-section structure:
- `web/` — Next.js 15 app, routes: `/` (dark hero), `/app` (token interface), `/about` (two-column)
- `docs-site/` — Docusaurus 3.6.3, runs on port 3001, linked from nav as `NEXT_PUBLIC_DOCS_URL` (default `http://localhost:3001`)
- Nav component at `web/src/components/Nav.tsx` — fixed, pathname-aware dark/light mode (dark on `/`, white elsewhere)

**Why:** User requested full redesign with Solana-style dark hero, serif headings, About page, and integrated Docusaurus docs.
**How to apply:** `web/` for frontend changes; `docs-site/` for documentation. To run both locally: `npm run dev` in `web/` (port 3000) and `npm run start` in `docs-site/` (port 3001). Docusaurus 3.6.3 requires `overrides: { webpack: "5.94.0" }` in its package.json due to webpack 5.107+ breaking ProgressPlugin API.
