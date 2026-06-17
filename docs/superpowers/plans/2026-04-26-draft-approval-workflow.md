# 3단계 결재/기안 워크플로우 DB 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase DB에 실제 기안 제출, 결재함 조회, 승인/반려/보류 처리를 연결하여 소망병원 ERP 전자결재 워크플로우를 완성한다.

**Architecture:** 커스텀 훅(useXxx) 패턴으로 모든 DB 접근을 캡슐화한다. UI 컴포넌트는 props로만 데이터/액션을 받는다. Supabase client는 트랜잭션 미지원이므로 fail-fast 순차 INSERT로 기안 제출을 처리하고, RLS + 클라이언트 검증 이중 차단으로 결재 처리를 보호한다.

**Tech Stack:** Next.js 16.2 App Router, Supabase (@supabase/ssr), TypeScript, React 19, Tailwind CSS v4

---

## 전제 조건 (코드 작업 전 수동 작업)

결재 테스트를 위해 Supabase에 아래 2개 계정을 생성해야 한다. UUID 확인 후 Task 1의 `approval-approvers.ts`에 입력.

| 사번 | 이름 | 직책 | 이메일 | 비밀번호 |
|---|---|---|---|---|
| h001 | 한기석 | 총무과장 | h001@somang.internal | 임의 설정 |
| e001 | 이강표 | 이사장 | e001@somang.internal | 임의 설정 |

**Supabase 계정 생성 순서:**
1. Dashboard → Authentication → Users → Invite user (Auto confirm 체크)
2. `SELECT id FROM auth.users WHERE email = 'h001@somang.internal';` 로 UUID 확인
3. profiles INSERT (corporation_id = `cc363f81-7b81-4eea-8d7d-86803741a0cf`):

```sql
INSERT INTO profiles (id, corporation_id, full_name, department, position, is_super_admin, employment_status)
VALUES
  ('<h001-uuid>', 'cc363f81-7b81-4eea-8d7d-86803741a0cf', '한기석', '총무과', '총무과장', false, 'active'),
  ('<e001-uuid>', 'cc363f81-7b81-4eea-8d7d-86803741a0cf', '이강표', '이사장실', '이사장', true, 'active');
```

---

## 파일 구조

| 파일 | 구분 | 역할 |
|---|---|---|
| `src/lib/approval-approvers.ts` | 신규 | position → UUID 매핑, getApproverByPosition() |
| `src/lib/approval-roles.ts` | 신규 | profile → 기본탭 결정 |
| `src/hooks/useDraftSubmit.ts` | 신규 | 기안 제출 (drafts + contents + steps 순차 INSERT) |
| `src/hooks/useMyDrafts.ts` | 신규 | 내 기안함 목록 (drafter_id = me) |
| `src/hooks/useApprovalInbox.ts` | 신규 | 결재함 (내 차례인 pending steps) |
| `src/hooks/useDraftDetail.ts` | 신규 | 기안 상세 (drafts + body + steps 조인) |
| `src/hooks/useApprovalAction.ts` | 신규 | 승인/반려/보류 처리 |
| `src/components/draft/DraftComposeView.tsx` | 수정 | onSubmit async prop 추가, handleSubmit 비동기화 |
| `src/components/views/DraftView.tsx` | 수정 | onSubmit/onAfterSubmit props 추가 |
| `src/app/(main)/draft/page.tsx` | 수정 | useDraftSubmit 연결, 제출 후 결재함으로 이동 |
| `src/app/(main)/approval/page.tsx` | 수정 | 내 기안함/결재함 이중 탭 구조 |
| `src/components/views/ApprovalDetailView.tsx` | 수정 | onApprove/onConfirmReject/onConfirmHold props 추가 |
| `src/app/(main)/approval/[id]/approval-detail-client.tsx` | 수정 | 실제 id + 두 훅 연결 |

---

### Task 1: 매핑 파일 2개 생성

**Files:**
- Create: `src/lib/approval-approvers.ts`
- Create: `src/lib/approval-roles.ts`

- [ ] **Step 1: approval-approvers.ts 작성**

