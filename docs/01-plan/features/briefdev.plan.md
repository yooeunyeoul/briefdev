---
template: plan
version: 1.2
feature: briefdev
date: 2026-04-25
author: Brady
project: BriefDev
status: Draft
---

# BriefDev Planning Document

> **Summary**: 한국 개발자를 위한 매일 5분 AI 트렌드 큐레이션 카드
>
> **Project**: BriefDev
> **Version**: 0.1.0
> **Author**: Brady
> **Date**: 2026-04-25
> **Status**: Draft
> **Deadline**: 2026-04-28 (3 days)
> **Context**: 뤼튼테크놀로지스 Product Engineer 과제

---

## 1. Overview

### 1.1 Purpose

AI 기술 발전 속도를 따라가지 못해 뒤늦게 정보를 알게 되는 한국 개발자의 **"진작 알았으면" 후회**를 해결한다.

### 1.2 Background

- 2024-2026, AI 도구 시장 폭발: Claude Code, Cursor, Codex, GPT-5 등 주간 단위로 신규 릴리즈
- 한국 개발자의 정보 습득 경로:
  - 영문 X(Twitter) / HackerNews / 공식 블로그 → 시간 부족
  - 한국 미디어 번역 → 1주일 이상 지연
  - 유튜브 구독 → 15분 영상 = 출퇴근 5분 소화 불가
- 결과: **"이거 지난 주에 나왔었어?" 후회를 매주 반복**

### 1.3 Related Documents

- 과제 원본: `~/Downloads/[뤼튼테크놀로지스]+Product+Engineer+과제+전형.pdf`
- One Pager: `ONEPAGER.md` (제출용)
- README: `README.md` (제출용 - AI 도구 활용 어필)

---

## 2. Scope

### 2.1 In Scope (3일 내 구현)

- [ ] HackerNews + Anthropic/OpenAI 블로그 RSS 자동 수집 (Vercel Cron)
- [ ] Gemini 1.5 Flash로 5개 큐레이션 + 3줄 요약 + "왜 중요한가" 1줄
- [ ] 카드 5장 스와이프 UI (모바일 퍼스트, PWA)
- [ ] 매직링크 인증 (이메일만)
- [ ] 본 카드 기록 (간단 분석용)
- [ ] 카카오톡/슬랙 공유 1탭
- [ ] Vercel 배포 + 데모 영상

### 2.2 Out of Scope (의도적 미구현 — One Pager에 명시)

- 결제/구독 시스템 (Phase 2 가설)
- B2B 팀 기능 (Phase 3 베팅)
- 푸시 알림 (PWA Web Push는 시간 부족 시 제외)
- 다크모드 (시스템 설정 자동 따름으로 대체)
- 회원가입/마이페이지/관리자 (매직링크로 갈음)
- 카테고리 커스터마이징 (모두에게 동일 5개 카드)
- 영문 콘텐츠 자체 번역 (Gemini 한국어 출력으로 갈음)

> **이유**: 가설 ("왜 중요한가" 한 줄이 D1 리텐션 30%를 만든다)을 검증하는 데 핵심이 아닌 모든 기능 제거. PE는 무엇을 만들지보다 무엇을 안 만들지로 평가받는다.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 매일 새벽 5시 HackerNews top 30 + RSS 자동 수집 | High | Pending |
| FR-02 | Gemini API로 5개 큐레이션 (한국 개발자 맥락 프롬프트) | High | Pending |
| FR-03 | 각 카드: 카테고리 / 제목 / 3줄 요약 / 왜 중요한가 / 원문 링크 | High | Pending |
| FR-04 | 모바일 퍼스트 카드 스와이프 UI (좌우 스와이프) | High | Pending |
| FR-05 | 이메일 매직링크 인증 (Supabase Auth) | High | Pending |
| FR-06 | 카드 조회 기록 (user_views 테이블) | Medium | Pending |
| FR-07 | "동료에게 공유" — 카톡/슬랙/링크 복사 | Medium | Pending |
| FR-08 | PWA 설정 (홈화면 추가, 오프라인 캐시) | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 첫 카드 표시 < 1초 (3G 환경) | Lighthouse |
| Cost | LLM 비용 = $0 (Gemini 무료 티어) | AI Studio 대시보드 |
| Security | API 키 환경변수만, .gitignore로 .env* 제외 | 코드 리뷰 |
| Mobile UX | iPhone SE / Galaxy 기본형에서 카드 스와이프 부드러움 | 실기 테스트 |
| Accessibility | WCAG 2.1 AA 기본 (대비, 키보드, alt) | Lighthouse |

