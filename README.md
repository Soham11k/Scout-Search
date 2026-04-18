# Scout — AI Search

> A quieter, smarter way to search the web. Scout answers your question first, shows its sources, and lets you save what matters.

Scout is an AI-first search engine built with Next.js. It combines real web search, OpenAI-powered synthesis, page summarization, and a calm editorial UI into a single, installable app.

![editorial](https://img.shields.io/badge/design-editorial-8b6f47)
![next](https://img.shields.io/badge/Next.js-16-black)
![ai](https://img.shields.io/badge/AI-OpenAI_GPT--4o-10a37f)
![license](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **AI answer as the hero** — Every search runs through GPT, with inline citations that scroll you to the source row. Streams in real time.
- **Real web search** — Plug in any free provider (Brave, Serper, Google CSE, Tavily) to get actual results. Falls back to tasteful demo data with no key.
- **Browse any URL** — Paste a link; Scout fetches, parses, and summarizes the page (TL;DR, key points, sentiment, reading time).
- **Image strip** — Real images via Pexels/Unsplash (free APIs, no card required).
- **Bookmarks** — Save any result. Persists to Supabase or Neon Postgres; falls back to in-memory.
- **Auth** — Supabase-backed email/password, with a client-side fallback for local demos.
- **6 color palettes × light/dark** — Paper, Sepia, Mono, Ocean, Rose, Forest. Each re-tints the entire app.
- **PWA** — Installable on mobile home screen.
- **Markdown-rich answers** — Bold, lists, headers all render in AI responses.
- **Keyboard-first** — `/` to focus search, `j`/`k` to step through results, `⌘K` surfaces.
- **Rate-limited & secure** — In-memory sliding-window limiter on every API route, HSTS + CSP + security headers in `next.config.mjs`.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Set up environment (see next section)
cp .env.example .env   # if .env.example exists; otherwise create .env

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up (local demo mode works out of the box), then head to `/app` to search.

---

## Environment variables

Create `.env` in the project root. **All keys below are optional** — Scout degrades gracefully without them.

```bash
# ─── AI (required for real AI answers) ─────────────────────────
OPENAI_API_KEY=sk-...

# ─── Web search (pick ONE — all have free tiers) ──────────────
SERPER_API_KEY=                           # 2,500 free, no card — serper.dev
BRAVE_SEARCH_API_KEY=                     # 2k/mo free — brave.com/search/api
TAVILY_API_KEY=                           # 1k/mo free — tavily.com
GOOGLE_CUSTOM_SEARCH_API_KEY=             # 100/day free — console.cloud.google.com
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=           # paired with the above
BING_SEARCH_API_KEY=                      # decommissioned, kept for legacy

# ─── Images (fallbacks if your search provider doesn't return images) ─
PEXELS_API_KEY=                           # pexels.com/api
UNSPLASH_ACCESS_KEY=                      # unsplash.com/developers

# ─── Auth (optional — skip for local-only mode) ───────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                # server-side, for admin ops

# ─── Database (optional — used for persisting bookmarks) ──────
DATABASE_URL=                             # Neon serverless Postgres — neon.tech
```

### Search provider priority

Scout checks providers in this order and uses the first one configured:

**Brave → Serper → Bing → Google CSE → Tavily → demo**

### Image strip priority

**Provider's own images → Pexels → Unsplash → demo placeholders**

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind v4, Radix primitives, shadcn-style components |
| AI | OpenAI `gpt-4o-mini` (streaming) |
| Auth | Supabase (optional) + local fallback |
| Database | Neon serverless Postgres, Supabase Postgres, or in-memory |
| Data fetching | SWR |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Toast | sonner |
| Markdown | react-markdown + remark-gfm |
| Analytics | Vercel Analytics (prod only) |

---

## Scripts

```bash
npm run dev      # Start dev server (Next.js + Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

If you hit a Turbopack `CPU doesn't support bmi2` panic on older Intel Macs, run dev without Turbopack:

```bash
npx next dev --no-turbo
```

---

## Project structure

```
.
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── bookmarks/        # GET / POST / DELETE — Supabase|Neon|memory
│   │   ├── browse/           # POST — fetch + summarize a URL
│   │   ├── openai/           # POST — streaming AI answer
│   │   └── search/           # GET  — web search + image strip
│   ├── app/page.tsx          # Main search app (client component)
│   ├── login/, signup/       # Auth screens
│   ├── layout.tsx            # Root layout, providers, palette bootstrap script
│   ├── manifest.ts           # PWA manifest
│   └── globals.css           # Tailwind tokens + 6 palettes
├── components/
│   ├── ai-overview.tsx       # Streaming AI hero section
│   ├── search-results.tsx    # Source rows + image strip
│   ├── search-bar.tsx        # Command-style search input
│   ├── browse-panel.tsx      # Browse-URL experience
│   ├── user-menu.tsx         # Avatar dropdown with palette picker
│   ├── theme-toggle.tsx      # Light / Dark / System
│   └── ui/                   # shadcn primitives
├── lib/
│   ├── auth.tsx              # AuthProvider (Supabase + local fallback)
│   ├── palette.tsx           # PaletteProvider (data-palette attr)
│   ├── db.ts                 # Neon client
│   ├── rate-limit.ts         # Sliding-window in-memory limiter
│   ├── search-cache.ts       # In-memory search response cache
│   └── utils.ts              # cn(), helpers
├── hooks/                    # Custom React hooks
├── public/                   # Static assets, PWA icons
├── next.config.mjs           # Security headers, cache rules
└── tsconfig.json
```

---

## Database setup (optional)

### Option A — Neon (recommended, free forever)

1. [neon.tech](https://neon.tech) → Create project
2. Run in SQL Editor:

   ```sql
   CREATE TABLE IF NOT EXISTS bookmarks (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_email  TEXT NOT NULL,
     title       TEXT NOT NULL,
     url         TEXT NOT NULL,
     description TEXT,
     favicon_url TEXT,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX IF NOT EXISTS bookmarks_user_email_idx ON bookmarks(user_email);
   ```

3. Copy the connection string → add `DATABASE_URL=...` to `.env`.

### Option B — Supabase

Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Run the same schema in the Supabase SQL editor and add an RLS policy:

```sql
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can manage own bookmarks"
  ON bookmarks
  FOR ALL
  USING (auth.uid()::text = user_id);
```

### Option C — Nothing

Skip both. Bookmarks live in memory and wipe on server restart. Fine for demos.

---

## Themes & palettes

Scout has two orthogonal knobs:

- **Mode** — Light / Dark / System (via `next-themes`)
- **Palette** — Paper / Sepia / Mono / Ocean / Rose / Forest (via `data-palette` attribute)

That's **12 distinct looks**. Both persist to `localStorage`, apply instantly with a 0.3s cross-fade, and bootstrap before hydration to prevent flash.

To change from the UI: avatar → dropdown → Palette row.

To add your own palette, edit `lib/palette.tsx` (add the entry) and `app/globals.css` (add the `[data-palette='...']` and `.dark[data-palette='...']` blocks).

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` | Focus the search bar |
| `j` / `k` | Step through results |
| `⌘K` / `Ctrl+K` | Command palette |
| `Enter` | Open the active result |
| `Esc` | Close menus / clear focus |

---

## Security & rate limiting

- **Headers** — HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy all set in `next.config.mjs`.
- **Rate limiting** — In-memory sliding window on every API route. Defaults:
  - `/api/search` — 60 req/IP/min
  - `/api/openai` — 20 req/IP/min
  - `/api/browse` — 10 req/IP/min
  - `/api/bookmarks` — no limit (user-scoped)
- **For multi-instance production**, swap `lib/rate-limit.ts` for Upstash Redis.

Never commit `.env`. Rotate any key that has been exposed in chat/screenshots.

---

## Deploying

### Vercel (recommended)

1. Push to GitHub
2. Import in Vercel
3. Add all `.env` values in project settings → **Environment Variables**
4. Deploy

The `/app` route is dynamic; everything else is static. Middleware proxies to ensure the auth cookie is honored.

---

## Roadmap

- [ ] Browser extension — one-click open Scout from current tab
- [ ] iOS/Android native shell (Capacitor)
- [ ] Team sharing — collaborative bookmark spaces
- [ ] Offline cache of saved pages
- [ ] Voice input
- [ ] More palettes (neon, terminal, editorial-noir)

---

## License

MIT — do whatever, just don't pretend you wrote it from scratch.

---

> *Small tools, made carefully.*