```ts
// src/lib/approval-approvers.ts
import type { Profile } from "@/types/profile";

// UUID가 "<...>" 형태 placeholder이면 런타임 throw
const PLACEHOLDER = /^<.+>$/;

const POSITION_MAP: Record<string, string | null> = {
  "총무과장": "<h001-uuid>",   // h001@somang.internal — Task 1 완료 후 실제 UUID로 교체
  "이사장":   "<e001-uuid>",   // e001@somang.internal — 위와 동일
  "팀장":     null,
  "부서장":   null,
  "담당":     null,
};

export function getApproverByPosition(position: string): string | null {
  const uuid = POSITION_MAP[position] ?? null;
  if (uuid && PLACEHOLDER.test(uuid)) {
    throw new Error(`결재자 UUID 미설정: ${position} — approval-approvers.ts에 실제 UUID를 입력하세요`);
  }
  return uuid;
}
```

- [ ] **Step 2: UUID placeholder를 실제 값으로 교체 (Supabase 계정 생성 완료 후)**

`<h001-uuid>` 와 `<e001-uuid>` 를 실제 UUID로 교체한다. 예시:
```ts
"총무과장": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
"이사장":   "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
```

- [ ] **Step 3: approval-roles.ts 작성**

```ts
// src/lib/approval-roles.ts
import type { Profile } from "@/types/profile";

export type ApprovalTab = "my-drafts" | "inbox";

export function getDefaultApprovalTab(profile: Profile): ApprovalTab {
  if (profile.is_super_admin || profile.is_global_viewer) return "inbox";
  return "my-drafts";
}

export function shouldHideMyDraftsTab(profile: Profile): boolean {
  return profile.is_super_admin;
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/lib/approval-approvers.ts src/lib/approval-roles.ts
git commit -m "feat: add approval-approvers and approval-roles mapping files"
```

---

### Task 2: useDraftSubmit hook

**Files:**
- Create: `src/hooks/useDraftSubmit.ts`

- [ ] **Step 1: useDraftSubmit.ts 작성**

```ts
// src/hooks/useDraftSubmit.ts
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";
import { getApproverByPosition } from "@/lib/approval-approvers";
import { FORMS, type FormKind } from "@/lib/draft-forms";

export type DraftSubmitData = {
  title: string;
  docType: FormKind;
  body: Record<string, unknown>;
};

export function useDraftSubmit() {
  const { profile } = useAuth();

  async function submit(data: DraftSubmitData): Promise<{ error?: string }> {
    if (!profile) return { error: "로그인이 필요합니다" };

    const supabase = createClient();

    // 1. 결재선 UUID 변환
    const approvalLine = FORMS[data.docType].approvalLine;
    const steps: { uuid: string; orderIndex: number }[] = [];
    let orderIndex = 1;
    for (const step of approvalLine) {
      let uuid: string | null;
      try {
        uuid = getApproverByPosition(step.position);
      } catch (e) {
        return { error: (e as Error).message };
      }
      if (uuid) {
        steps.push({ uuid, orderIndex });
        orderIndex++;
      }
    }

    if (steps.length === 0) {
      return { error: "결재자가 지정되지 않았습니다" };
    }

    // 2. drafts INSERT
    const { data: draft, error: draftError } = await supabase
      .from("drafts")
      .insert({
        corporation_id: profile.corporation_id,
        drafter_id: profile.id,
        title: data.title,
        doc_type: data.docType,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (draftError || !draft) {
      return { error: draftError?.message ?? "기안 생성 실패" };
    }

    // 3. document_contents INSERT
    const { error: contentsError } = await supabase
      .from("document_contents")
      .insert({
        draft_id: draft.id,
        body: data.body,
        attachments: [],
      });

    if (contentsError) return { error: contentsError.message };

    // 4. draft_approval_steps INSERT
    const stepRows = steps.map((s) => ({
      draft_id: draft.id,
      approver_id: s.uuid,
      order_index: s.orderIndex,
      action: "pending",
    }));

    const { error: stepsError } = await supabase
      .from("draft_approval_steps")
      .insert(stepRows);

    if (stepsError) return { error: stepsError.message };

    return {};
  }

  return { submit };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useDraftSubmit.ts
git commit -m "feat: add useDraftSubmit hook"
```

---

### Task 3: useMyDrafts hook

