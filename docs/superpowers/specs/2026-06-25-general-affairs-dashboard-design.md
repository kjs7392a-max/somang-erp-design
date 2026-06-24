# 총무과대시보드 설계 (General Affairs Dashboard)

- 작성일: 2026-06-25
- 프로젝트: SOMANG ERP (`C:\dev\SOMANG ERP`)
- 스택: Next.js 16.2.4 + React 19.2.4 (인라인 CSS, Supabase)
- 기준: 기존 간호(병동)대시보드 `ward-dashboard`의 UI/패턴을 본떠 신규 작성

## 목표

간호대시보드와 동일한 UI/디자인의 **총무과 전용 대시보드**를 SOMANG ERP에 추가한다.
핵심 기능은 인사(HR) 중심이다.

1. **전직원 현황관리** — 전 직원 목록/현황
2. **휴가관리** — 년차·반차·휴가 등 신청/잔여 현황
3. **전자결재** — 각 기안 상신/결재 관리 (기존 `approval` 기능 재사용)

## 핵심 결정 사항

| 항목 | 결정 |
|---|---|
| 위치 | SOMANG ERP 내부에 신규 추가 (간호 코드 미수정) |
| 공존 방식 | 별도 라우트 `/general` (간호 `/ward`와 독립 공존) |
| 탭 구성 | 현황 / 직원현황 / 휴가관리 + 사이드바 전자결재 |
| 전자결재 | 기존 `features/approval` 컴포넌트 재사용 |
| 휴가↔결재 | **연동** — 휴가 신청 시 결재 기안 자동 상신, 결재 완료 시 휴가 "승인" 반영 |
| 데이터 | 전부 더미 데이터 (백엔드 연동은 추후 별도 작업) |

## 전체 구조

```
src/
├── app/
│   ├── ward/                  ← 기존 간호 (그대로 유지)
│   └── general/               ← 신규: 총무과 라우트
│       ├── layout.tsx
│       └── page.tsx           (GeneralApp 렌더, 클라이언트)
├── features/
│   ├── ward-dashboard/        ← 미수정 (단, ApprovalDoc import 경로 1줄만 변경)
│   ├── approval/              ← 전자결재 (재사용, 타입 소유로 정리)
│   └── general-dashboard/     ← 신규
│       ├── components/
│       │   ├── GeneralApp.tsx
│       │   ├── GeneralSidebar.tsx
│       │   ├── GeneralTopbar.tsx
│       │   └── tabs/
│       │       ├── TabStatus.tsx
│       │       ├── TabStaff.tsx
│       │       └── TabLeave.tsx
│       ├── data.ts
│       └── types.ts
└── shared/ui/WardUI.tsx       ← 디자인 시스템 그대로 재사용
```

## 컴포넌트 설계

### GeneralApp.tsx (메인 셸)
- `WardApp.tsx` 패턴을 따른다: 라우트 상태(`general` | `approval` | `draft`) + 탭 상태(`status` | `staff` | `leave`) 관리.
- localStorage 키는 간호의 `nd_*`와 충돌하지 않게 **`gd_*`**(`gd_route`, `gd_tab`) 사용.
- 전자결재 핸들러(`handleApprove`, `handleReject`, `handleSubmitDoc`)는 WardApp 로직 재사용.
- 사용자 전환(`switchUser`), 토스트(`WardToast`) 동일 패턴.
- 휴가↔결재 연동: 휴가 신청 핸들러가 `LeaveRequest` 생성과 동시에 `ApprovalDoc`(양식=휴가신청서)을 상신. 결재 완료(`완료`) 시 해당 휴가의 상태를 `승인`으로 갱신(문서 id ↔ 휴가 id 매핑).

