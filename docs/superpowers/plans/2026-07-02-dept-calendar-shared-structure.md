# 부서별 일정 탭 + 공유 데이터 구조 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 일정 탭을 부서 레지스트리로 화면 분기하고, 대시보드가 나중에 채울 공유 테이블(근무표·부서일정·휴가)과 "승인→기록→실시간" 연동 지점을 **구조만** 깔아둔다.

**Architecture:** 3층 구조 — ① Supabase 공유 테이블(읽기 RLS 활성 / 트리거·쓰기정책·Realtime은 정의만) ② 데이터층(`src/lib/dept/data.ts`, 단일 교체 지점, 지금은 빈 결과) ③ 부서 레지스트리(`src/lib/dept/registry.ts`)로 일정 탭 화면 변형. 승인된 휴가는 근무표에 overlay(이중기록 금지).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `@supabase/supabase-js` + `@supabase/ssr`, Tailwind v4. Supabase project ref `bnlybtvdqyfxmbrcvcnv` (asia-northeast3). 마이그레이션은 `supabase/migrations/*.sql` + Management API 적용.

## Global Constraints

- **부서 격리 불변식(절대):** 어떤 부서도 타 부서 데이터를 열람할 수 없다(총무 포함, 예외 없음). RLS는 어디서나 "자기 부서(`corporation_id`+`department`)로 스코프된 행만".
- **"구조만" 범위:** 테이블 CREATE + 읽기 RLS는 **활성화**. 트리거·쓰기 RLS·Realtime 구독은 **정의/자리만**(미설치·미활성).
- **단일 원천:** 근무표는 `leaves`를 overlay로 표시. `dept_shifts`에 휴가를 이중 기록하지 않는다.
- **테스트 하네스 없음:** 이 저장소는 unit test runner가 없다. 각 태스크 검증 = `npx tsc --noEmit`(타입) + 필요 시 `npm run build` + 실계정 로그인 런타임 확인. 새 테스트 프레임워크는 도입하지 않는다.
- **두 축 분리:** role축(`role==='exec'` → `ClinicScheduleView` 진료)은 유지. 부서축(레지스트리)은 비-exec 케이스만 관장.
- **커밋:** 태스크마다 작게 커밋. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **DB 적용 승인:** 마이그레이션을 production DB에 적용하는 것은 배포성 작업 → 실행 시 사용자 승인 필요(메모리 `deploy-workflow`). 계획 문서 자체는 코드 변경 아님.
- 스펙: `docs/superpowers/specs/2026-07-02-dept-calendar-shared-structure-design.md`.

---

## File Structure

- Create `supabase/migrations/20260702_dept_calendar_shared.sql` — 테이블 3종 + 인덱스 + 읽기 RLS(활성) + 트리거/쓰기정책(주석·정의만).
- Create `src/types/dept-calendar.ts` — 공유 타입(`WardShift`, `Leave`, `DeptEvent`, `DateRange`).
- Create `src/lib/dept/registry.ts` — `CalendarVariant`, alias, `calendarVariantFor`, `normalizeDept`.
- Create `src/lib/dept/data.ts` — `getWardShifts`, `getDeptLeaves`(지금은 Supabase 조회, 빈 결과).
- Create `src/components/calendar/WardShiftView.tsx` — 전병동 근무표 뷰(데이터층 읽기 + 빈 상태).
- Create `src/components/calendar/DeptLeavesView.tsx` — 부서원 휴가 뷰(데이터층 읽기 + 빈 상태).
- Modify `src/components/views/CalendarView.tsx` — 2번째 탭 콘텐츠를 레지스트리로 분기, `isNurseProfile`·mock 의존 제거, personal variant는 토글 숨김.
- Delete (Task 7, 완전 대체 후) `src/components/shift/ShiftTable.tsx`, `src/lib/shift-data.ts`, `MOCK_EVENTS`(in `src/lib/calendar-data.ts`) — 미사용 확인 후.

---

## Task 1: 공유 스키마 마이그레이션 (테이블 + 읽기 RLS 활성 / 트리거·쓰기정책 정의만)

**Files:**
- Create: `supabase/migrations/20260702_dept_calendar_shared.sql`

