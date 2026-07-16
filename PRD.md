# PRD — 미국주식 자산관리 & 기업정보 웹서비스

> 최종 정리: 2026-07-15 · 상태: **MVP 구현 완료** (배포 전)
> 이 문서는 실제 구현된 내용(as-built) 기준입니다. 초기 기획본은 상위 폴더 `PRD_미국주식자산뉴스서비스.md` 참고.

---

## 1. 개요

미국주식 투자자가 **자신의 보유 자산(총액·손익·환차손익)을 한눈에 확인**하고,
**관심 기업의 뉴스·공식 공시·실적 일정을 자동으로 모아보는** 공개 웹서비스.

- **주 사용자**: 미국주식을 보유한 한국 개인투자자
- **핵심 가치**: 흩어진 자산 현황 + 관심 종목 소식을 하나의 대시보드로
- **한 줄 정의**: "내 미국주식 포트폴리오 + 관심 종목 소식을 한 곳에서"

---

## 2. 확정 결정사항

| 항목 | 결정 |
|------|------|
| 사용 대상 | 불특정 다수 (공개 서비스, 회원 인증) |
| 자산 입력 | 수동 입력 (티커·수량·매수단가·매수환율) |
| 시세 | 지연 시세 (약 15분, 무료 API) |
| 정보 소스 | 뉴스 + 공식 공시(SEC) + 실적 캘린더 |
| 언어 | 원문 그대로 (영어) — AI 요약·번역은 향후 |
| 표시 통화 | USD / KRW 둘 다 + **환차손익 분리** |
| 추이 기록 | MVP는 현재 시점, 일별 스냅샷 테이블은 준비됨(배치는 향후) |
| 기술 스택 | Next.js 16 + Supabase + Vercel |

---

## 3. 구현 완료 기능 (MVP)

### 3.1 인증
- 이메일/비밀번호 **회원가입 · 로그인 · 로그아웃** (Supabase Auth)
- 이메일 확인 흐름(`/auth/confirm`) — 개발 편의로 현재 OFF, **배포 전 ON 필요**
- Proxy(구 Middleware)로 세션 갱신 + 보호 경로(`/dashboard`, `/portfolio`) 접근 제어

### 3.2 포트폴리오 (자산 관리)
- 보유 종목 **추가 / 수정 / 삭제** (RLS로 본인 데이터만)
  - 필드: 티커 · 수량 · 평균 매수단가(USD) · 매수 시점 환율
  - 각 행 "수정"으로 수량·평균단가·매수환율 일괄 편집
- 종목별 **현재가 · 평가금액 · 평가손익 · 수익률** (지연 시세)
- 상단 요약 카드: **총 평가금액(USD/KRW) · 총 평가손익**
- **환차손익 분리 표시**
  - 주식손익 = 수량 × (현재가 − 매수가) × 현재환율
  - 환차손익 = 수량 × 매수가 × (현재환율 − 매수환율)
- 색상: 한국식 (빨강=수익 / 파랑=손실)

### 3.3 대시보드
- 스탯 카드: **총 자산(USD/KRW) · 전일 대비 등락 · 총 평가손익(환차 포함)**
- **종목 비중 도넛 차트** (순수 SVG, 색맹 안전 팔레트, 9개↑는 "기타"로 묶음)

### 3.4 관심 & 소식 피드
- **관심 종목 관리** (추가/삭제) + 보유 종목 자동 포함
- 통합 피드 (원문 그대로, 최신순, 미래 실적 일정 상단):
  - **뉴스**: Finnhub company-news
  - **공시**: SEC EDGAR (8-K, 10-Q, 10-K 등 주요 서식, 실제 문서 링크)
  - **실적**: Finnhub earnings calendar (예정 실적 + EPS 예상)
- 필터 탭: 전체 / 뉴스 / 공시 / 실적

---

## 4. 기술 아키텍처

```
[Next.js 16 (App Router, TS, Tailwind)]  — Vercel 배포 예정
        │
        ├─ Supabase Auth        인증
        ├─ Supabase Postgres    데이터 + RLS
        └─ (예정) Edge/Cron      스냅샷·수집 배치
                 │
                 ├─ Finnhub       시세(/quote) · 뉴스 · 실적 캘린더
                 ├─ Frankfurter   환율 USD→KRW (키 불필요)
                 └─ SEC EDGAR     공시 (키 불필요, User-Agent 필요)
```

- 시세/뉴스/환율은 **서버 사이드 fetch + revalidate 캐시**(시세 15분, 환율 1시간, 뉴스 30분)로 무료 한도 보호
- 계산 로직은 `src/lib/portfolio.ts`(`computePortfolio`)로 공통화

