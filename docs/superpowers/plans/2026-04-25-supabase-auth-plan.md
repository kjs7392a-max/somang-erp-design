# Supabase Auth + Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 가짜 로그인(쿠키 하드코딩)을 Supabase Auth 기반 실제 인증으로 교체하고, 사용자 프로필(법인·부서·boolean 권한)을 DB로 관리한다.

**Architecture:** `@supabase/ssr` 패키지를 사용해 브라우저/서버(미들웨어) 클라이언트를 분리한다. AuthContext가 세션 + 프로필을 전역으로 관리하고, employment_status 검증 후 비활성 계정은 즉시 로그아웃시킨다. 역할(role)은 UI 표시 전용 파생값이며 실제 권한은 profile boolean으로 판단한다.

**Tech Stack:** Next.js 16.2 App Router · @supabase/supabase-js · @supabase/ssr · TypeScript · React 19

---

## 파일 맵

| 파일 | 신규/수정 | 역할 |
|---|---|---|
| `.env.local` | 신규 | Supabase URL + anon key |
| `src/lib/supabase.ts` | 신규 | 브라우저 클라이언트 팩토리 |
| `src/types/profile.ts` | 신규 | Profile 타입 |
| `src/context/AuthContext.tsx` | 신규 | session + profile 전역 상태, employment_status 검증 |
| `src/lib/role.ts` | 수정 | localStorage 제거 → deriveDisplayRole(profile) |
| `src/middleware.ts` | 신규 | Supabase 세션 쿠키 검증, 미인증 → /login |
| `src/app/(main)/layout.tsx` | 수정 | AuthProvider 주입 |
| `src/app/login/page.tsx` | 수정 | 실제 signInWithPassword |
| `src/components/auth/LoginView.tsx` | 수정 | error + loading props 추가 |
| `src/app/(main)/home/page.tsx` | 수정 | profile.name + useUserRole() |
| `src/app/(main)/mypage/page.tsx` | 수정 | profile 표시, signOut |

---

## Task 1: 패키지 설치 + 환경변수

**Files:**
- Modify: `package.json` (npm install)
- Create: `.env.local`

- [ ] **Step 1: 패키지 설치**

```bash
cd "C:\dev\SOMANG ERP"
npm install @supabase/supabase-js @supabase/ssr
```

Expected output: `added X packages` (no errors)

- [ ] **Step 2: .env.local 생성**

Supabase Dashboard → `bnlybtvdqyfxmbrcvcnv` 프로젝트 → Settings → API에서 값 확인 후 작성.

```
NEXT_PUBLIC_SUPABASE_URL=https://bnlybtvdqyfxmbrcvcnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<대시보드 anon key>
```

- [ ] **Step 3: .gitignore에 .env.local 포함 확인**

```bash
grep ".env.local" .gitignore
```

없으면 추가:
```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "app_old_backup\|^components/"
```

Expected: 에러 없음 (app_old_backup, components/ 폴더는 무시)

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: install @supabase/supabase-js and @supabase/ssr"
```

---

## Task 2: Supabase 브라우저 클라이언트 + Profile 타입

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/profile.ts`

- [ ] **Step 1: src/lib/supabase.ts 생성**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: src/types/profile.ts 생성**

```ts
export type Profile = {
  id: string;
  employee_id: string;
  name: string;
  corporation_id: string;
  department_id: string | null;
  department_name: string | null;  // departments 테이블 join 결과 (표시용)
  position_name: string | null;
  job_title: string | null;
  employment_status: string;
  is_approver: boolean;
  is_department_head: boolean;
  is_global_viewer: boolean;
  receives_final_approval_notifications: boolean;
  kakao_notify_enabled: boolean;
  remember_login_id_enabled: boolean;
  created_at: string;
  updated_at: string;
};
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "app_old_backup\|^components/"
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/lib/supabase.ts src/types/profile.ts
git commit -m "feat: add Supabase browser client and Profile type"
```

---

## Task 3: Supabase DB 스키마 + RLS (Supabase Dashboard)

**Files:** 없음 — Supabase Dashboard SQL Editor에서 직접 실행

이 태스크는 코드 변경이 없다. Supabase Dashboard → SQL Editor에서 아래 SQL을 순서대로 실행한다.

- [ ] **Step 1: corporations 테이블 생성**

```sql
create table public.corporations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz default now()
);
```

- [ ] **Step 2: departments 테이블 생성**

```sql
create table public.departments (
  id             uuid primary key default gen_random_uuid(),
  corporation_id uuid not null references corporations(id) on delete cascade,
  name           text not null,
  created_at     timestamptz default now(),
  unique (corporation_id, name)
);
```

- [ ] **Step 3: profiles 테이블 생성**

