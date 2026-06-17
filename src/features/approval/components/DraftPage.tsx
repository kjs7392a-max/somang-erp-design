"use client";

import React, { useState } from "react";
import { C, FONT, MONO, WardCard, WardBadge, WardBtn, WardModal, WardIcons, fmtDot } from "@/shared/ui/WardUI";
import { APPROVERS, TODAY } from "@/features/ward-dashboard/data";
import type { ApprovalDoc, ApprovalDocStatus } from "@/features/ward-dashboard/types";

interface Props {
  docs: ApprovalDoc[];
  onSubmit: (data: { form: string; title: string; content: string }) => void;
  setOpenId: (id: string | null) => void;
  openId: string | null;
  compose: { open: boolean; form?: string };
  setCompose: (c: { open: boolean; form?: string }) => void;
}

const DOC_FORMS = [
  { id: "annual", label: "연차 휴가 신청서", icon: "calendar" as const, fields: ["기간", "사유"] },
  { id: "half", label: "반차 신청서", icon: "clock" as const, fields: ["일자", "구분", "사유"] },
  { id: "shift", label: "근무 변경 신청서", icon: "table" as const, fields: ["대상일", "변경 내용", "사유"] },
  { id: "leave", label: "외박·외출 특별 승인 요청", icon: "door" as const, fields: ["환자", "기간", "사유"] },
  { id: "purchase", label: "물품 구매 요청서", icon: "building" as const, fields: ["품목", "수량", "사유"] },
  { id: "report", label: "특이사항 보고서", icon: "file" as const, fields: ["발생일시", "내용"] },
];

const STATUS_TONE: Record<ApprovalDocStatus, "warn" | "info" | "ok" | "danger"> = {
  결재대기: "warn", 진행중: "info", 완료: "ok", 반려: "danger",
};

function ComposeModal({ initialForm, onClose, onSubmit }: {
  initialForm?: string; onClose: () => void; onSubmit: (data: { form: string; title: string; content: string }) => void;
}) {
  const [selectedForm, setSelectedForm] = useState(initialForm || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [step, setStep] = useState<"pick" | "write">(initialForm ? "write" : "pick");
  const form = DOC_FORMS.find((f) => f.id === selectedForm);

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
            {DOC_FORMS.map((f) => (
              <div key={f.id} onClick={() => { setSelectedForm(f.id); setStep("write"); }}
                style={{ padding: "16px 14px", borderRadius: 10, border: `1px solid ${C.border}`, cursor: "pointer", textAlign: "center", transition: "all 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.background = C.primarySoft; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  {WardIcons[f.icon](24, C.primaryDeep)}
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
            {WardIcons[form.icon](16, C.primaryDeep)}
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
          {/* 결재선 미리보기 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>결재선</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {[
                { name: "이수진", role: "수간호사", kind: "기안", me: true },
                { name: APPROVERS.head.name, role: APPROVERS.head.role, kind: "검토" },
                { name: APPROVERS.exec.name, role: APPROVERS.exec.role, kind: "결재" },
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

export function DraftPage({ docs, onSubmit, setOpenId, openId, compose, setCompose }: Props) {
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

      {/* 양식 카드 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {DOC_FORMS.map((f) => (
          <WardCard key={f.id} style={{ padding: "16px 18px", cursor: "pointer" }} onClick={() => setCompose({ open: true, form: f.id })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {WardIcons[f.icon](18, C.primaryDeep)}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>{f.label}</div>
            </div>
          </WardCard>
        ))}
      </div>

      {/* 상신함 */}
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
          const currentApprover = d.line.find(s => s.status === "결재중");
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

      {/* 기안 작성 모달 */}
      <WardModal open={compose.open} onClose={() => setCompose({ open: false })} width={620}>
        <ComposeModal
          initialForm={compose.form}
          onClose={() => setCompose({ open: false })}
          onSubmit={onSubmit}
        />
      </WardModal>

      {/* 문서 상세 모달 */}
      <WardModal open={!!openDoc} onClose={() => setOpenId(null)} width={580}>
        {openDoc && <DocViewModal doc={openDoc} onClose={() => setOpenId(null)} />}
      </WardModal>
    </div>
  );
}