**Interfaces:**
- Produces: 테이블 `public.dept_shifts`, `public.dept_events`, `public.leaves` (컬럼은 아래 SQL 그대로). 이후 데이터층(Task 4)이 이 컬럼명을 읽는다.

- [ ] **Step 1: 마이그레이션 SQL 작성**

`supabase/migrations/20260702_dept_calendar_shared.sql`:

```sql
-- 부서별 일정 탭 공유 스키마 (2026-07-02)
-- 읽기 RLS: 활성 / 트리거·쓰기정책·Realtime: 정의만(미설치)

-- ── 1) dept_shifts (간호 전병동 근무표) ─────────────────────────
create table if not exists public.dept_shifts (
  id             uuid primary key default gen_random_uuid(),
  corporation_id uuid not null references public.corporations(id),
  department     text not null,
  ward           text,
  staff_id       uuid references public.profiles(id),
  staff_name     text,
  work_date      date not null,
  shift_code     text not null,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_dept_shifts_scope
  on public.dept_shifts (corporation_id, department, work_date);

-- ── 2) dept_events (부서 공통 일정) ──────────────────────────────
create table if not exists public.dept_events (
  id             uuid primary key default gen_random_uuid(),
  corporation_id uuid not null references public.corporations(id),
  department     text not null,
  title          text not null,
  category       text not null,
  event_date     date not null,
  start_time     time,
  end_time       time,
  location       text,
  memo           text,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_dept_events_scope
  on public.dept_events (corporation_id, department, event_date);

-- ── 3) leaves (휴가·연차) ────────────────────────────────────────
create table if not exists public.leaves (
  id              uuid primary key default gen_random_uuid(),
  corporation_id  uuid not null references public.corporations(id),
  department      text not null,
  staff_id        uuid references public.profiles(id),
  staff_name      text,
  leave_type      text not null,
  start_date      date not null,
  end_date        date not null,
  status          text not null default '승인',
  source_draft_id uuid references public.drafts(id),
  memo            text,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_leaves_scope
  on public.leaves (corporation_id, department, start_date);
create index if not exists idx_leaves_source_draft
  on public.leaves (source_draft_id);

-- ── 4) RLS 활성 + 읽기 정책(자기 부서만) ─────────────────────────
alter table public.dept_shifts enable row level security;
alter table public.dept_events enable row level security;
alter table public.leaves      enable row level security;

create policy "dept_shifts_select_own_dept" on public.dept_shifts
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.corporation_id = dept_shifts.corporation_id
        and p.department     = dept_shifts.department
    )
  );

create policy "dept_events_select_own_dept" on public.dept_events
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.corporation_id = dept_events.corporation_id
        and p.department     = dept_events.department
    )
  );

create policy "leaves_select_own_dept" on public.leaves
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.corporation_id = leaves.corporation_id
        and p.department     = leaves.department
    )
  );

-- ⚠️ 쓰기(INSERT/UPDATE) 정책: 지금은 만들지 않음(=차단). "구조만".
--    대시보드/트리거 연동 시 아래 형태로 활성화.
-- create policy "leaves_insert_by_service" on public.leaves for insert with check (...);

-- ── 5) 승인→leaves 트리거: 정의만(미설치). 연동 Phase에서 주석 해제 ──
-- create or replace function public.fn_leave_from_approved_draft()
-- returns trigger language plpgsql security definer as $$
-- begin
--   if new.status = 'approved' and new.doc_type = 'vacation'
--      and (old.status is distinct from 'approved') then
--     insert into public.leaves (
--       corporation_id, department, staff_id, staff_name,
--       leave_type, start_date, end_date, status, source_draft_id, created_by
--     )
--     select p.corporation_id, p.department, p.id, p.full_name,
--            coalesce(new.body->>'vacationType','annual'),
--            (new.body->>'startDate')::date, (new.body->>'endDate')::date,
--            '승인', new.id, new.drafter_id
--     from public.profiles p
--     where p.id = new.drafter_id;
--   end if;
--   return new;
-- end; $$;
-- create trigger trg_leave_from_approval
--   after update of status on public.drafts
--   for each row execute function public.fn_leave_from_approved_draft();
```

- [ ] **Step 2: 스키마 전제 확인 (drafts 컬럼)**

트리거 정의가 참조하는 컬럼이 실제 존재하는지 확인(정의만이라도 정확해야 함).

