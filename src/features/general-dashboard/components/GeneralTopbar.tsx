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
