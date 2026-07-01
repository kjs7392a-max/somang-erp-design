# 공지 권한 구조 설계 (Supabase + RLS)

> 작성일 2026-06-27 · 브랜치 feature/general-affairs-dashboard

## 목적

홈 화면 공지를 mock 데이터에서 Supabase로 전환하고, **"누가 어떤 공지를 올릴 수 있는가 / 누가 볼 수 있는가"** 권한 규칙을 DB(RLS)에 박는다. 부서별 대시보드(작성 UI)는 아직 없으므로 이번엔 **데이터 구조 + 권한 + 읽기 전환**까지만. 작성은 추후 대시보드에서 INSERT만 하면 되도록 준비.

## 공지 3계층 + 병동

- **company(전체공지)** — 해당 법인 전 직원이 읽음.
- **dept(부서공지)** — 같은 법인 + 같은 부서원만 읽음 (타 부서 차단).
- **ward(병동공지)** — 간호과 전용. 같은 법인 + 같은 병동 간호사만 읽음 (타 병동 차단).

간호과만 병동으로 다시 쪼개진다. 나머지 부서는 dept 단위 그대로.

## 권한 매트릭스

### 전체공지(company) — 작성 주체 부서
| 법인 | 주체 |
|---|---|
| 소망(SM) | 총무과 |
| 현대(HD) | 기획실 |

### 부서공지(dept) — 가능 부서 (간호과 제외 = dept 단위)
| 법인 | 부서공지 가능 부서 |
|---|---|
| 소망(SM) | 총무과, 원무과, 사회복지과, 약국, 영양과 |
| 현대(HD) | 원무과, 사회복지과, 영양과 |

### 병동공지(ward) — 간호과, 병동 단위
| 법인 | 병동 |
|---|---|
| 소망(SM) | 1, 2, 3, 5, 8, 9, 10-A, 10-B, 11, 12 |
| 현대(HD) | 101, 102, 103, 105, 106, 107, 108 |

※ 간호과 전체 대상(전 병동) 공지가 필요하면 scope='dept', target_dept='간호과'로 별도 발행 가능(추후 대시보드에서 옵션 제공). 이번 구조에 형태만 열어둠.

super_admin(`profiles.is_super_admin`)은 모든 작성/수정/삭제 허용.

## 데이터 모델

### `corporations` 컬럼 추가
- `company_notice_dept text` — 전체공지 작성 주체 부서. SM='총무과', HD='기획실'.

### 신규 `notice_departments` — 부서공지 가능 부서 화이트리스트
```
corporation_id  uuid → corporations(id)
department      text
PRIMARY KEY (corporation_id, department)
```
시드: SM(총무과,원무과,사회복지과,약국,영양과,간호과) / HD(원무과,사회복지과,영양과,간호과).
※ 간호과도 포함하되, 간호과는 dept 공지 대신 **ward 공지**가 기본 경로(위 3계층 참고).

### 신규 `wards` — 병동 목록
```
corporation_id  uuid → corporations(id)
code            text                 -- '1','10-A','101' 등 (입력값 그대로)
sort_order      int
PRIMARY KEY (corporation_id, code)
```
표시는 `code + '병동'` (예: '10-A병동'). 시드 = 위 병동 매트릭스.

### `profiles` 컬럼 추가
- `ward text` nullable — 간호사의 소속 병동 code. **명단은 추후 제공**, 지금은 전부 NULL(간호과 ward 공지는 명단 채워질 때까지 매칭 대상 0).

### 신규 `announcements`
```
id              uuid PK default gen_random_uuid()
corporation_id  uuid NOT NULL → corporations(id)
scope           text NOT NULL CHECK (scope IN ('company','dept','ward'))
target_dept     text                 -- scope='dept' 또는 'ward'(='간호과')일 때
target_ward     text                 -- scope='ward'일 때만 NOT NULL
title           text NOT NULL
body            text NOT NULL
content         text
author_id       uuid → profiles(id)
author_name     text                 -- 표시용 denorm ("한기석 총무과장")
author_dept     text
pinned          boolean DEFAULT false
title_i18n      jsonb DEFAULT '{}'   -- 기존 titleI18n 호환(번역 기능)
body_i18n       jsonb DEFAULT '{}'
published_at    timestamptz DEFAULT now()
created_at      timestamptz DEFAULT now()
```
CHECK: company→target_dept/target_ward NULL · dept→target_dept NOT NULL, target_ward NULL · ward→target_dept='간호과' AND target_ward NOT NULL.

