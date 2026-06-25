# 작업 지시서 — 총무과 관리자 대시보드 (MVP)

**날짜:** 2026-06-25
**대상:** SOMANG ERP repo 내 `/admin` 신규 경로
**목적:** 총무과가 직원·공지 데이터를 직접 관리 → 모바일 앱에 즉시 반영

---

## 0. 배경 / 전제

- 모바일 앱(`SOMANG ERP`), 간호 대시보드(`somang-ward`), 급식앱(`meal-management-app`)은 **모두 같은 Supabase**(`bnlybtvdqyfxmbrcvcnv`)를 공유한다. → 코드가 분리돼 있어도 데이터는 이미 연동됨.
- 따라서 **총무과 대시보드만 SOMANG ERP에 포함**한다(핵심 테이블 profiles/announcements를 모바일과 공유하므로). 간호·영양은 별도 유지.
- **선결(사장님 별도 처리):** `staff_directory`(또는 `profiles`)에 **입사일 컬럼이 채워진다.** 본 지시서는 입사일이 존재한다는 전제.

---

## 1. 위치 / 구조

```
SOMANG ERP/src/app/
├─ (main)/        ← 기존 모바일 앱 (직원용, 변경 없음)
└─ admin/         ← 신규. 데스크탑 레이아웃
   ├─ layout.tsx        ← 접근 제어 + 사이드바
   ├─ staff/page.tsx    ← 메뉴 1: 직원 관리
   └─ notices/page.tsx  ← 메뉴 2: 공지 관리
```

- 데스크탑 UI. 모바일 `(main)` 그룹과 레이아웃 분리.
- Supabase 클라이언트·타입(`@/lib/supabase`, `@/types/profile`) **재사용**.

## 2. 접근 제어

- `/admin/*` 진입 시 다음만 허용: `profile.department === "총무과"` **또는** `profile.is_super_admin === true`.
- 그 외 접근 → `/home`으로 리다이렉트.
- `admin/layout.tsx`에서 가드(서버 컴포넌트에서 프로필 조회 권장).

---

## 3. 메뉴 1 — 직원 관리

**데이터:** `profiles`, `staff_directory`

**화면**
- **목록:** 부서·직책·사번·재직상태 표시. 부서/재직상태 필터 + 이름·사번 검색.
- **직원 추가:** 신규 직원 입력 → ① `profiles` 행 생성 ② `staff_directory` 행 생성 ③ **로그인 계정 발급**(이메일 = `사번@somang.internal` 또는 `@hyundai.internal`, 초기 비번 = `사번+1234`, `onboarded=false`).
- **직원 수정:** 부서·직책·입사일·연락처 변경.
- **퇴사 처리:** `employment_status`를 퇴사로 변경 → 로그인 차단.

**기술 주의**
- 계정 발급은 Supabase Auth **service role** 필요 → 반드시 **서버 API 라우트**(`/api/admin/staff`)에서 처리. service role 키는 클라이언트 노출 금지.
- 사번 prefix(SM-/HD-)로 `corporation_id`·이메일 도메인 자동 결정 (기존 로그인 로직과 동일 규칙).

**완료 기준(AC)**
- 총무과 계정으로 직원 추가 → 그 직원이 즉시 모바일 로그인 가능.
- 직책 변경 → 모바일 홈 인사말에 즉시 반영.
- 퇴사 처리 → 해당 직원 로그인 거부.

---

## 4. 메뉴 2 — 공지 관리

**현재 문제:** 모바일 홈 공지가 `src/lib/home-data.ts`의 `ANNOUNCEMENTS` **하드코딩**. Supabase 테이블 없음.

**작업**
1. **`announcements` 테이블 신규 생성**(migration). 컬럼: `id, corporation_id, scope('company'|'dept'), target_dept(nullable), title, body, author, department, pinned(bool), created_at`. (다국어 컬럼은 MVP 제외 — 한국어만.)
2. **관리 화면:** 공지 목록 + 작성/수정/삭제. 필드: scope, 대상부서(dept일 때), 제목, 본문, 고정 여부.
3. **모바일 연결:** `AnnouncementSection`을 하드코딩 → `announcements` 테이블 fetch로 교체. (기존 `getAnnouncementText` 다국어 폴백은 한국어만 쓰도록 단순화 또는 유지.)

**완료 기준(AC)**
- 총무과가 전사 공지 작성 → 전 직원 모바일 홈에 노출.
- 고정(pinned) 공지가 상단 우선 표시.
- 공지 삭제 → 모바일에서 사라짐.

---

## 5. 이번 범위 제외 (다음 단계)

- 결재자 지정 (`approval-approvers.ts` 하드코딩 UUID 해소) — MVP 검증 후
- 연차 부여·조회 (입사일 들어온 뒤 자동계산)
- 근무표(간호)·식단(영양) — 별도 부서 대시보드 소관

---

## 6. 작업 순서 권장

1. `admin/layout.tsx` + 접근 가드
2. 공지 관리(메뉴 2) — 범위 작고 독립적, "대시보드 작동" 빠른 증명
3. 직원 관리(메뉴 1) — 계정 발급 API 포함, 핵심
