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
-- 주의: 휴가 본문은 drafts가 아니라 별도 테이블 public.document_contents(draft_id, body jsonb)에 있음.
--       (검증 2026-07-02: drafts에 body 컬럼 없음. useDraftDetail.ts의 document_contents(body) join 참고)
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
--            coalesce(dc.body->>'vacationType','annual'),
--            (dc.body->>'startDate')::date, (dc.body->>'endDate')::date,
--            '승인', new.id, new.drafter_id
--     from public.profiles p
--     join public.document_contents dc on dc.draft_id = new.id
--     where p.id = new.drafter_id;
--   end if;
--   return new;
-- end; $$;
-- create trigger trg_leave_from_approval
--   after update of status on public.drafts
--   for each row execute function public.fn_leave_from_approved_draft();
