"use client";

import React, { useState } from "react";
import { C, FONT, MONO, WardCard, WardBadge, WardBtn, WardSearchInput, WardSelect, WardSlidePanel, WardIcons, fmtDot, fmtDT } from "@/shared/ui/WardUI";
import { PATIENTS, DOCTORS, INIT_LEAVES, EXAMS, leaveDays, TODAY } from "@/features/ward-dashboard/data";
import type { Patient } from "@/features/ward-dashboard/types";

interface Props {
  onOpenPatient: (id: string) => void;
  selectedPatientId: string | null;
  onClosePatient: () => void;
  toast: (msg: string) => void;
}

function PatientPanel({ patient, onClose, toast }: { patient: Patient | undefined; onClose: () => void; toast: (m: string) => void }) {
  if (!patient) return null;
  const p = patient;
  const lv = INIT_LEAVES.find((l) => l.name === p.name && l.status !== "복귀완료");
  const exams = EXAMS.filter((e) => e.name === p.name);

  const Field = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div>
      <div style={{ fontSize: 11, color: C.textFaint, fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, fontFamily: mono ? MONO : FONT }}>{value}</div>
    </div>
  );

  return (
    <>
      {/* 헤더 */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.primarySoft}, #f1fafc)` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: C.primaryDeep }}>
              {p.name.slice(0, 1)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>{p.name}</span>
                <WardBadge tone={p.status === "외박" ? "oebak" : p.status === "외출" ? "oechul" : "info"} dot>{p.status}</WardBadge>
              </div>
              <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 3 }}>{p.age}세 · {p.sex} · <span style={{ fontFamily: MONO }}>{p.bed}</span></div>
            </div>
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: C.textMuted, padding: 4 }}>
            {WardIcons.close(20, C.textMuted)}
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", display: "flex", flexDirection: "column", gap: 22 }}>
        {p.risk !== "—" && (
          <div style={{ padding: "11px 14px", borderRadius: 9, background: C.warnBg, border: `1px solid ${C.warn}33`, display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "#7a430a", fontWeight: 600 }}>
            {WardIcons.flame(16, C.warn)} 주의사항 · {p.risk}
          </div>
        )}
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.textMuted, letterSpacing: "0.04em", marginBottom: 12 }}>입원 정보</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="진단명" value={p.dx} />
            <Field label="담당의" value={`${p.doctor} 전문의`} />
            <Field label="입원일" value={fmtDot(p.admit)} mono />
            <Field label="재원일수" value={`${leaveDays(p.admit, TODAY)}일`} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.textMuted, letterSpacing: "0.04em", marginBottom: 12 }}>보호자</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="보호자" value={p.guardian} />
            <Field label="연락처" value={p.contact} mono />
          </div>
        </div>
        {lv && (
          <div style={{ padding: "14px 16px", borderRadius: 11, background: lv.type === "외박" ? C.oebakBg : C.oechulBg, border: `1px solid ${(lv.type === "외박" ? C.oebak : C.oechul)}26` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              {WardIcons.door(15, lv.type === "외박" ? C.oebak : C.oechul)}
              <span style={{ fontSize: 12.5, fontWeight: 700, color: lv.type === "외박" ? C.oebak : C.oechul }}>{lv.status}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="출발일시" value={fmtDT(lv.depart)} mono />
              <Field label="복귀예정" value={fmtDT(lv.expect)} mono />
              <div style={{ gridColumn: "1/-1" }}><Field label="사유" value={lv.reason} /></div>
            </div>
          </div>
        )}
        {exams.length > 0 && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.textMuted, letterSpacing: "0.04em", marginBottom: 10 }}>예정 검사</div>
            {exams.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < exams.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                <span style={{ fontSize: 12, fontFamily: MONO, color: C.textMuted }}>{e.date.slice(5)} {e.time}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, flex: 1 }}>{e.type}</span>
                <span style={{ fontSize: 11, color: C.textFaint }}>{e.room}</span>
                {e.done && <WardBadge tone="ok">완료</WardBadge>}
              </div>
            ))}
          </div>
        )}
        {p.note && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.textMuted, letterSpacing: "0.04em", marginBottom: 8 }}>간호 메모</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, padding: "12px 14px", background: C.bg, borderRadius: 9 }}>{p.note}</div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 9, justifyContent: "flex-end" }}>
        <WardBtn variant="ghost" onClick={() => toast("간호 기록 화면을 준비 중입니다")}>간호 기록</WardBtn>
        <WardBtn variant="primary" onClick={() => toast("정보 수정 화면을 준비 중입니다")}>정보 수정</WardBtn>
      </div>
    </>
  );
}