## RLS 정책

현재 사용자 profile = `(SELECT ... FROM profiles WHERE id = auth.uid())` (확인됨: `profiles.id = auth.uid()`).

| 동작 | 규칙 |
|---|---|
| **SELECT** | `corporation_id = 내 법인` AND ( company OR (dept AND `target_dept=내 부서`) OR (ward AND `target_ward=내 병동`) ). super_admin은 전체. |
| **INSERT/UPDATE/DELETE company** | scope='company' AND `내 부서 = 내 법인의 company_notice_dept` AND 같은 법인. OR super_admin. |
| **INSERT/UPDATE/DELETE dept** | scope='dept' AND `내 부서 = target_dept` AND `(내 법인,내 부서) ∈ notice_departments` AND 같은 법인. OR super_admin. |
| **INSERT/UPDATE/DELETE ward** | scope='ward' AND `내 부서 = '간호과'` AND `(내 법인,target_ward) ∈ wards` AND 같은 법인. OR super_admin. |

→ 부서/병동 공지는 **읽기 자체가 같은 부서/병동으로 제한**되어 타 부서·타 병동이 못 본다. UI 필터 + RLS 이중 보장.

### SELECT 정책에 작성자 본인 가시성 (필수)
`ann_select`에 `author_id = auth.uid()` 분기를 둔다. 이유: **PostgREST의 `INSERT ... RETURNING`이 SELECT 정책의 적용을 받는다.** 병동공지는 `target_ward = my_ward()`로 보이는데, 간호사↔병동 명단이 아직 없어 `my_ward()=NULL`이므로 방금 작성한 행이 본인에게 안 보여 RETURNING이 42501로 거부된다. `author_id=auth.uid()`로 "작성자는 자기 글을 항상 봄"을 보장해 해결. (명단 적재 후엔 같은 병동원도 보임.)

### 작성 계약 (대시보드 구현 시)
공지 작성(INSERT) 시 **반드시 `author_id = 현재 사용자 id`를 세팅**해야 한다(위 RETURNING 문제 방지 + 작성자 추적). 병동 유효성은 복합 FK `announcements_ward_fk (corporation_id, target_ward) → wards`가 강제하므로, 잘못된/타 법인 병동은 23503으로 거부된다.

### 실데이터 검증 (2026-06-27, 실 계정 RLS)
SM 총무과/간호과/원무과, HD 기획실/간호과 계정으로 11개 케이스 전부 기대대로:
전체공지 SM총무과·HD기획실만 허용 / 부서·병동 타 소속 차단 / 간호사 자기법인 병동 작성 허용, 없는·타법인 병동 FK 거부.

## 앱 측 변경

### 신규 `src/lib/announcements.ts`
- `fetchAnnouncements()` — Supabase 조회(읽기는 RLS가 필터). 홈에서 company/dept/ward 자동 구분 표시.
- 권한 헬퍼(대시보드 버튼 노출용, RLS와 동일):
  - `canPostCompanyNotice(profile, corp)` · `canPostDeptNotice(profile)` · `canPostWardNotice(profile)`.

### `AnnouncementSection.tsx`
- mock `ANNOUNCEMENTS` → `fetchAnnouncements`로 교체. 표시·읽음·번역(`getAnnouncementText`) 로직 유지. 간호과는 ward 섹션도 노출.

## 기존 mock 공지 이전
마이그레이션에서 현재 `home-data.ts` mock 공지를 seed: 전체공지는 SM·HD 양쪽, 부서공지(총무과)는 SM. 간호과 mock 공지는 ward 명단 전이므로 scope='dept'(간호과 전체)로 임시 seed.

## 범위 밖(YAGNI)
- 작성/수정 UI(대시보드) — 추후 별도 spec.
- 간호사↔병동 명단 적재 — **추후 사용자 제공**(profiles.ward 채우는 마이그레이션).
- 직책 단위 세분화(과장 이상만 등) — 지금은 부서/간호과 단위.

## 검증 기준
- RLS 적용 후, 다른 부서/병동/법인 계정 SELECT 시 보이는 행이 매트릭스와 일치.
- 비주체 부서의 company INSERT, 타 병동 ward INSERT가 RLS로 거부됨.
- 홈 공지 표시가 이전과 동일(seed 데이터).
- wards 시드: SM 10개 / HD 7개 행 확인.
