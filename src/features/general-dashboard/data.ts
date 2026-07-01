// src/features/general-dashboard/data.ts
import type {
  GeneralAccount, GeneralStaff, LeaveRequest, LeaveBalance, LeaveKind,
} from "./types";
import type { ApprovalDoc, DocForm, Approvers } from "@/features/approval/types";

export const TODAY = "2026-06-25";

export const G_ACCOUNTS: GeneralAccount[] = [
  { id: "g1", name: "김총무", role: "총무과장", dept: "총무과", canApprove: true },
  { id: "g2", name: "이행정", role: "총무주임", dept: "총무과", canApprove: true },
  { id: "g3", name: "박서무", role: "사원", dept: "총무과", canApprove: false },
];

export const G_DEPTS = ["간호과", "원무과", "총무과", "진료지원", "약제과", "영양과", "시설관리"];

export const G_STAFF: GeneralStaff[] = [
  { id: "e01", name: "이강표", dept: "총무과", role: "대표이사", join: "2008-01-02", contact: "010-2211-0001", status: "재직" },
  { id: "e02", name: "김총무", dept: "총무과", role: "총무과장", join: "2012-03-05", contact: "010-2211-0002", status: "재직" },
  { id: "e03", name: "이행정", dept: "총무과", role: "총무주임", join: "2016-07-11", contact: "010-2211-0003", status: "재직" },
  { id: "e04", name: "박서무", dept: "총무과", role: "사원", join: "2022-09-01", contact: "010-2211-0004", status: "재직" },
  { id: "e05", name: "정현숙", dept: "간호과", role: "간호부장", join: "2010-04-12", contact: "010-2211-0005", status: "재직" },
  { id: "e06", name: "이수진", dept: "간호과", role: "수간호사", join: "2009-03-02", contact: "010-2211-0006", status: "재직" },
  { id: "e07", name: "박지영", dept: "간호과", role: "간호사", join: "2019-07-15", contact: "010-2211-0007", status: "재직" },
  { id: "e08", name: "최유나", dept: "간호과", role: "간호사", join: "2021-09-01", contact: "010-2211-0008", status: "휴직" },
  { id: "e09", name: "강나래", dept: "간호과", role: "간호조무사", join: "2018-05-22", contact: "010-2211-0009", status: "재직" },
  { id: "e10", name: "한지민", dept: "원무과", role: "원무과장", join: "2013-02-18", contact: "010-2211-0010", status: "재직" },
  { id: "e11", name: "오세훈", dept: "원무과", role: "주임", join: "2018-11-05", contact: "010-2211-0011", status: "재직" },
  { id: "e12", name: "윤도경", dept: "원무과", role: "사원", join: "2023-03-20", contact: "010-2211-0012", status: "재직" },
  { id: "e13", name: "김도현", dept: "진료지원", role: "전문의", join: "2015-03-02", contact: "010-2211-0013", status: "재직" },
  { id: "e14", name: "이정민", dept: "진료지원", role: "전문의", join: "2017-09-01", contact: "010-2211-0014", status: "재직" },
  { id: "e15", name: "장미선", dept: "약제과", role: "약제과장", join: "2014-06-09", contact: "010-2211-0015", status: "재직" },
  { id: "e16", name: "조한별", dept: "약제과", role: "약사", join: "2020-08-17", contact: "010-2211-0016", status: "재직" },
  { id: "e17", name: "신영아", dept: "영양과", role: "영양사", join: "2019-04-01", contact: "010-2211-0017", status: "재직" },
  { id: "e18", name: "권민재", dept: "시설관리", role: "시설팀장", join: "2011-10-04", contact: "010-2211-0018", status: "재직" },
  { id: "e19", name: "황보름", dept: "시설관리", role: "기사", join: "2021-01-11", contact: "010-2211-0019", status: "재직" },
  { id: "e20", name: "남기훈", dept: "시설관리", role: "기사", join: "2024-05-02", contact: "010-2211-0020", status: "재직" },
];