export function TabPatients({ onOpenPatient, selectedPatientId, onClosePatient, toast }: Props) {
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("전체 상태");
  const [docF, setDocF] = useState("전체 담당의");

  const rows = PATIENTS.filter((p) => {
    if (q && !(p.name.includes(q) || p.bed.includes(q) || p.dx.includes(q))) return false;
    if (statusF !== "전체 상태" && p.status !== statusF) return false;
    if (docF !== "전체 담당의" && p.doctor !== docF) return false;
    return true;
  });

  const HEAD = "100px 1.1fr 84px 96px 88px 88px 40px";
  const selectedPatient = PATIENTS.find((p) => p.id === selectedPatientId);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: C.textMuted, whiteSpace: "nowrap" }}>
          전체 <b style={{ color: C.ink }}>{PATIENTS.length}명</b> · 입원중 {PATIENTS.filter(p => p.status === "입원중").length} · 외박 {PATIENTS.filter(p => p.status === "외박").length} · 외출 {PATIENTS.filter(p => p.status === "외출").length}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <WardBtn variant="ghost" icon={WardIcons.download(16, C.textMuted)} onClick={() => toast("퇴원 처리 화면으로 이동합니다")}>퇴원 처리</WardBtn>
          <WardBtn variant="primary" icon={WardIcons.plus(16, "#fff")} onClick={() => toast("입원 등록 폼을 준비 중입니다")}>입원 등록</WardBtn>
        </div>
      </div>

      <WardCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", gap: 9, alignItems: "center" }}>
          <WardSearchInput value={q} onChange={setQ} placeholder="환자명 · 병상번호 · 진단 검색" />
          <WardSelect value={statusF} onChange={setStatusF} options={["전체 상태", "입원중", "외박", "외출"]} />
          <WardSelect value={docF} onChange={setDocF} options={["전체 담당의", ...DOCTORS]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: HEAD, padding: "11px 18px", fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, borderBottom: `1px solid ${C.border}`, letterSpacing: "0.02em" }}>
          <span>병상번호</span><span>환자명 / 진단</span><span>나이/성별</span><span>입원일</span><span>담당의</span><span>상태</span><span></span>
        </div>
        {rows.map((p, i) => (
          <div key={p.id} onClick={() => onOpenPatient(p.id)}
            style={{ display: "grid", gridTemplateColumns: HEAD, padding: "13px 18px", alignItems: "center", fontSize: 13, color: C.textDark, cursor: "pointer", borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : "none", transition: "background 0.1s" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.primarySoft + "55"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.textMuted }}>{p.bed}</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                {p.name}
                {p.risk !== "—" && <span title={p.risk} style={{ fontSize: 9.5, fontWeight: 700, color: C.warn, background: C.warnBg, padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>⚠ {p.risk}</span>}
              </div>
              <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{p.dx}</div>
            </div>
            <span style={{ color: C.textMuted }}>{p.age}세 · {p.sex}</span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.textMuted }}>{fmtDot(p.admit)}</span>
            <span style={{ color: C.textDark, fontWeight: 500 }}>{p.doctor}</span>
            <span><WardBadge tone={p.status === "외박" ? "oebak" : p.status === "외출" ? "oechul" : "info"} dot>{p.status}</WardBadge></span>
            <span style={{ color: C.textFaint, textAlign: "center", display: "flex", justifyContent: "center" }}>{WardIcons.chevR(16, C.textFaint)}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: C.textFaint, fontSize: 13 }}>조건에 맞는 환자가 없습니다.</div>
        )}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.borderSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: C.textMuted }}>
          <span>{rows.length}명 표시 / 전체 {PATIENTS.length}명</span>
          <span style={{ color: C.textFaint }}>행을 클릭하면 환자 상세가 우측에서 열립니다</span>
        </div>
      </WardCard>

      <WardSlidePanel open={!!selectedPatient} onClose={onClosePatient} width={448}>
        <PatientPanel patient={selectedPatient} onClose={onClosePatient} toast={toast} />
      </WardSlidePanel>
    </div>
  );
}