**Files:**
- Create: `src/hooks/useMyDrafts.ts`

- [ ] **Step 1: useMyDrafts.ts 작성**

```ts
// src/hooks/useMyDrafts.ts
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";

export type DraftSummary = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  created_at: string;
};

export function useMyDrafts() {
  const { profile } = useAuth();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("drafts")
      .select("id, title, doc_type, status, created_at")
      .eq("drafter_id", profile.id)
      .order("created_at", { ascending: false });

    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    setDrafts(data ?? []);
  }, [profile?.id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { drafts, loading, error, refetch: fetch };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useMyDrafts.ts
git commit -m "feat: add useMyDrafts hook"
```

---

### Task 4: useApprovalInbox hook

**Files:**
- Create: `src/hooks/useApprovalInbox.ts`

- [ ] **Step 1: useApprovalInbox.ts 작성**

```ts
// src/hooks/useApprovalInbox.ts
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";

export type InboxItem = {
  draftId: string;
  stepId: string;
  title: string;
  drafterName: string;
  drafterDept: string;
  createdAt: string;
};

export function useApprovalInbox() {
  const { profile } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // Step 1: 내 pending steps
    const { data: mySteps, error: e1 } = await supabase
      .from("draft_approval_steps")
      .select("id, draft_id, order_index")
      .eq("approver_id", profile.id)
      .eq("action", "pending");

    if (e1) { setError(e1.message); setLoading(false); return; }
    if (!mySteps || mySteps.length === 0) { setItems([]); setLoading(false); return; }

    // Step 2: draft_id dedupe
    const uniqueDraftIds = [...new Set(mySteps.map((s) => s.draft_id))];

    // Step 3: 해당 drafts의 모든 pending steps
    const { data: allSteps, error: e2 } = await supabase
      .from("draft_approval_steps")
      .select("draft_id, order_index, approver_id")
      .in("draft_id", uniqueDraftIds)
      .eq("action", "pending");

    if (e2) { setError(e2.message); setLoading(false); return; }

    // Step 4: draft별 min pending order_index 계산, 내 차례인 것만 필터
    const minIdx: Record<string, number> = {};
    for (const s of allSteps ?? []) {
      if (minIdx[s.draft_id] === undefined || s.order_index < minIdx[s.draft_id]) {
        minIdx[s.draft_id] = s.order_index;
      }
    }
    const myTurnSteps = mySteps.filter((s) => s.order_index === minIdx[s.draft_id]);

    if (myTurnSteps.length === 0) { setItems([]); setLoading(false); return; }

    // Step 5: draft 헤더 + 기안자 정보 조회
    const myTurnDraftIds = myTurnSteps.map((s) => s.draft_id);
    const { data: drafts, error: e3 } = await supabase
      .from("drafts")
      .select("id, title, created_at, profiles!drafter_id(full_name, department)")
      .in("id", myTurnDraftIds);

    if (e3) { setError(e3.message); setLoading(false); return; }

    const result: InboxItem[] = myTurnSteps.map((step) => {
      const draft = (drafts ?? []).find((d) => d.id === step.draft_id);
      const drafter = draft?.profiles as { full_name: string; department: string } | null;
      return {
        draftId: step.draft_id,
        stepId: step.id,
        title: draft?.title ?? "",
        drafterName: drafter?.full_name ?? "",
        drafterDept: drafter?.department ?? "",
        createdAt: draft?.created_at ?? "",
      };
    });

    setItems(result);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, error, refetch: fetch };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useApprovalInbox.ts
git commit -m "feat: add useApprovalInbox hook with client-side min order_index filter"
```

---

### Task 5: useDraftDetail hook

**Files:**
- Create: `src/hooks/useDraftDetail.ts`

- [ ] **Step 1: useDraftDetail.ts 작성**

