"use client";

import React, { useState } from "react";
import { C, FONT, MONO, WardCard, WardBadge, WardBtn, WardSearchInput, WardSelect, WardModal, WardIcons, fmtDot } from "@/shared/ui/WardUI";
import { STAFF } from "@/features/ward-dashboard/data";
import type { Staff } from "@/features/ward-dashboard/types";

interface Props {
  toast: (msg: string) => void;
}

function StaffEditForm({ staff, onClose, onSave }: { staff: Staff; onClose: () => void; onSave: (s: Staff) => void }) {
  const [form, setForm] = useState({ ...staff });
  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
    fontSize: 13, fontFamily: FONT, color: C.ink, background: C.bg, outline: "none",
  };
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>직원 정보 수정</div>
        <span onClick={onClose} style={{ cursor: "pointer", color: C.textFaint }}>{WardIcons.close(20, C.textFaint)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { label: "이름", key: "name", type: "text" },
          { label: "입사일", key: "join", type: "date" },
          { label: "연락처", key: "contact", type: "tel" },
        ].map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>{f.label}</label>
            <input
              type={f.type}
              value={(form as any)[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              style={inp}
            />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>직책</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Staff["role"] })} style={{ ...inp, appearance: "none" }}>
            <option value="수간호사">수간호사</option>
            <option value="간호사">간호사</option>
            <option value="간호조무사">간호조무사</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6 }}>상태</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Staff["status"] })} style={{ ...inp, appearance: "none" }}>
            <option value="재직">재직</option>
            <option value="휴직">휴직</option>
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 24 }}>
        <WardBtn variant="ghost" onClick={onClose}>취소</WardBtn>
        <WardBtn variant="primary" onClick={() => onSave(form)}>저장</WardBtn>
      </div>
    </div>
  );
}

export function TabStaff({ toast }: Props) {
  const [staffList, setStaffList] = useState<Staff[]>(STAFF);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("전체 직책");
  const [editStaff, setEditStaff] = useState<Staff | null>(null);

  const rows = staffList.filter((s) => {
    if (q && !(s.name.includes(q) || s.contact.includes(q))) return false;
    if (roleF !== "전체 직책" && s.role !== roleF) return false;
    return true;
  });

  const HEAD = "1fr 130px 120px 150px 90px 40px";
  const active = staffList.filter((s) => s.status === "재직").length;
  const leave = staffList.filter((s) => s.status === "휴직").length;

  function handleSave(updated: Staff) {
    setStaffList((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    setEditStaff(null);
    toast(`${updated.name} 직원 정보가 저장되었습니다`);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: C.textMuted }}>
          전체 <b style={{ color: C.ink }}>{staffList.length}명</b> · 재직 {active} · 휴직 {leave}
        </div>
        <WardBtn variant="primary" icon={WardIcons.plus(16, "#fff")} onClick={() => toast("직원 추가 화면을 준비 중입니다")}>직원 추가</WardBtn>
      </div>

      <WardCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", gap: 9, alignItems: "center" }}>
          <WardSearchInput value={q} onChange={setQ} placeholder="이름 · 연락처 검색" />
          <WardSelect value={roleF} onChange={setRoleF} options={["전체 직책", "수간호사", "간호사", "간호조무사"]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: HEAD, padding: "11px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
          <span>이름</span><span>직책</span><span>입사일</span><span>연락처</span><span>상태</span><span></span>
        </div>
        {rows.map((s, i) => (
          <div key={s.id} onClick={() => setEditStaff(s)}
            style={{ display: "grid", gridTemplateColumns: HEAD, padding: "13px 18px", alignItems: "center", fontSize: 13, cursor: "pointer", borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : "none" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.primarySoft + "55"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDeep})`, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.name.slice(0, 1)}</div>
              <span style={{ fontWeight: 700, color: C.ink }}>{s.name}</span>
            </div>
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

      <WardModal open={!!editStaff} onClose={() => setEditStaff(null)} width={440}>
        {editStaff && (
          <StaffEditForm staff={editStaff} onClose={() => setEditStaff(null)} onSave={handleSave} />
        )}
      </WardModal>
    </div>
  );
}
