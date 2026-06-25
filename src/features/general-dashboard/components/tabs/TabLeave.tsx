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
