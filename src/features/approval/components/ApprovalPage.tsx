"use client";

import React, { useState } from "react";
import { C, FONT, MONO, WardCard, WardBadge, WardBtn, WardModal, WardIcons, fmtDot } from "@/shared/ui/WardUI";
import type { ApprovalDoc, ApprovalStep, ApprovalDocStatus } from "@/features/ward-dashboard/types";

interface Props {
  docs: ApprovalDoc[];
  onApprove: (id: string) => void;
  onReject: (id: string, memo: string) => void;
  setOpenId: (id: string | null) => void;
  openId: string | null;
}

const STATUS_TONE: Record<ApprovalDocStatus, "warn" | "info" | "ok" | "danger"> = {
  결재대기: "warn", 진행중: "info", 완료: "ok", 반려: "danger",
};
const FORM_ICONS: Record<string, keyof typeof WardIcons> = {
  annual: "calendar", half: "clock", shift: "table",
  leave: "door", purchase: "building", report: "file",
  sick: "file", family: "users", official: "stamp",
};

function ApprovalLine({ line, compact }: { line: ApprovalStep[]; compact?: boolean }) {
  const sz = compact ? 30 : 40;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 10, flexWrap: "wrap" }}>
      {line.map((s, i) => {
        const colors: Record<ApprovalStep["status"], { bg: string; fg: string; border: string }> = {
          승인: { bg: C.okBg, fg: C.ok, border: C.ok },
          결재중: { bg: C.primaryDeep, fg: "#fff", border: C.primaryDeep },
          대기: { bg: C.surface, fg: C.textMuted, border: C.border },
          반려: { bg: C.dangerBg, fg: C.danger, border: C.danger },
        };
        const col = colors[s.status];
        return (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ width: compact ? 16 : 24, height: 1, background: C.border, flexShrink: 0 }} />}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: sz, height: sz, borderRadius: "50%", border: `2px solid ${col.border}`,
                  background: col.bg, color: col.fg, fontSize: compact ? 11 : 13, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: s.status === "결재중" ? `0 0 0 4px ${C.primaryDeep}26` : "none",
                }}>
                  {s.status === "승인" ? WardIcons.check(compact ? 14 : 18, C.ok) :
                    s.status === "반려" ? WardIcons.close(compact ? 14 : 18, C.danger) :
                    s.name.slice(0, 1)}
                </div>
                {s.me && (
                  <span style={{ position: "absolute", top: -6, right: -6, fontSize: 9, fontWeight: 700, background: C.primaryDeep, color: "#fff", padding: "1px 5px", borderRadius: 999 }}>나</span>
                )}
              </div>
              {!compact && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textDark }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: C.textFaint }}>{s.kind}</div>
                  {s.at && <div style={{ fontSize: 10, color: C.textFaint, fontFamily: MONO }}>{s.at}</div>}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ApprovalDetailModal({ doc, onClose, onApprove, onReject }: {
  doc: ApprovalDoc; onClose: () => void;
  onApprove: (id: string) => void; onReject: (id: string, memo: string) => void;
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [memo, setMemo] = useState("");
  const isPending = doc.box === "received" && doc.status === "결재대기";

  return (
    <div>
      {/* 헤더 */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontFamily: MONO, color: C.textMuted }}>{doc.id}</span>
              <WardBadge tone={STATUS_TONE[doc.status]}>{doc.status}</WardBadge>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{doc.title}</div>
            <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>
              {doc.drafter.name} {doc.drafter.role} · {fmtDot(doc.date)} 상신
            </div>
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: C.textFaint }}>{WardIcons.close(20, C.textFaint)}</span>
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 결재선 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: "0.04em", marginBottom: 12 }}>결재선</div>
          <ApprovalLine line={doc.line} />
          {doc.line.find(s => s.status === "반려" && s.memo) && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: C.dangerBg, border: `1px solid ${C.danger}26`, fontSize: 12.5, color: C.danger, fontWeight: 600 }}>
              반려 사유: {doc.line.find(s => s.memo)?.memo}
            </div>
          )}
        </div>

        {/* 기안 내용 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: "0.04em", marginBottom: 12 }}>기안 내용</div>
          <div style={{ borderRadius: 9, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {doc.body.map(([label, value], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", borderBottom: i < doc.body.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                <div style={{ padding: "11px 14px", background: C.bg, fontSize: 12, fontWeight: 700, color: C.textMuted }}>{label}</div>
                <div style={{ padding: "11px 14px", fontSize: 13, color: C.ink, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 반려 입력 */}
        {rejectMode && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>반려 사유</div>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3}
              placeholder="반려 사유를 입력하세요"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: FONT, color: C.ink, background: C.bg, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
        )}
      </div>

      {/* 액션 푸터 */}
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 9, justifyContent: "flex-end" }}>
        {isPending && !rejectMode && (
          <>
            <WardBtn variant="danger" onClick={() => setRejectMode(true)}>반려</WardBtn>
            <WardBtn variant="primary" onClick={() => onApprove(doc.id)}>승인</WardBtn>
          </>
        )}
        {isPending && rejectMode && (
          <>
            <WardBtn variant="ghost" onClick={() => setRejectMode(false)}>취소</WardBtn>
            <WardBtn variant="danger" onClick={() => onReject(doc.id, memo)}>반려 확정</WardBtn>
          </>
        )}
        {!isPending && <WardBtn variant="ghost" onClick={onClose}>닫기</WardBtn>}
      </div>
    </div>
  );
}

