# BriefDev

> **출퇴근 5분, 카드 5장.**
> Claude Code · Cursor · 새 모델 — 진짜 내 일에 영향 줄 5개만 골라드립니다.

**Live**: https://briefdev.vercel.app
**One Pager**: [`ONEPAGER.md`](./ONEPAGER.md)
**Repo**: https://github.com/yooeunyeoul/briefdev

> 뤼튼테크놀로지스 Product Engineer 과제 (2026-04-25 ~ 2026-04-28, 3일).

---

## 🎯 한 문장 요약

매일 새벽 5시(KST), HackerNews + Hugging Face Blog + Simon Willison + The Verge AI + GitHub trending에서 모은 30~50개의 글을 Gemini가 큐레이션해 카드 1~5장으로 정리하는 모바일 퍼스트 웹앱.

페르소나: **Claude Code, Cursor 등 AI 코딩 도구를 적극 활용하는 한국 IT 직장인 (3-8년차 개발자)**.

---

## 🚀 실행 방법

### 사전 요구
- Node.js 20+ (개발은 Node 23.11)
- 무료 계정: [Supabase](https://supabase.com), [Google AI Studio](https://aistudio.google.com), [Vercel](https://vercel.com)

### 로컬 개발

```bash
git clone https://github.com/yooeunyeoul/briefdev.git
cd briefdev
npm install
cp .env.local.example .env.local
# .env.local에 5개 키 채우기 (아래 'Environment Variables' 참고)

# Supabase SQL Editor에서 docs/02-design/schema.sql 실행
# → articles, bundles, cards, user_views 테이블 + RLS 정책 생성

npm run dev
# http://localhost:3000

# 로컬에서 큐레이션 1회 트리거 (DB에 오늘의 bundle 생성)
curl "http://localhost:3000/api/cron/collect?token=$CRON_SECRET"
```

### Environment Variables

| 변수 | 용도 | 어디서 |
|------|------|------|
| `GEMINI_API_KEY` | LLM 큐레이션 | https://aistudio.google.com/apikey (무료) |
| `NEXT_PUBLIC_SUPABASE_URL` | DB / Auth | Supabase 프로젝트 → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저용 (RLS 보호) | 동일 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 작업용 (RLS 우회, 절대 클라이언트 X) | 동일 |
| `CRON_SECRET` | Vercel Cron 인증 | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | OG 절대 URL | `http://localhost:3000` 또는 production URL |

`.env.local`은 `.gitignore`에 포함됨 (검증: `git check-ignore .env.local`).

### Production 배포

```bash
vercel link --project briefdev
vercel env add GEMINI_API_KEY production         # 5개 변수 모두
vercel --prod
```

`vercel.json`의 cron 정의로 매일 **05:00 KST (20:00 UTC)** 자동 큐레이션.

---

## 🏗 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| **프레임워크** | Next.js 16 App Router + TypeScript strict | 채용공고 우대 + Vercel 즉시 배포 |
| **스타일** | Tailwind v4 (다크 강제) + 직접 컴포넌트 | shadcn 의존 X (의존성 가볍게) |
| **백엔드** | Next.js API Routes + Supabase Postgres | 별도 서버 X, 모노 레포 |
| **인증** | Supabase Magic Link (선택) | 패스워드 X, 마찰 최소 |
| **LLM** | Google Gemini 2.5 Flash | 무료 + 1M 컨텍스트 + JSON Mode + 멀티모달 확장성 |
| **본문 추출** | Jina Reader (`r.jina.ai`) | 무료 + 광고/네비 제거된 markdown 반환 |
| **배포** | Vercel + Vercel Cron | 같은 플랫폼, 무료 티어 충분 |
| **검증** | zod 모든 외부 데이터 (LLM/RSS/HN/GitHub) | 환각 방어 + 런타임 안전 |

### 폴더 구조 핵심

```
prompts/                  # 프롬프트 버전 관리 (하네스 핵심)
  curate-v1.md ~ v5.md
src/
  app/
    page.tsx              # 메인 (DB 캐시에서 오늘 bundle)
    c/[id]/page.tsx       # 카드 공유 페이지 (per-card OG)
    login/                # 매직링크 (선택)
    api/
      cron/collect/       # 매일 새벽 5시 KST 큐레이션
      og/                 # 동적 OG 이미지 (1200x630)
      auth/               # callback / signout
      views/              # 카드 조회 + 공유 기록 (zod + RLS)
  components/card/
    CardSwiper.tsx        # 포인터 드래그 + dwell-time tracking
    CardItem.tsx          # 카드 비주얼
    ShareBar.tsx          # Web Share / Slack / 클립보드
  lib/
    sources/              # hackernews / rss / github / index (aggregator)
    gemini/curate.ts      # 본문 주입 + zod + relevance threshold
    db/bundles.ts         # saveArticles / saveBundle / getLatestBundle / getCardById
    supabase/             # client (브라우저) / server (서버 + service-role)
docs/
  01-plan/features/briefdev.plan.md
  02-design/schema.sql    # Supabase에 그대로 paste-and-run
```

---

## 🤖 AI 도구 활용 — 진짜로 어떻게 썼는지

### Claude Code (개발 도구)

이 레포의 **거의 모든 코드는 Claude Code(Opus 4.7)와 함께 작성**됐습니다.

#### 1. 하네스 — `CLAUDE.md`
프로젝트 컨벤션, 도메인 용어, 금지 패턴을 한 문서에 정리해 매 세션마다 일관된 산출물을 보장.

```markdown
## Forbidden Patterns
- ❌ any 타입 — unknown + zod parse
- ❌ console.log 커밋
- ❌ 하드코딩 키
- ❌ LLM JSON parse without zod
- ❌ 클라이언트 LLM 호출
```

→ "다음 세션에 백엔드만 만들어달라" 같은 부분 작업도 같은 스타일로 나옴.

#### 2. 프롬프트 버전 관리 — `prompts/curate-vN.md`
LLM 프롬프트를 코드처럼 버전 관리. 각 버전이 무엇을 가설하고 무엇을 바꿨는지 헤더에 기록.
실제 production을 거치며 v1 → v5로 5번 진화 (아래 섹션).

#### 3. PDCA 사이클 자동화
계획 → 설계 → 구현 → 검증 → 개선의 사이클을 슬래시 커맨드로 묶어 빠른 가설 검증.

### Gemini 2.5 Flash (제품 LLM)

**제품 안에서 큐레이션을 수행하는 두뇌**. 무료 티어 + 1M 컨텍스트 + JSON Mode + 503 재시도.

> **Claude Code = 만드는 도구**, **Gemini = 만드는 제품 안의 도구**. 분리 의도적.

### 시간 단축 사례 (실제 측정)

| 작업 | 전통 방식 추정 | Claude Code 활용 | 단축 |
|------|------|------|------|
| Next.js 16 + Supabase 셋업 | 4시간 | 30분 | **8x** |
| 카드 스와이프 UX (드래그/캡처/햅틱) | 6시간 | 1시간 | **6x** |
| 동적 OG 이미지 (next/og) | 3시간 | 25분 | **7x** |
| RSS 파서 (의존성 0) | 2시간 | 15분 | **8x** |
| RLS 정책 + 콜백 + 미들웨어 | 4시간 | 40분 | **6x** |
| **합계 (3일치 작업)** | ~30시간 | ~6시간 | **5x** |

→ 7일 과제를 3일에 끝낸 핵심 레버리지.

### AI가 못한 것 / 사람이 한 것

- **사용자 신뢰의 임계값 설정** — "5장 강제 vs 2장이라도 정직?" 판단은 사람이 결정
- **페르소나 정의** — "한국 개발자 = 누구?"의 디테일 (서브 페르소나 포함 폭 결정)
- **whyMatters 문체 톤** — "~을 하는 개발자에게 — 가치" 형태 발견까지 5번 시행착오
- **프롬프트 임계값 8 vs 7** — 점수 분포 보고 사람이 결정

→ AI는 빠르게 만들지만, **무엇을 만들고 무엇을 안 만들지**의 판단은 여전히 사람의 일.

---

## 🧬 큐레이션 진화 (v1 → v5)

이 프로젝트의 핵심 가치는 **3일 동안 5번에 걸쳐 큐레이션 품질을 끌어올린 사이클**입니다.

```
v1: 제목+URL → "5개 골라서 한국어로 요약"
   ❌ LLM이 학습 지식으로 살붙이기 — 환각
   증상: 발표에 없는 파라미터 수, 잘못된 가격 등장

v2: + 페이월 도메인 차단 (코드 + 프롬프트 양쪽)
   ✅ 사용자가 '원문 읽기' 클릭 시 결제벽 안 만남
   잔여 문제: 본문 추측 환각은 그대로

v3: + Jina Reader로 원문 본문(markdown) 추출 → 본문 근거 요약
   ✅ "120개 작업 중 110개 해결" — 본문에 적힌 실제 수치
   ✅ NO_BODY 글은 큐레이션에서 자동 제외
   잔여 문제: 5장 강제 채움 → 부적합 글 끼어듦 (10GbE 어댑터 등장)

v4: + 적합도 점수(1-10) + 임계값 8 + 가변 카드 수 (0~5)
   ✅ 부적합 글 자동 제외 (양자 컴퓨팅, 그래픽스, 네트워크 하드웨어)
   ✅ "오늘은 2장입니다" 정직한 UX
   잔여 문제: HN 단일 소스 → 8점+ 글이 부족한 날

v5: + 다중 소스 (HF, Simon Willison, The Verge AI, GitHub) + 다양성 가중치
   ✅ 풀 30 → 50+ → 매일 5장 안정
   ✅ 출처 한 곳 독점 방지 (다양성 보장)
   ✅ whyMatters: "~을 하는 개발자에게 — 가치" 형태 강제
   → 사용자가 5초 안에 자기 케이스인지 판단 가능
```

### 다층 방어 (Defense-in-Depth)

```
1. 소스 단     → 페이월 도메인 fetch에서 차단 (PAYWALL_HOSTS allowlist)
2. 본문 단     → Jina Reader 실패 시 <NO_BODY> 마킹
3. 프롬프트 단 → 적합도 8점 + 카테고리 강제 제외 명시
4. 코드 필터  → relevanceScore < 8 자동 drop (LLM이 부풀려도 거름)
5. 출력 단    → zod 스키마 검증
```

LLM 출력은 절대 신뢰하지 않습니다.

### 실측 결과 (2026-04-26 기준)
- 풀 크기: **34** (HF 5 + Simon 5 + Verge 5 + HN 19, paywall 1개 자동 제외)
- 본문 추출 성공: **20/29** (9개는 봇 차단/지원 안 됨)
- 카드 출력: **5장**
- 출처 분산: **3개 소스에 분포**
- LLM 호출: **1회/일** (38초)
- 비용: **$0** (Gemini 무료 티어 + Jina 무료)

---

## 📐 PE 판단력 — 의도적으로 만들지 않은 것

| 안 만든 것 | 이유 |
|----------|------|
| 회원가입 / 마이페이지 / 관리자 | 매직링크로 갈음, 가설 검증에 무관 |
| 카테고리 커스터마이징 | Phase 1은 "5장의 가치" 자체를 검증해야 함 |
| 결제 / Pro 플랜 | Phase 2 가설, 지금은 마찰 0이 우선 |
| 푸시 알림 | PWA Web Push는 효과 대비 시간 소모 큼 |
| 강제 회원가입 | "기록 남기고 싶다면" 선택사항 — 첫 가치 체험에 마찰 0 |
| 시간 단위 실시간 갱신 | "출퇴근 5분 다이제스트" 가설은 1일 1번이 본질. 자주 갱신하면 가설 자체가 바뀜 |

> 7일에 풀스택 개발자처럼 기능 10개 다 만드는 건 PE의 일이 아닙니다.
> PE는 **가설 1개 검증에 필요한 디테일 1개에 집착하는 사람**.

---

## 💰 수익 모델 가설

| Phase | 수익 모델 | 가설 |
|-------|---------|------|
| 1 (지금) | **무료, 데이터 수집** | D1 리텐션 30%+ 검증, 어떤 카테고리가 리텐션을 만드는가 학습 |
| 2 (1~3개월) | **B2C Freemium** ₩4,900/월 | 음성 듣기, 분야별 큐레이션, 백넘버 검색 |
| 3 (3~6개월) | **B2B SaaS** ₩99,000/월 ⭐ | "팀 도메인 맞춤 AI 트렌드 다이제스트" — 진짜 베팅 |

자세한 내용은 [`ONEPAGER.md`](./ONEPAGER.md).

---

## 📊 측정 — 가설 검증 인프라

가설("'~을 하는 개발자에게' whyMatters가 D1 리텐션 30%를 만든다")을 검증할 수 있도록:

- **Vercel Analytics** — 페이지뷰, 세션
- **`user_views` 테이블** — 카드별 조회, dwell time, 공유 여부 (RLS로 본인만)
- **자체 이벤트** — `/api/views`에 카드 ID + dwell + shared 기록

```sql
-- 카드별 인기도
select c.title, count(*) as views, avg(uv.read_seconds) as avg_dwell
from cards c
join user_views uv on uv.card_id = c.id
where c.bundle_id = (select id from bundles order by bundle_date desc limit 1)
group by c.id, c.title
order by views desc;

-- 카테고리별 리텐션
select c.category, count(distinct uv.user_id) as readers,
       sum(case when uv.shared then 1 else 0 end) as shares
from cards c
join user_views uv on uv.card_id = c.id
group by c.category;
```

---

## 🛡 보안

- API 키는 환경변수만, `.env.local`은 `.gitignore`에 포함
- `service_role` 키는 **서버 라우트에서만** 사용 (`src/lib/supabase/server.ts`의 `createServiceClient`)
- 클라이언트는 `anon` 키만 사용 + RLS 정책으로 보호
- `user_views`는 `auth.uid() = user_id` 정책 → 본인 행만 조회/삽입
- LLM 출력 zod 스키마 검증 (환각 + 인젝션 방어)
- Cron API는 `Bearer ${CRON_SECRET}` 인증 (Vercel Cron 표준)

---

## 🗓 7일이 더 있다면

1. **B2B 파일럿 1팀 검증** — 지인 스타트업 1곳에 슬랙봇 전달 → 1주 사용 후 인터뷰
2. **다국어 소스 확장** — 일본 (Qiita, Zenn) / 중국 (juejin) AI 트렌드 추가
3. **유튜브 영상 자동 요약** — Gemini Multimodal로 본인의 정보 습득 1차 채널(유튜브) 직접 흡수
4. **카테고리 개인화** — 본 카드 / 공유한 카드 학습 → 다음 큐레이션에 가중치
5. **A/B 큐레이션 비교** — v5 vs 다음 버전을 같은 풀로 동시 생성, 사용자별로 노출 → CTR/공유율 측정

---

## 📦 주요 의존성 (모두 무료)

```
@supabase/supabase-js, @supabase/ssr   인증 + DB
@google/generative-ai                  Gemini SDK
zod                                    런타임 검증
swr                                    클라이언트 캐싱 (소량)
next, react, tailwindcss               프레임워크
```

외부 API:
- HackerNews API (무료, no key)
- Jina Reader (무료, no key, IP rate limit)
- GitHub Search API (무료, anon 60 req/h)
- Hugging Face / Simon Willison / The Verge RSS (무료)
- Google Gemini 2.5 Flash (무료 티어 1500 req/일)
- Supabase (무료 티어 500MB DB + 50K MAU)
- Vercel (무료 티어 + Cron)

→ **운영 비용 $0**.

---

## 📝 라이센스

MIT.

---

**제작자**: Brady (yooeunyeoul)
**기간**: 2026-04-25 ~ 2026-04-28 (3일)
**평균 일 1배포**: ✅ 매 커밋 → push → Vercel 자동 배포
