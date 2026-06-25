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