Run:
```bash
cd "C:/dev/SOMANG ERP" && TOKEN=$(sed -n 's/^SUPABASE_ACCESS_TOKEN=//p' .env.local | tr -d '"\r') && curl -s -X POST "https://api.supabase.com/v1/projects/bnlybtvdqyfxmbrcvcnv/database/query" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"query":"select column_name from information_schema.columns where table_name=''drafts'' and column_name in (''status'',''doc_type'',''body'',''drafter_id'') order by column_name"}'
```
Expected: `body`, `doc_type`, `drafter_id`, `status` 4행 모두 반환. (누락 시 트리거 주석의 컬럼명을 실제에 맞게 수정)

- [ ] **Step 3: 마이그레이션 적용 (사용자 승인 후)**

> ⚠️ production DB 변경 — 실행 전 사용자 승인(메모리 `deploy-workflow`). 테이블은 빈 채 생성이라 저위험.

Run (node로 파일 읽어 JSON 안전 인코딩 후 POST — python/jq 의존 없음, Node 18+ 전역 fetch):
```bash
cd "C:/dev/SOMANG ERP" && node -e "
const fs=require('fs');
const sql=fs.readFileSync('supabase/migrations/20260702_dept_calendar_shared.sql','utf8');
const env=fs.readFileSync('.env.local','utf8');
const token=(env.match(/^SUPABASE_ACCESS_TOKEN=(.*)\$/m)||[])[1].replace(/[\"\r]/g,'').trim();
fetch('https://api.supabase.com/v1/projects/bnlybtvdqyfxmbrcvcnv/database/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query:sql})}).then(r=>r.text()).then(t=>console.log(t));
"
```
Expected: 에러 없이 `[]` 또는 성공 응답. (에러 문자열 반환 시 SQL 수정 후 재실행)

- [ ] **Step 4: 테이블·RLS 생성 검증**

Run:
```bash
cd "C:/dev/SOMANG ERP" && TOKEN=$(sed -n 's/^SUPABASE_ACCESS_TOKEN=//p' .env.local | tr -d '"\r') && curl -s -X POST "https://api.supabase.com/v1/projects/bnlybtvdqyfxmbrcvcnv/database/query" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"query":"select tablename, rowsecurity from pg_tables where tablename in (''dept_shifts'',''dept_events'',''leaves'')"}'
```
Expected: 3개 테이블, `rowsecurity=true`.

- [ ] **Step 5: 트리거 미설치 확인 (구조만 검증)**

Run:
```bash
cd "C:/dev/SOMANG ERP" && TOKEN=$(sed -n 's/^SUPABASE_ACCESS_TOKEN=//p' .env.local | tr -d '"\r') && curl -s -X POST "https://api.supabase.com/v1/projects/bnlybtvdqyfxmbrcvcnv/database/query" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"query":"select tgname from pg_trigger where tgname=''trg_leave_from_approval''"}'
```
Expected: `[]` (트리거 없음 — 의도대로).

- [ ] **Step 6: Commit**

```bash
cd "C:/dev/SOMANG ERP" && git add supabase/migrations/20260702_dept_calendar_shared.sql && git commit -m "feat(db): 부서 일정 공유 테이블 3종 + 읽기 RLS (트리거·쓰기정책 정의만)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: 공유 타입 정의

**Files:**
- Create: `src/types/dept-calendar.ts`

**Interfaces:**
- Produces: `WardShift`, `Leave`, `DeptEvent`, `DateRange` 타입. Task 4(데이터층)·Task 5(뷰)가 소비.

- [ ] **Step 1: 타입 파일 작성**

`src/types/dept-calendar.ts`:

```ts
// 공유 스키마(Supabase)와 1:1 대응 타입. 대시보드·모바일 공통.

export type WardShift = {
  id: string;
  corporationId: string;
  department: string;
  ward: string | null;
  staffId: string | null;
  staffName: string | null;
  workDate: string;   // "YYYY-MM-DD"
  shiftCode: string;  // D/E/N/OFF/V/H/DB …
};

