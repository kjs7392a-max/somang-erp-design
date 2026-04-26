# 3단계 결재/기안 워크플로우 DB 연동 — 설계 문서

**프로젝트** 소망병원 ERP 전자결재 앱  
**단계** 3단계  
**작성일** 2026-04-26  
**범위** 기안 제출 → 결재함 목록 → 결재 처리 (승인/반려/보류)  
**제외 범위** Admin Dashboard, 회원가입, 결재선 편집 UI, approval_line_templates 테이블

---

## 전제 조건 (코드 작업 전 Supabase 수동 작업)

결재 흐름 테스트를 위해 아래 2개 계정을 Supabase에 생성해야 한다.

| 사번 | 이름 | 직책 | 이메일 | 용도 |
|---|---|---|---|---|
| h001 | 한기석 | 총무과장 | `h001@somang.internal` | 1차 결재자 |
| e001 | 이강표 | 이사장 | `e001@somang.internal` | 2차 결재자 |

**생성 순서:**
1. Supabase Dashboard → Authentication → Users → Add user (Auto confirm 체크)
2. 각 계정 UUID 확인 후 profiles INSERT
3. UUID를 `src/lib/approval-approvers.ts`에 입력

---

## 아키텍처 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 결재선 매핑 | 코드 하드코딩 (`approval-approvers.ts`) | MVP 단일 법인, 고정 결재선 |
| 역할별 기본 탭 | 매핑 파일 (`approval-roles.ts`) | 나중에 DB 전환 용이 |
| DB 호출 구조 | 커스텀 훅 (Approach B) | UI/DB 분리, AuthContext 패턴 일관성 |
| 결재 액션 범위 | 승인 + 반려 + 보류 전체 | UI/DB 이미 준비됨, 병원 실무 필요 |
| 현재 결재 순번 판단 | 클라이언트 필터 | DB 함수 신규 생성 없음 |

---

## 신규 파일 구조

```
src/
├── lib/
│   ├── approval-approvers.ts   ← 직책 → UUID 매핑 (신규)
│   └── approval-roles.ts       ← profile → 기본 탭 결정 (신규)
├── hooks/
│   ├── useDraftSubmit.ts       ← 기안 제출 (신규)
│   ├── useMyDrafts.ts          ← 내 기안함 목록 (신규)
│   ├── useApprovalInbox.ts     ← 결재할 문서 목록 (신규)
│   ├── useDraftDetail.ts       ← 기안 상세 조회 (신규)
│   └── useApprovalAction.ts    ← 승인/반려/보류 처리 (신규)
└── app/(main)/
    ├── draft/page.tsx                          ← useDraftSubmit 연결 (수정)
    ├── approval/page.tsx                       ← 탭 구조 + 두 훅 연결 (수정)
    └── approval/[id]/approval-detail-client.tsx ← 실제 id 연동 (수정)
```

**수정 없는 UI 컴포넌트:**  
`DraftComposeView`, `SubmitConfirmModal`, `ApprovalLineView`, `AttachmentPicker`, `ApprovalListView`, `ApprovalDetailView`

---

## 매핑 파일 설계

### `src/lib/approval-approvers.ts`

```ts
// 직책 → profile UUID 매핑
// UUID가 placeholder("x의-uuid" 형태)이면 런타임 throw
// 나중에 DB 매핑 테이블로 교체 시 이 파일 내부만 수정

const POSITION_MAP: Record<string, string | null> = {
  "총무과장": "<h001-uuid>",   // h001@somang.internal
  "이사장":   "<e001-uuid>",   // e001@somang.internal
  "팀장":     null,
  "부서장":   null,
  "담당":     null,
};

const PLACEHOLDER_PATTERN = /^<.+>$/;

export function getApproverByPosition(position: string): string | null {
  const uuid = POSITION_MAP[position] ?? null;
  if (uuid && PLACEHOLDER_PATTERN.test(uuid)) {
    throw new Error(`결재자 UUID 미설정: ${position}`);
  }
  return uuid;
}
```

### `src/lib/approval-roles.ts`

```ts
// 기본 탭 결정만 담당
// 실제 권한 판단은 RLS와 profile 기준으로 처리

export type ApprovalTab = "my-drafts" | "inbox";

export function getDefaultApprovalTab(profile: Profile): ApprovalTab {
  if (profile.is_super_admin || profile.is_global_viewer) return "inbox";
  return "my-drafts";
}

export function shouldHideMyDraftsTab(profile: Profile): boolean {
  return profile.is_super_admin;
}
```

---

## 데이터 흐름

### 기안 제출

