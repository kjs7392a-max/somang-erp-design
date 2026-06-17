# 결재 상세 화면 body 데이터 실제 렌더링 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ApprovalDetailView`의 모든 하드코딩 데이터를 제거하고 `useDraftDetail`에서 반환하는 실제 DB 데이터로 대체한다.

**Architecture:** `useDraftDetail`에 `drafterPosition`/`approverPosition` 필드를 추가한 뒤, `ApprovalDetailView`에 `draft: DraftDetail` prop을 추가해 헤더·요약탭·원문탭·PDF 스탬프를 동적으로 렌더링한다. `approval-detail-client.tsx`에서 `detail`을 `draft` prop으로 주입한다. 지원하지 않는 `formKind`는 "준비 중" fallback 카드로 처리한다. DB 변경 없음.

**Tech Stack:** Next.js 16 App Router, Supabase, TypeScript, Tailwind CSS

---

### Task 1: `useDraftDetail` — position 필드 추가

**Files:**
- Modify: `src/hooks/useDraftDetail.ts`

- [ ] **Step 1: `StepDetail`에 `approverPosition`, `DraftDetail`에 `drafterPosition` 추가**

```ts
// src/hooks/useDraftDetail.ts — type 섹션 전체 교체
export type StepDetail = {
  id: string;
  order_index: number;
  approver_id: string;
  approverName: string;
  approverDept: string;
  approverPosition: string;   // 추가
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
  drafterPosition: string;    // 추가
  body: Record<string, unknown>;
  steps: StepDetail[];
};
```

- [ ] **Step 2: Supabase select 쿼리에 `position` 추가**

`profiles!drafter_id` 및 `profiles!approver_id` 양쪽에 `position` 추가:

```ts
// 기존:  profiles!drafter_id(full_name, department),
// 변경:
profiles!drafter_id(full_name, department, position),

// 기존:  profiles!approver_id(full_name, department)
// 변경:
profiles!approver_id(full_name, department, position)
```

- [ ] **Step 3: `setDetail` 매핑에 position 추가**

```ts
// drafter cast 타입에 position 추가
const drafter = data.profiles as unknown as {
  full_name: string; department: string; position: string;
} | null;

// DraftDetail 매핑에 아래 추가
drafterPosition: drafter?.position ?? "",

// steps map 내 approver cast 타입에 position 추가
const approver = s.profiles as {
  full_name: string; department: string; position: string;
} | null;
// step 객체에 아래 추가
approverPosition: approver?.position ?? "",
```

- [ ] **Step 4: TypeScript 확인**

Run: `npx tsc --noEmit`  
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useDraftDetail.ts
git commit -m "feat: add drafterPosition and approverPosition to useDraftDetail"
```

---

### Task 2: `ApprovalDetailView` 전면 교체 + client 주입

**Files:**
- Modify: `src/components/views/ApprovalDetailView.tsx`
- Modify: `src/app/(main)/approval/[id]/approval-detail-client.tsx`

- [ ] **Step 1: imports 추가, `draft: DraftDetail` prop 추가**

파일 상단 imports 수정:
```ts
import type { DraftDetail } from "@/hooks/useDraftDetail";
import { VACATION_TYPES } from "@/lib/draft-forms";
```

`ApprovalDetailViewProps` 앞에 `draft: DraftDetail` 추가:
```ts
export type ApprovalDetailViewProps = {
  draft: DraftDetail;
  activeTab: ApprovalDetailTab;
  // ... 나머지 기존 props 유지
};
```

함수 시그니처 첫 번째 인수에 `draft,` 추가:
```ts
export function ApprovalDetailView({
  draft,
  activeTab,
  // ... 나머지 기존 구조분해 유지
}: ApprovalDetailViewProps) {
```

- [ ] **Step 2: 모듈 레벨 상수·헬퍼 추가 (컴포넌트 바깥)**

파일 맨 위 (컴포넌트 함수 바깥)에 아래 추가:

```ts
const ACTION_STYLE: Record<string, { textCls: string; label: string; numBg: string }> = {
  pending: { textCls: "text-amber-500", label: "대기중", numBg: "bg-amber-500" },
  approve: { textCls: "text-green-600", label: "승인",   numBg: "bg-green-500" },
  reject:  { textCls: "text-red-500",   label: "반려",   numBg: "bg-red-500"   },
  hold:    { textCls: "text-gray-400",  label: "보류",   numBg: "bg-gray-300"  },
};

function toKoreanDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${y}년 ${m}월 ${day}일`;
}

function VacationBodySection({ body }: { body: Record<string, unknown> }) {
  const vacationLabel =
    VACATION_TYPES.find((t) => t.value === body.vacationType)?.label ??
    String(body.vacationType ?? "");
  const rows = [
    { label: "휴가 종류",   value: vacationLabel },
    { label: "기간",        value: `${body.startDate ?? ""} ~ ${body.endDate ?? ""}` },
    { label: "사유",        value: String(body.reason ?? "") },
    { label: "비상연락처",  value: String(body.contact ?? "") },
  ];
  return (
    <>
      {rows.map(({ label, value }, i, arr) => (
        <div key={label} className={`flex py-2 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
          <span className="w-[90px] flex-shrink-0 text-sm text-[#666]">{label}</span>
          <span className="text-[0.9375rem] font-semibold text-[#333]">{value}</span>
        </div>
      ))}
    </>
  );
}

