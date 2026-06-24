"use client";

import React, { useState, useEffect, useRef } from "react";
import { C, FONT, WardIcons, WardToast } from "@/shared/ui/WardUI";
import { WardSidebar } from "./WardSidebar";
import { WardTopbar } from "./WardTopbar";
import { TabStatus } from "./tabs/TabStatus";
import { TabPatients } from "./tabs/TabPatients";
import { TabLeave } from "./tabs/TabLeave";
import { TabExam } from "./tabs/TabExam";
import { TabShift } from "./tabs/TabShift";
import { TabStaff } from "./tabs/TabStaff";
import { ApprovalPage } from "@/features/approval/components/ApprovalPage";
import { DraftPage } from "@/features/approval/components/DraftPage";
import {
  ACCOUNTS, INIT_LEAVES, INIT_DOCS, APPROVERS, TODAY, DOC_FORMS,
} from "@/features/ward-dashboard/data";
import type { WardAccount, WardRoute, WardTab, Leave, ApprovalDoc } from "@/features/ward-dashboard/types";

const WARD_TABS: { id: WardTab; label: string; icon: keyof typeof WardIcons }[] = [
  { id: "status", label: "현황", icon: "grid" },
  { id: "patients", label: "환자", icon: "bed" },
  { id: "leave", label: "외박·외출", icon: "door" },
  { id: "exam", label: "검사 일정", icon: "clipboard" },
  { id: "shift", label: "근무표", icon: "table" },
  { id: "staff", label: "직원", icon: "users" },
];

function TabBar({ tab, onTab }: { tab: WardTab; onTab: (t: WardTab) => void }) {
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 22 }}>
      {WARD_TABS.map((t) => {
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

export function WardApp() {
  const [route, setRoute] = useState<WardRoute>(() => {
    if (typeof window !== "undefined") {
      const r = localStorage.getItem("nd_route") as WardRoute | null;
      return (r === "ward" || r === "approval" || r === "draft") ? r : "ward";
    }
    return "ward";
  });
  const [tab, setTab] = useState<WardTab>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("nd_tab") as WardTab) || "status";
    }
    return "status";
  });
  const [user, setUser] = useState<WardAccount>(ACCOUNTS[0]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>(INIT_LEAVES);
  const [docs, setDocs] = useState<ApprovalDoc[]>(INIT_DOCS);
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [compose, setCompose] = useState<{ open: boolean; form?: string }>({ open: false });
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { localStorage.setItem("nd_route", route); }, [route]);
  useEffect(() => { localStorage.setItem("nd_tab", tab); }, [tab]);
  useEffect(() => {
    function h(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenDocId(null);
        setCompose({ open: false });
        setPatientId(null);
      }
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

  function switchUser(acc: WardAccount) {
    setUser(acc);
    setPatientId(null);
    if (!acc.canApprove && (route === "approval" || route === "draft")) setRoute("ward");
    toast(`${acc.name} ${acc.role} · ${acc.canApprove ? "결재권 계정으로 전환" : "열람 계정으로 전환"}`);
  }

  function handleApprove(id: string) {
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
      return { ...d, line, status: allDone ? "완료" : "진행중" };
    }));
    setOpenDocId(null);
    toast("결재를 승인했습니다");
  }

  function handleReject(id: string, memo: string) {
    setDocs((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const line = d.line.map((s) => ({ ...s }));
      const idx = line.findIndex((s) => s.status === "결재중");
      if (idx >= 0) { line[idx].status = "반려"; line[idx].at = nowStamp(); if (memo) line[idx].memo = memo; }
      return { ...d, line, status: "반려" };
    }));
    setOpenDocId(null);
    toast("결재를 반려했습니다");
  }

  function handleSubmitDoc({ form, title, content }: { form: string; title: string; content: string }) {
    const nid = "A" + (25 + docs.filter((d) => d.box === "sent").length);
    const newDoc: ApprovalDoc = {
      id: nid, box: "sent", form, title,
      drafter: { name: user.name, role: user.role }, date: TODAY, status: "진행중",
      body: content ? [["내용", content]] : [["내용", "(본문 없음)"]],
      line: [
        { name: user.name, role: user.role, kind: "기안", status: "승인", at: nowStamp(), me: true },
        { name: APPROVERS.head.name, role: APPROVERS.head.role, kind: "검토", status: "결재중", at: null },
        { name: APPROVERS.exec.name, role: APPROVERS.exec.role, kind: "결재", status: "대기", at: null },
      ],
    };
    setDocs((prev) => [newDoc, ...prev]);
    setCompose({ open: false });
    toast("기안을 상신했습니다");
  }

  const pendingCount = user.canApprove
    ? docs.filter((d) => d.box === "received" && d.status === "결재대기").length
    : 0;

  const meta = route === "approval" && user.canApprove
    ? { title: "전자결재", crumbs: ["간호과", "결재함"] }
    : route === "draft" && user.canApprove
    ? { title: "전자결재", crumbs: ["간호과", "기안 결재"] }
    : { title: user.ward.name, crumbs: [user.ward.dept, WARD_TABS.find((t) => t.id === tab)?.label ?? ""] };

  return (
    <div style={{ display: "flex", height: "100vh", minWidth: 1280, background: C.bg, fontFamily: FONT, color: C.ink, WebkitFontSmoothing: "antialiased" }}>
      <WardSidebar
        route={route}
        onNav={(r) => {
          if (!user.canApprove && r !== "ward") return;
          setRoute(r);
        }}
        user={user}
        pendingCount={pendingCount}
        onLogout={() => toast("로그아웃 기능은 메인 ERP에서 사용하세요")}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <WardTopbar
          title={meta.title}
          crumbs={meta.crumbs}
          user={user}
          today={TODAY}
          onSwitch={switchUser}
        />
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px" }}>
          {route === "ward" && (
            <>
              <TabBar tab={tab} onTab={(t) => { setPatientId(null); setTab(t); }} />
              {tab === "status" && <TabStatus leaves={leaves} onOpenPatient={setPatientId} goTab={(t) => setTab(t as WardTab)} />}
              {tab === "patients" && <TabPatients onOpenPatient={setPatientId} selectedPatientId={patientId} onClosePatient={() => setPatientId(null)} toast={toast} />}
              {tab === "leave" && <TabLeave leaves={leaves} onAddLeave={(l) => setLeaves((prev) => [l, ...prev])} toast={toast} />}
              {tab === "exam" && <TabExam toast={toast} />}
              {tab === "shift" && <TabShift toast={toast} />}
              {tab === "staff" && <TabStaff toast={toast} />}
            </>
          )}
          {route === "approval" && user.canApprove && (
            <ApprovalPage
              docs={docs}
              onApprove={handleApprove}
              onReject={handleReject}
              setOpenId={setOpenDocId}
              openId={openDocId}
            />
          )}
          {route === "draft" && user.canApprove && (
            <DraftPage
              docs={docs}
              onSubmit={handleSubmitDoc}
              setOpenId={setOpenDocId}
              openId={openDocId}
              compose={compose}
              setCompose={setCompose}
              forms={DOC_FORMS}
              approvers={APPROVERS}
            />
          )}
        </div>
      </div>
      <WardToast msg={toastMsg} />
    </div>
  );
}