```ts
// src/hooks/useDraftDetail.ts
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export type StepDetail = {
  id: string;
  order_index: number;
  approver_id: string;
  approverName: string;
  approverDept: string;
  action: string;
  comment: string | null;
  acted_at: string | null;
};

export type DraftDetail = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  created_at: string;
  drafterName: string;
  drafterDept: string;
  body: Record<string, unknown>;
  steps: StepDetail[];
};

export function useDraftDetail(draftId: string) {
  const [detail, setDetail] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!draftId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: dbError } = await supabase
      .from("drafts")
      .select(`
        id, title, doc_type, status, created_at,
        profiles!drafter_id(full_name, department),
        document_contents(body),
        draft_approval_steps(
          id, order_index, approver_id, action, comment, acted_at,
          profiles!approver_id(full_name, department)
        )
      `)
      .eq("id", draftId)
      .single();

    setLoading(false);
    if (dbError || !data) { setError(dbError?.message ?? "조회 실패"); return; }

    const drafter = data.profiles as { full_name: string; department: string } | null;
    const contents = data.document_contents as { body: Record<string, unknown> } | null;
    const rawSteps = (data.draft_approval_steps as any[]) ?? [];

    setDetail({
      id: data.id,
      title: data.title,
      doc_type: data.doc_type,
      status: data.status,
      created_at: data.created_at,
      drafterName: drafter?.full_name ?? "",
      drafterDept: drafter?.department ?? "",
      body: contents?.body ?? {},
      steps: rawSteps
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((s: any) => {
          const approver = s.profiles as { full_name: string; department: string } | null;
          return {
            id: s.id,
            order_index: s.order_index,
            approver_id: s.approver_id,
            approverName: approver?.full_name ?? "",
            approverDept: approver?.department ?? "",
            action: s.action,
            comment: s.comment ?? null,
            acted_at: s.acted_at ?? null,
          };
        }),
    });
  }, [draftId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { detail, loading, error, refetch: fetch };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useDraftDetail.ts
git commit -m "feat: add useDraftDetail hook"
```

---

### Task 6: useApprovalAction hook

**Files:**
- Create: `src/hooks/useApprovalAction.ts`

- [ ] **Step 1: useApprovalAction.ts 작성**

```ts
// src/hooks/useApprovalAction.ts
import { createClient } from "@/lib/supabase";

export function useApprovalAction() {
  async function approve(stepId: string): Promise<{ error?: string }> {
    const supabase = createClient();
    const { data: step } = await supabase
      .from("draft_approval_steps")
      .select("action")
      .eq("id", stepId)
      .single();

    if (!step || step.action !== "pending") {
      return { error: "이미 처리된 결재입니다" };
    }

    const { error } = await supabase
      .from("draft_approval_steps")
      .update({ action: "approved", acted_at: new Date().toISOString() })
      .eq("id", stepId);

    return error ? { error: error.message } : {};
  }

  async function reject(stepId: string, comment: string): Promise<{ error?: string }> {
    if (!comment.trim()) return { error: "사유를 입력하세요" };

    const supabase = createClient();
    const { data: step } = await supabase
      .from("draft_approval_steps")
      .select("action")
      .eq("id", stepId)
      .single();

    if (!step || step.action !== "pending") {
      return { error: "이미 처리된 결재입니다" };
    }

    const { error } = await supabase
      .from("draft_approval_steps")
      .update({ action: "rejected", comment, acted_at: new Date().toISOString() })
      .eq("id", stepId);

    return error ? { error: error.message } : {};
  }

  async function hold(stepId: string, comment: string): Promise<{ error?: string }> {
    if (!comment.trim()) return { error: "사유를 입력하세요" };

    const supabase = createClient();
    const { data: step } = await supabase
      .from("draft_approval_steps")
      .select("action")
      .eq("id", stepId)
      .single();

    if (!step || step.action !== "pending") {
      return { error: "이미 처리된 결재입니다" };
    }

    const { error } = await supabase
      .from("draft_approval_steps")
      .update({ action: "held", comment, acted_at: new Date().toISOString() })
      .eq("id", stepId);

    return error ? { error: error.message } : {};
  }

  return { approve, reject, hold };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useApprovalAction.ts
git commit -m "feat: add useApprovalAction hook (approve/reject/hold)"
```

---

### Task 7: 기안 제출 연결

**Files:**
- Modify: `src/components/draft/DraftComposeView.tsx`
- Modify: `src/components/views/DraftView.tsx`
- Modify: `src/app/(main)/draft/page.tsx`

- [ ] **Step 1: DraftComposeView.tsx — onSubmit prop 추가 및 handleSubmit 비동기화**

