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