```sql
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
```

- [ ] **Step 4: RLS 활성화 + 정책 설정**

```sql
-- profiles: 본인 행만 SELECT
-- ※ employment_status 필터 없이 전체 본인 행 허용
--   → 앱에서 employment_status 읽어 비활성 계정 처리 가능
alter table public.profiles enable row level security;

create policy "본인 프로필 조회"
  on public.profiles for select
  using (auth.uid() = id);

-- corporations: 인증 사용자 읽기
alter table public.corporations enable row level security;

create policy "인증 사용자 법인 조회"
  on public.corporations for select
  using (auth.role() = 'authenticated');

-- departments: 인증 사용자 읽기
alter table public.departments enable row level security;

create policy "인증 사용자 부서 조회"
  on public.departments for select
  using (auth.role() = 'authenticated');
```

- [ ] **Step 5: department + corporation 무결성 트리거**

profiles에 insert/update 시 department_id가 같은 corporation_id 소속인지 DB 레벨에서 강제한다.

```sql
create or replace function public.check_department_corporation()
returns trigger
language plpgsql
as $$
begin
  if new.department_id is not null then
    if not exists (
      select 1 from public.departments
      where id = new.department_id
        and corporation_id = new.corporation_id
    ) then
      raise exception
        'department(%) does not belong to corporation(%)',
        new.department_id, new.corporation_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_check_dept_corp
  before insert or update of department_id, corporation_id
  on public.profiles
  for each row execute function public.check_department_corporation();
```

- [ ] **Step 6: profiles 자동 생성 트리거**

auth.users가 생성될 때 `raw_user_meta_data`에 `corporation_id`가 있으면 자동으로 profiles를 insert한다. 없으면 skip → 수동 SQL로 처리.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_corp_id uuid;
  v_dept_id uuid;
begin
  -- corporation_id 없으면 auto-insert 스킵
  begin
    v_corp_id := (new.raw_user_meta_data->>'corporation_id')::uuid;
  exception when others then
    return new;
  end;

  if v_corp_id is null then
    return new;
  end if;

  v_dept_id := nullif(new.raw_user_meta_data->>'department_id', '')::uuid;

  insert into public.profiles (
    id, employee_id, name, corporation_id, department_id,
    position_name, job_title, employment_status,
    is_approver, is_department_head, is_global_viewer,
    receives_final_approval_notifications
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'employee_id',
             split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', '미설정'),
    v_corp_id,
    v_dept_id,
    new.raw_user_meta_data->>'position_name',
    new.raw_user_meta_data->>'job_title',
    coalesce(new.raw_user_meta_data->>'employment_status', 'active'),
    coalesce((new.raw_user_meta_data->>'is_approver')::boolean, false),
    coalesce((new.raw_user_meta_data->>'is_department_head')::boolean, false),
    coalesce((new.raw_user_meta_data->>'is_global_viewer')::boolean, false),
    coalesce((new.raw_user_meta_data->>'receives_final_approval_notifications')::boolean, false)
  );
  return new;
exception when others then
  -- profiles insert 실패 시 auth.users는 롤백하지 않음
  -- (계정은 생성되되, 수동 SQL로 profiles 추가 필요)
  raise warning 'profiles auto-insert failed for %: %', new.email, sqlerrm;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 7: 개발용 초기 데이터 INSERT**

```sql
-- 법인
insert into corporations (name) values ('음성소망의료재단')
  on conflict (name) do nothing;

-- 부서 (같은 corporation_id 기준으로만 insert — 무결성 트리거 대비)
insert into departments (corporation_id, name)
values (
  (select id from corporations where name = '음성소망의료재단'),
  '간호과'
)
on conflict (corporation_id, name) do nothing;
```

- [ ] **Step 8: 개발용 Auth 계정 생성**

Supabase Dashboard → Authentication → Users → "Add user" 클릭:
- Email: `N001@somang.internal`
- Password: 임시 비밀번호 설정
- "Auto confirm user" 체크

> ※ Dashboard에서 생성 시 raw_user_meta_data가 비어 있으므로 handle_new_user 트리거가 skip됨 → Step 9에서 수동 insert

- [ ] **Step 9: 개발용 profile INSERT (수동)**

```sql
insert into profiles (
  id, employee_id, name,
  corporation_id,
  department_id,
  position_name,
  is_approver
)
values (
  (select id from auth.users where email = 'N001@somang.internal'),
  'N001',
  '윤민주',
  (select id from corporations where name = '음성소망의료재단'),
  (select d.id from departments d
   join corporations c on c.id = d.corporation_id
   where c.name = '음성소망의료재단' and d.name = '간호과'),
  '간호사',
  false
);
```