---

## 4. Success Criteria

### 4.1 제품 가설 (One Pager 핵심)

> **"왜 이게 중요한가" 한 줄이 카드에 있으면, 한국 개발자는 매일 1회 이상 앱을 열 것이다.**
> **왜냐하면 이들이 원하는 건 정보 전달이 아니라 맥락 이해이기 때문.**

### 4.2 검증 지표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **D1 리텐션** | 30%+ | 첫날 가입 vs 다음날 재방문 |
| **카드 완독률** | 60%+ | 5개 중 평균 본 개수 / 5 |
| **공유율** | 10%+ | 공유 클릭 / 카드 조회 |
| **세션 시간** | 3분+ | 진입~이탈 |

### 4.3 과제 평가 Definition of Done

- [ ] One Pager (1-2장) — 4개 필수 항목 + 수익 모델 + 의도적 미구현
- [ ] Vercel 배포 URL — 누구나 5초 안에 가치 체험
- [ ] README.md — 실행 방법 + 기술 스택 + AI 도구 활용 (하네스 어필)
- [ ] 데모 영상 (1분) — 핵심 플로우
- [ ] GitHub 레포 (Public)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gemini 출력 JSON 깨짐 | High | Medium | structured output + zod 검증 + 재시도 1회 |
| HackerNews/RSS 다운 | Medium | Low | 폴백 데이터 (전날 캐시) |
| Vercel Cron 무료 한도 | Low | Low | 1일 1회만 사용 (한도 충분) |
| 3일 안에 다 못 끝냄 | High | Medium | OOS 항목 절대 손대지 않기 / D2 끝나면 OOS 추가 가능성 검토 |
| 본인이 페르소나 아님 | High | Low | 본인 = 페르소나 본인 (방어책 불요) |
| API 키 노출 | High | Medium | .gitignore 우선 셋업 + Vercel Env Variables |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Selected | Rationale |
|-------|:--------:|-----------|
| Starter | ☐ | 백엔드 필요 (수집 + DB) |
| **Dynamic** | ☑ | Next.js + Supabase fullstack, 3일 내 구현 가능 |
| Enterprise | ☐ | 과제 범위 초과 |

### 6.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Framework | **Next.js 14 (App Router)** | 채용공고 우대 + Vercel 배포 즉시 |
| Language | **TypeScript** | 채용공고 우대 + AI 코드 일관성 |
| Styling | **Tailwind + shadcn/ui** | 빠른 UI 구축 + 디자인 일관성 |
| State | **React Query + URL state** | 서버 상태 위주, 클라 상태 최소 |
| Backend | **Next.js API Routes** | 별도 서버 X, 모노 레포 |
| DB / Auth | **Supabase** | 무료 + 매직링크 + RLS 즉시 |
| LLM | **Google Gemini 1.5 Flash** | 무료 / 1M 컨텍스트 / Multimodal 확장성 |
| Cron | **Vercel Cron** | 무료 / Next.js 통합 |
| Deploy | **Vercel** | Next.js 최적 / 즉시 |
| Monitoring | **Vercel Analytics + 자체 로그** | 무료 + 충분 |

### 6.3 Folder Structure

```
briefdev/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (main)/
│   │   ├── page.tsx              # 카드 5장 메인 화면
│   │   └── card/[id]/page.tsx    # 개별 카드 상세
│   ├── api/
│   │   ├── cron/collect/route.ts # 매일 수집 + 큐레이션
│   │   ├── auth/callback/route.ts
│   │   └── share/route.ts
│   └── layout.tsx
├── components/
│   ├── card/CardSwiper.tsx       # 스와이프 UI 핵심
│   ├── card/CardItem.tsx
│   └── ui/                       # shadcn/ui
├── lib/
│   ├── supabase/{client,server}.ts
│   ├── gemini/curate.ts          # LLM 큐레이션 핵심
│   ├── sources/{hackernews,rss}.ts
│   └── analytics/track.ts
├── prompts/
│   ├── curate-v1.md              # 프롬프트 버전 관리 (하네스)
│   ├── curate-v2.md
│   └── curate-v3.md              # 현재 사용중
├── public/
│   └── manifest.json             # PWA
├── docs/
│   ├── 01-plan/
│   ├── 02-design/
│   └── 04-report/
├── ONEPAGER.md                    # 제출 핵심
├── README.md                      # 제출 핵심
├── CLAUDE.md                      # 하네스
└── .env.local                     # gitignore
```

