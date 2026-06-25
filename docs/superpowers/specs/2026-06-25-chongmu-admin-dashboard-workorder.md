# 작업 지시서 — 총무과 대시보드 (`/general`) 실데이터 연결

**날짜:** 2026-06-25
**대상:** SOMANG ERP repo 기존 `/general` 경로 (브랜치 `feature/general-affairs-dashboard`)
**목적:** 이미 만들어진 총무과 대시보드 UI를 **목업 → Supabase 실데이터**로 전환 → 모바일 앱과 연동

---

## 0. 배경 / 현 상태 (중요)

- 모바일 앱(`SOMANG ERP`), 간호(`somang-ward`), 급식(`meal-management-app`)은 **모두 같은 Supabase**(`bnlybtvdqyfxmbrcvcnv`) 공유 → 데이터는 이미 연동됨.
- **총무과 대시보드는 이미 SOMANG ERP 안에 `/general`로 골격이 존재한다.** UI 완성도 높음. 단, **데이터가 100% 가짜다.**
  - `src/app/general/{layout,page}.tsx`
  - `src/features/general-dashboard/` — `GeneralApp`, `GeneralSidebar`, `GeneralTopbar`
  - 탭 3개: **현황(status) · 직원현황(staff) · 휴가관리(leave)** + 결재/기안 라우트
  - 모든 데이터가 `data.ts`의 목업(`G_ACCOUNTS`, `G_STAFF`, `INIT_LEAVE_REQUESTS`, `G_INIT_DOCS`)
  - 상태는 전부 로컬 React state. **Supabase·실제 로그인 없음.** 사용자도 mock 계정 전환으로 흉내.

→ **그래서 이 작업은 "새로 만들기"가 아니라 "기존 UI를 실데이터에 연결"이다.**

- **선결(사장님 별도 처리):** `staff_directory`(또는 `profiles`)에 **입사일 컬럼 채워짐** 전제.

---

## 1. 전환 원칙

| 현재 (mock) | 목표 (real) |
|---|---|
| `data.ts`의 `G_STAFF` 등 상수 | Supabase `profiles` / `staff_directory` 조회 |
| `G_ACCOUNTS` mock 사용자 전환 | 실제 로그인 프로필(`useAuth`) |
| 로컬 state CRUD | Supabase write (+ 서버 API) |
| 누구나 `/general` 접근 | 총무과·super_admin만 접근 |

- UI 컴포넌트(`GeneralApp`/탭/사이드바) **레이아웃은 유지**, 데이터 소스만 교체.
- Supabase 클라이언트·타입(`@/lib/supabase`, `@/types/profile`) 재사용.

## 2. 접근 제어 (신규)

- `/general/*` 진입 시: `profile.department === "총무과"` **또는** `profile.is_super_admin === true` 만 허용. 그 외 `/home` 리다이렉트.
- 기존 mock 사용자 전환(`switchUser`, `G_ACCOUNTS`) 제거 → `useAuth` 실제 프로필로 대체.

---

## 3. 1순위 — 직원현황(staff) 탭 실데이터화 ★MVP 핵심

**현재:** `TabStaff`가 `G_STAFF`(mock) 사용.
**작업:** `profiles` + `staff_directory` 실데이터로 교체.

- **목록:** 부서·직책·사번·재직상태. 부서/재직상태 필터 + 이름·사번 검색. (UI 이미 있음 → 데이터만 연결)
- **직원 추가:** ① `profiles` ② `staff_directory` 생성 ③ **로그인 계정 발급**(이메일 = `사번@somang.internal`/`@hyundai.internal`, 초기 비번 = `사번+1234`, `onboarded=false`).
- **직원 수정:** 부서·직책·입사일·연락처.
- **퇴사 처리:** `employment_status` 변경 → 로그인 차단.

**기술 주의**
- 계정 발급은 Supabase Auth **service role** 필요 → 반드시 **서버 API 라우트**(`/api/general/staff`). service role 키 클라이언트 노출 금지.
- 사번 prefix(SM-/HD-)로 `corporation_id`·이메일 도메인 자동 결정.

**완료 기준(AC)**
- 총무과 계정으로 직원 추가 → 그 직원 즉시 모바일 로그인 가능.
- 직책 변경 → 모바일 홈 인사말 즉시 반영.
- 퇴사 처리 → 로그인 거부.

---

## 4. 2순위 — 공지 관리 (신규 탭 추가)

**주의: 현재 `/general` 골격에 공지 탭은 없다.** 새로 추가한다. 동시에 모바일 공지도 아직 `home-data.ts` 하드코딩이다.

- **테이블 신규:** `announcements` (migration). 컬럼: `id, corporation_id, scope('company'|'dept'), target_dept(nullable), title, body, author, department, pinned(bool), created_at`. (다국어 MVP 제외, 한국어만.)
- **신규 탭:** `GENERAL_TABS`에 "공지" 추가 + `TabNotice` 컴포넌트(작성/수정/삭제).
- **모바일 연결:** `AnnouncementSection` 하드코딩 → `announcements` fetch로 교체.

**완료 기준(AC)**
- 총무과가 전사 공지 작성 → 전 직원 모바일 홈 노출. 고정(pinned) 상단 우선. 삭제 시 모바일에서 사라짐.

---

## 5. 이번 범위 제외 (다음 단계)

- **휴가관리(leave) 탭** — UI는 있으나 mock(`INIT_LEAVE_REQUESTS`). 직원·입사일 실데이터 후 연결.
- **현황(status) 탭** — 위 두 탭이 실데이터화되면 집계로 자연 해결.
- **결재/기안 라우트** — `/general`이 자체 mock 결재(`G_INIT_DOCS`)를 씀. ⚠️ 모바일 앱은 실제 `drafts` 테이블 사용 → **둘이 분리돼 있음.** 추후 `drafts` 테이블로 **통합** 필요(중복 제거).
- **결재자 지정**(`approval-approvers.ts` UUID 하드코딩 해소), **연차 자동계산**(입사일 기반).

---

## 6. 작업 순서 권장

1. **접근 제어 + 실제 로그인 연결** (mock 사용자 전환 제거)
2. **직원현황 탭 실데이터화** (+ 계정 발급 API) — 핵심·토대
3. **공지 관리 탭 신규** (+ `announcements` 테이블 + 모바일 연결) — 독립적 빠른 효과