export type Leave = {
  id: string;
  corporationId: string;
  department: string;
  staffId: string | null;
  staffName: string | null;
  leaveType: string;  // annual/sick/… (표시 매핑은 draft-forms VACATION_TYPES)
  startDate: string;  // "YYYY-MM-DD"
  endDate: string;    // "YYYY-MM-DD"
  status: string;     // 신청/승인/반려
  sourceDraftId: string | null;
  memo: string | null;
};

export type DeptEvent = {
  id: string;
  corporationId: string;
  department: string;
  title: string;
  category: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  memo: string | null;
};

export type DateRange = { start: string; end: string }; // "YYYY-MM-DD"
```

- [ ] **Step 2: 타입체크**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
cd "C:/dev/SOMANG ERP" && git add src/types/dept-calendar.ts && git commit -m "feat(types): 부서 일정 공유 타입(WardShift/Leave/DeptEvent)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 부서 레지스트리

**Files:**
- Create: `src/lib/dept/registry.ts`

**Interfaces:**
- Produces: `type CalendarVariant = "ward_shift" | "dept_leaves" | "personal"`, `normalizeDept(raw: string): string`, `calendarVariantFor(dept: string): CalendarVariant`. Task 5(CalendarView)가 소비.

- [ ] **Step 1: 레지스트리 작성**

`src/lib/dept/registry.ts`:

```ts
// 부서축 레지스트리 — isNurseProfile() 휴리스틱을 대체하는 명시적 맵.
// 특수 뷰가 필요한 부서는 간호과·원무과 2개뿐, 그 외 전부 personal.

export type CalendarVariant = "ward_shift" | "dept_leaves" | "personal";

// 실 DB 노이즈 정규화(2026-07-02 조회 기준)
const DEPT_ALIASES: Record<string, string> = {
  "조리": "영양과",
  "조리과": "영양과",
  "재무관리과": "경리과",
};

const CALENDAR_VARIANT: Record<string, CalendarVariant> = {
  "간호과": "ward_shift",
  "원무과": "dept_leaves",
};

export function normalizeDept(raw: string): string {
  const v = (raw ?? "").trim();
  return DEPT_ALIASES[v] ?? v;
}

export function calendarVariantFor(dept: string): CalendarVariant {
  return CALENDAR_VARIANT[normalizeDept(dept)] ?? "personal";
}
```

- [ ] **Step 2: 타입체크**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 로직 검증(임시 스크립트, node)**

Run:
```bash
cd "C:/dev/SOMANG ERP" && node -e "
const m={'간호과':'ward_shift','원무과':'dept_leaves'};
const a={'조리':'영양과','조리과':'영양과','재무관리과':'경리과'};
const norm=s=>a[(s||'').trim()]??(s||'').trim();
const v=d=>m[norm(d)]??'personal';
console.log(v('간호과'), v('원무과'), v('총무과'), v('조리과'), v('영양과'));
"
```
Expected: `ward_shift dept_leaves personal personal personal`
(레지스트리 로직과 동일한지 눈으로 대조 — 이 저장소엔 test runner가 없어 임시 확인)

- [ ] **Step 4: Commit**

```bash
cd "C:/dev/SOMANG ERP" && git add src/lib/dept/registry.ts && git commit -m "feat(dept): 부서 레지스트리 calendarVariantFor (간호=근무표/원무=휴가/그외=개인)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 데이터층 (단일 교체 지점, 지금은 빈 결과)

**Files:**
- Create: `src/lib/dept/data.ts`

**Interfaces:**
- Consumes: `WardShift`, `Leave`, `DateRange` (Task 2). `createClient` from `@/lib/supabase`.
- Produces: `getWardShifts(corporationId, department, month): Promise<WardShift[]>`, `getDeptLeaves(corporationId, department, range: DateRange): Promise<Leave[]>`. Task 5 뷰가 소비. (지금은 테이블이 비어 있어 항상 `[]` 반환)

- [ ] **Step 1: 데이터층 작성**

`src/lib/dept/data.ts`:

```ts
import { createClient } from "@/lib/supabase";
import type { WardShift, Leave, DateRange } from "@/types/dept-calendar";

/** 근무표(간호 전병동). month = "YYYY-MM" */
export async function getWardShifts(
  corporationId: string,
  department: string,
  month: string,
): Promise<WardShift[]> {
  const supabase = createClient();
  const start = `${month}-01`;
  const end = `${month}-31`;
  const { data, error } = await supabase
    .from("dept_shifts")
    .select("id, corporation_id, department, ward, staff_id, staff_name, work_date, shift_code")
    .eq("corporation_id", corporationId)
    .eq("department", department)
    .gte("work_date", start)
    .lte("work_date", end)
    .order("work_date", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    corporationId: r.corporation_id,
    department: r.department,
    ward: r.ward,
    staffId: r.staff_id,
    staffName: r.staff_name,
    workDate: r.work_date,
    shiftCode: r.shift_code,
  }));
}

/** 부서원 휴가 목록 */
export async function getDeptLeaves(
  corporationId: string,
  department: string,
  range: DateRange,
): Promise<Leave[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leaves")
    .select("id, corporation_id, department, staff_id, staff_name, leave_type, start_date, end_date, status, source_draft_id, memo")
    .eq("corporation_id", corporationId)
    .eq("department", department)
    .gte("start_date", range.start)
    .lte("start_date", range.end)
    .order("start_date", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    corporationId: r.corporation_id,
    department: r.department,
    staffId: r.staff_id,
    staffName: r.staff_name,
    leaveType: r.leave_type,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    sourceDraftId: r.source_draft_id,
    memo: r.memo,
  }));
}
```

- [ ] **Step 2: 타입체크**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit`
Expected: 에러 없음. (특히 `@/lib/supabase`의 `createClient` import 성립 확인)

- [ ] **Step 3: Commit**

```bash
cd "C:/dev/SOMANG ERP" && git add src/lib/dept/data.ts && git commit -m "feat(dept): 데이터층 getWardShifts/getDeptLeaves (지금은 빈 결과)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 뷰 컴포넌트 (WardShiftView / DeptLeavesView) + 빈 상태

**Files:**
- Create: `src/components/calendar/WardShiftView.tsx`
- Create: `src/components/calendar/DeptLeavesView.tsx`

**Interfaces:**
- Consumes: `getWardShifts`, `getDeptLeaves` (Task 4), `useAuth` from `@/context/AuthContext` (`profile.corporation_id`, `profile.department`, `profile.full_name`).
- Produces: `<WardShiftView />`, `<DeptLeavesView />` (props 없음, 내부에서 profile로 조회). Task 6(CalendarView)가 렌더.

> 참고: `useAuth()`는 `{ profile }` 반환(파일 `src/context/AuthContext.tsx`, 기존 사용처 `ShiftTable.tsx` 참고). `profile.corporation_id`, `profile.department`, `profile.full_name` 사용.

- [ ] **Step 1: WardShiftView 작성 (빈 상태 우선)**

`src/components/calendar/WardShiftView.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getWardShifts } from "@/lib/dept/data";
import type { WardShift } from "@/types/dept-calendar";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function WardShiftView() {
  const { profile } = useAuth();
  const [shifts, setShifts] = useState<WardShift[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    getWardShifts(profile.corporation_id, profile.department, currentMonth())
      .then((rows) => { if (alive) setShifts(rows); })
      .catch(() => { if (alive) setShifts([]); });
    return () => { alive = false; };
  }, [profile]);

  if (shifts === null) {
    return <div className="px-4 py-10 text-center text-sm text-zinc-400">불러오는 중…</div>;
  }
  if (shifts.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-2xl bg-zinc-50 p-8 text-center">
        <p className="text-2xl">🗓️</p>
        <p className="mt-2 text-sm font-semibold text-zinc-600">아직 등록된 근무표가 없습니다</p>
        <p className="mt-1 text-xs text-zinc-400">대시보드에서 근무표가 등록되면 여기에 표시됩니다.</p>
      </div>
    );
  }
  // 데이터가 생기면 이후 Phase에서 그리드 렌더. 지금은 목록 최소 표시.
  return (
    <ul className="mx-4 mt-4 space-y-1">
      {shifts.map((s) => (
        <li key={s.id} className="flex justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
          <span className="font-semibold text-zinc-700">{s.staffName ?? "-"} {s.ward ? `(${s.ward})` : ""}</span>
          <span className="text-zinc-500">{s.workDate} · {s.shiftCode}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: DeptLeavesView 작성 (빈 상태 우선)**

`src/components/calendar/DeptLeavesView.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDeptLeaves } from "@/lib/dept/data";
import type { Leave } from "@/types/dept-calendar";

