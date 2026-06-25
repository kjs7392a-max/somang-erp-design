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