### GeneralSidebar.tsx
- 로고: "소망병원 ERP" / 부제 `GENERAL · 총무과`.
- 컨텍스트 카드: "총무과 / 행정지원팀".
- 메뉴 섹션:
  - **총무 업무** → `총무 대시보드`
  - **전자결재** → `결재함`, `기안 결재` (결재권 계정만 노출, 대기 건수 뱃지)

### GeneralTopbar.tsx
- 제목 + 경로(총무과 › 현황), 오늘 날짜, 사용자 전환 드롭다운 (간호 패턴 동일).

### 탭
1. **TabStatus (현황)** — KPI 카드 4개: `전체 직원 수` · `오늘 결재 대기` · `금일/금주 휴가자` · `이번 달 휴가 사용 건`. 아래에 오늘 휴가자 목록 + 최근 기안 요약.
2. **TabStaff (직원현황)** — 전직원 테이블(이름/부서/직급/입사일/연락처/상태). 검색·부서 필터, 행 클릭 상세.
3. **TabLeave (휴가관리)** — 직원별 연차 잔여/사용 현황 + 휴가 신청 내역(유형 배지/기간/일수/상태). 신규 휴가 등록 모달(간호 외박·외출 등록 패턴 재사용) → 결재 상신 연동.

## 데이터 모델 (general-dashboard/types.ts)

```ts
interface GeneralAccount {
  id: string;
  name: string;
  role: string;        // 총무과장 | 주임 | 사원 등
  dept: string;        // 총무과 / 행정지원팀
  canApprove: boolean;
}

interface Staff {
  id, name, dept, role, join, contact,
  status: "재직" | "휴직";
}

type LeaveType = "년차" | "반차" | "병가" | "경조" | "공가";
interface LeaveRequest {
  id, staffId, name, type: LeaveType,
  start, end, days, reason,
  status: "대기" | "승인" | "반려",
  docId?: string;      // 연동된 전자결재 문서 id
}

interface LeaveBalance {
  staffId, name,
  granted, used, remain;   // 연차 부여/사용/잔여
}
```

### data.ts 더미 규모
- `ACCOUNTS`: 총무 계정 3~4명 (예: 김총무 총무과장·결재권, 이행정 주임, 박서무 사원).
- `STAFF`: 전직원 ~20명.
- `INIT_LEAVES` (LeaveRequest): ~12건.
- `LEAVE_BALANCES`: 직원별 연차 현황.
- `INIT_DOCS` + `APPROVERS_GENERAL`: 전자결재 더미 + 총무 결재선(기안 → 총무과장 → 행정원장).

## 전자결재 재사용

- `features/approval`의 `ApprovalPage`(결재함)·`DraftPage`(기안)는 props(docs/핸들러)만 받는 범용 컴포넌트 → 그대로 import.
- `ApprovalDoc` 타입을 `features/approval/types.ts`로 이전(approval이 자기 타입 소유). `ward-dashboard`는 import 경로 1줄만 변경(동작 변화 없음).
- 총무 결재선/결재자(`APPROVERS_GENERAL`)는 general 데이터에서 별도 정의.

## 기술 사항 / 제약

- **AGENTS.md 준수**: 이 Next.js는 관례가 다를 수 있으므로 코드 작성 전 `node_modules/next/dist/docs/`의 관련 문서 확인.
- `/general/page.tsx`는 `ward/page.tsx`와 동일하게 `GeneralApp`만 렌더(클라이언트 컴포넌트).
- 디자인 토큰/공용 UI는 `shared/ui/WardUI.tsx` 그대로 사용(색상·카드·버튼·아이콘·폰트).
- 간호 코드 회귀 방지: `ward-dashboard`는 ApprovalDoc import 경로 외 수정 없음.

## 범위 밖 (YAGNI)

- 실제 Supabase 백엔드 연동(현재 더미 데이터, 추후 별도 spec).
- 출퇴근/근태 자동 집계, 급여, 비품/자산/시설/계약 관리(요청 범위 아님).
- 로그인/권한 시스템(기존 ERP의 것 사용).
