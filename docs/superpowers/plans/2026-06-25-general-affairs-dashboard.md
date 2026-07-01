# 총무과대시보드 (General Affairs Dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 간호(병동)대시보드와 동일한 UI/디자인의 총무과 전용 대시보드를 SOMANG ERP에 `/general` 라우트로 추가한다. 핵심 기능은 전직원 현황·휴가관리·전자결재(휴가↔결재 연동).

**Architecture:** 기존 `ward-dashboard`를 본떠 독립적인 `general-dashboard` 기능 폴더를 만든다. 디자인 시스템(`shared/ui/WardUI`)과 전자결재(`features/approval`) 컴포넌트는 그대로 재사용한다. `DraftPage`만 양식/결재자를 props로 받도록 일반화하여 간호·총무 양쪽에서 쓴다. 모든 데이터는 더미이며 상태는 클라이언트(useState)에서 관리한다.

**Tech Stack:** Next.js 16.2.4 (App Router), React 19.2.4, TypeScript, 인라인 CSS(Tailwind/styled-components 미사용), Supabase(이번 작업에선 미사용).

## Global Constraints

- **인라인 CSS만 사용** — Tailwind 클래스/styled-components 금지. 기존 코드처럼 `style={{...}}`와 `@/shared/ui/WardUI`의 `C` 토큰을 쓴다.
- **`WardUI.tsx`는 수정 금지** — 디자인 토큰/컴포넌트를 그대로 import해서 사용한다.
- **`ward-dashboard`는 명시된 곳 외 수정 금지** — 본 계획에서 수정하는 ward 파일은 `ward-dashboard/types.ts`(재-export), `ward-dashboard/data.ts`(DOC_FORMS 이동), `components/WardApp.tsx`(DraftPage props 전달) 세 곳뿐. 그 외 회귀 금지.
- **클라이언트 컴포넌트**: 상호작용/`useState`를 쓰는 모든 컴포넌트 파일 최상단에 `"use client";`.
- **localStorage 키 접두사 `gd_`** — 간호의 `nd_*`와 절대 충돌 금지.
- **Next.js 16 주의 (AGENTS.md)**: 라우팅/메타데이터 코드 작성 전 `node_modules/next/dist/docs/`의 관련 문서를 확인한다. 이 버전은 관례가 다를 수 있다. (단, 본 계획의 라우트는 기존 `app/ward/{layout,page}.tsx`와 동일 패턴이므로 그 패턴을 따른다.)
- **테스트 인프라 없음**: 프로젝트에 test runner/스크립트가 없고 산출물이 시각적 UI이므로, 각 태스크 검증은 **`npm run build`(타입체크·컴파일) 통과 + 개발 서버 시각 확인**으로 한다. 테스트 프레임워크는 도입하지 않는다(요청 범위 밖). 비즈니스 로직(KPI 계산·휴가↔결재 연동)은 순수 함수로 분리하고, 빌드 통과 + 명시된 수동 확인 절차로 검증한다.
- **빌드 명령**: 작업 디렉터리 `C:/dev/SOMANG ERP`에서 `npm run build`. 개발 서버는 `npm run dev`(포트 3000), 확인 URL `http://localhost:3000/general`.
- **경로 별칭**: `@/` = `src/`.

## File Structure

```
src/
├── app/general/
│   ├── layout.tsx                      [Task 11] 메타데이터
│   └── page.tsx                        [Task 11] GeneralApp 렌더
├── features/
│   ├── approval/
│   │   ├── types.ts                    [Task 1] (신규) 전자결재 공용 타입
│   │   └── components/DraftPage.tsx    [Task 2] (수정) forms/approvers props화
│   ├── ward-dashboard/
│   │   ├── types.ts                    [Task 1] (수정) approval 타입 재-export
│   │   ├── data.ts                     [Task 2] (수정) DOC_FORMS 추가
│   │   └── components/WardApp.tsx      [Task 2] (수정) DraftPage에 props 전달
│   └── general-dashboard/
│       ├── types.ts                    [Task 3]
│       ├── data.ts                     [Task 4]
│       └── components/
│           ├── GeneralSidebar.tsx      [Task 5]
│           ├── GeneralTopbar.tsx       [Task 6]
│           ├── GeneralApp.tsx          [Task 10]
│           └── tabs/
│               ├── TabStatus.tsx       [Task 7]
│               ├── TabStaff.tsx        [Task 8]
│               └── TabLeave.tsx        [Task 9]
└── shared/ui/WardUI.tsx                (재사용, 수정 금지)
```

---

## Task 1: 전자결재 공용 타입 추출

전자결재 타입을 `features/approval/types.ts`로 옮기고(소유권 정리), `ward-dashboard/types.ts`는 그 타입을 재-export하여 기존 import가 깨지지 않게 한다. 양식/결재자 타입(`DocForm`, `Approvers`)을 신규 추가한다.

**Files:**
- Create: `src/features/approval/types.ts`
- Modify: `src/features/ward-dashboard/types.ts`

**Interfaces:**
- Produces: `ApprovalDoc`, `ApprovalStep`, `ApprovalStepStatus`, `ApprovalDocStatus`, `ApprovalStepKind`, `DocBox`, `DocForm`, `Approvers` (from `@/features/approval/types`). `ward-dashboard/types`는 동일 이름들을 재-export하여 기존 소비자(`ApprovalPage`, `DraftPage`, `WardApp`)가 그대로 동작.

- [ ] **Step 1: `features/approval/types.ts` 생성**

```typescript
// src/features/approval/types.ts
export type ApprovalStepStatus = "승인" | "결재중" | "대기" | "반려";
export type ApprovalDocStatus = "결재대기" | "진행중" | "완료" | "반려";
export type ApprovalStepKind = "기안" | "검토" | "결재";
export type DocBox = "received" | "sent";

export interface ApprovalStep {
  name: string;
  role: string;
  kind: ApprovalStepKind;
  status: ApprovalStepStatus;
  at: string | null;
  me?: boolean;
  memo?: string;
}

export interface ApprovalDoc {
  id: string;
  box: DocBox;
  form: string;
  title: string;
  drafter: { name: string; role: string };
  date: string;
  status: ApprovalDocStatus;
  body: [string, string][];
  line: ApprovalStep[];
}

/** 기안 작성 양식 정의 (DraftPage가 props로 받음) */
export interface DocForm {
  id: string;
  label: string;
  icon: string;       // WardIcons 키 (예: "calendar")
  fields: string[];
}

/** 결재선 검토·결재자 (DraftPage가 props로 받음) */
export interface Approvers {
  head: { name: string; role: string };  // 검토
  exec: { name: string; role: string };  // 결재
}
```

- [ ] **Step 2: `ward-dashboard/types.ts`에서 전자결재 타입 정의를 재-export로 교체**

`src/features/ward-dashboard/types.ts`의 라인 81~106(전자결재 타입 블록: `ApprovalStepStatus`부터 `ApprovalDoc` 인터페이스까지)을 아래로 교체한다. 파일의 나머지(`WardInfo`, `WardAccount`, `Patient`, `Leave`, `Exam`, `ShiftRow`, `Staff`, `WardRoute`, `WardTab` 등)는 그대로 둔다.

교체 전(삭제 대상):
```typescript
export type ApprovalStepStatus = "승인" | "결재중" | "대기" | "반려";
export type ApprovalDocStatus = "결재대기" | "진행중" | "완료" | "반려";
export type ApprovalStepKind = "기안" | "검토" | "결재";
export type DocBox = "received" | "sent";

export interface ApprovalStep {
  name: string;
  role: string;
  kind: ApprovalStepKind;
  status: ApprovalStepStatus;
  at: string | null;
  me?: boolean;
  memo?: string;
}

export interface ApprovalDoc {
  id: string;
  box: DocBox;
  form: string;
  title: string;
  drafter: { name: string; role: string };
  date: string;
  status: ApprovalDocStatus;
  body: [string, string][];
  line: ApprovalStep[];
}
```

교체 후:
```typescript
export type {
  ApprovalStepStatus, ApprovalDocStatus, ApprovalStepKind, DocBox,
  ApprovalStep, ApprovalDoc, DocForm, Approvers,
} from "@/features/approval/types";
```

- [ ] **Step 3: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공(타입 에러 없음). `ApprovalPage`/`DraftPage`/`WardApp`이 `@/features/ward-dashboard/types`에서 import하는 `ApprovalDoc` 등이 재-export로 정상 해석됨.

- [ ] **Step 4: 커밋**

```bash
git add src/features/approval/types.ts src/features/ward-dashboard/types.ts
git commit -m "refactor: 전자결재 타입을 approval 기능으로 추출 + DocForm/Approvers 추가"
```

---

## Task 2: DraftPage 일반화 (forms/approvers props화)

`DraftPage`가 내부에 하드코딩한 `DOC_FORMS`와 `APPROVERS`를 props로 받게 한다. 간호 양식 배열은 `ward-dashboard/data.ts`로 옮기고, `WardApp`이 기존과 동일한 값을 전달하여 간호 동작은 변하지 않는다.

**Files:**
- Modify: `src/features/approval/components/DraftPage.tsx`
- Modify: `src/features/ward-dashboard/data.ts`
- Modify: `src/features/ward-dashboard/components/WardApp.tsx`

**Interfaces:**
- Consumes: `DocForm`, `Approvers` (Task 1).
- Produces: `DraftPage` props가 `{ docs, onSubmit, setOpenId, openId, compose, setCompose, forms: DocForm[], approvers: Approvers }`로 확장됨. `ward-dashboard/data.ts`가 `DOC_FORMS: DocForm[]` export.

- [ ] **Step 1: 간호 양식 배열을 `ward-dashboard/data.ts`로 이동**

`src/features/ward-dashboard/data.ts` 상단 import에 `DocForm`를 추가하고(기존 `import type { ... } from "./types";` 목록에 `DocForm` 추가), 파일 끝(마지막 `computeKpi` 함수 뒤)에 아래를 추가한다.