`src/components/draft/DraftComposeView.tsx` 상단에 import 추가:
```ts
import type { DraftSubmitData } from "@/hooks/useDraftSubmit";
```

Props 타입 변경 (`type Props = {` 블록):
```ts
type Props = {
  kind: FormKind;
  onBack: () => void;
  onSubmitted: () => void;
  onSubmit?: (data: DraftSubmitData) => Promise<{ error?: string }>;
  initialStartDate?: string;
  initialEndDate?: string;
};
```

함수 시그니처 변경:
```ts
export function DraftComposeView({ kind, onBack, onSubmitted, onSubmit, initialStartDate, initialEndDate }: Props) {
```

`handleOpenConfirm` 아래, `handleSubmit` 위에 `buildPayload` 함수 추가:
```ts
  const buildPayload = (): DraftSubmitData => {
    const bodyJson: Record<string, unknown> = { formKind: kind };
    if (kind === "vacation") {
      Object.assign(bodyJson, { vacationType: vacType, startDate, endDate, reason: body, contact });
    } else if (kind === "proposal") {
      Object.assign(bodyJson, { coopDept, amount, description: body });
    } else {
      Object.assign(bodyJson, { resignDate, note: body });
    }
    return { title, docType: kind, body: bodyJson };
  };
```

`handleSubmit` 전체 교체:
```ts
  const handleSubmit = async () => {
    setShowConfirm(false);
    if (onSubmit) {
      const result = await onSubmit(buildPayload());
      if (result?.error) {
        alert(result.error);
        return;
      }
    }
    setSubmitted(true);
    setTimeout(() => {
      onSubmitted();
    }, 1400);
  };
```

SubmitConfirmModal의 `onConfirm` prop은 현재 `onConfirm={handleSubmit}` 이다. `handleSubmit`이 async가 됐으므로 타입 호환을 확인한다. SubmitConfirmModal의 `onConfirm` 타입이 `() => void`이면 `() => { void handleSubmit(); }` 로 래핑한다.

SubmitConfirmModal을 읽어서 `onConfirm` prop 타입을 확인한 뒤, 필요하면:
```tsx
onConfirm={() => { void handleSubmit(); }}
```

- [ ] **Step 2: DraftView.tsx — onSubmit/onAfterSubmit props 추가**

`src/components/views/DraftView.tsx` import 추가:
```ts
import type { DraftSubmitData } from "@/hooks/useDraftSubmit";
```

`DraftViewProps` 타입 변경:
```ts
export type DraftViewProps = {
  onBack?: () => void;
  prefill?: DraftPrefill;
  onSubmit?: (data: DraftSubmitData) => Promise<{ error?: string }>;
  onAfterSubmit?: () => void;
};
```

`DraftView` 함수 시그니처 변경:
```ts
export function DraftView({ prefill, onSubmit, onAfterSubmit }: DraftViewProps) {
```

`composeKind` 분기에서 `DraftComposeView` 렌더링 변경:
```tsx
    return (
      <DraftComposeView
        kind={composeKind}
        onBack={() => { setComposeKind(null); setActivePrefill(null); }}
        onSubmitted={() => {
          setComposeKind(null);
          setActivePrefill(null);
          onAfterSubmit?.();
        }}
        onSubmit={onSubmit}
        initialStartDate={activePrefill?.start}
        initialEndDate={activePrefill?.end}
      />
    );
```

- [ ] **Step 3: draft/page.tsx — useDraftSubmit 연결**

