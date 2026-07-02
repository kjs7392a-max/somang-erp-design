# 부서별 일정 탭 + 공유 데이터 구조 설계

- 날짜: 2026-07-02
- 프로젝트: 소망/현대 ERP 모바일 (SOMANG ERP)
- 관련 메모리: `dept-home-nav`, `dash-erp`, `project-corporations`, `announcement-permissions`
- 상태: 설계 승인됨 (2026-07-02) — 스펙 확정, 구현 대기

---

## 1. 배경 / 문제

부서원이 사번으로 로그인하면 **부서에 따라 일정 탭 화면이 달라져야** 한다(간호과=전병동 근무표, 원무과=부서원 휴가, 그 외=개인 일정). 그런데:

- **생산자(대시보드, DASH ERP)가 아직 미완성** → 근무표·일정을 입력할 곳이 없어 실데이터가 없다. 그래서 모바일 일정 탭은 현재 mock만 보인다.
- 즉 "생산자 쪽이 비어서 소비자 쪽이 빈 화면"인 상태.

**결정: 지금은 "구조(뼈대)만" 만든다.** 대시보드가 나중에 같은 공유 테이블에 데이터를 부으면(또는 결재 승인이 채우면) **모바일 코드 수정 없이 자동으로 표시**되도록 연동 지점을 미리 깔아둔다.

### 현재 코드 실태 (검증 완료)
- `CalendarView.tsx` — 월간/근무표 뷰 토글. 근무표 뷰가 이미 분기 중:
  - `role === "exec"` → `ClinicScheduleView`(진료)
  - 그 외 → `ShiftTable`, 그 안에서 `isNurseProfile()` **휴리스틱**으로 간호/총무 데이터셋 분기
- 데이터는 전부 mock(`MOCK_EVENTS`, `ADMIN_DATASET`/`NURSE_DATASET`) + 개인일정 localStorage
- `profile.department`는 자유 문자열이나 **실 DB 값은 이미 깔끔**하게 정규화돼 있음

### 실 DB 부서 분포 (profiles, 2026-07-02 조회)
특수 뷰가 필요한 부서는 **간호과·원무과 2개**뿐, 나머지 ~38개 부서는 전부 개인(default).
- 간호과: SM 37 / HD 30 → 전병동 근무표
- 원무과: SM 8 / HD 6 → 부서원 휴가
- 총무과 SM 6(통합부서=수신처), 경리과 SM 2, 영양과 SM 19/HD 6 등 → 개인
- 노이즈: SM "조리과"(5)/"조리"(1)↔영양과, "재무관리과"(1)↔경리과 → alias 정규화로 흡수

---

## 2. 목표 / 비목표

### 목표 (이번 범위 = "구조만")
1. 공유 스키마 테이블 3종 생성: `dept_shifts`, `dept_events`, `leaves`.
2. "승인 → 기록 → 실시간 반영" 파이프라인을 **마이그레이션으로 정의**(트리거·Realtime·RLS 쓰기정책). **설치·활성화는 대시보드 붙일 때(나중).**
3. `isNurseProfile()` 휴리스틱 → **부서 레지스트리**(명시적 맵)로 교체.
4. 데이터층(`src/lib/dept/data.ts`)을 단일 교체 지점으로 두고, 모바일 일정 탭이 이를 통해 읽음. 지금은 빈 결과 → 빈 상태 UI.

### 비목표 (나중 Phase)
- 대시보드(DASH ERP) 입력 UI 구현.
- 트리거/Realtime/쓰기정책의 **실제 설치·활성화**.
- 개인 일정의 기기간 동기화(현행 localStorage 유지).
- 홈 화면(HomeView)의 부서별 변형(이번엔 일정 탭 파일럿만).
- 경리과/영양과 등 나머지 부서의 특수 뷰.

---

## 3. 아키텍처 — "승인 → 실시간 반영" 파이프라인

```
휴가/연차/반차 신청 (모바일 OR 대시보드)
        │
        ▼
  전자결재 라인  ──(마지막 결재자 승인)──▶  drafts.status = 'approved'
        │
        ▼  ★ 연동 지점 = Postgres 트리거 (DB 레벨, 클라이언트 무관)  [정의만, 설치는 나중]
   trigger: status→approved AND doc_type='vacation'
        │  → drafts.body 파싱(기간·종류·기안자·부서·법인)
        ▼
   INSERT INTO leaves (status='승인', source_draft_id=...)
        │
        ▼  ★ 실시간 = Supabase Realtime 구독  [나중]
  ┌──────────────┬───────────────┬──────────────┐
  ▼              ▼               ▼
총무과 대시보드   간호 근무표      모바일 일정탭
(관리)          (그날→휴가 표시)  (원무과=부서원휴가)
```