export const INIT_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "G07", staffId: "e07", name: "박지영", dept: "간호과", kind: "년차", start: "2026-06-25", end: "2026-06-26", days: 2, reason: "가족 행사 참석", status: "승인", docId: "GA12" },
  { id: "G06", staffId: "e11", name: "오세훈", dept: "원무과", kind: "반차", start: "2026-06-25", end: "2026-06-25", days: 0.5, reason: "오후 병원 진료", status: "승인" },
  { id: "G05", staffId: "e16", name: "조한별", dept: "약제과", kind: "년차", start: "2026-06-22", end: "2026-06-22", days: 1, reason: "개인 사유", status: "승인" },
  { id: "G04", staffId: "e12", name: "윤도경", dept: "원무과", kind: "병가", start: "2026-06-29", end: "2026-06-30", days: 2, reason: "독감 치료", status: "대기", docId: "GA10" },
  { id: "G03", staffId: "e19", name: "황보름", dept: "시설관리", kind: "년차", start: "2026-07-01", end: "2026-07-03", days: 3, reason: "여름 휴가", status: "대기", docId: "GA09" },
  { id: "G02", staffId: "e09", name: "강나래", dept: "간호과", kind: "경조", start: "2026-06-18", end: "2026-06-19", days: 2, reason: "조부상", status: "승인" },
  { id: "G01", staffId: "e17", name: "신영아", dept: "영양과", kind: "공가", start: "2026-06-15", end: "2026-06-15", days: 1, reason: "예비군 훈련", status: "승인" },
];

export const LEAVE_BALANCES: LeaveBalance[] = [
  { staffId: "e06", name: "이수진", dept: "간호과", granted: 20, used: 8, remain: 12 },
  { staffId: "e07", name: "박지영", dept: "간호과", granted: 16, used: 9, remain: 7 },
  { staffId: "e09", name: "강나래", dept: "간호과", granted: 17, used: 11, remain: 6 },
  { staffId: "e11", name: "오세훈", dept: "원무과", granted: 16, used: 6.5, remain: 9.5 },
  { staffId: "e12", name: "윤도경", dept: "원무과", granted: 15, used: 4, remain: 11 },
  { staffId: "e16", name: "조한별", dept: "약제과", granted: 15, used: 5, remain: 10 },
  { staffId: "e17", name: "신영아", dept: "영양과", granted: 16, used: 7, remain: 9 },
  { staffId: "e19", name: "황보름", dept: "시설관리", granted: 15, used: 3, remain: 12 },
];

export const G_APPROVERS: Approvers = {
  head: { name: "김총무", role: "총무과장" },
  exec: { name: "한영태", role: "행정원장" },
};

export const G_DOC_FORMS: DocForm[] = [
  { id: "annual", label: "연차 휴가 신청서", icon: "calendar", fields: ["기간", "사유"] },
  { id: "half", label: "반차 신청서", icon: "clock", fields: ["일자", "구분", "사유"] },
  { id: "sick", label: "병가 신청서", icon: "file", fields: ["기간", "사유", "증빙"] },
  { id: "family", label: "경조 휴가 신청서", icon: "users", fields: ["사유", "기간"] },
  { id: "official", label: "공가 신청서", icon: "stamp", fields: ["사유", "일자"] },
  { id: "purchase", label: "물품 구매 요청서", icon: "building", fields: ["품목", "수량", "사유"] },
  { id: "report", label: "업무 보고서", icon: "file", fields: ["제목", "내용"] },
];

export const KIND_TO_FORM: Record<LeaveKind, string> = {
  년차: "annual", 반차: "half", 병가: "sick", 경조: "family", 공가: "official",
};