```typescript
export const DOC_FORMS: DocForm[] = [
  { id: "annual", label: "연차 휴가 신청서", icon: "calendar", fields: ["기간", "사유"] },
  { id: "half", label: "반차 신청서", icon: "clock", fields: ["일자", "구분", "사유"] },
  { id: "shift", label: "근무 변경 신청서", icon: "table", fields: ["대상일", "변경 내용", "사유"] },
  { id: "leave", label: "외박·외출 특별 승인 요청", icon: "door", fields: ["환자", "기간", "사유"] },
  { id: "purchase", label: "물품 구매 요청서", icon: "building", fields: ["품목", "수량", "사유"] },
  { id: "report", label: "특이사항 보고서", icon: "file", fields: ["발생일시", "내용"] },
];
```

- [ ] **Step 2: `DraftPage.tsx`를 props 기반으로 수정**

`src/features/approval/components/DraftPage.tsx`를 아래 내용으로 교체한다. 변경점: ① `APPROVERS, TODAY` import 제거, `DocForm, Approvers` 타입 import 추가 ② 모듈 상수 `DOC_FORMS` 제거 ③ Props에 `forms`, `approvers` 추가 ④ 내부에서 `DOC_FORMS`→`forms`, `APPROVERS`→`approvers` 참조 ⑤ 아이콘 접근을 안전 캐스팅으로.

