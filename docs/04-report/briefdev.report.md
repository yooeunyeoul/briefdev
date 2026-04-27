# BriefDev — PDCA Completion Report

> **Wrtn Technologies Product Engineer 과제**
> Started: 2026-04-25 / Submitted: 2026-04-28 (3-day sprint)
> Repo: github.com/yooeunyeoul/briefdev / Live: briefdev.vercel.app

---

## 1. Executive Summary

한국 IT 직장인 (특히 AI 도구 사용 3-8년차 개발자) 을 위한 **하루 5장, 5분 AI 트렌드 큐레이션** 서비스를 3일만에 0→Production 까지 빌드.

- **전체 기능 완성**: 데이터 수집 → LLM 큐레이션 → 모바일 카드 UI → 공유 → 인증 → Cron 자동화 → Vercel 배포
- **프롬프트 6회 진화**: v1(베이스라인) → v6(한국 출처 포함 + 가중치 룰)
- **품질 가드레일 3중**: 본문 발췌 근거 (Jina) + 점수 임계값 8점 + zod 스키마 검증
- **honest framing**: ONEPAGER에 "푼 것 vs 못 푼 것" 섹션 추가, 가설 검증 인프라 강조

**평가 포인트**: "기술적 화려함보다 사용자에게 의미 있는 경험을 만드는 판단" — 6번의 프롬프트 진화 자체가 *판단의 흔적*.

---

## 2. PDCA Cycle Trace

### Plan (2026-04-25)
| 항목 | 결정 |
|---|---|
| 도메인 | C: AI 요약/큐레이션 (A: 사주, B: 이미지 생성 대비 리텐션 게임 가능성) |
| 페르소나 | 한국 IT 직장인 (3-8년차) — AI 도구 사용 + 영어 부담 + "진작 알았으면" 좌절 |
| 코어 가설 | "whyMatters → 5초 자기 매칭 → D1 30%+" |
| 플랫폼 피봇 | Flutter (지원자 본업) → Next.js (회사 스택 매칭) |

**산출물**: `docs/01-plan/features/briefdev.plan.md`

### Design (2026-04-25)
| 항목 | 결정 |
|---|---|
| 스택 | Next.js 16 + Supabase + Gemini 2.5 Flash + Vercel |
| 데이터 모델 | `daily_bundles`, `cards`, `user_views` (RLS) |
| 카테고리 | 5개 (`pick`/`tool`/`tip`/`deep`/`kr`) |
| 큐레이션 발행 주기 | 1일 1회 (Vercel Cron 05:00 KST) |
| 인증 | Magic Link (Supabase Auth) |

**산출물**: `docs/02-design/schema.sql`

### Do (2026-04-25 ~ 2026-04-27)

**24 commits, 25개 TS/TSX 파일, 약 3,800 LOC** (next 골조 제외).

빌드 순서대로 (커밋 시간순):
1. **Scaffold** (`f159314`) — Next 16 App Router, TS strict, Tailwind v4
2. **Card Swiper + DB** (`d214bb7`) — Pointer 이벤트, Supabase 스키마
3. **Cron Pipeline** (`550b0ca`) — 매일 05:00 KST 자동 큐레이션
4. **Auth** (`2f0b63f`) — 매직 링크 + per-card 뷰 트래킹
5. **Dark Theme + Link Fix** (`4ba7603`) — 카드 안 링크 클릭 가능하게
6. **Paywall Filter** (`e5c6bd0`) — Bloomberg/WSJ/NYT 등 9개 도메인 차단
7. **Body Grounding** (`b20e17a`) — Jina Reader 본문 추출 → 환각 방어 핵심
8. **Read Original Row** (`1241586`) — UI 일그러짐 해결
9. **v4 Threshold** (`0902c20`) — 점수 8점 이상만 카드 (1~5장 가변)
10. **KST Date** (`fc1a944`) — UTC 표시 버그 수정
11. **v5 Multi-Source** (`2a64235`) — HN + HF + Simon Willison + Verge AI + GitHub
12. **whyMatters Format** (`c82dda2`) — *"~을 하는 개발자에게"* 강제
13. **Auto-grow Card** (`08b5ece`) — 컨텐츠 길이별 높이
14. **Per-Card Page + OG** (`12e887d`) — 카드별 공유 가능한 URL + 1200×630 동적 OG
15. **Inline ShareBar** (`525d720`) — 페이지 점프 제거
16. **Submission README** (`ed5cc7b`)
17. **Truthful Metadata** (`1815a24`) — 출처 없는 통계 제거, 검증된 수치만
18. **Login Justification** (`4889264`) — 사용자 가치 0임을 인정 + Phase 2 인프라 정의
19. **Sticky Pagination** (`02c77e8`) — 카드별 높이 차이로 인한 버튼 점프 해결
20. **Native Share Mobile** (`803f3a0`) — Web Share API 상태 머신 (idle/sharing/shared/copied/failed)
21. **v6 Korean Sources** (`565c09e`) — GeekNews + 토스 + 카카오 RSS 추가
22. **v6 Sync Docs** (`1c3c32d`)
23. **v6 Prompt Fix** (`71cef12`) — StarRocks (DB 운영) 가 8점 통과한 버그 → "한국 출처 ≠ 자동 가산점" 룰 명시
24. **솔직한 한계** (`410b1cb`) — ONEPAGER에 "푼 것 vs 못 푼 것" 섹션

