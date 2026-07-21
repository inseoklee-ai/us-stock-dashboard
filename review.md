# AIFFEL Campus Code Peer Review Templete
- 코더 : 최종우
- 리뷰어 : 이인석 + Claude

> 검토일 2026-07-21 · 검토 커밋 `3a85a22`("docs: PRD 1-4장 현재 배포 상태로 최신화") 기준.
> 검토 방법: 소스 전체 정독 + `npm install` → `tsc --noEmit` → `next build` → `eslint` 실행 + 실제 배포본(https://us-stock-dashboard-modu-rich.vercel.app) 브라우저 접속 확인.
> 로그인 이후 화면(종목 추가 → 차트 반영 등)은 계정 생성·비밀번호 입력을 대신 수행하지 않는다는 원칙에 따라 직접 조작해보지 못했습니다. 코드 레벨 검증과 비로그인 상태에서 확인 가능한 실동작만 근거로 삼았습니다.

---

# PRT(Peer Review Template)

[x]  **1. 주어진 문제를 해결하는 완성된 코드가 제출되었나요?**
- 문제에서 요구하는 기능이 정상적으로 작동하는지?
    - 해당 조건을 만족하는 부분의 코드 및 결과물을 근거로 첨부

이번 리뷰 요청의 3가지 관점(① 보안 ② 백엔드 동작이 의도와 일치하는지 ③ 서비스가 직관적으로 잘 동작하는지)을 이 항목의 근거로 정리합니다.

### ① 보안 — 제출물이 주장하는 보안 점검 결과가 실제로 맞는지

`PRD.md` 9-1절이 스스로 체크한 4개 항목을 코드로 재검증했습니다.

| 항목 | 확인 결과 | 근거 |
|---|---|---|
| 비밀값 환경변수화 | ✅ | 전체 grep 결과 하드코딩 토큰 0건, 전부 `process.env.*`. `.gitignore`에 `.env*` 등록, git 이력에 `.env` 계열 파일 없음 |
| 백엔드 입력 검증 | ✅ | `src/app/portfolio/actions.ts`, `src/app/feed/actions.ts` 등 모든 서버 액션이 [validation.ts](src/lib/validation.ts)로 재검증 + DB `CHECK` 제약(`quantity>0` 등, [schema.sql:24-25](supabase/schema.sql#L24-L25)) 이중 방어 |
| Supabase RLS | ✅ | 5개 테이블 모두 RLS 활성화, `quotes_cache`/`feed_items`는 쓰기 정책이 아예 없어 service_role(cron)만 기록 가능 |
| 인가 확인 | ✅ | 모든 서버 액션이 `getSession()`이 아닌 `supabase.auth.getUser()`로 서버 재검증([proxy.ts:46](src/lib/supabase/proxy.ts#L46) 주석 참고). 수정/삭제는 `.eq("user_id", user.id)` + RLS 이중 스코프 |

실제 배포본에서 재현 검증한 결과:
- `/api/cron/snapshot`을 인증 헤더 없이 호출 → `{"error":"Unauthorized"}`(401) 확인 — PRD 11-22가 언급한 "`CRON_SECRET` 미설정 시 `Bearer undefined`로 우회되던 버그"의 수정([snapshot/route.ts:12-15](src/app/api/cron/snapshot/route.ts#L12-L15))이 실제로 살아있음.
- 비로그인 상태로 `/dashboard`, `/portfolio` 접근 시 `/login`으로 정상 리다이렉트.
- 클라이언트 네트워크 요청에 Finnhub/Marketaux/SEC API 키가 전혀 노출되지 않음(전부 서버 사이드 fetch).
- 외부 링크는 `target="_blank" rel="noopener noreferrer"` 사용([FeedList.tsx:78-82](src/components/FeedList.tsx#L78-L82)), `dangerouslySetInnerHTML`/`eval` 등 XSS 위험 패턴 0건.

**경미하게 개선하면 좋은 점(치명적이지 않음)**:
1. `src/proxy.ts`의 `protectedPaths`가 `["/dashboard", "/portfolio"]`뿐이라 `/feed`는 Proxy 레벨 보호 대상이 아닙니다([proxy.ts:36](src/proxy.ts#L36)). 실제로는 `feed/page.tsx` 내부에서 `getUser()` 체크 후 조회 자체를 막아 데이터 유출은 없지만(배포본에서 비로그인 접속 시 "로그인이 필요합니다" 텍스트만 표시됨을 확인), 나머지 두 페이지와 동작 방식이 달라 일관성 문제가 있습니다. `protectedPaths`에 `/feed` 추가를 권장합니다.
2. 비밀번호 최소 길이 6자([validation.ts:93](src/lib/validation.ts#L93))는 공개 서비스치고 다소 낮습니다.
3. 이메일 확인(Confirm email)이 운영에서도 OFF로 보이는 점은 PRD가 이미 로드맵에 "정식 오픈 전 ON 권장"으로 인지하고 있는 항목이라 새 지적은 아니지만, 실사용자를 받는 시점엔 최우선 처리가 필요합니다.
4. 서버 액션에 rate limit이 없어(예: `addHolding`) 인증된 계정이 반복 삽입으로 DB/외부 API 무료 한도를 소진시킬 수 있습니다. RLS로 타인 피해는 없으나 규모가 커지면 고려가 필요합니다.

**결론: 치명적이거나 익스플로잇 가능한 보안 취약점은 발견되지 않았고, 제출물이 자체 주장한 보안 점검 내용은 실제 코드·배포본과 일치합니다.**

### ② 백엔드 동작이 의도(PRD)와 일치하는지

- 포트폴리오 손익 계산식이 PRD 3-2 공식과 정확히 일치: `computePortfolio()`의 `stockGainKrw = quantity × (price − avg_price) × fxRate`, `fxGainKrw = quantity × avg_price × (fxRate − buy_fx_rate)`([portfolio.ts:92-104](src/lib/portfolio.ts#L92-L104)).
- 일별 스냅샷은 PRD가 설명한 "방문 기반 + cron 이중 기록" 그대로 구현: `dashboard/page.tsx`가 방문마다 오늘자 스냅샷을 upsert([dashboard/page.tsx:90-103](src/app/dashboard/page.tsx#L90-L103))하고, `/api/cron/snapshot`이 Vercel Cron(매일 22:00 UTC)으로 동일 로직을 재실행. `(user_id, snapshot_date)` unique + upsert라 중복 기록 없음.
- 피드 소스별 5초 타임아웃(PRD 3-4, 11-24)도 `AbortSignal.timeout(5000)`으로 실제 적용([feed.ts:54,101,153,192,260](src/lib/feed.ts#L54)).

**PRD 문서와 코드 사이 불일치(문서 정리 필요, 기능 결함 아님)**:
1. `PRD.md` 5장 표에 "`portfolio_snapshots` | 배치 미구현(테이블만)"([PRD.md:126](PRD.md#L126))이라고 적혀 있는데, 같은 문서 3장·4장·11-18절에는 스냅샷 배치가 "구현 완료"라고 되어 있어 서로 모순. 코드 확인 결과 실제로는 구현되어 있으므로 5장의 해당 줄이 갱신되지 않은 낡은 문구입니다.
2. `/api/cron/feed`는 인증만 확인하고 실제 작업 없이 `{ ok:true, todo:true }`만 반환하는 빈 스텁([feed/route.ts:17-20](src/app/api/cron/feed/route.ts#L17-L20))이고 `vercel.json`에도 등록되어 있지 않습니다. 실제 뉴스/공시/실적은 `feed/page.tsx`가 매 요청마다 실시간으로 가져오는 방식이라 **서비스 동작 자체는 의도와 일치**하지만, 죽은 라우트가 레포에 남아 있어 오해의 소지가 있습니다.
3. `README.md`의 "남은 개발(MVP)" 목록([README.md:54-63](README.md#L54-L63))이 완전히 낡아, 이미 구현·배포된 로그인/포트폴리오/시세/환율/대시보드/피드/스냅샷 배치를 전부 미구현으로 표시하고 있습니다. `PRD.md`와 맞춰 갱신을 권장합니다.

### ③ 서비스가 직관적이고 의도대로 동작하는지

실제 배포된 프로덕션 사이트에서 비로그인 상태로 확인 가능한 범위를 점검했습니다.
- 홈 화면 소개 문구·CTA·3개 카드 네비게이션·면책 문구까지 PRD 설명과 일치, 콘솔 에러 0건.
- `/dashboard`, `/portfolio` 비로그인 접근 시 `/login`으로 자동 리다이렉트되는 자연스러운 흐름 확인.
- 로그인 페이지: 로그인/회원가입 탭 전환 시 안내 문구·제출 버튼 라벨이 즉시 전환됨. `/forgot-password` 정상 렌더링.
- 다크모드 토글 클릭 시 `<html data-theme>` 속성이 깜빡임 없이 즉시 전환(쿠키 기반 서버 렌더링 설계 의도와 일치).
- `/api/cron/*`를 브라우저로 직접 열어도 JSON 401만 반환, 크래시 없음.

개선하면 좋은 점: `/feed`만 비로그인 시 리다이렉트가 아닌 인라인 텍스트만 표시되어 나머지 두 페이지와 흐름이 다르게 느껴짐(보안 항목 1번과 동일 이슈, UX 관점에서도 재차 지적). 로그인 이후 실제 화면(종목 추가 → 도넛차트/추이그래프 반영, 환차손익 표기, 감성 뱃지 노출 조건 등)은 이번 리뷰에서 직접 조작해보지 못했으므로 실제 계정으로 한 번 더 훑어보시길 권장합니다.

---

[x]  **2. 핵심적이거나 복잡하고 이해하기 어려운 부분에 작성된 설명을 보고 해당 코드가 잘 이해되었나요?**
- 해당 코드 블럭에 doc string/annotation/markdown이 달려 있는지 확인
- 해당 코드가 무슨 기능을 하는지, 왜 그렇게 짜여진건지, 작동 메커니즘이 뭔지 기술.
- 주석을 보고 코드 이해가 잘 되었는지 확인
    - 잘 작성되었다고 생각되는 부분을 근거로 첨부합니다.

WHAT이 아니라 WHY를 설명하는 주석이 핵심 파일에 잘 배치되어 있습니다.

- `src/app/portfolio/actions.ts:16-19` — "Server Function은 UI 뿐 아니라 직접 POST로도 호출될 수 있으므로 내부에서 인증을 반드시 확인한다." → 왜 매 액션마다 `getUser()`를 반복 호출하는지 이유를 명확히 설명.
- `src/lib/supabase/proxy.ts:46` — "`getUser()`를 호출해야 만료된 세션이 갱신된다. 이 줄을 지우면 로그인 상태가 임의로 풀릴 수 있다." → 지워도 될 것처럼 보이는 코드가 사실은 숨겨진 불변조건임을 경고하는 좋은 예.
- `src/lib/supabase/admin.ts:3-6` — "service_role 키를 사용하므로 RLS를 우회한다. cron/배치 작업에서만 사용할 것. 절대 클라이언트 코드에서 import 하지 말 것." → 오용 시 위험한 모듈에 대한 명확한 경고.
- `supabase/schema.sql:142-144` (Notes) — `quotes_cache`/`feed_items`에 쓰기 정책이 없는 이유(service_role만 기록)를 SQL 파일 안에 직접 남겨, 스키마만 봐도 설계 의도를 알 수 있게 함.
- `PRD.md` 자체가 "as-built" 문서로 각 기능의 배경과 결정 이유(예: 2장 확정 결정사항 표)를 정리해두어, 코드만으로는 알기 어려운 "왜 이렇게 설계했는가"를 보완합니다.

전반적으로 복잡한 로직(환차손익 분해, RLS 정책, 인증 흐름)마다 이유를 남기는 습관이 일관되어 있어 코드 이해에 도움이 되었습니다.

---

[x]  **3. 에러가 난 부분을 디버깅하여 "문제를 해결한 기록"을 남겼나요? 또는 "새로운 시도 및 추가 실험"을 해봤나요?**
- 문제 원인 및 해결 과정을 잘 기록하였는지 확인
- 문제에서 요구하는 조건에 더해 추가적으로 수행한 나만의 시도, 실험이 기록되어 있는지 확인
    - 잘 작성되었다고 생각되는 부분을 캡쳐해 근거로 첨부합니다.

`PRD.md` 11장 "작업 이력"이 사실상 디버깅/실험 로그 역할을 하고 있어 근거가 풍부합니다.

- **11-6 (Supabase 설정)**: "SQL 실행 시 한글 주석의 멀티바이트+줄바꿈이 클립보드에서 깨져 `for select` 문법오류 → 주석을 전부 영어로, drop-if-exists로 재작성해 해결." — 원인 분석부터 해결 방법까지 구체적으로 기록.
- **11-17 (비밀번호 재설정)**: "기본 메일 발송 제한 → Gmail SMTP 커스텀 연결(앱 비밀번호). SMTP 붙이니 템플릿 편집 잠금 해제 → Reset Password 템플릿을 `token_hash` 방식으로 수정 → 안정 작동." — 막힌 지점과 우회 경로를 순서대로 서술.
- **11-20 (뉴스 소스 추가)**: "처음 Tiingo를 붙였으나 계정에 News API 권한 없음(403 확인) → 무료 티어에서 실제 뉴스가 나오는 Marketaux로 교체." — 실패한 시도(Tiingo)를 숨기지 않고 대안 탐색 과정을 남긴 좋은 예.
- **11-22 (보안 점검 & 하드닝)**: "`cron/feed`가 `CRON_SECRET` 미설정 시 `Bearer undefined`로 우회 가능하던 것을 ... 가드로 차단. 401 응답 검증 완료." — 스스로 취약점을 찾아 고친 기록이며, 이번 리뷰에서도 배포본에서 실제로 막혀 있음을 재확인했습니다.
- **11-24 (피드 로딩 개선)**: "Suspense 스트리밍(뼈대 먼저)도 시도했으나 프리뷰 환경에서 reveal이 완료되지 않아(검증 불가) 제외." — 요구 조건 이상의 추가 실험을 시도했고, 검증되지 않은 것은 채택하지 않았다는 점까지 정직하게 기록.

요구 조건에 없던 시도(Marketaux 감성분석 배지, Suspense 스트리밍 실험, 토스 스타일 테마 리디자인, CKF 로고 브랜딩)도 다수 확인되어, 단순 요구사항 이행을 넘어선 추가 실험이 활발했습니다.

---

[ ]  **4. 회고를 잘 작성했나요?**
- 프로젝트 결과물에 대해 배운점과 아쉬운점, 느낀점 등이 상세히 기록 되어 있나요?
	- 딥러닝 모델의 경우, 인풋이 들어가 최종적으로 아웃풋이 나오기까지의 전체 흐름을 도식화하여 모델 아키텍쳐에 대한 이해를 돕고 있는지 확인

`PRD.md`/`README.md` 전체를 검색한 결과 "회고", "배운점", "느낀점", "아쉬운점" 등에 해당하는 별도 섹션은 찾지 못했습니다.

- `PRD.md` 11-25 "진행 중 / 보류" 절에 "AI 한글 요약: 착수했으나 진행 중 보류"라는 한 줄이 있어 미완성 항목에 대한 인지는 있으나, 이는 회고라기보다 로드맵 메모에 가깝습니다.
- 9장 "리스크 & 유의사항"도 서비스 운영 관점의 주의사항 나열이지, 본인이 이번 프로젝트를 진행하며 무엇을 배웠고 무엇이 아쉬웠는지에 대한 회고는 아닙니다.
- (본 프로젝트는 웹 서비스 프로젝트라 "딥러닝 모델 아키텍처 도식화" 항목은 해당사항 없음. 대신 `PRD.md` 4장의 기술 아키텍처 다이어그램이 그 역할을 대체하고 있고, 이 다이어그램 자체는 Next.js/Supabase/외부 API 연동 구조를 한눈에 보여줘 잘 작성되어 있습니다.)

**제안**: `PRD.md` 말미(또는 README)에 "이번 프로젝트에서 배운 점 / 어려웠던 점 / 아쉬운 점(예: 자체 발견한 CRON_SECRET 우회 취약점, RLS 설계 학습 등)"을 3~5줄이라도 추가하면 이 항목을 충족할 수 있습니다.

---

[ ]  **5. 코드가 간결하고 효율적인가요?**
- 파이썬 스타일 가이드 (PEP8)를 준수하였는지 확인
- 코드 중복을 최소화하고 범용적으로 사용할 수 있도록 모듈화(함수화) 했는지
    - 잘 작성되었다고 생각되는 부분을 근거로 첨부합니다.

이 프로젝트는 Python이 아닌 TypeScript(Next.js) 기반이라 PEP8은 해당하지 않으며, 동등한 기준으로 프로젝트에 설정된 ESLint(`eslint-config-next`)와 `tsc` 타입 체크를 기준으로 확인했습니다.

**확인된 결과**:
- `npx tsc --noEmit` → 에러 없음.
- `npx next build` → 프로덕션 빌드 성공.
- `npx eslint .` → **에러 3건 발견** (제출 시점에는 통과 여부 불명, 이번 리뷰에서 새로 확인):
  1. [EditableHoldingRow.tsx:34](src/components/EditableHoldingRow.tsx#L34) — `useEffect` 안에서 `setState`를 동기 호출(`react-hooks/set-state-in-effect`). 수정 성공 후 편집모드를 닫는 로직을 effect가 아니라 액션 완료 콜백(또는 `useActionState`의 `pending` 전이 시점)에서 처리하도록 리팩토링 권장.
  2. [ThemeToggle.tsx:25](src/components/ThemeToggle.tsx#L25) — 동일 규칙 위반. 초기 렌더 시점에 `useState`의 초기값 함수로 계산해 effect 자체를 없애는 방향을 권장.
  3. [WeightDonut.tsx:62](src/components/WeightDonut.tsx#L62) — `.map()` 콜백 밖의 지역 변수 `cum`을 순회마다 재할당(`react-hooks/immutability`). 현재는 일반 React 런타임이라 실제로 오동작하지는 않지만, `reduce()`로 누적값을 함수형으로 계산하도록 바꾸면 React Compiler와도 호환되고 더 간결해집니다.

  이 3건 모두 즉시 기능 장애를 일으키진 않지만("정상 동작"과는 별개로), 최신 `eslint-config-next`가 강제하는 스타일 가이드를 완전히 통과하지는 못한 상태입니다.

**모듈화는 전반적으로 양호**:
- 포트폴리오 손익 계산이 `computePortfolio()`([portfolio.ts](src/lib/portfolio.ts))로 공통화되어 대시보드/포트폴리오 페이지가 동일 함수를 재사용.
- 입력 검증이 `validation.ts`의 `parseTicker`/`parseQuantity`/`parsePrice`/`parseFxRate`/`parseEmail`/`parsePassword`로 일반화되어 여러 서버 액션에서 중복 없이 재사용.
- 통화/숫자 포맷팅이 `format.ts`로, UI가 `Card`/`SubmitButton` 등 공용 컴포넌트로 분리되어 있어 페이지마다 로직이 반복되지 않음.

**결론**: 구조적 모듈화는 잘 되어 있으나, `eslint` 기준으로는 3건의 미해결 경고가 있어 "간결하고 효율적"이라는 기준을 100% 만족한다고 보기엔 근소하게 부족합니다.

---

# 참고 링크 및 코드 개선

```
# 참고 링크
- React 공식 문서, "You Might Not Need an Effect": https://react.dev/learn/you-might-not-need-an-effect
  → ESLint(react-hooks/set-state-in-effect)가 EditableHoldingRow.tsx / ThemeToggle.tsx 위반 시 직접 안내한 링크.
  effect 안에서 setState를 동기 호출하는 대신, 파생 상태는 렌더 중 계산하거나 이벤트 핸들러에서 갱신하라는 내용.

# 코드 개선 제안 (이번 리뷰에서는 적용하지 않고 제안만 남깁니다 — 리뷰 요청 범위가 "점검"이라 실제 수정은 하지 않았습니다)

1. src/proxy.ts — 보호 경로에 /feed 추가
   const protectedPaths = ["/dashboard", "/portfolio", "/feed"];
   → 세 페이지 모두 동일하게 비로그인 시 /login으로 리다이렉트되어 UX 일관성 확보.

2. src/components/WeightDonut.tsx — 지역 변수 재할당 대신 reduce로 누적
   let cum = 0
   대신
   const arcs = slices.reduce((acc, s) => {
     const full = (s.amount / total) * C;
     const visible = Math.max(full - gap, 0.75);
     acc.list.push({ ...s, dasharray: `${visible} ${C - visible}`, offset: -acc.cum });
     acc.cum += full;
     return acc;
   }, { list: [] as Arc[], cum: 0 }).list;
   → eslint react-hooks/immutability 위반 해소.

3. PRD.md — 5장 portfolio_snapshots 행의 "배치 미구현(테이블만)" 문구를
   "cron(vercel.json, 매일 22:00 UTC) + 방문 기반 upsert로 구현 완료"로 수정,
   README.md의 "남은 개발(MVP)" 체크리스트를 PRD.md 3장 기준으로 갱신.
```

---

# 리뷰어의 회고

리뷰어(이인석) : GitHub를 활용해서 코드리뷰를 처음해 보았습니다. 드디어 개발자 협업의 세상에 들어오게 되었네요. 이 세상은 AI와 함께 더욱 나은 세상이 되겠지요!
