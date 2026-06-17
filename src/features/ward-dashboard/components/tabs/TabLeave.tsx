"use client";

import React, { useState } from "react";
import { C, FONT, MONO, WardCard, WardBadge, WardBtn, WardSelect, WardModal, WardIcons, fmtDT } from "@/shared/ui/WardUI";
import { PATIENTS } from "@/features/ward-dashboard/data";
import type { Leave } from "@/features/ward-dashboard/types";

interface Props {
  leaves: Leave[];
  onAddLeave: (l: Leave) => void;
  toast: (msg: string) => void;
}

function LeaveApplyForm({ initialType, onClose, onSubmit }: {
  initialType: "외박" | "외출";
  onClose: () => void;
  onSubmit: (data: Omit<Leave, "id" | "returned" | "registrar" | "status">) => void;
}) {
  const [type, setType] = useState<"외박" | "외출">(initialType);
  const [patientId, setPatientId] = useState("");
  const [depart, setDepart] = useState("");
  const [expect, setExpect] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const admittedPatients = PATIENTS.filter((p) => p.status === "입원중" || p.status === "외박" || p.status === "외출");
  const sel = admittedPatients.find((p) => p.id === patientId);

  function handleSubmit() {
    if (!patientId || !sel) return setErr("환자를 선택해주세요.");
    if (!depart || !expect) return setErr("출발 및 복귀 예정 일시를 입력해주세요.");
    if (depart >= expect) return setErr("복귀 예정 일시는 출발 일시보다 나중이어야 합니다.");
    setErr("");
    onSubmit({ name: sel.name, bed: sel.bed, type, depart, expect, reason });
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
    fontSize: 13, fontFamily: FONT, color: C.ink, background: C.bg, outline: "none",
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{type} 신청</div>
        <span onClick={onClose} style={{ cursor: "pointer", color: C.textFaint }}>{WardIcons.close(20, C.textFaint)}</span>
      </div>
      {/* 유형 선택 */}
      <div style={{ display: "flex", marginBottom: 18, background: C.bg, borderRadius: 8, padding: 3, gap: 3 }}>
        {(["외박", "외출"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} style={{
            flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: FONT,
            fontSize: 13, fontWeight: type === t ? 700 : 600,
            background: type === t ? C.surface : "transparent",
            color: type === t ? (t === "외박" ? C.oebak : C.oechul) : C.textMuted,
            boxShadow: type === t ? "0 1px 2px rgba(28,55,70,0.1)" : "none",
          }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>환자</label>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} style={{ ...inp, appearance: "none" }}>
            <option value="">환자 선택 — 이름 · 병상</option>
            {admittedPatients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.bed}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>출발 일시</label>
            <input type="datetime-local" value={depart} onChange={(e) => setDepart(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>복귀 예정 일시</label>
            <input type="datetime-local" value={expect} onChange={(e) => setExpect(e.target.value)} style={inp} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>사유</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="사유를 입력하세요" style={inp} />
        </div>
        {err && <div style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>{err}</div>}
      </div>
      <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 24 }}>
        <WardBtn variant="ghost" onClick={onClose}>취소</WardBtn>
        <WardBtn variant="primary" onClick={handleSubmit}>등록</WardBtn>
      </div>
    </div>
  );
}

function NutritionSendModal({ leaves, onClose, onSend }: {
  leaves: Leave[]; onClose: () => void; onSend: () => void;
}) {
  const outNow = leaves.filter((l) => l.status !== "복귀완료");
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>영양과 식수 보고</div>
        <span onClick={onClose} style={{ cursor: "pointer", color: C.textFaint }}>{WardIcons.close(20, C.textFaint)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "식사 제외 인원", value: outNow.length, unit: "명", color: C.primaryDeep },
          { label: "외박 중", value: outNow.filter(l => l.type === "외박").length, unit: "명", color: C.oebak },
          { label: "외출 중", value: outNow.filter(l => l.type === "외출").length, unit: "명", color: C.oechul },
        ].map((s) => (
          <div key={s.label} style={{ padding: "14px 16px", borderRadius: 10, background: C.bg, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}<span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{s.unit}</span></div>
          </div>
        ))}
      </div>
      <div style={{ borderRadius: 9, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "9px 14px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.03em" }}>제외 대상 명단</div>
        {outNow.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: C.textFaint, fontSize: 13 }}>현재 외박·외출 중인 환자가 없습니다.</div>
        )}
        {outNow.map((l, i) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i > 0 ? `1px solid ${C.divider}` : "none" }}>
            <b style={{ fontSize: 13, color: C.ink, minWidth: 60 }}>{l.name}</b>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.textMuted }}>{l.bed}</span>
            <WardBadge tone={l.type === "외박" ? "oebak" : "oechul"}>{l.type}</WardBadge>
            <span style={{ flex: 1, fontSize: 11.5, color: C.textFaint }}>복귀예정 {fmtDT(l.expect)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
        <WardBtn variant="ghost" onClick={onClose}>취소</WardBtn>
        <WardBtn variant="primary" icon={WardIcons.send(16, "#fff")} onClick={onSend}>영양과로 전송</WardBtn>
      </div>
    </div>
  );
}