function VacationOriginalSection({ draft }: { draft: DraftDetail }) {
  const { body, steps } = draft;
  const start = String(body.startDate ?? "");
  const end   = String(body.endDate   ?? "");
  const dayCount = start && end
    ? `(${Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1}일)`
    : "";
  const periodStr = start && end
    ? `${toKoreanDate(start)} ~ ${toKoreanDate(end)} ${dayCount}`
    : "";
  const detailRows = [
    { label: "소속",       value: draft.drafterDept },
    { label: "성명",       value: draft.drafterName },
    { label: "직책",       value: draft.drafterPosition },
    { label: "기간",       value: periodStr },
    { label: "사유",       value: String(body.reason ?? "") },
    { label: "비상연락처", value: String(body.contact ?? "") },
  ];
  return (
    <>
      <h3 className="mb-6 border-b-2 border-[#333] pb-4 text-center text-xl font-bold text-[#1a1a1a]">
        연 차 신 청 서
      </h3>
      <table className="mb-6 w-full border-collapse border border-[#ddd] text-[0.8125rem]">
        <tbody>
          <tr>
            {steps.map((s) => (
              <td key={s.id} className="w-20 border border-[#ddd] bg-[#f8f9fa] p-2 text-center font-semibold">
                {s.approverPosition || s.approverDept}
              </td>
            ))}
          </tr>
          <tr>
            {steps.map((s) => (
              <td key={s.id} className="h-[60px] border border-[#ddd] p-2" />
            ))}
          </tr>
        </tbody>
      </table>
      <table className="w-full border-collapse border border-[#ddd] text-sm">
        <tbody>
          {detailRows.map(({ label, value }) => (
            <tr key={label}>
              <td className="w-[100px] border border-[#ddd] bg-[#f8f9fa] p-2.5 font-semibold">{label}</td>
              <td className="border border-[#ddd] p-2.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 text-center text-sm text-[#666]">
        <p>위와 같이 연차를 신청하오니 승인하여 주시기 바랍니다.</p>
        <p className="mt-8">{toKoreanDate(draft.created_at.slice(0, 10))}</p>
        <p className="mt-4 font-semibold">신청자: {draft.drafterName} (인)</p>
      </div>
    </>
  );
}
```

- [ ] **Step 3: 헤더 카드 교체**

기존 하드코딩 3줄 (`연차 신청서` h2, `윤민주 간호사` span, `작성일: 2026-04-15`) 을 아래로 교체:

```tsx
<h2 className="mb-3 text-xl font-bold text-[#1a1a1a]">{draft.title}</h2>
<div className="flex items-center gap-2">
  <span className="text-[0.9375rem] font-semibold text-[#333]">
    {draft.drafterName} {draft.drafterPosition}
  </span>
  <div className="h-3 w-px bg-[#ddd]" />
  <span className="text-sm text-[#666]">{draft.drafterDept}</span>
</div>
<div className="mt-1.5 text-[0.8125rem] text-[#999]">
  작성일: {draft.created_at.slice(0, 10)}
</div>
```

- [ ] **Step 4: summary 탭 — 문서 내용 카드 교체**

기존 `[{ label: "휴가 종류", value: "연차" }, ...]` 하드코딩 배열 전체 (`.map(...)` 포함)를 아래로 교체:

```tsx
{draft.doc_type === "vacation" ? (
  <VacationBodySection body={draft.body} />
) : (
  <p className="text-sm text-[#999]">이 양식의 미리보기는 준비 중입니다.</p>
)}
```

- [ ] **Step 5: summary 탭 — 결재선 카드 교체**

기존 하드코딩 두 개의 step div (한기석, 이강표)를 아래로 교체:

```tsx
{(() => {
  const firstPendingIdx = draft.steps.findIndex((s) => s.action === "pending");
  return draft.steps.map((step, i) => {
    const isActivePending = step.action === "pending" && i === firstPendingIdx;
    const style = ACTION_STYLE[step.action] ?? ACTION_STYLE.pending;
    return (
      <div
        key={step.id}
        className={`flex items-center justify-between rounded-lg px-3 py-2 ${
          isActivePending ? "bg-amber-100" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${style.numBg}`}>
            {i + 1}
          </div>
          <div>
            <div className="text-[0.9375rem] font-semibold text-[#333]">
              {step.approverName} {step.approverPosition}
            </div>
            <div className="text-xs text-[#999]">{step.approverDept}</div>
          </div>
        </div>
        <div className={`rounded-xl px-3 py-1 text-xs font-semibold ${
          isActivePending
            ? "bg-white text-amber-500"
            : `bg-gray-100 ${style.textCls}`
        }`}>
          {style.label}
        </div>
      </div>
    );
  });
})()}
```

- [ ] **Step 6: original 탭 교체**

기존 original 탭 내부 전체 (헤더~서명 부분)를 아래로 교체:

```tsx
{draft.doc_type === "vacation" ? (
  <VacationOriginalSection draft={draft} />
) : (
  <p className="py-8 text-center text-sm text-[#999]">
    원문 보기는 준비 중입니다.
  </p>
)}
```

- [ ] **Step 7: PDF 스탬프 stages 실제 데이터로 교체**

컴포넌트 함수 상단 (`const [showPdf, setShowPdf] = useState(false)` 직후)에 추가:

```ts
const pdfStages = draft.steps.map((s) => ({
  title: s.approverPosition || s.approverDept,
  name:  s.approverName,
  acted: s.action !== "pending",
  action: (s.action === "approve" ? "approve"
         : s.action === "reject"  ? "reject"
         : undefined) as "approve" | "reject" | undefined,
}));
```

기존 하드코딩 `PdfPreviewSheet` props 교체:

```tsx
{showPdf && (
  <PdfPreviewSheet
    docId={draft.id}
    kind={draft.doc_type as "vacation" | "proposal" | "resignation"}
    status={docStatus as "approved" | "rejected"}
    stages={pdfStages}
    onClose={() => setShowPdf(false)}
  />
)}
```

- [ ] **Step 8: `approval-detail-client.tsx` — `draft={detail}` 주입**

`approval-detail-client.tsx`에서 `<ApprovalDetailView>` 에 `draft={detail}` prop 추가:

```tsx
<ApprovalDetailView
  draft={detail}      // 추가
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
  docStatus={docStatus}
  onApprove={myStep ? handleApprove : undefined}
  onConfirmReject={myStep ? handleConfirmReject : undefined}
  onConfirmHold={myStep ? handleConfirmHold : undefined}
/>
```

- [ ] **Step 9: TypeScript 확인**

Run: `npx tsc --noEmit`  
Expected: 오류 없음

- [ ] **Step 10: 커밋**

```bash
git add src/components/views/ApprovalDetailView.tsx src/app/\(main\)/approval/\[id\]/approval-detail-client.tsx
git commit -m "feat: render real DraftDetail data in ApprovalDetailView, remove all hardcoding"
```