```
DraftView (폼 작성)
  → SubmitConfirmModal (상신 확인)
  → onConfirm → useDraftSubmit.submit(payload)
      1. getApproverByPosition() 호출 → placeholder이면 throw
      2. steps 필터 (null 제거)
      3. steps.length === 0 → return { error: "결재자가 지정되지 않았습니다" }
      4. drafts INSERT → 실패 시 error 반환 + 중단
      5. document_contents INSERT → 실패 시 error 반환 + 중단
      6. draft_approval_steps INSERT (order_index 순서대로) → 실패 시 error 반환 + 중단
      7. 1~6 모두 성공 시에만 완료로 간주 → router.push(ROUTES.approval)
      ※ Supabase client는 트랜잭션 미지원 → 각 단계 실패 시 이후 INSERT 중단
         (부분 삽입이 남을 수 있으나 MVP에서는 허용, 추후 DB 함수로 원자성 보장 가능)
```

**document_contents.body JSONB 구조:**
```json
{
  "formKind": "vacation",
  "title": "연차 신청",
  "vacationType": "annual",
  "startDate": "2026-04-28",
  "endDate": "2026-04-29",
  "reason": "개인 사유"
}
```

### 결재함 목록

```
approval/page.tsx
  ├─ useMyDrafts()
  │    SELECT drafts WHERE drafter_id = me
  │    ORDER BY created_at DESC
  │
  └─ useApprovalInbox()
       Step 1: SELECT draft_approval_steps
                WHERE approver_id = me AND action = 'pending'
       Step 2: draft_id 목록을 Set으로 dedupe
       Step 3: dedupe된 draft_id[] 로 단일 IN query
                SELECT * FROM draft_approval_steps
                WHERE draft_id IN (...) AND action = 'pending'
       Step 4: 클라이언트 필터
                내 step.order_index === min(pending order_index) 인 것만 표시
```

### 결재 처리

```
ApprovalDetailView
  → 승인 버튼 → useApprovalAction.approve(stepId)
  → 반려 버튼 → useApprovalAction.reject(stepId, comment)
  → 보류 버튼 → useApprovalAction.hold(stepId, comment)

  → draft_approval_steps UPDATE { action, comment, acted_at: now() }
  → trg_sync_draft_status 자동 실행 → drafts.status 갱신
```

---

## 에러 처리 원칙

| 상황 | 처리 계층 |
|---|---|
| UUID placeholder 감지 | 코드 throw (getApproverByPosition 내부) |
| steps.length === 0 | 코드 차단 → `{ error: "결재자가 지정되지 않았습니다" }` |
| 반려/보류 사유 없음 | 코드 차단 → `{ error: "사유를 입력하세요" }` |
| 이미 처리된 step 재처리 시도 | 코드 차단 (action !== 'pending' 검증) + RLS 이중 차단 |
| 내 순번 아닌 step 처리 시도 | 코드 차단 (order_index 검증) + RLS 이중 차단 |
| 네트워크/DB 오류 | 각 훅에서 `{ error: string }` 반환, UI에서 표시 |

---

## 탭 구성 및 역할별 기본 탭

| 사용자 | 기본 탭 | 내 기안함 탭 |
|---|---|---|
| N001 윤민주 (staff) | 내 기안함 | 표시 |
| h001 한기석 (총무과장) | 결재함 | 표시 |
| e001 이강표 (이사장) | 결재함 | 숨김 (is_super_admin) |

기본 탭 결정: `getDefaultApprovalTab(profile)`  
내 기안함 숨김: `shouldHideMyDraftsTab(profile)`

---

## DB 테이블 참조

이미 Supabase에 생성된 구조. 3단계에서 신규 테이블 생성 없음.

| 테이블 | 용도 |
|---|---|
| `drafts` | 기안 헤더 (status: draft_status ENUM) |
| `document_contents` | 기안 본문 (body JSONB) |
| `draft_approval_steps` | 결재선 + 처리 결과 (action: approval_action ENUM) |
| `trg_sync_draft_status` | 결재 action 변경 시 drafts.status 자동 동기화 |

---

## 구현 후 수동 검증 시나리오

| 시나리오 | 예상 결과 |
|---|---|
| N001이 연차신청서 제출 | drafts(pending) + document_contents + 2개 steps 생성 |
| N001 기안함에서 확인 | status: pending 표시 |
| h001으로 로그인 → 결재함 | 윤민주 연차신청서 표시 |
| h001 승인 | steps[0].action=approved, drafts.status=in_progress |
| e001으로 로그인 → 결재함 | 윤민주 연차신청서 표시 |
| e001 최종 승인 | steps[1].action=approved, drafts.status=approved |
| N001 기안함에서 확인 | status: approved 표시 |
| h001이 반려 (사유 없음) | 코드 차단, 에러 메시지 표시 |
| h001이 반려 (사유 입력) | status=rejected, N001 기안함에 반려 표시 |

---

*설계 확정일: 2026-04-26*
