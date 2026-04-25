@AGENTS.md

# BriefDev — AI Coding Harness

> 한국 개발자를 위한 매일 5분 AI 트렌드 큐레이션
> Wrtn Technologies Product Engineer 과제 (Deadline: 2026-04-28)

## Project Domain

큐레이션 = 매일 자동 수집된 AI 관련 글 30개 중 Gemini가 5개를 골라
"왜 한국 개발자에게 중요한가" 한 줄과 함께 카드로 보여주는 서비스.

### Domain Vocabulary
- **Card** = 큐레이션된 1개 아이템 (제목, 3줄 요약, 왜 중요한가, 원문 링크)
- **Source** = 데이터 소스 (HackerNews, RSS feeds)
- **Curate** = LLM이 30개 중 5개를 고르고 한국어로 요약 + 맥락화하는 행위
- **Bundle** = 매일 발행되는 5개 카드 묶음 (1일 1번)
- **Category** = 🔥오늘의1픽 / 📦모델·도구 / 💡실전팁 / 📚깊이읽기 / 🎯한국화제

## Tech Stack (Decided in Plan)
- **Framework**: Next.js 16 (App Router) — read `node_modules/next/dist/docs/` before writing
- **Language**: TypeScript strict mode
- **Styling**: Tailwind CSS v4 + shadcn/ui (when needed)
- **Backend**: Next.js API Routes + Supabase (Postgres + Auth + RLS)
- **LLM**: Google Gemini 1.5 Flash (free tier, JSON mode + zod validation)
- **Cron**: Vercel Cron (daily 05:00 KST)
- **Deploy**: Vercel
- **Validation**: zod (parse all external data — LLM output, RSS, etc.)

## Coding Conventions

### TypeScript
- `strict: true` always
- No `any` — use `unknown` + zod parse
- Prefer `type` over `interface` for shapes
- Named exports only (no default except Next.js pages/layouts)

### File Naming
- Components: `PascalCase.tsx` (e.g., `CardSwiper.tsx`)
- Utilities: `camelCase.ts` (e.g., `fetchHackerNews.ts`)
- Routes: kebab-case folders
- DB tables: snake_case (e.g., `user_views`)
- Constants: `UPPER_SNAKE_CASE`

### Folder Structure
```
src/
├── app/
│   ├── (auth)/login/         # Magic link login
│   ├── (main)/               # Authenticated routes
│   ├── api/
│   │   ├── cron/collect/     # Daily curation (Vercel Cron)
│   │   └── auth/callback/    # Supabase auth callback
│   └── layout.tsx
├── components/
│   ├── card/                 # Card swiper, card item
│   └── ui/                   # shadcn/ui primitives
└── lib/
    ├── supabase/             # client.ts, server.ts
    ├── gemini/               # curate.ts, prompts.ts
    ├── sources/              # hackernews.ts, rss.ts
    └── analytics/            # track.ts
prompts/
├── curate-v1.md
├── curate-v2.md
└── curate-v3.md              # Currently used
```

## Forbidden Patterns

- ❌ `any` type — always validate with zod
- ❌ `console.log` in committed code (use proper logging)
- ❌ Hard-coded API keys / secrets — env vars only
- ❌ Direct LLM JSON parsing without zod schema
- ❌ Client-side LLM calls (always via `/api/` route)
- ❌ Mutating Supabase from client (use server actions / API routes)

## Required Patterns

### LLM Output Validation (Critical)
```typescript
// ❌ Never trust LLM output
const result = JSON.parse(llmResponse)

// ✅ Always validate with zod
const CardSchema = z.object({
  category: z.enum(['pick', 'tool', 'tip', 'deep', 'kr']),
  title: z.string().min(1).max(120),
  summary: z.array(z.string()).length(3),
  whyMatters: z.string().min(10),
  url: z.string().url(),
})
const result = CardSchema.parse(JSON.parse(llmResponse))
```

### Prompt Versioning (Harness Showcase)
- All prompts live in `prompts/curate-vN.md`
- Each version tracks: hypothesis, change, results
- Code reads prompt by env: `CURATION_PROMPT_VERSION=v3`

### Error Handling
- Use Result pattern for fallible operations (no exceptions across boundaries)
- All API routes return JSON: `{ ok: true, data } | { ok: false, error }`
- LLM failure → fallback to previous day's curation (graceful degradation)

## Build & Run

```bash
npm run dev              # http://localhost:3000
npm run build            # Production build
npm run start            # Production server
npm run lint             # Lint check
npm run typecheck        # tsc --noEmit
```

## Environment Variables

See `.env.local.example` — never commit `.env.local`.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `GEMINI_API_KEY` | Server | LLM curation |
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase admin key (server only!) |
| `CRON_SECRET` | Server | Vercel Cron auth |
| `NEXT_PUBLIC_APP_URL` | Both | App base URL |

## Key Decisions Log

| Decision | Reason |
|----------|--------|
| Gemini Flash over Claude/GPT | Free tier (1500/day), 1M context, multimodal future-proof |
| Supabase over self-hosted DB | Magic link auth + RLS + free tier, 3-day deadline |
| App Router (not Pages) | Modern, channel match with company stack |
| zod for everything external | LLM/RSS/network — never trust |
| Single bundle per day | "Same content for everyone" simplifies Phase 1 hypothesis |
| Magic link only (no password) | Friction reduction, 3-day scope |

## What NOT to Build (Out of Scope — From Plan)

These are intentionally excluded for hypothesis validation focus:
- Sign up / profile / admin pages (magic link is enough)
- Category customization (everyone same 5 cards in Phase 1)
- Payment / Pro plan (Phase 2 hypothesis)
- Push notifications (effort vs. value tradeoff)
- Real-time updates (curation = "set time, set quantity")

If asked to add any of these, push back and reference this list.

## Submission Checklist (2026-04-28)

- [ ] ONEPAGER.md polished with author's voice
- [ ] Vercel deployed + URL
- [ ] README.md with AI tooling section
- [ ] 1-min demo video
- [ ] GitHub public repo
- [ ] All API keys rotated/safe