export function TabLeave({ leaves, onAddLeave, toast }: Props) {
  const [typeF, setTypeF] = useState("전체");
  const [applyType, setApplyType] = useState<"외박" | "외출" | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  let leaveCounter = leaves.length;

  const chips = ["전체", "외박중", "외출중", "복귀완료"];
  const rows = leaves.filter((l) => typeF === "전체" ? true : l.status === typeF);
  const outNow = leaves.filter((l) => l.status !== "복귀완료");
  const obNow = outNow.filter((l) => l.type === "외박").length;
  const ocNow = outNow.filter((l) => l.type === "외출").length;

  const HEAD = "1fr 70px 124px 124px 96px 1.3fr 80px";

  function handleAdd(data: Omit<Leave, "id" | "returned" | "registrar" | "status">) {
    leaveCounter++;
    const nid = "L" + String(10 + leaveCounter).padStart(2, "0");
    const row: Leave = {
      id: nid, ...data, returned: null,
      registrar: "이수진",
      status: data.type === "외박" ? "외박중" : "외출중",
    };
    onAddLeave(row);
    setApplyType(null);
    toast(`${data.name}님 ${data.type} 신청이 등록되었습니다`);
  }

  function handleSend() {
    const now = new Date();
    setSentAt(`${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setSendOpen(false);
    toast("영양과로 식수 정보가 전송되었습니다");
  }

  return (
    <div>
      {/* 상단 컨트롤 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <WardSelect value="이번 주 (06.01–06.07)" onChange={() => {}} options={["오늘 (06.07)", "이번 주 (06.01–06.07)", "이번 달 (2026.06)", "지난 30일"]} />
          <div style={{ display: "flex", gap: 4, background: C.bg, borderRadius: 8, padding: 3 }}>
            {chips.map((c) => (
              <button key={c} onClick={() => setTypeF(c)} style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: typeF === c ? 700 : 600,
                border: "none", cursor: "pointer", fontFamily: FONT,
                background: typeF === c ? C.surface : "transparent",
                color: typeF === c ? C.primaryDeep : C.textMuted,
                boxShadow: typeF === c ? "0 1px 2px rgba(28,55,70,0.1)" : "none",
              }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <WardBtn variant="ghost" icon={WardIcons.plus(16, C.oechul)} onClick={() => setApplyType("외출")} style={{ color: C.oechul }}>외출 신청</WardBtn>
          <WardBtn variant="primary" icon={WardIcons.plus(16, "#fff")} onClick={() => setApplyType("외박")}>외박 신청</WardBtn>
        </div>
      </div>

      <WardCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: HEAD, padding: "11px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
          <span>환자명</span><span>유형</span><span>출발일시</span><span>복귀예정일시</span><span>복귀확인</span><span>사유</span><span>등록자</span>
        </div>
        {rows.map((l, i) => (
          <div key={l.id} style={{ display: "grid", gridTemplateColumns: HEAD, padding: "13px 18px", alignItems: "center", fontSize: 12.5, color: C.textDark, borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{l.name}</div>
              <div style={{ fontSize: 10.5, color: C.textFaint, fontFamily: MONO }}>{l.bed}</div>
            </div>
            <span><WardBadge tone={l.type === "외박" ? "oebak" : "oechul"}>{l.type}</WardBadge></span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.textMuted }}>{fmtDT(l.depart)}</span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: l.status !== "복귀완료" ? (l.type === "외박" ? C.oebak : C.oechul) : C.textMuted, fontWeight: l.status !== "복귀완료" ? 600 : 400 }}>{fmtDT(l.expect)}</span>
            <span>
              {l.returned
                ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: C.ok, fontFamily: MONO }}>{WardIcons.check(13, C.ok)}{fmtDT(l.returned)}</span>
                : <WardBadge tone={l.status === "외박중" ? "oebak" : "oechul"} dot>{l.status}</WardBadge>}
            </span>
            <span style={{ fontSize: 12, color: C.text, paddingRight: 8 }}>{l.reason}</span>
            <span style={{ fontSize: 12, color: C.textMuted }}>{l.registrar}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: C.textFaint, fontSize: 13 }}>조건에 맞는 기록이 없습니다.</div>
        )}
      </WardCard>

      {/* 요약 카드 3개 */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <WardCard style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {WardIcons.bowl(24, C.primaryDeep)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: C.textMuted, fontWeight: 600 }}>오늘 식사 제외 인원</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em", marginTop: 2 }}>{obNow + ocNow}<span style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>명</span></div>
          </div>
        </WardCard>

        <WardCard style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11.5, color: C.textMuted, fontWeight: 600, marginBottom: 10 }}>유형별 현재 인원</div>
          <div style={{ display: "flex", gap: 16 }}>
            {[{ label: "외박", count: obNow, color: C.oebak, bg: C.oebakBg }, { label: "외출", count: ocNow, color: C.oechul, bg: C.oechulBg }].map((s) => (
              <div key={s.label} style={{ flex: 1, padding: "10px 12px", borderRadius: 9, background: s.bg, textAlign: "center" }}>
                <div style={{ fontSize: 10.5, color: s.color, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
              </div>
            ))}
          </div>
        </WardCard>

        <WardCard style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11.5, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>영양과 식수 보고 연동</div>
          {sentAt ? (
            <div style={{ fontSize: 12.5, color: C.ok, fontWeight: 700, marginBottom: 12 }}>
              {WardIcons.check(14, C.ok)} 전송됨 · {sentAt}
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 12 }}>미전송 — 전송 대기 중</div>
          )}
          <WardBtn variant="soft" onClick={() => setSendOpen(true)}>영양과 전송</WardBtn>
        </WardCard>
      </div>

      {/* 신청 모달 */}
      <WardModal open={!!applyType} onClose={() => setApplyType(null)} width={480}>
        {applyType && (
          <LeaveApplyForm initialType={applyType} onClose={() => setApplyType(null)} onSubmit={handleAdd} />
        )}
      </WardModal>

      {/* 영양과 전송 모달 */}
      <WardModal open={sendOpen} onClose={() => setSendOpen(false)} width={500}>
        <NutritionSendModal leaves={leaves} onClose={() => setSendOpen(false)} onSend={handleSend} />
      </WardModal>
    </div>
  );
}