### Check (Continuous)

각 진화 단계마다 **사용자 직접 리뷰 → 즉시 수정** 사이클이 있었음. 별도 Gap Analysis 단계는 진행하지 않음 (3일 데드라인 + Solo Dev + 단계별 라이브 검증으로 대체).

검증 인프라:
- `user_views` 테이블 (D1 리텐션 베이스라인 측정 가능)
- Vercel Logs (Cron 결과, Gemini 응답)
- 실기기 테스트 (iPhone Safari + Mac Chrome)

### Act (Continuous)

각 커밋이 *직전 발견 문제의 즉시 수정*. 대표 사례:

| 발견 | Act |
|---|---|
| Bloomberg 페이월 카드 클릭 시 결제 강요 | URL 도메인 allowlist + 프롬프트 v2 |
| 카드가 그냥 머리만 보고 LLM 추측 | Jina Reader 본문 발췌 → v3 |
| 5장을 채우려고 점수 낮은 글까지 선택 | 임계값 8점 + 가변 카드 수 → v4 |
| 영문 페르소나 매칭 불일치 | 한국 RSS 4개 + 'kr' 카테고리 활성 → v6 |
| 한국 출처라고 일반 DB 글이 8점 받음 | 출처 가중치 룰 강화 (v6 fix) |
| 모바일 공유 실패에 사용자 무반응 | 상태 머신 (sharing/shared/copied/failed) |
| 카드별 높이 차이로 페이지네이션 점프 | sticky bottom pill |

---

## 3. Hypothesis Status

> **"AI 도구를 쓰는 한국 개발자는 매일 출근길 5분, 자기 시나리오에 맞춘 5장 카드만 받으면 D1 리텐션 30% 이상이 가능하다."**

| 단계 | 상태 |
|---|---|
| 가설 정량화 | ✅ (D1 30%, P50 dwell ≥ 30s) |
| 검증 인프라 | ✅ (`user_views` + Vercel Analytics) |
| MVP Production | ✅ (briefdev.vercel.app) |
| 베이스라인 측정 | ❌ (사용자 0명, 측정 시작 전) |
| 가설 정량 갱신 | ❌ |

**정직한 결론**: "문제를 풀었다" 가 아니라 "**풀 수 있는 가설로 만들고 검증 인프라를 깔았다**".

---

## 4. Prompt Evolution (Harness Showcase)

| 버전 | 변경 | 발견된 문제 | 다음 가설 |
|---|---|---|---|
| v1 | HN top 30 → 5 카드 | 영문 + AI 무관 글 다수 | RSS 추가 |
| v2 | + paywall 도메인 차단 | 큐레이션 자체 환각 | 본문 발췌 |
| v3 | Jina Reader 본문 그라운딩 | 5장 채우려고 5/6점 글 끌어올림 | 임계값 |
| v4 | 점수 임계값 8 + 가변 카드 수 | 1소스 의존 | 다소스 |
| v5 | HN + HF + Simon Willison + Verge AI + GitHub | 페르소나 ≠ 영문 풀 | 한국 출처 |
| v6 | + GeekNews + 토스 + 카카오 + 가중치 룰 | (현재) GeekNews와 60% 컨텐츠 겹침 가능성 | Phase 2: 한국어 본문 변환 |