```tsx
"use client";

import React, { useState } from "react";
import { C, FONT, MONO, WardCard, WardBadge, WardBtn, WardModal, WardIcons, fmtDot } from "@/shared/ui/WardUI";
import type { ApprovalDoc, ApprovalDocStatus, DocForm, Approvers } from "@/features/approval/types";

interface Props {
  docs: ApprovalDoc[];
  onSubmit: (data: { form: string; title: string; content: string }) => void;
  setOpenId: (id: string | null) => void;
  openId: string | null;
  compose: { open: boolean; form?: string };
  setCompose: (c: { open: boolean; form?: string }) => void;
  forms: DocForm[];
  approvers: Approvers;
}

const STATUS_TONE: Record<ApprovalDocStatus, "warn" | "info" | "ok" | "danger"> = {
  결재대기: "warn", 진행중: "info", 완료: "ok", 반려: "danger",
};

function ic(name: string, size: number, color: string) {
  const fn = WardIcons[name as keyof typeof WardIcons] || WardIcons.file;
  return fn(size, color);
}

function ComposeModal({ initialForm, forms, approvers, onClose, onSubmit }: {
  initialForm?: string; forms: DocForm[]; approvers: Approvers;
  onClose: () => void; onSubmit: (data: { form: string; title: string; content: string }) => void;
}) {
  const [selectedForm, setSelectedForm] = useState(initialForm || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [step, setStep] = useState<"pick" | "write">(initialForm ? "write" : "pick");
  const form = forms.find((f) => f.id === selectedForm);

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
    fontSize: 13, fontFamily: FONT, color: C.ink, background: C.bg, outline: "none", boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>기안 작성</div>
        <span onClick={onClose} style={{ cursor: "pointer", color: C.textFaint }}>{WardIcons.close(20, C.textFaint)}</span>
      </div>

      {step === "pick" && (
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>결재 양식을 선택하세요</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {forms.map((f) => (
              <div key={f.id} onClick={() => { setSelectedForm(f.id); setStep("write"); }}
                style={{ padding: "16px 14px", borderRadius: 10, border: `1px solid ${C.border}`, cursor: "pointer", textAlign: "center", transition: "all 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.background = C.primarySoft; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  {ic(f.icon, 24, C.primaryDeep)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "write" && form && (
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "10px 14px", borderRadius: 9, background: C.primarySoft, display: "flex", alignItems: "center", gap: 9 }}>
            {ic(form.icon, 16, C.primaryDeep)}
            <span style={{ fontSize: 13, fontWeight: 700, color: C.primaryDeep }}>{form.label}</span>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>제목</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${form.label} 제목 입력`} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>
              내용 <span style={{ color: C.textFaint }}>— 필드: {form.fields.join(", ")}</span>
            </label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
              placeholder={form.fields.map((f) => `${f}: `).join("\n")}
              style={{ ...inp, resize: "vertical" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>결재선</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {[
                { name: "나", role: "기안자", kind: "기안", me: true },
                { name: approvers.head.name, role: approvers.head.role, kind: "검토" },
                { name: approvers.exec.name, role: approvers.exec.role, kind: "결재" },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div style={{ width: 20, height: 1, background: C.border }} />}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.me ? C.primaryDeep : C.chipBg, color: s.me ? "#fff" : C.textMuted, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px" }}>{s.name.slice(0, 1)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textDark }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: C.textFaint }}>{s.kind}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 9, justifyContent: "flex-end" }}>
        {step === "write" && (
          <>
            <WardBtn variant="ghost" onClick={() => setStep("pick")}>← 양식 변경</WardBtn>
            <WardBtn variant="primary" icon={WardIcons.send(16, "#fff")} onClick={() => {
              if (!title.trim()) return;
              onSubmit({ form: selectedForm, title: title.trim(), content });
            }}>상신</WardBtn>
          </>
        )}
        {step === "pick" && <WardBtn variant="ghost" onClick={onClose}>취소</WardBtn>}
      </div>
    </div>
  );
}

function DocViewModal({ doc, onClose }: { doc: ApprovalDoc; onClose: () => void }) {
  return (
    <div>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontFamily: MONO, color: C.textMuted }}>{doc.id}</span>
            <WardBadge tone={STATUS_TONE[doc.status]}>{doc.status}</WardBadge>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{doc.title}</div>
        </div>
        <span onClick={onClose} style={{ cursor: "pointer", color: C.textFaint }}>{WardIcons.close(20, C.textFaint)}</span>
      </div>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ borderRadius: 9, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {doc.body.map(([label, value], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", borderBottom: i < doc.body.length - 1 ? `1px solid ${C.divider}` : "none" }}>
              <div style={{ padding: "11px 14px", background: C.bg, fontSize: 12, fontWeight: 700, color: C.textMuted }}>{label}</div>
              <div style={{ padding: "11px 14px", fontSize: 13, color: C.ink, fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
        <WardBtn variant="ghost" onClick={onClose}>닫기</WardBtn>
      </div>
    </div>
  );
}

export function DraftPage({ docs, onSubmit, setOpenId, openId, compose, setCompose, forms, approvers }: Props) {
  const sent = docs.filter((d) => d.box === "sent");
  const openDoc = docs.find((d) => d.id === openId);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>기안 결재</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>결재 양식을 선택하고 기안 문서를 작성합니다</div>
        </div>
        <WardBtn variant="primary" icon={WardIcons.edit(16, "#fff")} onClick={() => setCompose({ open: true })}>기안 작성</WardBtn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {forms.map((f) => (
          <WardCard key={f.id} style={{ padding: "16px 18px", cursor: "pointer" }} onClick={() => setCompose({ open: true, form: f.id })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {ic(f.icon, 18, C.primaryDeep)}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>{f.label}</div>
            </div>
          </WardCard>
        ))}
      </div>

      <WardCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>상신함</span>
          <span style={{ fontSize: 12, color: C.textFaint, marginLeft: 8 }}>내가 올린 기안 목록</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "66px 1.4fr 140px 92px 96px", padding: "10px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
          <span>문서번호</span><span>제목</span><span>현재 결재자</span><span>상태</span><span>상신일</span>
        </div>
        {sent.length === 0 && <div style={{ padding: 32, textAlign: "center", color: C.textFaint, fontSize: 13 }}>상신한 문서가 없습니다.</div>}
        {sent.map((d, i) => {
          const currentApprover = d.line.find((s) => s.status === "결재중");
          return (
            <div key={d.id} onClick={() => setOpenId(d.id)}
              style={{ display: "grid", gridTemplateColumns: "66px 1.4fr 140px 92px 96px", padding: "13px 18px", alignItems: "center", fontSize: 13, cursor: "pointer", borderBottom: i < sent.length - 1 ? `1px solid ${C.divider}` : "none" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.primarySoft + "55"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: C.textMuted }}>{d.id}</span>
              <span style={{ fontWeight: 700, color: C.ink }}>{d.title}</span>
              <span style={{ color: C.textMuted }}>{currentApprover ? `${currentApprover.name} ${currentApprover.role}` : "—"}</span>
              <span><WardBadge tone={STATUS_TONE[d.status]}>{d.status}</WardBadge></span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: C.textMuted }}>{fmtDot(d.date)}</span>
            </div>
          );
        })}
      </WardCard>

      <WardModal open={compose.open} onClose={() => setCompose({ open: false })} width={620}>
        <ComposeModal
          initialForm={compose.form}
          forms={forms}
          approvers={approvers}
          onClose={() => setCompose({ open: false })}
          onSubmit={onSubmit}
        />
      </WardModal>

      <WardModal open={!!openDoc} onClose={() => setOpenId(null)} width={580}>
        {openDoc && <DocViewModal doc={openDoc} onClose={() => setOpenId(null)} />}
      </WardModal>
    </div>
  );
}
```

- [ ] **Step 3: `WardApp.tsx`에서 DraftPage에 forms/approvers 전달**

`src/features/ward-dashboard/components/WardApp.tsx`:
1. import에 `DOC_FORMS`, `APPROVERS`를 추가한다. 현재 import는:
   ```tsx
   import { ACCOUNTS, INIT_LEAVES, INIT_DOCS, APPROVERS, TODAY } from "@/features/ward-dashboard/data";
   ```
   → 다음으로 교체:
   ```tsx
   import { ACCOUNTS, INIT_LEAVES, INIT_DOCS, APPROVERS, TODAY, DOC_FORMS } from "@/features/ward-dashboard/data";
   ```
2. `<DraftPage ... />` 호출(현재 라인 206~214)에 `forms`/`approvers` props를 추가한다:
   ```tsx
   {route === "draft" && user.canApprove && (
     <DraftPage
       docs={docs}
       onSubmit={handleSubmitDoc}
       setOpenId={setOpenDocId}
       openId={openDocId}
       compose={compose}
       setCompose={setCompose}
       forms={DOC_FORMS}
       approvers={APPROVERS}
     />
   )}
   ```

- [ ] **Step 4: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공. 타입 에러 없음.

- [ ] **Step 5: 간호 무회귀 시각 확인**

Run: `npm run dev` 후 브라우저에서 `http://localhost:3000/ward` 접속.
Expected: 결재권 계정(이수진/정현숙)으로 좌측 "전자결재 › 기안 결재" 진입 → 양식 카드 6개(연차/반차/근무변경/외박외출/물품구매/특이사항) 정상 표시, "기안 작성" 모달에서 결재선이 "나 → 김미현 수간호사 → 김태우 병원장"으로 표시됨(기존과 동일).

- [ ] **Step 6: 커밋**

```bash
git add src/features/approval/components/DraftPage.tsx src/features/ward-dashboard/data.ts src/features/ward-dashboard/components/WardApp.tsx
git commit -m "refactor: DraftPage 양식/결재자를 props로 일반화 (간호 동작 불변)"
```

---

## Task 3: 총무 타입 정의

총무 대시보드 전용 타입을 정의한다.

**Files:**
- Create: `src/features/general-dashboard/types.ts`

**Interfaces:**
- Produces: `GeneralAccount`, `GeneralStaff`, `LeaveKind`, `LeaveRequest`, `LeaveBalance`, `GeneralRoute`, `GeneralTab`.

- [ ] **Step 1: `types.ts` 생성**

```typescript
// src/features/general-dashboard/types.ts
export interface GeneralAccount {
  id: string;
  name: string;
  role: string;       // 총무과장 | 총무주임 | 사원 등
  dept: string;       // 소속 (총무과)
  canApprove: boolean;
}

export interface GeneralStaff {
  id: string;
  name: string;
  dept: string;       // 부서 (간호과/원무과/총무과 등)
  role: string;       // 직급/직책
  join: string;       // 입사일 YYYY-MM-DD
  contact: string;
  status: "재직" | "휴직";
}

export type LeaveKind = "년차" | "반차" | "병가" | "경조" | "공가";

export interface LeaveRequest {
  id: string;
  staffId: string;
  name: string;
  dept: string;
  kind: LeaveKind;
  start: string;      // YYYY-MM-DD
  end: string;        // YYYY-MM-DD
  days: number;       // 0.5 단위 허용 (반차=0.5)
  reason: string;
  status: "대기" | "승인" | "반려";
  docId?: string;     // 연동된 전자결재 문서 id
}

export interface LeaveBalance {
  staffId: string;
  name: string;
  dept: string;
  granted: number;    // 연차 부여일수
  used: number;       // 사용일수
  remain: number;     // 잔여일수
}

export type GeneralRoute = "general" | "approval" | "draft";
export type GeneralTab = "status" | "staff" | "leave";
```

- [ ] **Step 2: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/features/general-dashboard/types.ts
git commit -m "feat: 총무 대시보드 타입 정의"
```

---

## Task 4: 총무 더미 데이터 + 순수 로직

총무 계정·전직원·휴가 신청·연차 잔여·전자결재 더미 데이터와, KPI 계산/휴가일수/양식 매핑 등 순수 함수를 정의한다.

**Files:**
- Create: `src/features/general-dashboard/data.ts`

**Interfaces:**
- Consumes: `GeneralAccount`, `GeneralStaff`, `LeaveRequest`, `LeaveBalance`, `LeaveKind` (Task 3); `ApprovalDoc`, `DocForm`, `Approvers` (Task 1).
- Produces: `TODAY`, `G_ACCOUNTS: GeneralAccount[]`, `G_STAFF: GeneralStaff[]`, `INIT_LEAVE_REQUESTS: LeaveRequest[]`, `LEAVE_BALANCES: LeaveBalance[]`, `G_INIT_DOCS: ApprovalDoc[]`, `G_APPROVERS: Approvers`, `G_DOC_FORMS: DocForm[]`, `KIND_TO_FORM: Record<LeaveKind,string>`, `leaveDaysBetween(start,end,kind): number`, `computeGeneralKpi(staff,leaves,docs)`, `G_DEPTS: string[]`.

- [ ] **Step 1: `data.ts` 생성**

```typescript
// src/features/general-dashboard/data.ts
import type {
  GeneralAccount, GeneralStaff, LeaveRequest, LeaveBalance, LeaveKind,
} from "./types";
import type { ApprovalDoc, DocForm, Approvers } from "@/features/approval/types";

export const TODAY = "2026-06-25";

export const G_ACCOUNTS: GeneralAccount[] = [
  { id: "g1", name: "김총무", role: "총무과장", dept: "총무과", canApprove: true },
  { id: "g2", name: "이행정", role: "총무주임", dept: "총무과", canApprove: true },
  { id: "g3", name: "박서무", role: "사원", dept: "총무과", canApprove: false },
];

export const G_DEPTS = ["간호과", "원무과", "총무과", "진료지원", "약제과", "영양과", "시설관리"];

export const G_STAFF: GeneralStaff[] = [
  { id: "e01", name: "이강표", dept: "총무과", role: "대표이사", join: "2008-01-02", contact: "010-2211-0001", status: "재직" },
  { id: "e02", name: "김총무", dept: "총무과", role: "총무과장", join: "2012-03-05", contact: "010-2211-0002", status: "재직" },
  { id: "e03", name: "이행정", dept: "총무과", role: "총무주임", join: "2016-07-11", contact: "010-2211-0003", status: "재직" },
  { id: "e04", name: "박서무", dept: "총무과", role: "사원", join: "2022-09-01", contact: "010-2211-0004", status: "재직" },
  { id: "e05", name: "정현숙", dept: "간호과", role: "간호부장", join: "2010-04-12", contact: "010-2211-0005", status: "재직" },
  { id: "e06", name: "이수진", dept: "간호과", role: "수간호사", join: "2009-03-02", contact: "010-2211-0006", status: "재직" },
  { id: "e07", name: "박지영", dept: "간호과", role: "간호사", join: "2019-07-15", contact: "010-2211-0007", status: "재직" },
  { id: "e08", name: "최유나", dept: "간호과", role: "간호사", join: "2021-09-01", contact: "010-2211-0008", status: "휴직" },
  { id: "e09", name: "강나래", dept: "간호과", role: "간호조무사", join: "2018-05-22", contact: "010-2211-0009", status: "재직" },
  { id: "e10", name: "한지민", dept: "원무과", role: "원무과장", join: "2013-02-18", contact: "010-2211-0010", status: "재직" },
  { id: "e11", name: "오세훈", dept: "원무과", role: "주임", join: "2018-11-05", contact: "010-2211-0011", status: "재직" },
  { id: "e12", name: "윤도경", dept: "원무과", role: "사원", join: "2023-03-20", contact: "010-2211-0012", status: "재직" },
  { id: "e13", name: "김도현", dept: "진료지원", role: "전문의", join: "2015-03-02", contact: "010-2211-0013", status: "재직" },
  { id: "e14", name: "이정민", dept: "진료지원", role: "전문의", join: "2017-09-01", contact: "010-2211-0014", status: "재직" },
  { id: "e15", name: "장미선", dept: "약제과", role: "약제과장", join: "2014-06-09", contact: "010-2211-0015", status: "재직" },
  { id: "e16", name: "조한별", dept: "약제과", role: "약사", join: "2020-08-17", contact: "010-2211-0016", status: "재직" },
  { id: "e17", name: "신영아", dept: "영양과", role: "영양사", join: "2019-04-01", contact: "010-2211-0017", status: "재직" },
  { id: "e18", name: "권민재", dept: "시설관리", role: "시설팀장", join: "2011-10-04", contact: "010-2211-0018", status: "재직" },
  { id: "e19", name: "황보름", dept: "시설관리", role: "기사", join: "2021-01-11", contact: "010-2211-0019", status: "재직" },
  { id: "e20", name: "남기훈", dept: "시설관리", role: "기사", join: "2024-05-02", contact: "010-2211-0020", status: "재직" },
];

export const INIT_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "G07", staffId: "e07", name: "박지영", dept: "간호과", kind: "년차", start: "2026-06-25", end: "2026-06-26", days: 2, reason: "가족 행사 참석", status: "승인", docId: "GA12" },
  { id: "G06", staffId: "e11", name: "오세훈", dept: "원무과", kind: "반차", start: "2026-06-25", end: "2026-06-25", days: 0.5, reason: "오후 병원 진료", status: "승인", docId: "GA11" },
  { id: "G05", staffId: "e16", name: "조한별", dept: "약제과", kind: "년차", start: "2026-06-22", end: "2026-06-22", days: 1, reason: "개인 사유", status: "승인" },
  { id: "G04", staffId: "e12", name: "윤도경", dept: "원무과", kind: "병가", start: "2026-06-29", end: "2026-06-30", days: 2, reason: "독감 치료", status: "대기", docId: "GA10" },
  { id: "G03", staffId: "e19", name: "황보름", dept: "시설관리", kind: "년차", start: "2026-07-01", end: "2026-07-03", days: 3, reason: "여름 휴가", status: "대기", docId: "GA09" },
  { id: "G02", staffId: "e09", name: "강나래", dept: "간호과", kind: "경조", start: "2026-06-18", end: "2026-06-19", days: 2, reason: "조부상", status: "승인" },
  { id: "G01", staffId: "e17", name: "신영아", dept: "영양과", kind: "공가", start: "2026-06-15", end: "2026-06-15", days: 1, reason: "예비군 훈련", status: "승인" },
];

export const LEAVE_BALANCES: LeaveBalance[] = [
  { staffId: "e06", name: "이수진", dept: "간호과", granted: 20, used: 8, remain: 12 },
  { staffId: "e07", name: "박지영", dept: "간호과", granted: 16, used: 9, remain: 7 },
  { staffId: "e09", name: "강나래", dept: "간호과", granted: 17, used: 11, remain: 6 },
  { staffId: "e11", name: "오세훈", dept: "원무과", granted: 16, used: 6.5, remain: 9.5 },
  { staffId: "e12", name: "윤도경", dept: "원무과", granted: 15, used: 4, remain: 11 },
  { staffId: "e16", name: "조한별", dept: "약제과", granted: 15, used: 5, remain: 10 },
  { staffId: "e17", name: "신영아", dept: "영양과", granted: 16, used: 7, remain: 9 },
  { staffId: "e19", name: "황보름", dept: "시설관리", granted: 15, used: 3, remain: 12 },
];