- [ ] **Step 11: 확인 쿼리**

```sql
select p.employee_id, p.name, p.employment_status,
       c.name as corp, d.name as dept
from profiles p
join corporations c on c.id = p.corporation_id
left join departments d on d.id = p.department_id;
```

Expected: 윤민주 / 음성소망의료재단 / 간호과 / active 행이 보임

---

## Task 4: AuthContext

**Files:**
- Create: `src/context/AuthContext.tsx`

**employment_status 검증 위치:** DB RLS는 비활성 계정이어도 자신의 profile을 읽을 수 있게 허용한다 (읽어야 inactive 여부를 알 수 있으므로). 비활성 처리는 아래 `handleSession` 내부에서 로그인 직후 앱 레벨로 강제한다.

- [ ] **Step 1: src/context/AuthContext.tsx 생성**

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/types/profile";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from("profiles")
      .select("*, departments!department_id(name)")
      .eq("id", userId)
      .single();
    if (!data) return null;
    const { departments, ...rest } = data as typeof data & {
      departments: { name: string } | null;
    };
    return { ...rest, department_name: departments?.name ?? null };
  }

  async function handleSession(s: Session | null) {
    setSession(s);
    if (!s) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const p = await fetchProfile(s.user.id);
    if (!p || p.employment_status !== "active") {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setLoading(false);
      router.push("/login");
      return;
    }
    setProfile(p);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleSession(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "app_old_backup\|^components/"
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: add AuthContext with session, profile, employment_status guard"
```

---

## Task 5: role.ts 재작성

**Files:**
- Modify: `src/lib/role.ts`

현재 `role.ts`는 localStorage에서 "staff"/"manager"/"exec"를 읽는다. 이것을 `AuthContext`의 profile boolean에서 파생하도록 교체한다. `deriveDisplayRole`은 UI 표시용 전용이며 실제 권한 판단에 사용하지 않는다.

- [ ] **Step 1: src/lib/role.ts 전체 교체**

```ts
"use client";

import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/profile";
import type { UserRole } from "@/types/role";

export function deriveDisplayRole(profile: Profile): UserRole {
  if (profile.is_global_viewer) return "exec";
  if (profile.is_approver || profile.is_department_head) return "manager";
  return "staff";
}

export function useUserRole(): { role: UserRole } {
  const { profile } = useAuth();
  const role: UserRole = profile ? deriveDisplayRole(profile) : "staff";
  return { role };
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "app_old_backup\|^components/"
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/role.ts
git commit -m "refactor: replace localStorage role with deriveDisplayRole from profile booleans"
```

---

## Task 6: 미들웨어

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: src/middleware.ts 생성**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "app_old_backup\|^components/"
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/middleware.ts
git commit -m "feat: add Supabase session middleware, redirect unauthenticated to /login"
```

---

## Task 7: (main)/layout.tsx에 AuthProvider 주입

**Files:**
- Modify: `src/app/(main)/layout.tsx`

- [ ] **Step 1: layout.tsx 수정**

현재 파일:
```tsx
import { MainShell } from "@/components/layout/MainShell";

export default function MainGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainShell>{children}</MainShell>;
}
```

교체 후:
```tsx
import { MainShell } from "@/components/layout/MainShell";
import { AuthProvider } from "@/context/AuthContext";

export default function MainGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <MainShell>{children}</MainShell>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "app_old_backup\|^components/"
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add "src/app/(main)/layout.tsx"
git commit -m "feat: wrap main layout with AuthProvider"
```

---

## Task 8: 로그인 페이지 — 실제 인증 연결

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/auth/LoginView.tsx`

- [ ] **Step 1: LoginView에 error + loading props 추가**

`src/components/auth/LoginView.tsx` — `LoginViewProps` 타입과 컴포넌트 시그니처 수정:

```tsx
export type LoginViewProps = {
  userId: string;
  password: string;
  onUserIdChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string | null;
  loading?: boolean;
};
```

컴포넌트 함수 시그니처:
```tsx
export function LoginView({
  userId,
  password,
  onUserIdChange,
  onPasswordChange,
  onSubmit,
  error = null,
  loading = false,
}: LoginViewProps) {
```

`userName` prop은 제거한다(로그인 전에는 이름 불명). 웰컴 메시지를 표시하던 부분은 `resolveWelcomeMessage` 호출 시 `userName` 없이 호출:
```tsx
const { message } = resolveWelcomeMessage({ useSpecials: true, useRandom: true });
```

로그인 버튼 직전(버튼 위쪽)에 에러 메시지 삽입:
```tsx
{error && (
  <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
    {error}
  </p>
)}
```

로그인 버튼에 loading 상태 반영:
```tsx
<button
  type="submit"
  disabled={loading}
  className="mt-4 w-full cursor-pointer rounded-2xl border-none bg-[#3b82f6] py-4 text-[1.0625rem] font-semibold text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)] transition-all duration-200 hover:bg-[#2563eb] active:scale-[0.98] disabled:opacity-60"
>
  {loading ? "로그인 중..." : "로그인"}
</button>
```

- [ ] **Step 2: login/page.tsx 수정 — 실제 signInWithPassword**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password) {
      setError("사번과 비밀번호를 입력하세요.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${userId.trim()}@somang.internal`,
      password,
    });
    setLoading(false);
    if (authError) {
      setError("사번 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push(ROUTES.home);
  };

  return (
    <LoginView
      userId={userId}
      password={password}
      onUserIdChange={setUserId}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      error={error}
      loading={loading}
    />
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "app_old_backup\|^components/"
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/app/login/page.tsx src/components/auth/LoginView.tsx
git commit -m "feat: wire login page to Supabase signInWithPassword"
```

---

## Task 9: 홈 + 마이페이지 — profile에서 읽기

**Files:**
- Modify: `src/app/(main)/home/page.tsx`
- Modify: `src/app/(main)/mypage/page.tsx`

- [ ] **Step 1: home/page.tsx 수정**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { HomeView } from "@/components/views/HomeView";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/lib/role";
import { ROUTES } from "@/lib/routes";
import type { AppPage } from "@/types/navigation";

const NAV: Record<AppPage, string> = {
  home: ROUTES.home,
  approvalList: ROUTES.approval,
  approval: ROUTES.approval,
  schedule: ROUTES.calendar,
  myInfo: ROUTES.mypage,
  draft: ROUTES.draft,
};

export default function HomePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { role } = useUserRole();

  if (!profile) return null;

  return (
    <HomeView
      editName={profile.name}
      role={role}
      onNavigate={(p) => router.push(NAV[p])}
      onLogout={() => router.push(ROUTES.login)}
    />
  );
}
```

- [ ] **Step 2: mypage/page.tsx 수정**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { MyInfoView } from "@/components/views/MyInfoView";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/lib/role";
import { ROUTES } from "@/lib/routes";

export default function MypagePage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { role } = useUserRole();

  if (!profile) return null;

  return (
    <MyInfoView
      editName={profile.name}
      editPhone=""
      editEmail=""
      onEditNameChange={() => {}}
      onEditPhoneChange={() => {}}
      onEditEmailChange={() => {}}
      userPosition={profile.position_name ?? ""}
      userDepartment={profile.department_name ?? ""}
      onOpenChangePassword={() => alert("비밀번호 변경 (추후 구현)")}
      onOpenNotifications={() => alert("알림 설정 (추후 구현)")}
      onOpenAppInfo={() => alert("소망의료재단 ERP v0.1.0")}
      onLogout={signOut}
      role={role}
      onRoleChange={() => {}}
    />
  );
}
```

> 참고: `onRoleChange`는 이제 no-op. MyInfoView의 역할 전환 UI는 후속 태스크에서 제거한다.

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "app_old_backup\|^components/"
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(main)/home/page.tsx" "src/app/(main)/mypage/page.tsx"
git commit -m "feat: read name and role from Supabase profile in home and mypage"
```

---

## Task 10: 통합 수동 검증

**Files:** 없음 — 브라우저 확인

- [ ] **Step 1: 개발 서버 시작**

```bash
cd "C:\dev\SOMANG ERP"
npm run dev
```

- [ ] **Step 2: 미인증 접근 → 리다이렉트 확인**

브라우저에서 `http://localhost:3000/home` 접근.
Expected: `/login`으로 리다이렉트됨

- [ ] **Step 3: 잘못된 사번으로 로그인 시도**

사번 `WRONG` / 비밀번호 임의 입력 후 로그인.
Expected: "사번 또는 비밀번호가 올바르지 않습니다." 에러 메시지 표시

- [ ] **Step 4: 정상 로그인**

사번 `N001` / Task 3에서 설정한 임시 비밀번호 입력.
Expected: `/home`으로 이동, 상단에 "반갑습니다, 윤민주님" 표시

- [ ] **Step 5: employment_status 비활성 테스트**

Supabase SQL Editor:
```sql
update profiles set employment_status = 'inactive' where employee_id = 'N001';
```

로그아웃 후 재로그인 시도.
Expected: 로그인 직후 `/login`으로 강제 복귀.

원복:
```sql
update profiles set employment_status = 'active' where employee_id = 'N001';
```

- [ ] **Step 6: 마이페이지 확인**

하단 탭 → 마이페이지.
Expected: 이름 "윤민주", 직책 "간호사" 표시.