function DocRow({ doc, onClick }: { doc: ApprovalDoc; onClick: () => void }) {
  const pendingMe = doc.status === "결재대기" && doc.box === "received";
  return (
    <div onClick={onClick}
      style={{ display: "grid", gridTemplateColumns: "66px 1.4fr 140px 200px 92px 96px", padding: "13px 18px", alignItems: "center", fontSize: 13, cursor: "pointer", borderBottom: `1px solid ${C.divider}` }}
      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.primarySoft + "55"}
      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
      <span style={{ fontFamily: MONO, fontSize: 12, color: C.textMuted }}>{doc.id}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {WardIcons[FORM_ICONS[doc.form] || "file"](14, C.textFaint)}
        <span style={{ fontWeight: 700, color: C.ink }}>
          {pendingMe && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.danger, marginRight: 6, verticalAlign: "middle" }} />}
          {doc.title}
        </span>
      </div>
      <span style={{ color: C.textMuted }}>{doc.drafter.name} <span style={{ fontSize: 11, color: C.textFaint }}>{doc.drafter.role}</span></span>
      <div style={{ padding: "0 4px" }}><ApprovalLine line={doc.line} compact /></div>
      <span><WardBadge tone={STATUS_TONE[doc.status]}>{doc.status}</WardBadge></span>
      <span style={{ fontFamily: MONO, fontSize: 12, color: C.textMuted }}>{fmtDot(doc.date)}</span>
    </div>
  );
}

export function ApprovalPage({ docs, onApprove, onReject, setOpenId, openId }: Props) {
  const pending = docs.filter((d) => d.box === "received" && d.status === "결재대기");
  const done = docs.filter((d) => d.box === "received" && d.status !== "결재대기");
  const openDoc = docs.find((d) => d.id === openId);

  const summary = [
    { label: "내 결재 대기", value: pending.length, tone: "warn" as const },
    { label: "상신 진행 중", value: docs.filter(d => d.box === "sent" && d.status === "진행중").length, tone: "info" as const },
    { label: "결재 완료", value: docs.filter(d => d.status === "완료").length, tone: "ok" as const },
    { label: "반려", value: docs.filter(d => d.status === "반려").length, tone: "danger" as const },
  ];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>결재함</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>내가 결재해야 할 문서를 처리합니다</div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {summary.map((s) => (
          <WardCard key={s.label} style={{ flex: 1, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ marginTop: 6 }}><WardBadge tone={s.tone}>{s.label}</WardBadge></div>
          </WardCard>
        ))}
      </div>

      {/* 결재 대기 */}
      <WardCard style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>결재 대기</span>
          {pending.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: C.danger, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{pending.length}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "66px 1.4fr 140px 200px 92px 96px", padding: "10px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
          <span>문서번호</span><span>제목</span><span>기안자</span><span>결재선</span><span>상태</span><span>상신일</span>
        </div>
        {pending.length === 0 && <div style={{ padding: 32, textAlign: "center", color: C.textFaint, fontSize: 13 }}>결재 대기 중인 문서가 없습니다.</div>}
        {pending.map((d) => <DocRow key={d.id} doc={d} onClick={() => setOpenId(d.id)} />)}
      </WardCard>

      {/* 처리 완료 */}
      {done.length > 0 && (
        <WardCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>처리 완료</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "66px 1.4fr 140px 200px 92px 96px", padding: "10px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
            <span>문서번호</span><span>제목</span><span>기안자</span><span>결재선</span><span>상태</span><span>상신일</span>
          </div>
          {done.map((d) => <DocRow key={d.id} doc={d} onClick={() => setOpenId(d.id)} />)}
        </WardCard>
      )}

      <WardModal open={!!openDoc} onClose={() => setOpenId(null)} width={620}>
        {openDoc && (
          <ApprovalDetailModal
            doc={openDoc}
            onClose={() => setOpenId(null)}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}
      </WardModal>
    </div>
  );
}