**프롬프트 6개가 모두 `prompts/curate-vN.md` 에 보존됨** — 평가자가 *판단의 진화* 자체를 추적 가능.

---

## 5. What's Out of Scope (Intentional)

플랜 단계에서 *명시적으로 제외* 했고, 끝까지 안 만든 것들:

- 회원 가입 / 프로필 / 어드민 (매직 링크면 충분)
- 카테고리 커스터마이징 (Phase 1 = 모두에게 같은 5장)
- 결제 / Pro 플랜 (Phase 2 가설)
- 푸시 알림 (효과 대비 시간 소모 큼)
- 실시간 (큐레이션의 본질 = "정해진 시간, 정해진 양")

→ "안 만든 것을 명시" 하는 것 자체가 *판단의 결과물*.

---

## 6. Honest Limits (from ONEPAGER 솔직한 한계)

✅ **푸는 것**: 정보 양 절제, 5초 자기 매칭, 환각 방어, 모바일 카드 UX, 출처 다양성

⚠️ **못 푸는 것**:
1. 영어 부담 본질 (원문 클릭 → 영문 페이지)
2. 시간 단위 실시간성 (1일 1회 갱신)
3. 가설 자체 검증 데이터 0 (사용자 0명)
4. GeekNews와 60% 겹침 가능성 (진짜 차별 = 포맷 + 시나리오 + whyMatters)

---

## 7. Submission Checklist

- [x] ONEPAGER.md (도메인 / 페르소나 / 가설 / 한계 / 성공 지표)
- [x] README.md (AI 툴링 / 프롬프트 진화 / 디자인 결정 / 환경 변수)
- [x] Vercel 배포 (briefdev.vercel.app)
- [x] GitHub 공개 저장소
- [x] 매직 링크 인증 동작
- [x] Vercel Cron 등록 (05:00 KST)
- [x] 모바일 / 데스크톱 양쪽 동작 검증
- [x] API 키 환경 변수화 (.env.local 비공개)
- [ ] 1분 데모 영상 (선택)

---

## 8. Process Reflection

### 잘한 것
- **단계별 사용자 리뷰 사이클**: 빌드 → 사용자 확인 → 즉시 수정. 24 커밋 모두 작은 단위.
- **하네스 의식적 활용**: 프롬프트를 코드처럼 버전 관리, 가설 → 변경 → 결과 기록.
- **honest framing 끝까지 유지**: 출처 없는 통계 ("12% D1") 즉시 제거, 한계 섹션 자발적 추가.
- **결정 로그 (CLAUDE.md)**: 왜 Gemini? 왜 Supabase? 왜 매직 링크? 모두 사유 명시.

### 아쉬운 것
- 데이터 베이스라인 0 — 가설을 *증명* 하지 못함. 검증 *인프라* 까지만.
- Jina Reader 의존성 — 무료 한도 + 외부 서비스 SLA 위험.
- 'kr' 카테고리 빈도 — 한국 출처에서 실제 AI 직접 관련 글 빈도가 예상보다 낮음.

### Phase 2 우선순위 (실제 운영 시)
1. **베이스라인 측정 (1주)** — D1, dwell, 카테고리별 클릭률
2. **한국어 본문 깊이 해설** — 영어 부담 본질 해결
3. **개인화 v0** — 카테고리 가중치만 사용자별
4. **Pro 플랜 가설 (Phase 2)** — 7일치 아카이브 + 검색

---

## 9. Final Status

| 항목 | 상태 |
|---|---|
| Plan | ✅ Complete |
| Design | ✅ Complete |
| Do | ✅ Complete (24 commits, production deployed) |
| Check | ✅ Continuous (per-commit live review) |
| Act | ✅ Continuous (24 iterative fixes) |
| **Phase** | **✅ READY FOR SUBMISSION** |
| **Match Rate** | **N/A — assignment, not spec compliance** |
| **Deadline Pacing** | 3 of 3 days used, on schedule |

---

*Generated 2026-04-27 / Submission deadline 2026-04-28*