### 왜 DB 트리거인가 (클라이언트 승인 코드에 얹지 않는 이유)
현재 최종 승인은 클라이언트 훅(`useApprovalAction.ts:64-80`, `else` 분기에서 `drafts.status='approved'`)에서 처리된다. 여기에 leaves 쓰기를 얹으면 **모바일에서 승인할 때만** 동작하고 대시보드 승인 경로는 누락된다.
→ **DB 트리거**로 두면 어느 경로로든 `drafts.status='approved'`가 되는 순간 자동 기록. "승인과 동시에" 보장 + 모든 경로 커버(rule #8).

### 근무표 반영 = overlay(이중 기록 금지)
승인된 간호사 연차는 `dept_shifts`에 이중 기록하지 않고, 근무표 뷰가 읽을 때 `leaves`를 겹쳐 그날을 "휴가(V)"로 표시. → 단일 원천, 불일치 방지(rule #8).

---

## 4. 공유 스키마 (Supabase 테이블 3종)

모두 `corporation_id` + `department`로 태깅 → 법인·부서별 필터 자동.

### 4.1 `dept_shifts` — 근무표 (간호과 전병동용)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK (default gen_random_uuid) | |
| corporation_id | uuid NOT NULL → corporations.id | SM/HD |
| department | text NOT NULL | 예: 간호과 |
| ward | text NULL | 병동 구분(전병동 그룹핑, 예: "3병동") |
| staff_id | uuid → profiles.id | 대상 직원 |
| staff_name | text | 표시용(denormalized) |
| work_date | date NOT NULL | |
| shift_code | text NOT NULL | D/E/N/OFF/V/H/DB… (기존 ShiftCode 재사용) |
| created_by | uuid NULL | |
| created_at | timestamptz default now() | |
| updated_at | timestamptz default now() | |

인덱스: `(corporation_id, department, work_date)`.

### 4.2 `dept_events` — 부서 공통 일정 (회의·교육·행사)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| corporation_id | uuid NOT NULL | |
| department | text NOT NULL | |
| title | text NOT NULL | |
| category | text NOT NULL | meeting/training/event/deadline (기존 EventCategory) |
| event_date | date NOT NULL | |
| start_time | time NULL | |
| end_time | time NULL | |
| location | text NULL | |
| memo | text NULL | |
| created_by | uuid NULL | |
| created_at / updated_at | timestamptz default now() | |

인덱스: `(corporation_id, department, event_date)`.

### 4.3 `leaves` — 휴가·연차 (원무과 부서원 일정 + 근무표 overlay)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| corporation_id | uuid NOT NULL | |
| department | text NOT NULL | |
| staff_id | uuid → profiles.id | 대상자 |
| staff_name | text | 표시용 |
| leave_type | text NOT NULL | 연차/반차/병가/공가 |
| start_date | date NOT NULL | |
| end_date | date NOT NULL | |
| status | text NOT NULL default '승인' | 신청/승인/반려 |
| source_draft_id | uuid NULL → drafts.id | 원본 결재 문서 링크 |
| memo | text NULL | |
| created_by | uuid NULL | |
| created_at / updated_at | timestamptz default now() | |

인덱스: `(corporation_id, department, start_date)`, `(source_draft_id)`.

### 4.4 개인 일정
- **기존 localStorage 유지**(`somang-personal-events`). 개인 일정은 대시보드 생산물이 아니라 순수 개인용 → 공유 테이블 제외. (나중에 기기간 동기화 필요 시 `personal_events` 추가)

---

## 5. RLS 정책

### 읽기(SELECT) — 지금 활성화
세 테이블 공통: 로그인 사용자가 **`corporation_id = 내 법인 AND department = 내 부서`**인 행만 조회.
- 간호과원 → 간호과 전병동 근무표(+휴가) 조회
- 원무과원 → 원무과 휴가 조회
- `내 법인/내 부서`는 `profiles`에서 `auth.uid()`로 조회하는 서브쿼리로 판정(announcement-permissions RLS 패턴 참고).

### 쓰기(INSERT/UPDATE) — 지금은 막고, 마이그레이션에 정의만
- 지금: 쓰기 정책 없음(=차단). "구조만".
- 나중: 대시보드 관리자 계정 / 트리거(security definer)만 쓰기 허용하도록 정책 활성화.

---

## 6. 승인 트리거 (마이그레이션 정의만, 설치는 나중)

```sql
-- 정의만. 이번엔 파일로만 두고 실제 CREATE는 대시보드 연동 시 실행.
create or replace function public.fn_leave_from_approved_draft()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'approved' and new.doc_type = 'vacation'
     and (old.status is distinct from 'approved') then
    insert into public.leaves (
      corporation_id, department, staff_id, staff_name,
      leave_type, start_date, end_date, status, source_draft_id, created_by
    )
    select
      p.corporation_id, p.department, p.id, p.full_name,
      coalesce(new.body->>'vacationType', '연차'),
      (new.body->>'startDate')::date,
      (new.body->>'endDate')::date,
      '승인', new.id, new.drafter_id
    from public.profiles p
    where p.id = new.drafter_id;
  end if;
  return new;
end;
$$;

-- create trigger trg_leave_from_approval
--   after update of status on public.drafts
--   for each row execute function public.fn_leave_from_approved_draft();
```

> `drafts.body` 실제 키(`vacationType`/`startDate`/`endDate`)는 `draft-forms.ts`·`useDraftSubmit.ts`와 대조해 구현 시 확정한다.

### Realtime (나중)
소비자 화면(총무·간호 대시보드, 모바일 일정탭)이 `leaves`/`dept_shifts`를 Supabase Realtime(`postgres_changes`) 구독 → 승인되면 새로고침 없이 갱신. 이번엔 구독 훅의 자리(seam)만 만들고 실제 구독은 나중.

---

## 7. 부서 레지스트리 (모바일)

`isNurseProfile()` 휴리스틱 제거 → 명시적 맵.

```ts
// src/lib/dept/registry.ts
export type CalendarVariant = "ward_shift" | "dept_leaves" | "personal";

const DEPT_ALIASES: Record<string, string> = {
  "조리": "영양과", "조리과": "영양과",
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

### 일정 탭 뷰 변형
| variant | 부서 | 근무표/일정 뷰 내용 | 데이터 소스 |
|---|---|---|---|
| `ward_shift` | 간호과 | 전병동 근무표(+승인휴가 overlay) | `dept_shifts` + `leaves` |
| `dept_leaves` | 원무과 | 부서원 휴가/연차 목록 | `leaves`(부서 필터) |
| `personal` | 그 외 ~38개 | 개인 일정만 | localStorage(기존) |

### role축과의 관계 (두 축 분리 유지)
- 기존 `role === "exec" → ClinicScheduleView(진료)` **유지**(role 오버레이).
- 부서 레지스트리는 **비-exec 일반 케이스**를 관장.
- 즉 exec는 부서 무관하게 진료 뷰, 그 외는 부서 variant. role축과 부서축은 별개.

---

## 8. 데이터층 (단일 교체 지점)

```ts
// src/lib/dept/data.ts — 지금은 Supabase(빈 결과) 조회, 나중에 그대로 실데이터
export async function getWardShifts(corp: string, dept: string, month: string): Promise<WardShift[]>;
export async function getDeptLeaves(corp: string, dept: string, range: DateRange): Promise<Leave[]>;
// 개인 = 기존 usePersonalEvents(localStorage) 유지
```

- 빈 결과일 때 mock 대신 **"아직 등록된 근무표가 없습니다" / "등록된 부서 휴가가 없습니다"** 빈 상태 UI.
- 타입은 `src/types/`에 공유 스키마와 1:1로 정의(`WardShift`, `Leave`, `DeptEvent`).

### 걷어낼 것
- `isNurseProfile()` 및 mock 데이터셋 의존(`ShiftTable`이 mock 대신 `getWardShifts`를 읽도록 전환).
- `MOCK_EVENTS`는 개인 일정과 무관한 관리자/시스템 mock이므로 제거(빈 상태로 대체).

---

## 9. 구현 순서 (제안)

1. 마이그레이션 파일: 테이블 3종 CREATE + 인덱스 + 읽기 RLS **활성화** / 트리거·쓰기정책·Realtime은 **주석/미설치 정의**로 포함.
2. 공유 타입(`src/types/`) + 데이터층(`src/lib/dept/data.ts`) — 지금은 빈 결과.
3. 부서 레지스트리(`src/lib/dept/registry.ts`).
4. `CalendarView`/`ShiftTable`을 레지스트리+데이터층으로 전환, 빈 상태 UI.
5. 검증: 실 계정(간호과/원무과/그 외)으로 로그인 → 각 variant 렌더 + 빈 상태 확인. (rule #7)

---

## 10. 검증 기준 (rule #7)

- 간호과 계정 로그인 → 일정 탭 근무표 뷰 = `ward_shift`, `dept_shifts` 조회(빈 결과) → "아직 등록된 근무표가 없습니다".
- 원무과 계정 → `dept_leaves`, `leaves` 조회(빈 결과) → 빈 상태.
- 그 외 부서 계정 → `personal`, 개인 일정 localStorage 동작.
- exec 계정 → 부서 무관하게 진료 뷰 유지.
- 마이그레이션 적용 후 `select` 시 RLS가 타 부서 행을 가리는지 실계정으로 확인.
- (나중 연동 시) 트리거 설치 → 휴가 결재 최종승인 → `leaves`에 1행 자동 INSERT 확인.

---

## 11. 리스크 / 열린 결정

- `drafts.body`의 실제 키 이름 — 구현 시 `draft-forms.ts`와 대조 확정.
- `leaves`를 누가 채우나(트리거 vs 대시보드 수동)는 승인 트리거로 확정. 다만 대시보드에서 직접 등록하는 휴가(결재 없이)도 허용할지는 나중 결정.
- RLS의 "내 부서" 판정 서브쿼리 성능 — 인덱스로 커버.
- 통합부서(총무과)가 **타 부서** 데이터를 보는 요구(관리 목적)는 이번 읽기 RLS(자기 부서만)와 충돌 → 대시보드 Phase에서 별도 정책(총무=전체 열람) 설계.