`src/app/(main)/draft/page.tsx` 전체 교체:
```tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DraftView } from "@/components/views/DraftView";
import type { DraftPrefill } from "@/components/views/DraftView";
import { useDraftSubmit } from "@/hooks/useDraftSubmit";
import { ROUTES } from "@/lib/routes";

function DraftPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { submit } = useDraftSubmit();

  const form = params.get("form");
  const start = params.get("start") ?? undefined;
  const end   = params.get("end")   ?? undefined;

  const prefill: DraftPrefill | undefined =
    form === "vacation" || form === "proposal" || form === "resignation"
      ? { formKind: form, startDate: start, endDate: end }
      : undefined;

  return (
    <DraftView
      onBack={() => router.push(ROUTES.home)}
      prefill={prefill}
      onSubmit={submit}
      onAfterSubmit={() => router.push(ROUTES.approval)}
    />
  );
}

export default function DraftPage() {
  return (
    <Suspense>
      <DraftPageInner />
    </Suspense>
  );
}
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

에러가 있으면 수정 후 재실행. 주요 확인 사항:
- `DraftSubmitData` import 경로
- `handleSubmit` async 관련 타입 경고

- [ ] **Step 5: 커밋**

```bash
git add src/components/draft/DraftComposeView.tsx src/components/views/DraftView.tsx src/app/(main)/draft/page.tsx
git commit -m "feat: wire DraftComposeView with real DB submit via useDraftSubmit"
```

---

### Task 8: 결재함 목록 연결 (approval/page.tsx)

**Files:**
- Modify: `src/app/(main)/approval/page.tsx`

현재 파일은 `<ApprovalListView onOpenDetail={...} />` 만 렌더링한다.
새 구조: 외부 탭(내 기안함/결재함) + 각 탭의 실제 데이터 렌더링.

- [ ] **Step 1: approval/page.tsx 전체 교체**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMyDrafts } from "@/hooks/useMyDrafts";
import { useApprovalInbox } from "@/hooks/useApprovalInbox";
import { getDefaultApprovalTab, shouldHideMyDraftsTab, type ApprovalTab } from "@/lib/approval-roles";
import { ROUTES } from "@/lib/routes";
import type { Profile } from "@/types/profile";

export default function ApprovalListPage() {
  const { profile } = useAuth();
  if (!profile) return null;
  return <ApprovalListPageContent profile={profile} />;
}

function ApprovalListPageContent({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ApprovalTab>(
    getDefaultApprovalTab(profile)
  );
  const hideMyDrafts = shouldHideMyDraftsTab(profile);

  const { drafts, loading: draftsLoading } = useMyDrafts();
  const { items: inboxItems, loading: inboxLoading } = useApprovalInbox();

  const STATUS_LABEL: Record<string, string> = {
    pending: "대기중",
    in_progress: "진행중",
    approved: "승인",
    held: "보류",
    rejected: "반려",
  };
  const STATUS_COLOR: Record<string, string> = {
    pending: "text-amber-600 bg-amber-50",
    in_progress: "text-blue-600 bg-blue-50",
    approved: "text-emerald-600 bg-emerald-50",
    held: "text-zinc-600 bg-zinc-100",
    rejected: "text-red-600 bg-red-50",
  };

  return (
    <div className="flex flex-col">
      {/* 외부 탭 바 */}
      <div className="sticky top-14 z-20 flex border-b border-zinc-200 bg-white">
        {!hideMyDrafts && (
          <button
            type="button"
            onClick={() => setActiveTab("my-drafts")}
            className="relative flex-1 py-3 text-center active:bg-zinc-50"
          >
            <span className={`text-[0.9375rem] font-semibold ${activeTab === "my-drafts" ? "text-[#3b5bdb]" : "text-zinc-500"}`}>
              내 기안함
            </span>
            {activeTab === "my-drafts" && (
              <span className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-[#3b5bdb]" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("inbox")}
          className="relative flex-1 py-3 text-center active:bg-zinc-50"
        >
          <span className={`text-[0.9375rem] font-semibold ${activeTab === "inbox" ? "text-[#3b5bdb]" : "text-zinc-500"}`}>
            결재함
          </span>
          {activeTab === "inbox" && (
            <span className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-[#3b5bdb]" />
          )}
        </button>
      </div>

      {/* 내 기안함 */}
      {activeTab === "my-drafts" && (
        <div className="px-5 py-4">
          {draftsLoading ? (
            <p className="text-center text-sm text-zinc-400 py-12">불러오는 중...</p>
          ) : drafts.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-12">제출한 기안이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => router.push(`${ROUTES.approval}/${d.id}`)}
                  className="block w-full rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[1rem] font-bold text-zinc-900">{d.title}</h3>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[0.6875rem] font-bold ${STATUS_COLOR[d.status] ?? "text-zinc-500 bg-zinc-100"}`}>
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{d.created_at.slice(0, 10)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 결재함 */}
      {activeTab === "inbox" && (
        <div className="px-5 py-4">
          {inboxLoading ? (
            <p className="text-center text-sm text-zinc-400 py-12">불러오는 중...</p>
          ) : inboxItems.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-12">결재할 문서가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {inboxItems.map((item) => (
                <button
                  key={item.stepId}
                  type="button"
                  onClick={() => router.push(`${ROUTES.approval}/${item.draftId}`)}
                  className="block w-full rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-[0.98]"
                >
                  <h3 className="text-[1rem] font-bold text-zinc-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{item.drafterName} · {item.drafterDept}</p>
                  <p className="mt-1 text-xs text-zinc-400">{item.createdAt.slice(0, 10)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/(main)/approval/page.tsx
git commit -m "feat: add dual-tab approval page (내 기안함/결재함) with real DB data"
```

---

### Task 9: 결재 처리 연결

**Files:**
- Modify: `src/components/views/ApprovalDetailView.tsx`
- Modify: `src/app/(main)/approval/[id]/approval-detail-client.tsx`

- [ ] **Step 1: ApprovalDetailView.tsx — 액션 props 추가**

`ApprovalDetailViewProps` 타입에 3개 prop 추가:
```ts
export type ApprovalDetailViewProps = {
  // ... 기존 props 유지 ...
  onApprove?: () => void;
  onConfirmReject?: () => void;
  onConfirmHold?: () => void;
};
```

함수 시그니처에서 destructuring에 3개 추가:
```ts
export function ApprovalDetailView({
  // ... 기존 ...
  onApprove,
  onConfirmReject,
  onConfirmHold,
}: ApprovalDetailViewProps) {
```

승인 버튼에 onClick 추가 (현재 onClick 없음):
```tsx
<button
  type="button"
  onClick={onApprove}
  className="flex-1 cursor-pointer rounded-xl border-none bg-emerald-500 py-3.5 text-base font-bold text-white transition-transform active:scale-95"
>
  승인
</button>
```

반려 확인 버튼에 onClick 추가 (현재 onClick 없음, showRejectModal 블록 내):
```tsx
<button
  type="button"
  onClick={onConfirmReject}
  className="flex-1 cursor-pointer rounded-xl border-none bg-red-500 py-3 text-base font-bold text-white"
>
  확인
</button>
```

보류 확인 버튼에 onClick 추가 (현재 onClick 없음, showHoldModal 블록 내):
```tsx
<button
  type="button"
  onClick={onConfirmHold}
  className="flex-1 cursor-pointer rounded-xl border-none bg-amber-500 py-3 text-base font-bold text-white"
>
  확인
</button>
```

- [ ] **Step 2: approval-detail-client.tsx — 실제 id + 훅 연결**

`src/app/(main)/approval/[id]/approval-detail-client.tsx` 전체 교체:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApprovalDetailView } from "@/components/views/ApprovalDetailView";
import { useAuth } from "@/context/AuthContext";
import { useDraftDetail } from "@/hooks/useDraftDetail";
import { useApprovalAction } from "@/hooks/useApprovalAction";
import { ROUTES } from "@/lib/routes";
import type { ApprovalDetailTab } from "@/types/navigation";

export function ApprovalDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const { detail, loading, refetch } = useDraftDetail(id);
  const { approve, reject, hold } = useApprovalAction();

  const [activeTab, setActiveTab] = useState<ApprovalDetailTab>("summary");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [holdReason, setHoldReason] = useState("");

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-zinc-400">불러오는 중...</div>;
  if (!detail) return <div className="flex items-center justify-center py-20 text-sm text-zinc-400">문서를 찾을 수 없습니다</div>;

  // 현재 로그인 사용자의 pending step (없으면 결재 버튼 숨김)
  const myStep = profile
    ? detail.steps.find((s) => s.approver_id === profile.id && s.action === "pending")
    : null;

  const handleApprove = async () => {
    if (!myStep) return;
    const result = await approve(myStep.id);
    if (result.error) { alert(result.error); return; }
    await refetch();
    router.push(ROUTES.approval);
  };

  const handleConfirmReject = async () => {
    if (!myStep) return;
    const result = await reject(myStep.id, rejectReason);
    if (result.error) { alert(result.error); return; }
    setShowRejectModal(false);
    setRejectReason("");
    await refetch();
    router.push(ROUTES.approval);
  };

  const handleConfirmHold = async () => {
    if (!myStep) return;
    const result = await hold(myStep.id, holdReason);
    if (result.error) { alert(result.error); return; }
    setShowHoldModal(false);
    setHoldReason("");
    await refetch();
    router.push(ROUTES.approval);
  };

  // docStatus: 현재 문서 상태를 ApprovalDetailView의 기대값으로 매핑
  const docStatus: "pending" | "approved" | "rejected" =
    detail.status === "approved" ? "approved"
    : detail.status === "rejected" ? "rejected"
    : "pending";

  return (
    <ApprovalDetailView
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      showRejectModal={showRejectModal}
      showHoldModal={showHoldModal}
      rejectReason={rejectReason}
      holdReason={holdReason}
      onRejectReasonChange={setRejectReason}
      onHoldReasonChange={setHoldReason}
      onOpenRejectModal={() => setShowRejectModal(true)}
      onCloseRejectModal={() => setShowRejectModal(false)}
      onOpenHoldModal={() => setShowHoldModal(true)}
      onCloseHoldModal={() => setShowHoldModal(false)}
      onBack={() => router.push(ROUTES.approval)}
      docStatus={myStep ? "pending" : docStatus}
      onApprove={myStep ? handleApprove : undefined}
      onConfirmReject={myStep ? handleConfirmReject : undefined}
      onConfirmHold={myStep ? handleConfirmHold : undefined}
    />
  );
}
```

참고: `myStep`이 없으면 결재 버튼이 표시되지 않도록 `docStatus`를 실제 status로 전달한다.
`docStatus === "pending"`일 때만 승인/반려/보류 버튼이 표시되는데, 내 차례가 아니면 `docStatus`를 실제 status로 전달하여 버튼을 숨긴다.

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/views/ApprovalDetailView.tsx src/app/(main)/approval/[id]/approval-detail-client.tsx
git commit -m "feat: wire approval-detail-client with real DB (useDraftDetail + useApprovalAction)"
```

---

### Task 10: 수동 검증 시나리오

**전제:** Task 1 Step 2에서 h001/e001 UUID가 실제 값으로 교체되어 있어야 한다.

- [ ] **Step 1: n001(윤민주)으로 연차 신청서 제출**

1. n001@somang.internal 로그인
2. 기안 메뉴 → 연차 신청서
3. 제목, 기간, 사유, 연락처 입력 → 상신하기
4. 확인: 결재함(내 기안함)에 `status: 대기중` 항목 표시
5. Supabase Table Editor → drafts, document_contents, draft_approval_steps 행 확인

- [ ] **Step 2: h001(한기석)으로 1차 승인**

1. h001@somang.internal 로그인
2. 결재 메뉴 → 결재함 탭에 윤민주 연차신청서 표시 확인
3. 항목 클릭 → 승인 버튼 클릭
4. 확인: steps[order_index=1].action = approved, drafts.status = in_progress

- [ ] **Step 3: e001(이강표)으로 최종 승인**

1. e001@somang.internal 로그인
2. 결재 메뉴 → 결재함에 윤민주 연차신청서 표시 확인
3. 승인 버튼 클릭
4. 확인: steps[order_index=2].action = approved, drafts.status = approved

- [ ] **Step 4: n001 기안함에서 최종 상태 확인**

1. n001으로 재로그인
2. 결재 메뉴 → 내 기안함 → `status: 승인` 표시 확인

- [ ] **Step 5: 반려 플로우 테스트**

1. 새 기안 제출
2. h001으로 로그인 → 결재함 → 반려 버튼 → 사유 없이 확인 → 에러 메시지 표시 확인
3. 사유 입력 후 확인 → drafts.status = rejected 확인

- [ ] **Step 6: 보류 플로우 테스트**

1. 새 기안 제출
2. h001으로 로그인 → 결재함 → 보류 버튼 → 사유 없이 확인 → 에러 메시지 표시 확인
3. 사유 입력 후 확인 → drafts.status = held 확인

---

*계획 작성일: 2026-04-26*
