# Supabase Auth + Profiles — 설계 명세

**목표** 현재 가짜 로그인(쿠키 하드코딩)을 Supabase Auth 기반 실제 인증으로 교체하고, 사용자 프로필(법인·부서·권한 boolean)을 DB로 관리한다.

**범위** Phase 1 — 인증 + 프로필만. 결재/기안 DB 연동은 Phase 2.

---

## DB 스키마

```sql
-- 법인
create table public.corporations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz default now()
);

-- 부서 (법인 내 유일)
create table public.departments (
  id             uuid primary key default gen_random_uuid(),
  corporation_id uuid not null references corporations(id) on delete cascade,
  name           text not null,
  created_at     timestamptz default now(),
  unique (corporation_id, name)
);

-- 프로필
create table public.profiles (
  id                                    uuid primary key references auth.users(id) on delete cascade,
  employee_id                           text unique not null,
  name                                  text not null,
  corporation_id                        uuid not null references corporations(id),
  department_id                         uuid references departments(id),
  position_name                         text,
  job_title                             text,
  employment_status                     text not null default 'active',
  is_approver                           boolean default false,
  is_department_head                    boolean default false,
  is_global_viewer                      boolean default false,
  receives_final_approval_notifications boolean default false,
  kakao_notify_enabled                  boolean default true,
  remember_login_id_enabled             boolean default true,
  created_at                            timestamptz default now(),
  updated_at                            timestamptz default now()
);

-- profiles.department_id가 같은 법인의 부서인지 check
-- (DB 레벨 강제 — 불가능 시 INSERT 시 app 레벨에서 검증)
-- 참고: Postgres는 FK 교차 컬럼 check 제약 지원 안 함.
-- 대신 insert 시 반드시 아래 방식으로 조회:
--   department_id = (select id from departments
--                    where corporation_id = :corporation_id and name = :dept_name)
```

### 부서 법인 일치 보장 방법

Postgres FK는 두 컬럼에 걸친 cross-table check를 지원하지 않으므로, **application 레벨**에서 보장:

- 임시 SQL INSERT 시: `department_id`는 반드시 `departments`에서 `corporation_id = 해당 법인 id`로 조회한 결과만 사용
- 향후 Edge Function 계정 생성 시도: 동일 corporation_id 검증 후 insert

---

## RLS 정책

```sql
-- profiles: 본인 행만 SELECT
alter table public.profiles enable row level security;

create policy "본인 프로필 조회"
  on public.profiles for select
  using (auth.uid() = id);

-- employee_master: 클라이언트 직접 접근 금지 (테이블 존재 시)
alter table public.employee_master enable row level security;
-- (정책 없음 = 전체 차단)

-- signup_phone_verifications: 클라이언트 직접 접근 금지 (테이블 존재 시)
alter table public.signup_phone_verifications enable row level security;
-- (정책 없음 = 전체 차단)

-- corporations, departments: 인증된 사용자 읽기 허용 (로그인 후 부서명 표시용)
alter table public.corporations enable row level security;
create policy "인증 사용자 법인 조회" on public.corporations for select
  using (auth.role() = 'authenticated');

alter table public.departments enable row level security;
create policy "인증 사용자 부서 조회" on public.departments for select
  using (auth.role() = 'authenticated');
```

---

## 임시 계정 생성 순서 (개발용)

```
1. Supabase Dashboard → Authentication → Users → Add user
   email:    N001@somang.internal
   password: (임시 비밀번호)

2. SQL Editor:
   -- 법인/부서 먼저
   insert into corporations (name) values ('음성소망의료재단')
     on conflict (name) do nothing;

   insert into departments (corporation_id, name)
     values (
       (select id from corporations where name = '음성소망의료재단'),
       '간호과'
     )
     on conflict (corporation_id, name) do nothing;

   -- 프로필 (department는 반드시 같은 corporation_id로 조회)
   insert into profiles (id, employee_id, name, corporation_id, department_id,
                         position_name, is_approver)
   values (
     (select id from auth.users where email = 'N001@somang.internal'),
     'N001', '윤민주',
     (select id from corporations where name = '음성소망의료재단'),
     (select id from departments
      where corporation_id = (select id from corporations where name = '음성소망의료재단')
        and name = '간호과'),
     '간호사',
     false
   );
```

---

## 로그인 흐름

```
[LoginView] 사번 입력
  → email = `${employeeId}@somang.internal` 변환
  → supabase.auth.signInWithPassword({ email, password })
  → 실패 시: "사번 또는 비밀번호가 올바르지 않습니다" 표시

[AuthContext] 로그인 성공 후
  → profiles 테이블에서 본인 행 SELECT
  → profile.employment_status !== 'active'
      ? supabase.auth.signOut() → router.push('/login')  ← 즉시 강제 로그아웃
      : AuthContext에 profile 저장

[미들웨어] 인증 쿠키 없으면 → /login 리다이렉트
```

---

## 권한 처리 원칙

```ts
// deriveDisplayRole — UI 렌더링 분기 전용 (HomeView role prop 등)
// 실제 권한 판단에 절대 사용하지 않는다.
function deriveDisplayRole(profile: Profile): "staff" | "manager" | "exec" {
  if (profile.is_global_viewer) return "exec";
  if (profile.is_approver || profile.is_department_head) return "manager";
  return "staff";
}

// 실제 권한 판단은 항상 개별 boolean으로:
if (profile.is_approver) { /* 결재 버튼 표시 */ }
if (profile.is_department_head) { /* 부서 관리 접근 */ }
if (profile.is_global_viewer) { /* 전체 현황 조회 */ }
```

---

## 변경 파일 목록

| 파일 | 신규/수정 | 내용 |
|---|---|---|
| `src/lib/supabase.ts` | 신규 | Supabase 브라우저 클라이언트 (`createBrowserClient`) |
| `src/lib/supabase-server.ts` | 신규 | Supabase 서버 클라이언트 (미들웨어·서버 컴포넌트용) |
| `src/types/profile.ts` | 신규 | `Profile` 타입 (스키마 1:1 매핑) |
| `src/context/AuthContext.tsx` | 신규 | session + profile 전역 상태, employment_status 검증 |
| `src/lib/role.ts` | 수정 | localStorage 제거 → `deriveDisplayRole(profile)` |
| `src/middleware.ts` | 수정 | Supabase 세션 쿠키 검증으로 교체 |
| `src/app/login/page.tsx` | 수정 | `signInWithPassword` 호출, 에러 메시지 |
| `src/app/(main)/layout.tsx` | 수정 | `AuthContext.Provider` 주입 |
| `src/app/(main)/home/page.tsx` | 수정 | `profile.name`, `deriveDisplayRole(profile)` |
| `src/app/(main)/mypage/page.tsx` | 수정 | profile 필드 표시 (읽기 전용) |
| `.env.local` | 신규 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

---

## 패키지

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 비고

- `employee_master`, `signup_phone_verifications` 테이블은 Phase 1에서 생성하지 않는다. RLS 정책은 해당 테이블이 생성될 때 함께 적용한다.
- 향후 실제 회원가입 흐름: `employee_master` 사번 검증 → 전화인증(`signup_phone_verifications`) → Edge Function으로 `auth.admin.createUser()` + `profiles insert` (service role 사용, 클라이언트 직접 접근 금지).