### 주요 파일
| 영역 | 경로 |
|------|------|
| Supabase 클라이언트 | `src/lib/supabase/{client,server,admin,proxy}.ts` |
| 세션/보호경로 | `src/proxy.ts` |
| 시세·환율·피드 | `src/lib/{quotes,fx,feed,portfolio}.ts` |
| 인증 UI | `src/app/login/`, `src/components/AuthForm.tsx` |
| 포트폴리오 | `src/app/portfolio/`, `src/components/{AddHoldingForm,HoldingsTable,EditableHoldingRow,PortfolioSummary}.tsx` |
| 대시보드 | `src/app/dashboard/`, `src/components/WeightDonut.tsx` |
| 피드 | `src/app/feed/`, `src/components/{WatchlistManager,FeedList}.tsx` |
| 배치(뼈대) | `src/app/api/cron/{snapshot,feed}/route.ts`, `vercel.json` |

> ⚠️ Next.js 16 주의: Middleware → **Proxy**(`src/proxy.ts`, Node.js 런타임)로 명칭 변경됨.

---

## 5. 데이터 모델 (`supabase/schema.sql`)

| 테이블 | 내용 | 비고 |
|--------|------|------|
| `holdings` | 보유 종목 (ticker, quantity, avg_price, **buy_fx_rate**) | RLS: 본인만 |
| `watchlist` | 관심 종목 (user_id, ticker) | RLS: 본인만 |
| `portfolio_snapshots` | 일별 자산 스냅샷 | 배치 미구현(테이블만) |
| `quotes_cache` | 시세 캐시 | 현재 미사용(향후 cron) |
| `feed_items` | 뉴스/공시/실적 캐시 | 현재 미사용(현재는 실시간 fetch) |

- 인증은 Supabase 내장 `auth.users` 사용
- `quotes_cache` / `feed_items` 쓰기는 service_role만 (RLS 쓰기 정책 없음)

---

## 6. 외부 API (검증 완료)

| 용도 | 서비스 | 키 | 무료 한도 |
|------|--------|-----|-----------|
| 시세 | Finnhub `/quote` | 필요 (STOCK_API_KEY) | 60회/분 |
| 뉴스 | Finnhub `/company-news` | 동일 키 | 60회/분 |
| 실적 | Finnhub `/calendar/earnings` | 동일 키 | 무료 확인됨 |
| 환율 | Frankfurter (ECB) | 불필요 | 제한 없음 수준 |
| 공시 | SEC EDGAR | 불필요 (User-Agent) | 공식·무료 |

---

## 7. 화면 구성

1. **홈** (`/`) — 서비스 소개 + 네비게이션 + 로그인
2. **로그인** (`/login`) — 로그인/회원가입 탭
3. **대시보드** (`/dashboard`) — 총자산·전일대비·손익 카드 + 비중 차트
4. **포트폴리오** (`/portfolio`) — 요약 카드 + 종목 추가 폼 + 보유 목록(수정/삭제)
5. **관심 & 소식** (`/feed`) — 관심종목 관리 + 필터 탭 + 통합 피드

---

## 8. 로드맵 (남은 작업)

### 배포
- [ ] **Vercel 배포** + 환경변수 등록
- [ ] Supabase **이메일 확인 재활성화**
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` 설정

### v1.1 (안정화)
- [ ] `quotes_cache` DB 캐싱 + 시세 수집 cron (service_role)
- [ ] `feed_items` 캐싱 (현재 실시간 fetch → 캐시로)
- [ ] 일별 **자산 스냅샷 배치** (`portfolio_snapshots` 채우기)

### v2 (확장)
- [ ] 자산 총액 **과거 추이 그래프** (스냅샷 활용)
- [ ] **AI 한글 요약·번역** (뉴스·공시)
- [ ] 주가 급등락 알림
- [ ] 배당 캘린더, 세금(양도세) 추정

---

## 9. 리스크 & 유의사항

- **면책**: "투자 참고용, 투자자문 아님" 고지 (앱에 표시 중)
- **시세 정확성**: 지연 시세임을 UI에 명시
- **API 한도**: 사용자 증가 시 서버 캐싱→DB캐시+cron으로 전환 필요
- **개인정보**: 로그인 정보만 수집, 증권사 연동 없음 (민감정보 최소화)
- **뉴스 링크**: Finnhub 무료 티어는 원문으로 리다이렉트하는 URL 제공

---

## 10. 로컬 실행

```bash
cd us-stock-dashboard
npm run dev        # http://localhost:3000
```
- `.env.local`에 Supabase 키 + `STOCK_API_KEY` 필요
- `supabase/schema.sql`을 Supabase SQL Editor에서 실행