---

## 7. Convention Prerequisites

### 7.1 To Define (셋업 첫날)

- [ ] CLAUDE.md (AI 코딩 하네스)
- [ ] .gitignore (.env* 우선)
- [ ] tsconfig.json strict mode
- [ ] ESLint + Prettier
- [ ] 프롬프트 폴더 (`prompts/`) 버전 관리

### 7.2 Naming Conventions

| 카테고리 | 규칙 |
|---------|------|
| 컴포넌트 | PascalCase (`CardSwiper.tsx`) |
| 함수 | camelCase (`fetchHackerNews`) |
| 상수 | UPPER_SNAKE (`MAX_CARDS = 5`) |
| 폴더 | kebab-case (`api/cron/collect`) |
| DB 테이블 | snake_case (`user_views`) |

### 7.3 Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `GEMINI_API_KEY` | LLM 호출 | Server |
| `NEXT_PUBLIC_SUPABASE_URL` | DB/Auth | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | DB/Auth | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 서버 작업 | Server |
| `CRON_SECRET` | Cron 인증 | Server |

---

## 8. 3-Day Schedule

### D1: 2026-04-25 (오늘)
- [x] One Pager 1차 + Plan 문서 (지금)
- [ ] GitHub 레포 + Next.js 셋업 + .gitignore
- [ ] CLAUDE.md (하네스) 1차
- [ ] Supabase 프로젝트 + 스키마 + 로컬 연결
- [ ] HackerNews 수집 → DB 저장 1회 성공
- [ ] Gemini로 1개 글 요약 PoC 성공

### D2: 2026-04-26
- [ ] 큐레이션 프롬프트 v1 → v2 → v3 (A/B 테스트)
- [ ] Vercel Cron 매일 자동 실행
- [ ] 카드 5장 스와이프 UI
- [ ] 매직링크 인증
- [ ] 카드 조회 기록 (user_views)

### D3: 2026-04-27
- [ ] 공유 기능 (카톡/슬랙/복사)
- [ ] PWA 설정 (manifest, 아이콘)
- [ ] Vercel 배포 + 도메인
- [ ] README 작성 (AI 도구 활용 어필)
- [ ] 데모 영상 (Loom 1분)
- [ ] One Pager 최종 다듬기

### D4: 2026-04-28 (제출일 오전)
- [ ] 최종 검수 + 제출

---

## 9. AI 코딩 하네스 (채용공고 우대사항 어필)

### 9.1 CLAUDE.md (프로젝트 규칙)
- 도메인 용어 (카드, 큐레이션, 소스, 카테고리)
- 코딩 컨벤션 (TS strict, 함수형 컴포넌트, named export)
- 폴더 규칙 (lib/, prompts/, components/)
- 금지사항 (any, console.log 커밋, 키 하드코딩)

### 9.2 프롬프트 버전 관리
```
prompts/
├── curate-v1.md   # 단순 요약
├── curate-v2.md   # + "왜 중요한가"
└── curate-v3.md   # + 한국 개발자 맥락 (현재)
```
README에 버전별 결과 비교 표 → A/B 테스트 어필

### 9.3 슬래시 커맨드 (선택)
- `/add-source` — 새 데이터 소스 추가 시 정해진 파일 5개 자동 생성

### 9.4 Hooks (선택)
- 커밋 전 타입체크 자동 실행

---

## 10. Next Steps

1. [x] Plan 문서 작성 (이 문서)
2. [ ] Design 문서 (`/pdca design briefdev`) — 또는 시간 절약 위해 스킵 가능
3. [ ] Next.js 프로젝트 셋업 (즉시)
4. [ ] HackerNews + Gemini PoC (오늘 저녁)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-25 | Initial draft from PE 과제 | Brady |