export const G_INIT_DOCS: ApprovalDoc[] = [
  {
    id: "GA10", box: "received", form: "sick", title: "병가 신청서 (윤도경, 6/29~6/30)",
    drafter: { name: "윤도경", role: "사원" }, date: "2026-06-24", status: "결재대기",
    body: [["신청자", "윤도경 (원무과)"], ["휴가 구분", "병가 (2일)"], ["기간", "2026.06.29 ~ 2026.06.30"], ["사유", "독감 치료"]],
    line: [
      { name: "윤도경", role: "사원", kind: "기안", status: "승인", at: "06-24 10:10" },
      { name: "김총무", role: "총무과장", kind: "결재", status: "결재중", at: null, me: true },
    ],
  },
  {
    id: "GA09", box: "received", form: "annual", title: "연차 휴가 신청서 (황보름, 7/1~7/3)",
    drafter: { name: "황보름", role: "기사" }, date: "2026-06-23", status: "결재대기",
    body: [["신청자", "황보름 (시설관리)"], ["휴가 구분", "년차 (3일)"], ["기간", "2026.07.01 ~ 2026.07.03"], ["사유", "여름 휴가"]],
    line: [
      { name: "황보름", role: "기사", kind: "기안", status: "승인", at: "06-23 16:30" },
      { name: "김총무", role: "총무과장", kind: "검토", status: "결재중", at: null, me: true },
      { name: "한영태", role: "행정원장", kind: "결재", status: "대기", at: null },
    ],
  },
  {
    id: "GA08", box: "sent", form: "purchase", title: "사무용품 구매 요청서 (복합기 토너)",
    drafter: { name: "김총무", role: "총무과장" }, date: "2026-06-22", status: "진행중",
    body: [["품목", "복합기 토너 (검정)"], ["수량", "5 개"], ["추정 단가", "65,000원"], ["사유", "행정실 재고 소진"]],
    line: [
      { name: "김총무", role: "총무과장", kind: "기안", status: "승인", at: "06-22 09:40", me: true },
      { name: "한영태", role: "행정원장", kind: "결재", status: "결재중", at: null },
    ],
  },
  {
    id: "GA12", box: "sent", form: "annual", title: "연차 휴가 신청서 (박지영, 6/25~6/26)",
    drafter: { name: "박지영", role: "간호사" }, date: "2026-06-20", status: "완료",
    body: [["신청자", "박지영 (간호과)"], ["휴가 구분", "년차 (2일)"], ["기간", "2026.06.25 ~ 2026.06.26"], ["사유", "가족 행사 참석"]],
    line: [
      { name: "박지영", role: "간호사", kind: "기안", status: "승인", at: "06-20 11:00" },
      { name: "김총무", role: "총무과장", kind: "결재", status: "승인", at: "06-20 14:20" },
    ],
  },
];

/** 휴가 일수 계산 — 반차는 0.5일, 그 외는 날짜 포함 일수 */
export function leaveDaysBetween(start: string, end: string, kind: LeaveKind): number {
  if (kind === "반차") return 0.5;
  const a = new Date(start.slice(0, 10) + "T00:00:00");
  const b = new Date(end.slice(0, 10) + "T00:00:00");
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export interface GeneralKpi {
  totalStaff: number;
  pendingApproval: number;
  onLeaveToday: number;
  monthLeaveCount: number;
}

export function computeGeneralKpi(
  staff: GeneralStaff[], leaves: LeaveRequest[], docs: ApprovalDoc[],
): GeneralKpi {
  const today = TODAY;
  const month = TODAY.slice(0, 7);
  return {
    totalStaff: staff.filter((s) => s.status === "재직").length,
    pendingApproval: docs.filter((d) => d.box === "received" && d.status === "결재대기").length,
    onLeaveToday: leaves.filter(
      (l) => l.status === "승인" && l.start.slice(0, 10) <= today && today <= l.end.slice(0, 10),
    ).length,
    monthLeaveCount: leaves.filter((l) => l.start.slice(0, 7) === month).length,
  };
}
