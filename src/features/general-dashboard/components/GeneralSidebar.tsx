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