export const G_APPROVERS: Approvers = {
  head: { name: "김총무", role: "총무과장" },
  exec: { name: "한영태", role: "행정원장" },
};

export const G_DOC_FORMS: DocForm[] = [
  { id: "annual", label: "연차 휴가 신청서", icon: "calendar", fields: ["기간", "사유"] },
  { id: "half", label: "반차 신청서", icon: "clock", fields: ["일자", "구분", "사유"] },
  { id: "sick", label: "병가 신청서", icon: "file", fields: ["기간", "사유", "증빙"] },
  { id: "family", label: "경조 휴가 신청서", icon: "users", fields: ["사유", "기간"] },
  { id: "official", label: "공가 신청서", icon: "stamp", fields: ["사유", "일자"] },
  { id: "purchase", label: "물품 구매 요청서", icon: "building", fields: ["품목", "수량", "사유"] },
  { id: "report", label: "업무 보고서", icon: "file", fields: ["제목", "내용"] },
];

export const KIND_TO_FORM: Record<LeaveKind, string> = {
  년차: "annual", 반차: "half", 병가: "sick", 경조: "family", 공가: "official",
};

export const G_INIT_DOCS: ApprovalDoc[] = [
  {
    id: "GA10", box: "received", form: "sick", title: "병가 신청서 (윤도경, 6/29~6/30)",
    drafter: { name: "윤도경", role: "사원" }, date: "2026-06-24", status: "결재대기",
    body: [["신청자", "윤도경 (원무과)"], ["휴가 구분", "병가 (2일)"], ["기간", "2026.06.29 ~ 2026.06.30"], ["사유", "독감 치료"]],
    line: [
      { name: "윤도경", role: "사원", kind: "기안", status: "승인", at: "06-24 10:10" },
      { name: "김총무", role: "총무과장", kind: "결재", status: "결재중", at: null, me: true },
    ],
  },
  {
    id: "GA09", box: "received", form: "annual", title: "연차 휴가 신청서 (황보름, 7/1~7/3)",
    drafter: { name: "황보름", role: "기사" }, date: "2026-06-23", status: "결재대기",
    body: [["신청자", "황보름 (시설관리)"], ["휴가 구분", "년차 (3일)"], ["기간", "2026.07.01 ~ 2026.07.03"], ["사유", "여름 휴가"]],
    line: [
      { name: "황보름", role: "기사", kind: "기안", status: "승인", at: "06-23 16:30" },
      { name: "김총무", role: "총무과장", kind: "검토", status: "결재중", at: null, me: true },
      { name: "한영태", role: "행정원장", kind: "결재", status: "대기", at: null },
    ],
  },
  {
    id: "GA08", box: "sent", form: "purchase", title: "사무용품 구매 요청서 (복합기 토너)",
    drafter: { name: "김총무", role: "총무과장" }, date: "2026-06-22", status: "진행중",
    body: [["품목", "복합기 토너 (검정)"], ["수량", "5 개"], ["추정 단가", "65,000원"], ["사유", "행정실 재고 소진"]],
    line: [
      { name: "김총무", role: "총무과장", kind: "기안", status: "승인", at: "06-22 09:40", me: true },
      { name: "한영태", role: "행정원장", kind: "결재", status: "결재중", at: null },
    ],
  },
  {
    id: "GA12", box: "sent", form: "annual", title: "연차 휴가 신청서 (박지영, 6/25~6/26)",
    drafter: { name: "박지영", role: "간호사" }, date: "2026-06-20", status: "완료",
    body: [["신청자", "박지영 (간호과)"], ["휴가 구분", "년차 (2일)"], ["기간", "2026.06.25 ~ 2026.06.26"], ["사유", "가족 행사 참석"]],
    line: [
      { name: "박지영", role: "간호사", kind: "기안", status: "승인", at: "06-20 11:00" },
      { name: "김총무", role: "총무과장", kind: "결재", status: "승인", at: "06-20 14:20" },
    ],
  },
];