function monthRange(): { start: string; end: string } {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return { start: `${y}-${m}-01`, end: `${y}-${m}-31` };
}

export function DeptLeavesView() {
  const { profile } = useAuth();
  const [leaves, setLeaves] = useState<Leave[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    getDeptLeaves(profile.corporation_id, profile.department, monthRange())
      .then((rows) => { if (alive) setLeaves(rows); })
      .catch(() => { if (alive) setLeaves([]); });
    return () => { alive = false; };
  }, [profile]);

  if (leaves === null) {
    return <div className="px-4 py-10 text-center text-sm text-zinc-400">불러오는 중…</div>;
  }
  if (leaves.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-2xl bg-zinc-50 p-8 text-center">
        <p className="text-2xl">🌴</p>
        <p className="mt-2 text-sm font-semibold text-zinc-600">등록된 부서 휴가가 없습니다</p>
        <p className="mt-1 text-xs text-zinc-400">휴가 결재가 최종 승인되면 여기에 표시됩니다.</p>
      </div>
    );
  }
  return (
    <ul className="mx-4 mt-4 space-y-1">
      {leaves.map((l) => (
        <li key={l.id} className="flex justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
          <span className="font-semibold text-zinc-700">{l.staffName ?? "-"}</span>
          <span className="text-zinc-500">{l.startDate}~{l.endDate} · {l.leaveType}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: 타입체크**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
cd "C:/dev/SOMANG ERP" && git add src/components/calendar/WardShiftView.tsx src/components/calendar/DeptLeavesView.tsx && git commit -m "feat(calendar): WardShiftView/DeptLeavesView (데이터층 읽기 + 빈 상태)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: CalendarView를 레지스트리로 배선 + mock/휴리스틱 제거

**Files:**
- Modify: `src/components/views/CalendarView.tsx`

**Interfaces:**
- Consumes: `calendarVariantFor` (Task 3), `WardShiftView`/`DeptLeavesView` (Task 5), `useAuth` (`profile.department`), 기존 `useUserRole` (`role`).

**변경 설계:**
- 2번째 탭(현재 "근무/진료")의 콘텐츠를 아래 우선순위로 결정:
  1. `role === "exec"` → `ClinicScheduleView` (기존 유지)
  2. 아니면 `calendarVariantFor(profile.department)`:
     - `ward_shift` → `<WardShiftView />`
     - `dept_leaves` → `<DeptLeavesView />`
     - `personal` → **2번째 탭 자체를 숨김**(월간만 노출), 진입 시 `calView="month"` 강제.
- 월간 뷰의 mock(`MOCK_EVENTS`) 제거 → 개인 일정(localStorage)만. (Task 7에서 `MOCK_EVENTS` 정의 삭제)
- `isNurseProfile`/`ShiftTable` import 제거.

- [ ] **Step 1: import·변형 로직 추가**

`src/components/views/CalendarView.tsx` 상단 import에서 `ShiftTable` import를 제거하고 다음을 추가:

```tsx
import { WardShiftView } from "@/components/calendar/WardShiftView";
import { DeptLeavesView } from "@/components/calendar/DeptLeavesView";
import { calendarVariantFor, type CalendarVariant } from "@/lib/dept/registry";
import { useAuth } from "@/context/AuthContext";
```

컴포넌트 함수 본문 상단(`const { role } = useUserRole();` 다음)에 추가:

```tsx
  const { profile } = useAuth();
  const variant: CalendarVariant = profile ? calendarVariantFor(profile.department) : "personal";
  // exec는 부서 무관 진료 뷰. 그 외 personal이면 근무 탭 자체를 숨김.
  const showShiftTab = role === "exec" || variant !== "personal";
```

- [ ] **Step 2: personal variant일 때 근무 탭 강제 해제**

`useEffect(() => { setCalView(loadView()); }, []);` 아래에 추가:

```tsx
  useEffect(() => {
    if (!showShiftTab && calView === "shift") saveView("month");
  }, [showShiftTab, calView]);
```

- [ ] **Step 3: 토글 UI를 showShiftTab로 감싸기**

기존 뷰 토글 블록(`<div className="sticky top-14 ...">` 안의 `<div className="flex flex-1 gap-1 ...">` 토글)에서, 근무/진료 버튼을 `showShiftTab &&`로 감싼다. `showShiftTab`가 false면 토글 자체를 렌더하지 않고 월간 헤더만 남긴다. (토글 컨테이너 전체를 `{showShiftTab && ( ... )}`로 감싸도 됨 — personal은 월간 전용이므로 토글 불필요.)

구체 편집: 토글 `<div className="flex flex-1 gap-1 rounded-xl bg-zinc-100 p-1"> ... </div>` 전체를 다음으로 교체:

```tsx
        {showShiftTab && (
          <div className="flex flex-1 gap-1 rounded-xl bg-zinc-100 p-1">
            <button type="button" onClick={() => saveView("month")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${calView === "month" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}>
              📅 {t("cal_monthly")}
            </button>
            <button type="button" onClick={() => saveView("shift")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${calView === "shift" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}>
              {role === "exec" ? "📋 진료" : `🕐 ${t("cal_shift")}`}
            </button>
          </div>
        )}
```

- [ ] **Step 4: shift 뷰 분기를 레지스트리로 교체**

기존:
```tsx
      {calView === "shift" && (
        <div className="mt-3">
          {role === "exec" ? <ClinicScheduleView /> : <ShiftTable />}
        </div>
      )}
```
교체:
```tsx
      {showShiftTab && calView === "shift" && (
        <div className="mt-3">
          {role === "exec"
            ? <ClinicScheduleView />
            : variant === "ward_shift"
              ? <WardShiftView />
              : variant === "dept_leaves"
                ? <DeptLeavesView />
                : null}
        </div>
      )}
```

- [ ] **Step 5: 월간 뷰 mock 제거**

`usePersonalEvents()`가 `all = MOCK_EVENTS + personal`을 반환한다(파일 `src/lib/calendar-data.ts`). 월간에 mock이 섞이지 않도록, `src/lib/calendar-data.ts`의 `all` 계산을 개인 일정만으로 변경:

기존:
```ts
  const all = [...MOCK_EVENTS, ...personal.map((e) => ({ ...e, mine: true }))];
```
교체:
```ts
  const all = personal.map((e) => ({ ...e, mine: true }));
```
(`MOCK_EVENTS` 상수 자체 삭제는 Task 7에서 미사용 확인 후)

- [ ] **Step 6: 타입체크 + 빌드**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit && npm run build`
Expected: 타입 에러 없음, 빌드 성공.

- [ ] **Step 7: 실계정 런타임 검증 (rule #7)**

`npm run dev` 후 각 계정으로 로그인해 일정 탭 확인:
- **간호과 계정**(예: 윤민주 SM-0029) → 근무 탭 노출, 클릭 시 "아직 등록된 근무표가 없습니다".
- **원무과 계정**(SM 원무과 아무나) → 근무 탭 → "등록된 부서 휴가가 없습니다".
- **그 외 부서 계정**(예: 총무과) → 근무 탭 **없음**, 월간(개인 일정)만. mock 일정 사라짐 확인.
- **exec 계정**(이강표 SM-0001) → 근무 탭 = 진료(ClinicScheduleView) 유지.

(로그인 계정: `{사번소문자}@somang.internal` / 비번 `{사번}1234` — 메모리 `supabase-admin-access`)

- [ ] **Step 8: Commit**

```bash
cd "C:/dev/SOMANG ERP" && git add src/components/views/CalendarView.tsx src/lib/calendar-data.ts && git commit -m "feat(calendar): 일정 탭 부서 레지스트리 배선 + mock/휴리스틱 제거

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: 미사용 mock 정리

**Files:**
- Modify/Delete: `src/lib/calendar-data.ts` (`MOCK_EVENTS` 삭제)
- Delete: `src/components/shift/ShiftTable.tsx`, `src/lib/shift-data.ts` (미사용 확인 후)

**Interfaces:**
- 없음(제거만). 삭제 전 참조 0건 확인 필수.

- [ ] **Step 1: 참조 확인**

Run (ripgrep, 또는 Grep 툴):
```bash
cd "C:/dev/SOMANG ERP" && rg -n "MOCK_EVENTS|ShiftTable|shift-data|isNurseProfile|ADMIN_DATASET|NURSE_DATASET" src
```
Expected: `ShiftTable`/`shift-data`/`isNurseProfile`/`*_DATASET` 참조가 정의 파일 자신 외엔 없음. (`ClinicScheduleView`가 `shift-data`를 쓰면 삭제 대상에서 제외 — 확인 필수)

> ⚠️ `ClinicScheduleView.tsx`, `ShiftDayDetail.tsx` 등이 `shift-data`/`SHIFT_CODE_META`를 참조할 수 있음. 참조가 있으면 `shift-data.ts`는 **삭제하지 말고 유지**하고, `ADMIN_DATASET`/`NURSE_DATASET`만 미사용이면 그 상수만 제거.

- [ ] **Step 2: 미참조 항목만 삭제**

- `MOCK_EVENTS` 정의를 `src/lib/calendar-data.ts`에서 삭제(관련 주석 포함).
- `ShiftTable.tsx`: 참조 0이면 파일 삭제.
- `shift-data.ts`: 참조 0이면 삭제, 아니면 미사용 상수만 제거.

- [ ] **Step 3: 타입체크 + 빌드**

Run: `cd "C:/dev/SOMANG ERP" && npx tsc --noEmit && npm run build`
Expected: 에러 없음(삭제로 인한 깨진 import 없음).

- [ ] **Step 4: Commit**

```bash
cd "C:/dev/SOMANG ERP" && git add -A && git commit -m "chore(calendar): 미사용 mock(ShiftTable/shift-data/MOCK_EVENTS) 정리

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: 워크로그 갱신 (rule #11)

**Files:**
- Modify: `docs/worklog/2026-07-02.md`

- [ ] **Step 1: 구현 결과 기록**

`docs/worklog/2026-07-02.md`의 "부서별 일정 탭" 섹션에 구현 완료 내역 추가: 생성 파일, 마이그레이션 적용 여부, 실계정 검증 결과(간호/원무/기타/exec 각각), 남은 일(대시보드 붙일 때 트리거·쓰기정책·Realtime 활성화).

- [ ] **Step 2: Commit**

```bash
cd "C:/dev/SOMANG ERP" && git add docs/worklog/2026-07-02.md && git commit -m "docs(worklog): 부서 일정 공유 구조 구현 결과 기록

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 검증 요약 (완료 기준, rule #7)

- 마이그레이션 적용 후: `dept_shifts`/`dept_events`/`leaves` 존재 + RLS 활성 + 트리거 미설치 확인.
- 실계정 로그인 매트릭스:
  | 계정 | 근무 탭 | 클릭 시 |
  |---|---|---|
  | 간호과 | 있음 | "아직 등록된 근무표가 없습니다" |
  | 원무과 | 있음 | "등록된 부서 휴가가 없습니다" |
  | 그 외(총무 등) | **없음** | 월간(개인)만, mock 사라짐 |
  | exec | 있음 | 진료(ClinicScheduleView) |
- `npm run build` 성공.
- 부서 격리 불변식: 타 부서 계정으로 `leaves`/`dept_shifts` SELECT 시 0행(RLS) — 데이터가 생긴 뒤 재검증(연동 Phase).

## 이번 계획에서 의도적으로 미룬 것 (연동 Phase)

스펙에 있으나 "구조만" 범위라 지금 구현하지 않음(누락 아님):
- **근무표 leaves overlay**: `WardShiftView`는 지금 `dept_shifts`만 읽음. 승인 휴가를 근무표 그날에 겹쳐 "휴가"로 표시하는 overlay + 실제 근무표 그리드는 데이터가 생기는 연동 Phase에서.
- **트리거 설치**: `fn_leave_from_approved_draft`/`trg_leave_from_approval`은 마이그레이션에 주석으로 정의만. 대시보드 붙일 때 주석 해제·설치.
- **쓰기 RLS**: INSERT/UPDATE 정책 미생성(차단). 대시보드/트리거 연동 시 활성화.
- **Realtime 구독**: 참고 부서(총무·간호 대시보드, 모바일)의 `postgres_changes` 구독은 연동 Phase.
- **총무 배달(routing) 수신**: 대시보드 Phase. read-all 정책은 만들지 않음(불변식).
- **dept_events 소비 UI**: 테이블만 생성, 월간 뷰에 부서 공통일정 표시는 추후.
```