/** 휴가 일수 계산 — 반차는 0.5일, 그 외는 날짜 포함 일수 */
export function leaveDaysBetween(start: string, end: string, kind: LeaveKind): number {
  if (kind === "반차") return 0.5;
  const a = new Date(start.slice(0, 10) + "T00:00:00");
  const b = new Date(end.slice(0, 10) + "T00:00:00");
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export interface GeneralKpi {
  totalStaff: number;
  pendingApproval: number;
  onLeaveToday: number;
  monthLeaveCount: number;
}

export function computeGeneralKpi(
  staff: GeneralStaff[], leaves: LeaveRequest[], docs: ApprovalDoc[],
): GeneralKpi {
  const today = TODAY;
  const month = TODAY.slice(0, 7);
  return {
    totalStaff: staff.filter((s) => s.status === "재직").length,
    pendingApproval: docs.filter((d) => d.box === "received" && d.status === "결재대기").length,
    onLeaveToday: leaves.filter(
      (l) => l.status === "승인" && l.start.slice(0, 10) <= today && today <= l.end.slice(0, 10),
    ).length,
    monthLeaveCount: leaves.filter((l) => l.start.slice(0, 7) === month).length,
  };
}
```

- [ ] **Step 2: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공.

- [ ] **Step 3: 데이터 일관성 수동 확인**

다음을 눈으로 확인한다(자동 테스트 없음):
- `INIT_LEAVE_REQUESTS` 중 `docId`가 있는 항목(G07/G06/G04/G03)의 `docId`가 `G_INIT_DOCS`의 id(GA12/GA11/GA10/GA09)와 매칭되는지 확인. **주의: G06의 docId는 "GA11"인데 `G_INIT_DOCS`에 GA11이 없다 → GA11 문서를 추가하거나 G06의 docId를 제거**. 본 계획에서는 G06의 `docId: "GA11"`을 제거하여 단순화한다(연동 데모는 G07/G04/G03로 충분).
- `computeGeneralKpi` 기준 today=2026-06-25일 때 onLeaveToday는 G07(박지영, 6/25~6/26, 승인)·G06(오세훈, 6/25, 승인) = 2건이 되어야 한다.

위 G06 docId 수정을 반영한다:
```typescript
  { id: "G06", staffId: "e11", name: "오세훈", dept: "원무과", kind: "반차", start: "2026-06-25", end: "2026-06-25", days: 0.5, reason: "오후 병원 진료", status: "승인" },
```

- [ ] **Step 4: 커밋**

```bash
git add src/features/general-dashboard/data.ts
git commit -m "feat: 총무 더미 데이터 및 KPI/휴가일수 순수 함수"
```

---

## Task 5: GeneralSidebar

간호 사이드바를 본떠 총무 메뉴 + 전자결재 섹션을 가진 사이드바를 만든다.

**Files:**
- Create: `src/features/general-dashboard/components/GeneralSidebar.tsx`

**Interfaces:**
- Consumes: `GeneralAccount`, `GeneralRoute` (Task 3); `C`, `FONT`, `WardIcons` (WardUI).
- Produces: `GeneralSidebar` 컴포넌트, props `{ route: GeneralRoute; onNav: (r: GeneralRoute) => void; user: GeneralAccount; pendingCount: number; onLogout?: () => void }`.

- [ ] **Step 1: `GeneralSidebar.tsx` 생성**

```tsx
"use client";

import React from "react";
import { C, FONT, WardIcons } from "@/shared/ui/WardUI";
import type { GeneralAccount, GeneralRoute } from "@/features/general-dashboard/types";

const NAV_SECTIONS = [
  {
    label: "총무 업무",
    items: [{ id: "general" as GeneralRoute, label: "총무 대시보드", icon: "grid" as const }],
  },
  {
    label: "전자결재",
    items: [
      { id: "approval" as GeneralRoute, label: "결재함", icon: "stamp" as const },
      { id: "draft" as GeneralRoute, label: "기안 결재", icon: "edit" as const },
    ],
  },
];

interface Props {
  route: GeneralRoute;
  onNav: (r: GeneralRoute) => void;
  user: GeneralAccount;
  pendingCount: number;
  onLogout?: () => void;
}

export function GeneralSidebar({ route, onNav, user, pendingCount, onLogout }: Props) {
  const sections = user.canApprove ? NAV_SECTIONS : NAV_SECTIONS.filter((s) => s.label !== "전자결재");
  return (
    <aside style={{
      width: 248, flexShrink: 0, background: C.surface,
      borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      <div style={{ height: 64, padding: "0 20px", display: "flex", alignItems: "center", gap: 11, borderBottom: `1px solid ${C.borderSoft}` }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`,
          color: "#fff", fontSize: 16, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 8px rgba(0,160,198,0.3)",
        }}>S</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.1, letterSpacing: "-0.01em" }}>소망병원 ERP</div>
          <div style={{ fontSize: 10, color: C.textFaint, letterSpacing: "0.1em", marginTop: 2, whiteSpace: "nowrap" }}>GENERAL · 총무과</div>
        </div>
      </div>

      <div style={{ margin: "16px 16px 4px", padding: "12px 14px", borderRadius: 10, background: `linear-gradient(135deg, ${C.primarySoft}, #f0f9fb)`, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10.5, color: C.primaryDeep, fontWeight: 700, letterSpacing: "0.04em" }}>소속</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, marginTop: 3, letterSpacing: "-0.01em" }}>총무과</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>행정지원팀</div>
      </div>

      <div style={{ padding: "10px 0", flex: 1, overflowY: "auto" }}>
        {sections.map((sec) => (
          <div key={sec.label} style={{ marginBottom: 8 }}>
            <div style={{ padding: "8px 20px 6px", fontSize: 10, fontWeight: 700, color: C.textFaint, letterSpacing: "0.08em" }}>{sec.label}</div>
            {sec.items.map((it) => {
              const active = route === it.id;
              return (
                <div key={it.id} onClick={() => onNav(it.id)}
                  style={{
                    margin: "1px 10px", padding: "10px 12px", borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 11, cursor: "pointer",
                    background: active ? C.primarySoft : "transparent",
                    color: active ? C.primaryDeep : C.textDark,
                    fontWeight: active ? 700 : 500, fontSize: 13, fontFamily: FONT,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  {WardIcons[it.icon](18, active ? C.primaryDeep : C.textMuted)}
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.id === "approval" && pendingCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: C.danger, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingCount}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${C.borderSoft}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`,
          color: "#fff", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>{user.name.slice(0, 1)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{user.name}</div>
          <div style={{ fontSize: 11, color: C.textFaint }}>{user.dept} · {user.role}</div>
        </div>
        <span onClick={onLogout} style={{ cursor: "pointer", color: C.textFaint }} title="로그아웃">
          {WardIcons.logout(17, C.textFaint)}
        </span>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/features/general-dashboard/components/GeneralSidebar.tsx
git commit -m "feat: GeneralSidebar (총무 메뉴 + 전자결재)"
```

---

## Task 6: GeneralTopbar

간호 상단바를 본떠 총무 계정 스위처를 가진 상단바를 만든다.

**Files:**
- Create: `src/features/general-dashboard/components/GeneralTopbar.tsx`

**Interfaces:**
- Consumes: `GeneralAccount` (Task 3); `G_ACCOUNTS` (Task 4); `C`, `FONT`, `WardIcons`, `fmtK` (WardUI).
- Produces: `GeneralTopbar` 컴포넌트, props `{ title: string; crumbs?: string[]; user: GeneralAccount; today: string; onSwitch: (acc: GeneralAccount) => void }`.

- [ ] **Step 1: `GeneralTopbar.tsx` 생성**

```tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { C, FONT, WardIcons, fmtK } from "@/shared/ui/WardUI";
import type { GeneralAccount } from "@/features/general-dashboard/types";
import { G_ACCOUNTS } from "@/features/general-dashboard/data";

interface Props {
  title: string;
  crumbs?: string[];
  user: GeneralAccount;
  today: string;
  onSwitch: (acc: GeneralAccount) => void;
}

export function GeneralTopbar({ title, crumbs, user, today, onSwitch }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div style={{
      height: 64, background: C.surface, borderBottom: `1px solid ${C.border}`,
      padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{title}</div>
        {crumbs && crumbs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textFaint }}>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                <span style={{ color: i === crumbs.length - 1 ? C.textMuted : C.textFaint, whiteSpace: "nowrap" }}>{c}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.textMuted, fontWeight: 500, whiteSpace: "nowrap" }}>
          {WardIcons.calendar(15, C.textFaint)}
          {fmtK(today, true)}
        </div>
        <span style={{ position: "relative", cursor: "pointer", color: C.textMuted }}>
          {WardIcons.bell(19, C.textMuted)}
        </span>
        <div style={{ width: 1, height: 26, background: C.border }} />

        <div ref={ref} style={{ position: "relative" }}>
          <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", padding: "4px 6px", borderRadius: 8 }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.bg}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{user.name.slice(0, 1)}</div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", fontFamily: FONT }}>
                {user.name} <span style={{ color: C.textFaint, fontWeight: 500, fontSize: 11 }}>{user.role}</span>
              </div>
            </div>
            {WardIcons.chevD(14, C.textFaint)}
          </div>

          {open && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 60, width: 268, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: "0 12px 34px rgba(28,55,70,0.16)", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${C.borderSoft}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>계정 전환</div>
                <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 2 }}>로그인 시뮬레이션 · 권한별 메뉴 노출</div>
              </div>
              <div style={{ padding: 6 }}>
                {G_ACCOUNTS.map((a) => {
                  const cur = a.id === user.id;
                  return (
                    <div key={a.id} onClick={() => { onSwitch(a); setOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", background: cur ? C.primarySoft : "transparent" }}
                      onMouseEnter={(e) => { if (!cur) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                      onMouseLeave={(e) => { if (!cur) (e.currentTarget as HTMLElement).style.background = cur ? C.primarySoft : "transparent"; }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: cur ? C.primaryDeep : C.chipBg, color: cur ? "#fff" : C.textMuted, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.name.slice(0, 1)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, fontFamily: FONT }}>{a.name} <span style={{ fontWeight: 500, fontSize: 11, color: C.textFaint }}>{a.role}</span></div>
                        <div style={{ fontSize: 10.5, color: C.textFaint }}>{a.dept}</div>
                      </div>
                      {a.canApprove
                        ? <span style={{ fontSize: 9.5, fontWeight: 700, color: C.primaryDeep, background: C.primarySoft, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>결재권</span>
                        : <span style={{ fontSize: 9.5, fontWeight: 600, color: C.textFaint, background: C.chipBg, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}>열람</span>}
                      {cur && WardIcons.check(15, C.primaryDeep)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/features/general-dashboard/components/GeneralTopbar.tsx
git commit -m "feat: GeneralTopbar (총무 계정 스위처)"
```

---

## Task 7: TabStatus (현황)

KPI 카드 4개 + 오늘 휴가자 목록 + 최근 기안 요약을 보여주는 현황 탭.

**Files:**
- Create: `src/features/general-dashboard/components/tabs/TabStatus.tsx`

**Interfaces:**
- Consumes: `GeneralStaff`, `LeaveRequest`, `GeneralTab` (Task 3); `ApprovalDoc` (Task 1); `computeGeneralKpi`, `TODAY` (Task 4); `C`, `WardCard`, `WardBadge`, `SectionTitle`, `WardIcons`, `fmtDot` (WardUI).
- Produces: `TabStatus`, props `{ staff: GeneralStaff[]; leaves: LeaveRequest[]; docs: ApprovalDoc[]; goTab: (t: GeneralTab) => void; goApproval: () => void }`.

- [ ] **Step 1: `tabs/TabStatus.tsx` 생성**

```tsx
"use client";

import React from "react";
import { C, MONO, WardCard, WardBadge, SectionTitle, WardIcons, fmtDot } from "@/shared/ui/WardUI";
import { computeGeneralKpi, TODAY } from "@/features/general-dashboard/data";
import type { GeneralStaff, LeaveRequest, GeneralTab } from "@/features/general-dashboard/types";
import type { ApprovalDoc } from "@/features/approval/types";

interface Props {
  staff: GeneralStaff[];
  leaves: LeaveRequest[];
  docs: ApprovalDoc[];
  goTab: (t: GeneralTab) => void;
  goApproval: () => void;
}

const KIND_TONE: Record<string, "info" | "warn" | "danger" | "ok" | "neutral"> = {
  년차: "info", 반차: "info", 병가: "danger", 경조: "warn", 공가: "neutral",
};

export function TabStatus({ staff, leaves, docs, goTab, goApproval }: Props) {
  const kpi = computeGeneralKpi(staff, leaves, docs);
  const today = TODAY;

  const cards = [
    { label: "전체 직원 (재직)", value: kpi.totalStaff, unit: "명", icon: "users" as const, onClick: () => goTab("staff") },
    { label: "오늘 결재 대기", value: kpi.pendingApproval, unit: "건", icon: "stamp" as const, onClick: goApproval },
    { label: "오늘 휴가자", value: kpi.onLeaveToday, unit: "명", icon: "calendar" as const, onClick: () => goTab("leave") },
    { label: "이번 달 휴가 신청", value: kpi.monthLeaveCount, unit: "건", icon: "file" as const, onClick: () => goTab("leave") },
  ];

  const onLeaveToday = leaves.filter(
    (l) => l.status === "승인" && l.start.slice(0, 10) <= today && today <= l.end.slice(0, 10),
  );
  const recentDocs = [...docs].slice(0, 5);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {cards.map((c) => (
          <WardCard key={c.label} style={{ padding: "18px 20px" }} onClick={c.onClick}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600 }}>{c.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {WardIcons[c.icon](17, C.primaryDeep)}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>{c.value}</span>
              <span style={{ fontSize: 13, color: C.textFaint, fontWeight: 600 }}>{c.unit}</span>
            </div>
          </WardCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <WardCard style={{ padding: "18px 20px" }}>
          <SectionTitle action="휴가관리" onAction={() => goTab("leave")} sub={`${fmtDot(today)} 기준`}>오늘 휴가자</SectionTitle>
          {onLeaveToday.length === 0 && <div style={{ padding: "24px 0", textAlign: "center", color: C.textFaint, fontSize: 13 }}>오늘 휴가자가 없습니다.</div>}
          {onLeaveToday.map((l) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: `1px solid ${C.divider}` }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.chipBg, color: C.textMuted, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{l.name.slice(0, 1)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{l.name} <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}>{l.dept}</span></div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: MONO }}>{fmtDot(l.start)} ~ {fmtDot(l.end)}</div>
              </div>
              <WardBadge tone={KIND_TONE[l.kind] || "neutral"}>{l.kind}</WardBadge>
            </div>
          ))}
        </WardCard>

        <WardCard style={{ padding: "18px 20px" }}>
          <SectionTitle action="결재함" onAction={goApproval} sub="최근 기안 5건">최근 기안</SectionTitle>
          {recentDocs.length === 0 && <div style={{ padding: "24px 0", textAlign: "center", color: C.textFaint, fontSize: 13 }}>기안 문서가 없습니다.</div>}
          {recentDocs.map((d) => {
            const tone = d.status === "완료" ? "ok" : d.status === "반려" ? "danger" : d.status === "결재대기" ? "warn" : "info";
            return (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: `1px solid ${C.divider}` }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.textFaint, width: 40 }}>{d.id}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: C.textFaint }}>{d.drafter.name} {d.drafter.role}</div>
                </div>
                <WardBadge tone={tone}>{d.status}</WardBadge>
              </div>
            );
          })}
        </WardCard>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/features/general-dashboard/components/tabs/TabStatus.tsx
git commit -m "feat: TabStatus 현황 탭 (KPI + 오늘 휴가자 + 최근 기안)"
```

---

## Task 8: TabStaff (직원현황)

전직원 테이블 + 검색/부서 필터 + 상세보기 모달.

**Files:**
- Create: `src/features/general-dashboard/components/tabs/TabStaff.tsx`

**Interfaces:**
- Consumes: `GeneralStaff` (Task 3); `G_STAFF`, `G_DEPTS` (Task 4); `C`, `MONO`, `WardCard`, `WardBadge`, `WardBtn`, `WardSearchInput`, `WardSelect`, `WardModal`, `WardIcons`, `fmtDot` (WardUI).
- Produces: `TabStaff`, props `{ toast: (msg: string) => void }`.

- [ ] **Step 1: `tabs/TabStaff.tsx` 생성**

```tsx
"use client";

import React, { useState } from "react";
import { C, MONO, WardCard, WardBadge, WardBtn, WardSearchInput, WardSelect, WardModal, WardIcons, fmtDot } from "@/shared/ui/WardUI";
import { G_STAFF, G_DEPTS } from "@/features/general-dashboard/data";
import type { GeneralStaff } from "@/features/general-dashboard/types";

interface Props {
  toast: (msg: string) => void;
}

function StaffDetail({ staff, onClose }: { staff: GeneralStaff; onClose: () => void }) {
  const rows: [string, string][] = [
    ["이름", staff.name],
    ["부서", staff.dept],
    ["직급/직책", staff.role],
    ["입사일", fmtDot(staff.join)],
    ["연락처", staff.contact],
    ["상태", staff.status],
  ];
  return (
    <div>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{staff.name.slice(0, 1)}</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{staff.name}</div>
            <div style={{ fontSize: 12, color: C.textFaint }}>{staff.dept} · {staff.role}</div>
          </div>
        </div>
        <span onClick={onClose} style={{ cursor: "pointer", color: C.textFaint }}>{WardIcons.close(20, C.textFaint)}</span>
      </div>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ borderRadius: 9, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {rows.map(([label, value], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : "none" }}>
              <div style={{ padding: "11px 14px", background: C.bg, fontSize: 12, fontWeight: 700, color: C.textMuted }}>{label}</div>
              <div style={{ padding: "11px 14px", fontSize: 13, color: C.ink, fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
        <WardBtn variant="ghost" onClick={onClose}>닫기</WardBtn>
      </div>
    </div>
  );
}

export function TabStaff({ toast }: Props) {
  const [q, setQ] = useState("");
  const [deptF, setDeptF] = useState("전체 부서");
  const [detail, setDetail] = useState<GeneralStaff | null>(null);

  const rows = G_STAFF.filter((s) => {
    if (q && !(s.name.includes(q) || s.contact.includes(q))) return false;
    if (deptF !== "전체 부서" && s.dept !== deptF) return false;
    return true;
  });

  const HEAD = "1fr 120px 120px 120px 150px 80px 40px";
  const active = G_STAFF.filter((s) => s.status === "재직").length;
  const onLeave = G_STAFF.filter((s) => s.status === "휴직").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: C.textMuted }}>
          전체 <b style={{ color: C.ink }}>{G_STAFF.length}명</b> · 재직 {active} · 휴직 {onLeave}
        </div>
        <WardBtn variant="primary" icon={WardIcons.plus(16, "#fff")} onClick={() => toast("직원 추가 화면을 준비 중입니다")}>직원 추가</WardBtn>
      </div>

      <WardCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", gap: 9, alignItems: "center" }}>
          <WardSearchInput value={q} onChange={setQ} placeholder="이름 · 연락처 검색" />
          <WardSelect value={deptF} onChange={setDeptF} options={["전체 부서", ...G_DEPTS]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: HEAD, padding: "11px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
          <span>이름</span><span>부서</span><span>직급/직책</span><span>입사일</span><span>연락처</span><span>상태</span><span></span>
        </div>
        {rows.map((s, i) => (
          <div key={s.id} onClick={() => setDetail(s)}
            style={{ display: "grid", gridTemplateColumns: HEAD, padding: "13px 18px", alignItems: "center", fontSize: 13, cursor: "pointer", borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : "none" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.primarySoft + "55"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.name.slice(0, 1)}</div>
              <span style={{ fontWeight: 700, color: C.ink }}>{s.name}</span>
            </div>
            <span style={{ color: C.textDark, fontWeight: 500 }}>{s.dept}</span>
            <span style={{ color: C.textDark, fontWeight: 500 }}>{s.role}</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.textMuted }}>{fmtDot(s.join)}</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.textMuted }}>{s.contact}</span>
            <span><WardBadge tone={s.status === "재직" ? "ok" : "warn"} dot>{s.status}</WardBadge></span>
            <span style={{ color: C.textFaint, display: "flex", justifyContent: "center" }}>{WardIcons.chevR(16, C.textFaint)}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: C.textFaint, fontSize: 13 }}>조건에 맞는 직원이 없습니다.</div>
        )}
      </WardCard>

      <WardModal open={!!detail} onClose={() => setDetail(null)} width={460}>
        {detail && <StaffDetail staff={detail} onClose={() => setDetail(null)} />}
      </WardModal>
    </div>
  );
}
```

- [ ] **Step 2: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/features/general-dashboard/components/tabs/TabStaff.tsx
git commit -m "feat: TabStaff 직원현황 탭 (검색/부서필터/상세)"
```

---

## Task 9: TabLeave (휴가관리)

연차 잔여 현황 + 휴가 신청 내역 목록 + 신규 휴가 등록 모달(결재 상신 연동).

**Files:**
- Create: `src/features/general-dashboard/components/tabs/TabLeave.tsx`

**Interfaces:**
- Consumes: `LeaveRequest`, `LeaveKind`, `GeneralStaff` (Task 3); `LEAVE_BALANCES`, `G_STAFF`, `leaveDaysBetween`, `TODAY` (Task 4); `C`, `FONT`, `MONO`, `WardCard`, `WardBadge`, `WardBtn`, `WardModal`, `WardIcons`, `fmtDot` (WardUI).
- Produces: `TabLeave`, props `{ leaves: LeaveRequest[]; onAddLeave: (input: NewLeaveInput) => void }` where `NewLeaveInput = { staffId: string; kind: LeaveKind; start: string; end: string; reason: string }`. **`NewLeaveInput` 타입을 `general-dashboard/types.ts`에 추가로 정의**(아래 Step 1에서 추가)하여 GeneralApp(Task 10)과 공유한다.

- [ ] **Step 1: `general-dashboard/types.ts`에 `NewLeaveInput` 추가**

`src/features/general-dashboard/types.ts` 끝에 추가:
```typescript
export interface NewLeaveInput {
  staffId: string;
  kind: LeaveKind;
  start: string;
  end: string;
  reason: string;
}
```

- [ ] **Step 2: `tabs/TabLeave.tsx` 생성**

```tsx
"use client";

import React, { useState } from "react";
import { C, FONT, MONO, WardCard, WardBadge, WardBtn, WardModal, WardIcons, fmtDot } from "@/shared/ui/WardUI";
import { LEAVE_BALANCES, G_STAFF, leaveDaysBetween, TODAY } from "@/features/general-dashboard/data";
import type { LeaveRequest, LeaveKind, NewLeaveInput } from "@/features/general-dashboard/types";

interface Props {
  leaves: LeaveRequest[];
  onAddLeave: (input: NewLeaveInput) => void;
}

const KINDS: LeaveKind[] = ["년차", "반차", "병가", "경조", "공가"];
const KIND_TONE: Record<LeaveKind, "info" | "warn" | "danger" | "ok" | "neutral"> = {
  년차: "info", 반차: "info", 병가: "danger", 경조: "warn", 공가: "neutral",
};
const STATUS_TONE: Record<LeaveRequest["status"], "warn" | "ok" | "danger"> = {
  대기: "warn", 승인: "ok", 반려: "danger",
};

function NewLeaveForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: NewLeaveInput) => void }) {
  const [staffId, setStaffId] = useState("");
  const [kind, setKind] = useState<LeaveKind>("년차");
  const [start, setStart] = useState(TODAY);
  const [end, setEnd] = useState(TODAY);
  const [reason, setReason] = useState("");

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
    fontSize: 13, fontFamily: FONT, color: C.ink, background: C.bg, outline: "none", boxSizing: "border-box",
  };
  const days = leaveDaysBetween(start, end, kind);
  const valid = staffId && reason.trim() && start <= end;

  return (
    <div>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>휴가 신청</div>
        <span onClick={onClose} style={{ cursor: "pointer", color: C.textFaint }}>{WardIcons.close(20, C.textFaint)}</span>
      </div>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>신청자</label>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={{ ...inp, appearance: "none" }}>
            <option value="">직원 선택</option>
            {G_STAFF.filter((s) => s.status === "재직").map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.dept} · {s.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>휴가 구분</label>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {KINDS.map((k) => {
              const sel = kind === k;
              return (
                <button key={k} onClick={() => setKind(k)} style={{
                  padding: "7px 14px", borderRadius: 7, fontSize: 12.5, fontWeight: sel ? 700 : 600,
                  fontFamily: FONT, cursor: "pointer",
                  border: `1px solid ${sel ? C.primary : C.border}`,
                  background: sel ? C.primarySoft : C.surface, color: sel ? C.primaryDeep : C.textMuted,
                }}>{k}</button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>시작일</label>
            <input type="date" value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value > end) setEnd(e.target.value); }} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>종료일</label>
            <input type="date" value={end} min={start} disabled={kind === "반차"} onChange={(e) => setEnd(e.target.value)} style={{ ...inp, opacity: kind === "반차" ? 0.5 : 1 }} />
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: C.textMuted }}>신청 일수: <b style={{ color: C.primaryDeep }}>{days}일</b></div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>사유</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="사유를 입력하세요"
            style={{ ...inp, resize: "vertical" }} />
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 9, background: C.primarySoft, fontSize: 12, color: C.primaryDeep, fontWeight: 600 }}>
          상신 시 전자결재(기안 결재)로 자동 등록됩니다 · 결재선: 기안자 → 김총무 총무과장 → 한영태 행정원장
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 9, justifyContent: "flex-end" }}>
        <WardBtn variant="ghost" onClick={onClose}>취소</WardBtn>
        <WardBtn variant="primary" icon={WardIcons.send(16, "#fff")} disabled={!valid}
          onClick={() => { if (valid) onSubmit({ staffId, kind, start, end: kind === "반차" ? start : end, reason: reason.trim() }); }}>
          상신
        </WardBtn>
      </div>
    </div>
  );
}

export function TabLeave({ leaves, onAddLeave }: Props) {
  const [open, setOpen] = useState(false);
  const HEAD = "1fr 100px 90px 190px 70px 80px";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: C.textMuted }}>
          신청 <b style={{ color: C.ink }}>{leaves.length}건</b> · 대기 {leaves.filter((l) => l.status === "대기").length} · 승인 {leaves.filter((l) => l.status === "승인").length}
        </div>
        <WardBtn variant="primary" icon={WardIcons.plus(16, "#fff")} onClick={() => setOpen(true)}>휴가 신청</WardBtn>
      </div>

      {/* 연차 잔여 현황 */}
      <WardCard style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 14 }}>연차 잔여 현황</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {LEAVE_BALANCES.map((b) => {
            const pct = b.granted > 0 ? Math.round((b.used / b.granted) * 100) : 0;
            return (
              <div key={b.staffId} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{b.name} <span style={{ fontSize: 10.5, color: C.textFaint, fontWeight: 500 }}>{b.dept}</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, margin: "6px 0 8px" }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.primaryDeep }}>{b.remain}</span>
                  <span style={{ fontSize: 11, color: C.textFaint }}>/ {b.granted}일 잔여</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: C.bg, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: C.primary }} />
                </div>
              </div>
            );
          })}
        </div>
      </WardCard>

      {/* 휴가 신청 내역 */}
      <WardCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>휴가 신청 내역</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: HEAD, padding: "11px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
          <span>신청자</span><span>구분</span><span>일수</span><span>기간</span><span>결재</span><span>상태</span>
        </div>
        {leaves.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.textFaint, fontSize: 13 }}>휴가 신청 내역이 없습니다.</div>}
        {leaves.map((l, i) => (
          <div key={l.id}
            style={{ display: "grid", gridTemplateColumns: HEAD, padding: "13px 18px", alignItems: "center", fontSize: 13, borderBottom: i < leaves.length - 1 ? `1px solid ${C.divider}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.chipBg, color: C.textMuted, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{l.name.slice(0, 1)}</div>
              <div>
                <div style={{ fontWeight: 700, color: C.ink }}>{l.name}</div>
                <div style={{ fontSize: 11, color: C.textFaint }}>{l.dept}</div>
              </div>
            </div>
            <span><WardBadge tone={KIND_TONE[l.kind]}>{l.kind}</WardBadge></span>
            <span style={{ color: C.textDark, fontWeight: 600 }}>{l.days}일</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.textMuted }}>{fmtDot(l.start)} ~ {fmtDot(l.end)}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: l.docId ? C.primaryDeep : C.textFaint }}>{l.docId || "—"}</span>
            <span><WardBadge tone={STATUS_TONE[l.status]} dot>{l.status}</WardBadge></span>
          </div>
        ))}
      </WardCard>

      <WardModal open={open} onClose={() => setOpen(false)} width={560}>
        <NewLeaveForm onClose={() => setOpen(false)} onSubmit={(input) => { onAddLeave(input); setOpen(false); }} />
      </WardModal>
    </div>
  );
}
```

- [ ] **Step 3: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공.

- [ ] **Step 4: 커밋**

```bash
git add src/features/general-dashboard/types.ts src/features/general-dashboard/components/tabs/TabLeave.tsx
git commit -m "feat: TabLeave 휴가관리 탭 (잔여현황 + 신청내역 + 신청 모달)"
```

---

## Task 10: GeneralApp (메인 셸 + 상태 + 휴가↔결재 연동)

라우트/탭 상태, 계정 전환, 전자결재 핸들러, 그리고 휴가 신청을 결재 기안으로 상신하고 결재 완료 시 휴가 상태를 반영하는 연동 로직을 담은 메인 셸.

**Files:**
- Create: `src/features/general-dashboard/components/GeneralApp.tsx`

**Interfaces:**
- Consumes: 모든 이전 태스크 산출물 — `GeneralSidebar`(T5), `GeneralTopbar`(T6), `TabStatus`(T7), `TabStaff`(T8), `TabLeave`(T9), `ApprovalPage`(기존), `DraftPage`(T2 일반화), 데이터/타입(T3·T4), `WardToast`/`C`/`FONT`/`WardIcons`(WardUI).
- Produces: `GeneralApp` 컴포넌트 (props 없음).

- [ ] **Step 1: `GeneralApp.tsx` 생성**

```tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { C, FONT, WardIcons, WardToast } from "@/shared/ui/WardUI";
import { GeneralSidebar } from "./GeneralSidebar";
import { GeneralTopbar } from "./GeneralTopbar";
import { TabStatus } from "./tabs/TabStatus";
import { TabStaff } from "./tabs/TabStaff";
import { TabLeave } from "./tabs/TabLeave";
import { ApprovalPage } from "@/features/approval/components/ApprovalPage";
import { DraftPage } from "@/features/approval/components/DraftPage";
import {
  G_ACCOUNTS, G_STAFF, INIT_LEAVE_REQUESTS, G_INIT_DOCS, G_APPROVERS, G_DOC_FORMS,
  KIND_TO_FORM, leaveDaysBetween, TODAY,
} from "@/features/general-dashboard/data";
import type {
  GeneralAccount, GeneralRoute, GeneralTab, LeaveRequest, NewLeaveInput,
} from "@/features/general-dashboard/types";
import type { ApprovalDoc } from "@/features/approval/types";

const GENERAL_TABS: { id: GeneralTab; label: string; icon: keyof typeof WardIcons }[] = [
  { id: "status", label: "현황", icon: "grid" },
  { id: "staff", label: "직원현황", icon: "users" },
  { id: "leave", label: "휴가관리", icon: "calendar" },
];

function TabBar({ tab, onTab }: { tab: GeneralTab; onTab: (t: GeneralTab) => void }) {
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 22 }}>
      {GENERAL_TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => onTab(t.id)}
            style={{
              position: "relative", display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 18px", border: "none", background: "transparent", cursor: "pointer",
              fontFamily: FONT, fontSize: 13.5, fontWeight: active ? 700 : 600, whiteSpace: "nowrap",
              color: active ? C.primaryDeep : C.textMuted, transition: "color 0.12s",
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = C.textDark; }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
            {WardIcons[t.icon](16, active ? C.primaryDeep : C.textFaint)}
            {t.label}
            {active && <span style={{ position: "absolute", left: 12, right: 12, bottom: -1, height: 2.5, borderRadius: 2, background: C.primaryDeep }} />}
          </button>
        );
      })}
    </div>
  );
}

export function GeneralApp() {
  const [route, setRoute] = useState<GeneralRoute>(() => {
    if (typeof window !== "undefined") {
      const r = localStorage.getItem("gd_route") as GeneralRoute | null;
      return (r === "general" || r === "approval" || r === "draft") ? r : "general";
    }
    return "general";
  });
  const [tab, setTab] = useState<GeneralTab>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("gd_tab") as GeneralTab) || "status";
    }
    return "status";
  });
  const [user, setUser] = useState<GeneralAccount>(G_ACCOUNTS[0]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INIT_LEAVE_REQUESTS);
  const [docs, setDocs] = useState<ApprovalDoc[]>(G_INIT_DOCS);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [compose, setCompose] = useState<{ open: boolean; form?: string }>({ open: false });
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { localStorage.setItem("gd_route", route); }, [route]);
  useEffect(() => { localStorage.setItem("gd_tab", tab); }, [tab]);
  useEffect(() => {
    function h(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpenDocId(null); setCompose({ open: false }); }
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  function toast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }

  function nowStamp() {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function switchUser(acc: GeneralAccount) {
    setUser(acc);
    if (!acc.canApprove && (route === "approval" || route === "draft")) setRoute("general");
    toast(`${acc.name} ${acc.role} · ${acc.canApprove ? "결재권 계정으로 전환" : "열람 계정으로 전환"}`);
  }

  // 결재 완료 시 연동된 휴가의 상태를 동기화
  function syncLeaveByDoc(docId: string, leaveStatus: LeaveRequest["status"]) {
    setLeaves((prev) => prev.map((l) => (l.docId === docId ? { ...l, status: leaveStatus } : l)));
  }

  function handleApprove(id: string) {
    let completed = false;
    setDocs((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const line = d.line.map((s) => ({ ...s }));
      const idx = line.findIndex((s) => s.status === "결재중");
      if (idx >= 0) {
        line[idx].status = "승인";
        line[idx].at = nowStamp();
        if (line[idx + 1]) line[idx + 1].status = "결재중";
      }
      const allDone = line.every((s) => s.status === "승인");
      completed = allDone;
      return { ...d, line, status: allDone ? "완료" : "진행중" };
    }));
    if (completed) syncLeaveByDoc(id, "승인");
    setOpenDocId(null);
    toast(completed ? "결재가 완료되었습니다" : "결재를 승인했습니다");
  }

  function handleReject(id: string, memo: string) {
    setDocs((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const line = d.line.map((s) => ({ ...s }));
      const idx = line.findIndex((s) => s.status === "결재중");
      if (idx >= 0) { line[idx].status = "반려"; line[idx].at = nowStamp(); if (memo) line[idx].memo = memo; }
      return { ...d, line, status: "반려" };
    }));
    syncLeaveByDoc(id, "반려");
    setOpenDocId(null);
    toast("결재를 반려했습니다");
  }

  function handleSubmitDoc({ form, title, content }: { form: string; title: string; content: string }) {
    const nid = "GA" + (20 + docs.filter((d) => d.box === "sent").length);
    const newDoc: ApprovalDoc = {
      id: nid, box: "sent", form, title,
      drafter: { name: user.name, role: user.role }, date: TODAY, status: "진행중",
      body: content ? [["내용", content]] : [["내용", "(본문 없음)"]],
      line: [
        { name: user.name, role: user.role, kind: "기안", status: "승인", at: nowStamp(), me: true },
        { name: G_APPROVERS.head.name, role: G_APPROVERS.head.role, kind: "검토", status: "결재중", at: null },
        { name: G_APPROVERS.exec.name, role: G_APPROVERS.exec.role, kind: "결재", status: "대기", at: null },
      ],
    };
    setDocs((prev) => [newDoc, ...prev]);
    setCompose({ open: false });
    toast("기안을 상신했습니다");
  }

  // 휴가 신청 → 휴가 레코드 + 연동 결재 기안 동시 생성
  function handleAddLeave(input: NewLeaveInput) {
    const staff = G_STAFF.find((s) => s.id === input.staffId);
    if (!staff) return;
    const days = leaveDaysBetween(input.start, input.end, input.kind);
    const sentCount = docs.filter((d) => d.box === "sent").length;
    const docId = "GA" + (20 + sentCount);
    const leaveId = "G" + String(leaves.length + 8).padStart(2, "0");
    const form = KIND_TO_FORM[input.kind];
    const periodText = input.kind === "반차"
      ? `${input.start.replace(/-/g, ".")} (반차)`
      : `${input.start.replace(/-/g, ".")} ~ ${input.end.replace(/-/g, ".")}`;

    const newDoc: ApprovalDoc = {
      id: docId, box: "sent", form, title: `${input.kind} 신청서 (${staff.name})`,
      drafter: { name: user.name, role: user.role }, date: TODAY, status: "진행중",
      body: [
        ["신청자", `${staff.name} (${staff.dept})`],
        ["휴가 구분", `${input.kind} (${days}일)`],
        ["기간", periodText],
        ["사유", input.reason],
      ],
      line: [
        { name: user.name, role: user.role, kind: "기안", status: "승인", at: nowStamp(), me: true },
        { name: G_APPROVERS.head.name, role: G_APPROVERS.head.role, kind: "검토", status: "결재중", at: null },
        { name: G_APPROVERS.exec.name, role: G_APPROVERS.exec.role, kind: "결재", status: "대기", at: null },
      ],
    };
    const newLeave: LeaveRequest = {
      id: leaveId, staffId: staff.id, name: staff.name, dept: staff.dept,
      kind: input.kind, start: input.start, end: input.end, days,
      reason: input.reason, status: "대기", docId,
    };
    setDocs((prev) => [newDoc, ...prev]);
    setLeaves((prev) => [newLeave, ...prev]);
    toast(`${staff.name} ${input.kind} 신청을 상신했습니다`);
  }

  const pendingCount = user.canApprove
    ? docs.filter((d) => d.box === "received" && d.status === "결재대기").length
    : 0;

  const meta = route === "approval" && user.canApprove
    ? { title: "전자결재", crumbs: ["총무과", "결재함"] }
    : route === "draft" && user.canApprove
    ? { title: "전자결재", crumbs: ["총무과", "기안 결재"] }
    : { title: "총무과 대시보드", crumbs: ["총무과", GENERAL_TABS.find((t) => t.id === tab)?.label ?? ""] };

  return (
    <div style={{ display: "flex", height: "100vh", minWidth: 1280, background: C.bg, fontFamily: FONT, color: C.ink, WebkitFontSmoothing: "antialiased" }}>
      <GeneralSidebar
        route={route}
        onNav={(r) => { if (!user.canApprove && r !== "general") return; setRoute(r); }}
        user={user}
        pendingCount={pendingCount}
        onLogout={() => toast("로그아웃 기능은 메인 ERP에서 사용하세요")}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <GeneralTopbar title={meta.title} crumbs={meta.crumbs} user={user} today={TODAY} onSwitch={switchUser} />
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px" }}>
          {route === "general" && (
            <>
              <TabBar tab={tab} onTab={setTab} />
              {tab === "status" && <TabStatus staff={G_STAFF} leaves={leaves} docs={docs} goTab={setTab} goApproval={() => { if (user.canApprove) setRoute("approval"); else toast("결재 열람 권한이 없습니다"); }} />}
              {tab === "staff" && <TabStaff toast={toast} />}
              {tab === "leave" && <TabLeave leaves={leaves} onAddLeave={handleAddLeave} />}
            </>
          )}
          {route === "approval" && user.canApprove && (
            <ApprovalPage docs={docs} onApprove={handleApprove} onReject={handleReject} setOpenId={setOpenDocId} openId={openDocId} />
          )}
          {route === "draft" && user.canApprove && (
            <DraftPage docs={docs} onSubmit={handleSubmitDoc} setOpenId={setOpenDocId} openId={openDocId} compose={compose} setCompose={setCompose} forms={G_DOC_FORMS} approvers={G_APPROVERS} />
          )}
        </div>
      </div>
      <WardToast msg={toastMsg} />
    </div>
  );
}
```

- [ ] **Step 2: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/features/general-dashboard/components/GeneralApp.tsx
git commit -m "feat: GeneralApp 셸 + 휴가↔결재 연동 로직"
```

---

## Task 11: 라우트 연결 + 종단 검증

`/general` 라우트를 만들고 전체 흐름을 시각적으로 검증한다.

**Files:**
- Create: `src/app/general/layout.tsx`
- Create: `src/app/general/page.tsx`

**Interfaces:**
- Consumes: `GeneralApp` (Task 10).

- [ ] **Step 1: `app/general/layout.tsx` 생성** (기존 `app/ward/layout.tsx` 패턴 동일)

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소망병원 ERP — 총무과 대시보드",
};

export default function GeneralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: `app/general/page.tsx` 생성** (기존 `app/ward/page.tsx` 패턴 동일)

```tsx
import { GeneralApp } from "@/features/general-dashboard/components/GeneralApp";

export default function GeneralPage() {
  return <GeneralApp />;
}
```

- [ ] **Step 3: 빌드로 검증**

Run: `npm run build`
Expected: 컴파일 성공. `/general` 라우트가 빌드 산출물에 포함됨.

- [ ] **Step 4: 종단 시각 검증**

Run: `npm run dev` 후 `http://localhost:3000/general` 접속. 다음을 모두 확인:
1. **레이아웃**: 좌측 사이드바(GENERAL · 총무과, 소속 카드 "총무과/행정지원팀") + 상단바 + 탭바가 간호와 동일한 디자인으로 표시.
2. **현황 탭**: KPI 카드 4개. 기본 계정(김총무, today=2026-06-25 기준) → "전체 직원(재직)" 19, "오늘 결재 대기" 2, "오늘 휴가자" 2, "이번 달 휴가 신청" = 6월 신청 건수. "오늘 휴가자"에 박지영·오세훈 표시. "최근 기안" 목록 표시.
3. **직원현황 탭**: 전직원 20명 테이블. 검색("이수진")·부서 필터("간호과") 동작, 행 클릭 시 상세 모달.
4. **휴가관리 탭**: 연차 잔여 현황 카드들 + 휴가 신청 내역. "휴가 신청" 버튼 → 모달에서 직원/구분/기간/사유 입력 후 "상신" → 토스트 표시, 내역 목록 맨 위에 "대기" 상태로 추가되고 결재 컬럼에 GA 문서번호 표시.
5. **휴가↔결재 연동**: 위에서 상신한 건이 좌측 "전자결재 › 기안 결재"의 상신함에 나타남. 그리고 "결재함"에서 기존 결재대기 문서(GA10/GA09)를 "승인"으로 처리 → 완료되면(GA09는 2단계 결재) 휴가관리 탭에서 황보름 건 상태가 "승인"으로 바뀌는지 확인.
6. **권한**: 상단 계정 스위처에서 박서무(열람)로 전환 → 좌측 "전자결재" 섹션이 사라지고 대시보드만 노출.
7. **간호 무회귀**: `http://localhost:3000/ward` 정상 동작(특히 기안 결재 양식/결재선).
8. **상태 분리**: `/general`과 `/ward`를 오가도 탭/라우트 상태가 서로 간섭하지 않음(gd_* vs nd_*).

- [ ] **Step 5: 커밋**

```bash
git add src/app/general/layout.tsx src/app/general/page.tsx
git commit -m "feat: /general 라우트 연결 (총무과 대시보드)"
```

---

## Self-Review (작성자 점검 결과)

**1. Spec coverage:**
- 전직원 현황관리 → Task 8 (TabStaff) ✔
- 휴가관리(년차·반차·휴가) → Task 9 (TabLeave) ✔
- 전자결재(기안/결재) → 기존 ApprovalPage 재사용 + Task 2(DraftPage 일반화) ✔
- 휴가↔결재 연동 → Task 10 (handleAddLeave + syncLeaveByDoc) ✔
- 별도 `/general` 라우트 공존 → Task 11 ✔
- WardUI 재사용 → 전 태스크 ✔
- ApprovalDoc 타입 approval로 이전 → Task 1 ✔
- localStorage gd_* 분리 → Task 10 ✔
- 더미 데이터 전용 → Task 4 ✔

**2. Placeholder scan:** "준비 중"은 의도된 UI 문구(직원 추가 버튼). 그 외 TBD/TODO 없음. 모든 코드 단계에 실제 코드 포함.

**3. Type consistency:** `NewLeaveInput`(T9 정의)·`LeaveRequest.docId`·`KIND_TO_FORM`·`leaveDaysBetween`·`computeGeneralKpi` 시그니처가 T3/T4 정의와 T7/T9/T10 사용처에서 일치. `DraftPage` props(forms/approvers)가 T2 정의와 WardApp(T2)·GeneralApp(T10) 호출에서 일치. `ApprovalDoc` import 출처를 `@/features/approval/types`로 통일(데이터·신규 컴포넌트), 기존 ward 소비자는 재-export로 호환.

**4. 알려진 데이터 주의:** Task 4 Step 3에서 G06의 dangling docId("GA11") 제거를 명시했다(GA11 문서 미존재). 실행 시 반드시 반영할 것.
