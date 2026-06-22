import type {
  WardInfo, WardAccount, Patient, Leave, Exam,
  ShiftRow, ShiftCode, ShiftCodeMeta, Staff, ApprovalDoc,
} from "./types";

export const TODAY = "2026-06-07";
export const CAL_YEAR = 2026;
export const CAL_MONTH = 6;
export const DAYS_IN_MONTH = new Date(CAL_YEAR, CAL_MONTH, 0).getDate(); // 30

export const WARD: WardInfo = { name: "11병동", dept: "정신건강의학과 · 폐쇄병동", code: "N" };

export const ACCOUNTS: WardAccount[] = [
  { id: "u1", name: "이수진", role: "수간호사", dept: "간호과", ward: WARD, canApprove: true },
  { id: "u2", name: "정현숙", role: "간호부장", dept: "간호과", ward: WARD, canApprove: true },
  { id: "u3", name: "박지영", role: "간호사", dept: "간호과", ward: WARD, canApprove: false },
  { id: "u4", name: "강나래", role: "간호조무사", dept: "간호과", ward: WARD, canApprove: false },
];

export const DOCTORS = ["김도현", "이정민", "박서윤"];

export const PATIENTS: Patient[] = [
  { id: "p01", bed: "1101-1", name: "한정수", age: 54, sex: "남", admit: "2025-12-18", doctor: "김도현", status: "입원중", dx: "조현병", guardian: "한미래 (자녀)", contact: "010-2231-8841", risk: "낙상 주의", note: "약물 순응도 양호. 환청 빈도 감소 추세." },
  { id: "p02", bed: "1101-2", name: "오태경", age: 47, sex: "남", admit: "2026-03-03", doctor: "김도현", status: "외박", dx: "알코올 사용장애", guardian: "오정훈 (형제)", contact: "010-5512-3390", risk: "—", note: "주말 외박 — 가족 행사 참석." },
  { id: "p03", bed: "1102-1", name: "문상철", age: 61, sex: "남", admit: "2025-11-20", doctor: "이정민", status: "입원중", dx: "양극성 정동장애", guardian: "문지영 (배우자)", contact: "010-3340-7712", risk: "자해 이력", note: "기분 안정 단계. 외출 점진 허용 검토." },
  { id: "p04", bed: "1102-2", name: "강민호", age: 39, sex: "남", admit: "2026-04-18", doctor: "이정민", status: "외출", dx: "조현정동장애", guardian: "강은비 (자녀)", contact: "010-7781-2245", risk: "—", note: "외래 진료차 동반 외출." },
  { id: "p05", bed: "1103-1", name: "임재현", age: 28, sex: "남", admit: "2026-05-22", doctor: "박서윤", status: "입원중", dx: "주요 우울장애", guardian: "임선화 (부모)", contact: "010-2290-5567", risk: "자살 사고 모니터링", note: "정서 관찰 강화. 1:1 관찰 해제 검토." },
  { id: "p06", bed: "1103-2", name: "신동욱", age: 45, sex: "남", admit: "2026-02-14", doctor: "김도현", status: "입원중", dx: "조현병", guardian: "신경자 (부모)", contact: "010-6678-1120", risk: "—", note: "사회기술훈련 프로그램 참여 중." },
  { id: "p07", bed: "1105-1", name: "권혁수", age: 52, sex: "남", admit: "2026-03-27", doctor: "이정민", status: "입원중", dx: "알코올 사용장애", guardian: "권나연 (자녀)", contact: "010-8845-9921", risk: "금단 경과 관찰", note: "간기능 추적 검사 예정." },
  { id: "p08", bed: "1105-2", name: "배준영", age: 33, sex: "남", admit: "2026-05-30", doctor: "박서윤", status: "입원중", dx: "양극성 정동장애", guardian: "배성호 (부모)", contact: "010-3312-6690", risk: "—", note: "입원 초기. 수면 패턴 조정 중." },
  { id: "p09", bed: "1106-1", name: "황도식", age: 58, sex: "남", admit: "2026-01-09", doctor: "김도현", status: "외박", dx: "치매 (BPSD)", guardian: "황인선 (자녀)", contact: "010-9921-3345", risk: "배회·낙상 고위험", note: "보호자 동반 외박. 약물 지참 안내 완료." },
  { id: "p10", bed: "1107-1", name: "김미경", age: 49, sex: "여", admit: "2026-01-30", doctor: "박서윤", status: "외박", dx: "주요 우울장애", guardian: "김태식 (배우자)", contact: "010-4471-2278", risk: "—", note: "외박 적응 평가 단계." },
  { id: "p11", bed: "1107-2", name: "정은주", age: 58, sex: "여", admit: "2025-12-05", doctor: "이정민", status: "입원중", dx: "조현병", guardian: "정민재 (자녀)", contact: "010-5590-8812", risk: "—", note: "음성증상 위주. 작업치료 병행." },
  { id: "p12", bed: "1108-1", name: "윤소희", age: 36, sex: "여", admit: "2026-04-02", doctor: "김도현", status: "입원중", dx: "공황장애 / 우울", guardian: "윤재호 (부모)", contact: "010-2218-7740", risk: "—", note: "공황 발작 빈도 감소. 호흡 이완 훈련." },
  { id: "p13", bed: "1108-2", name: "한지원", age: 41, sex: "여", admit: "2026-05-11", doctor: "박서윤", status: "외출", dx: "양극성 정동장애", guardian: "한승우 (배우자)", contact: "010-7732-3349", risk: "—", note: "은행 업무차 보호자 동반 외출." },
  { id: "p14", bed: "1109-1", name: "조영란", age: 63, sex: "여", admit: "2026-02-22", doctor: "이정민", status: "입원중", dx: "치매 (BPSD)", guardian: "조현우 (자녀)", contact: "010-3360-1182", risk: "배회 주의", note: "야간 초조 증상. 환경 조정 적용." },
  { id: "p15", bed: "1109-2", name: "송미영", age: 44, sex: "여", admit: "2026-03-15", doctor: "김도현", status: "입원중", dx: "조현정동장애", guardian: "송기철 (부모)", contact: "010-6614-5523", risk: "—", note: "퇴원 계획 수립 중. 자조모임 연계." },
  { id: "p16", bed: "1110-1", name: "백현주", age: 31, sex: "여", admit: "2026-05-25", doctor: "박서윤", status: "입원중", dx: "경계성 인격장애", guardian: "백승현 (부모)", contact: "010-2247-9980", risk: "자해 이력", note: "변증법적 행동치료(DBT) 프로그램 참여." },
  { id: "p17", bed: "1110-2", name: "노수정", age: 55, sex: "여", admit: "2026-01-08", doctor: "김도현", status: "외박", dx: "주요 우울장애", guardian: "노태민 (배우자)", contact: "010-8819-2231", risk: "—", note: "장기 외박 평가. 복귀 후 퇴원 면담 예정." },
  { id: "p18", bed: "1111-1", name: "서동철", age: 50, sex: "남", admit: "2026-04-29", doctor: "이정민", status: "입원중", dx: "알코올 사용장애", guardian: "서유진 (자녀)", contact: "010-3391-6678", risk: "—", note: "단주 동기강화 상담 진행." },
  { id: "p19", bed: "1112-1", name: "명진숙", age: 67, sex: "여", admit: "2025-10-30", doctor: "박서윤", status: "입원중", dx: "치매 (BPSD)", guardian: "명재석 (자녀)", contact: "010-5572-3018", risk: "낙상·연하곤란", note: "식이 형태 조정. 연하 재활 협진." },
  { id: "p20", bed: "1112-2", name: "유경아", age: 38, sex: "여", admit: "2026-06-01", doctor: "김도현", status: "입원중", dx: "주요 우울장애", guardian: "유성민 (배우자)", contact: "010-7740-2298", risk: "자살 사고 모니터링", note: "신규 입원. 초기 평가 진행 중." },
];

export const INIT_LEAVES: Leave[] = [
  { id: "L10", name: "황도식", bed: "1106-1", type: "외박", depart: "2026-06-07T09:00", expect: "2026-06-09T16:00", returned: null, reason: "보호자 동반 가정 적응 외박", registrar: "이수진", status: "외박중" },
  { id: "L09", name: "노수정", bed: "1110-2", type: "외박", depart: "2026-06-07T11:00", expect: "2026-06-10T15:00", returned: null, reason: "장기 외박 평가 (퇴원 전 단계)", registrar: "박지영", status: "외박중" },
  { id: "L08", name: "오태경", bed: "1101-2", type: "외박", depart: "2026-06-06T10:00", expect: "2026-06-08T17:00", returned: null, reason: "가족 행사 참석", registrar: "김수민", status: "외박중" },
  { id: "L07", name: "김미경", bed: "1107-1", type: "외박", depart: "2026-06-06T14:00", expect: "2026-06-08T18:00", returned: null, reason: "외박 적응 평가", registrar: "이수진", status: "외박중" },
  { id: "L06", name: "강민호", bed: "1102-2", type: "외출", depart: "2026-06-07T10:00", expect: "2026-06-07T17:00", returned: null, reason: "외래 진료 (정형외과)", registrar: "최유나", status: "외출중" },
  { id: "L05", name: "한지원", bed: "1108-2", type: "외출", depart: "2026-06-07T13:00", expect: "2026-06-07T18:00", returned: null, reason: "은행 업무 (보호자 동반)", registrar: "한가은", status: "외출중" },
  { id: "L04", name: "송미영", bed: "1109-2", type: "외출", depart: "2026-06-06T11:00", expect: "2026-06-06T17:00", returned: "2026-06-06T16:55", reason: "자조모임 참석", registrar: "조민서", status: "복귀완료" },
  { id: "L03", name: "권혁수", bed: "1105-1", type: "외출", depart: "2026-06-05T10:00", expect: "2026-06-05T16:00", returned: "2026-06-05T15:40", reason: "외래 진료 (내과)", registrar: "김수민", status: "복귀완료" },
  { id: "L02", name: "서동철", bed: "1111-1", type: "외출", depart: "2026-06-04T09:00", expect: "2026-06-04T15:00", returned: "2026-06-04T14:50", reason: "법원 출석", registrar: "박지영", status: "복귀완료" },
  { id: "L01", name: "정은주", bed: "1107-2", type: "외박", depart: "2026-06-02T10:00", expect: "2026-06-05T17:00", returned: "2026-06-05T16:30", reason: "가정 외박 (3박 4일)", registrar: "이수진", status: "복귀완료" },
];

export const EXAMS: Exam[] = [
  { date: "2026-06-05", time: "09:00", name: "한지원", bed: "1108-2", type: "혈액검사", room: "검사실 A", staff: "임상병리실", done: true },
  { date: "2026-06-07", time: "09:00", name: "한정수", bed: "1101-1", type: "혈액검사", room: "검사실 A", staff: "임상병리실" },
  { date: "2026-06-07", time: "10:30", name: "문상철", bed: "1102-1", type: "심전도 (EKG)", room: "검사실 A", staff: "김도현" },
  { date: "2026-06-07", time: "14:00", name: "정은주", bed: "1107-2", type: "뇌파 (EEG)", room: "검사실 B", staff: "박서윤" },
  { date: "2026-06-08", time: "09:30", name: "임재현", bed: "1103-1", type: "심리검사 (MMPI-2)", room: "심리검사실", staff: "임상심리사" },
  { date: "2026-06-08", time: "11:00", name: "백현주", bed: "1110-1", type: "심리검사 (MMPI-2)", room: "심리검사실", staff: "임상심리사" },
  { date: "2026-06-09", time: "10:00", name: "조영란", bed: "1109-1", type: "인지기능검사 (K-MMSE)", room: "심리검사실", staff: "임상심리사" },
  { date: "2026-06-09", time: "11:00", name: "명진숙", bed: "1112-1", type: "인지기능검사 (K-MMSE)", room: "심리검사실", staff: "임상심리사" },
  { date: "2026-06-10", time: "09:00", name: "권혁수", bed: "1105-1", type: "간기능검사", room: "검사실 A", staff: "임상병리실" },
  { date: "2026-06-10", time: "09:30", name: "서동철", bed: "1111-1", type: "복부 초음파", room: "영상의학실", staff: "이정민" },
  { date: "2026-06-11", time: "10:00", name: "신동욱", bed: "1103-2", type: "뇌파 (EEG)", room: "검사실 B", staff: "김도현" },
  { date: "2026-06-12", time: "09:00", name: "황도식", bed: "1106-1", type: "흉부 X-ray", room: "영상의학실", staff: "영상의학과" },
  { date: "2026-06-12", time: "10:00", name: "윤소희", bed: "1108-1", type: "갑상선기능검사", room: "검사실 A", staff: "임상병리실" },
  { date: "2026-06-15", time: "09:30", name: "송미영", bed: "1109-2", type: "혈액검사", room: "검사실 A", staff: "임상병리실" },
  { date: "2026-06-17", time: "14:00", name: "유경아", bed: "1112-2", type: "심리검사 (MMPI-2)", room: "심리검사실", staff: "임상심리사" },
  { date: "2026-06-18", time: "10:00", name: "배준영", bed: "1105-2", type: "심전도 (EKG)", room: "검사실 A", staff: "박서윤" },
  { date: "2026-06-22", time: "09:00", name: "강민호", bed: "1102-2", type: "혈액검사", room: "검사실 A", staff: "임상병리실" },
  { date: "2026-06-25", time: "10:30", name: "노수정", bed: "1110-2", type: "갑상선기능검사", room: "검사실 A", staff: "임상병리실" },
];

export const STAFF: Staff[] = [
  { id: "s01", name: "이수진", role: "수간호사", join: "2009-03-02", contact: "010-2841-5567", status: "재직" },
  { id: "s02", name: "박지영", role: "간호사", join: "2019-07-15", contact: "010-3322-7781", status: "재직" },
  { id: "s03", name: "김수민", role: "간호사", join: "2017-04-03", contact: "010-5567-1120", status: "재직" },
  { id: "s04", name: "최유나", role: "간호사", join: "2021-09-01", contact: "010-8810-2245", status: "재직" },
  { id: "s05", name: "한가은", role: "간호사", join: "2022-03-14", contact: "010-4471-9982", status: "재직" },
  { id: "s06", name: "조민서", role: "간호사", join: "2023-06-20", contact: "010-7793-3340", status: "재직" },
  { id: "s07", name: "윤서아", role: "간호사", join: "2024-01-08", contact: "010-2256-7714", status: "재직" },
  { id: "s08", name: "정하나", role: "간호사", join: "2020-11-11", contact: "010-6638-2201", status: "휴직" },
  { id: "s09", name: "강나래", role: "간호조무사", join: "2018-05-22", contact: "010-3390-6678", status: "재직" },
  { id: "s10", name: "오현지", role: "간호조무사", join: "2023-10-02", contact: "010-7741-2098", status: "재직" },
  { id: "s11", name: "배진우", role: "간호조무사", join: "2025-02-17", contact: "010-9923-4416", status: "재직" },
];

function weekday(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay();
}
function rota(cycle: ShiftCode[], offset: number): ShiftCode[] {
  return Array.from({ length: DAYS_IN_MONTH }, (_, i) => cycle[(i + offset) % cycle.length]);
}
const NURSE_CYCLE: ShiftCode[] = ["D", "D", "E", "E", "N", "N", "휴", "휴"];
const ASSIST_CYCLE: ShiftCode[] = ["D", "D", "D", "E", "E", "휴", "휴"];

export const SHIFT_ROWS: ShiftRow[] = [
  { id: "s01", name: "이수진", role: "수간호사", row: Array.from({ length: DAYS_IN_MONTH }, (_, i) => { const wd = weekday(CAL_YEAR, CAL_MONTH, i + 1); return (wd === 0 || wd === 6) ? "휴" : "D"; }) },
  { id: "s02", name: "박지영", role: "간호사", row: rota(NURSE_CYCLE, 0) },
  { id: "s03", name: "김수민", role: "간호사", row: rota(NURSE_CYCLE, 2) },
  { id: "s04", name: "최유나", role: "간호사", row: rota(NURSE_CYCLE, 4) },
  { id: "s05", name: "한가은", role: "간호사", row: rota(NURSE_CYCLE, 6) },
  { id: "s06", name: "조민서", role: "간호사", row: rota(NURSE_CYCLE, 1) },
  { id: "s07", name: "윤서아", role: "간호사", row: rota(NURSE_CYCLE, 3) },
  { id: "s09", name: "강나래", role: "간호조무사", row: rota(ASSIST_CYCLE, 0) },
  { id: "s10", name: "오현지", role: "간호조무사", row: rota(ASSIST_CYCLE, 3) },
  { id: "s11", name: "배진우", role: "간호조무사", row: rota(ASSIST_CYCLE, 5) },
];

export const SHIFT_CODES: Record<ShiftCode, ShiftCodeMeta> = {
  D: { label: "데이", time: "07:00–15:00", bg: "#e1f3f8", fg: "#00a0c6" },
  E: { label: "이브닝", time: "15:00–23:00", bg: "#f0ebfd", fg: "#8b5cf6" },
  N: { label: "나이트", time: "23:00–07:00", bg: "#e6ebf7", fg: "#1e40af" },
  "휴": { label: "휴무", time: "—", bg: "#eef1f3", fg: "#94a3b8" },
};

export const APPROVERS = {
  head: { name: "김미현", role: "수간호사" },
  exec: { name: "김태우", role: "병원장" },
};

export const INIT_DOCS: ApprovalDoc[] = [
  {
    id: "A24", box: "received", form: "annual", title: "연차 휴가 신청서 (6/15~6/16)",
    drafter: { name: "박지영", role: "간호사" }, date: "2026-06-07", status: "결재대기",
    body: [["휴가 구분", "연차 (2일)"], ["기간", "2026-06-15(월) ~ 06-16(화)"], ["사유", "가족 행사 참석"], ["근무 대체", "최유나 간호사 교대 협의 완료"]],
    line: [
      { name: "박지영", role: "간호사", kind: "기안", status: "승인", at: "06-07 09:12" },
      { name: "이수진", role: "수간호사", kind: "검토", status: "결재중", at: null, me: true },
      { name: "정현숙", role: "간호부장", kind: "결재", status: "대기", at: null },
    ],
  },
  {
    id: "A23", box: "received", form: "shift", title: "근무 변경 신청서 (6/12)",
    drafter: { name: "김수민", role: "간호사" }, date: "2026-06-06", status: "결재대기",
    body: [["대상일", "2026-06-12(금)"], ["변경 내용", "나이트(N) → 이브닝(E)"], ["교대자", "윤서아 간호사 (E→N)"], ["사유", "야간 외래 진료 예약"]],
    line: [
      { name: "김수민", role: "간호사", kind: "기안", status: "승인", at: "06-06 18:40" },
      { name: "이수진", role: "수간호사", kind: "결재", status: "결재중", at: null, me: true },
    ],
  },
  {
    id: "A22", box: "received", form: "half", title: "반차 신청서 (6/10 오후)",
    drafter: { name: "한가은", role: "간호사" }, date: "2026-06-06", status: "결재대기",
    body: [["일자", "2026-06-10(수)"], ["구분", "오후 반차 (13:00~)"], ["사유", "병원 진료"]],
    line: [
      { name: "한가은", role: "간호사", kind: "기안", status: "승인", at: "06-06 14:05" },
      { name: "이수진", role: "수간호사", kind: "결재", status: "결재중", at: null, me: true },
    ],
  },
  {
    id: "A21", box: "sent", form: "leave", title: "외박 특별 연장 승인 요청 (황도식)",
    drafter: { name: "이수진", role: "수간호사" }, date: "2026-06-07", status: "진행중",
    body: [["환자", "황도식 (1106-1, 치매 BPSD)"], ["연장 기간", "06-09 → 06-11 (2일 연장)"], ["사유", "가정 적응 평가 연장, 보호자 요청"], ["담당의 소견", "김도현 전문의 동의"]],
    line: [
      { name: "이수진", role: "수간호사", kind: "기안", status: "승인", at: "06-07 10:30", me: true },
      { name: "정현숙", role: "간호부장", kind: "검토", status: "결재중", at: null },
      { name: "한영태", role: "행정원장", kind: "결재", status: "대기", at: null },
    ],
  },
  {
    id: "A20", box: "sent", form: "purchase", title: "병동 물품 구매 요청서 (전자혈압계)",
    drafter: { name: "이수진", role: "수간호사" }, date: "2026-06-05", status: "진행중",
    body: [["품목", "전자혈압계 (탁상형)"], ["수량", "2 대"], ["추정 단가", "180,000원"], ["사유", "기존 장비 노후 · 측정 오차 발생"]],
    line: [
      { name: "이수진", role: "수간호사", kind: "기안", status: "승인", at: "06-05 11:20", me: true },
      { name: "정현숙", role: "간호부장", kind: "검토", status: "승인", at: "06-05 15:40" },
      { name: "한영태", role: "행정원장", kind: "결재", status: "결재중", at: null },
    ],
  },
];

export function leaveDays(depart: string, expect: string): number {
  const a = new Date(depart.slice(0, 10) + "T00:00:00");
  const b = new Date(expect.slice(0, 10) + "T00:00:00");
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export function onDutyCount(dayIdx: number): number {
  return SHIFT_ROWS.filter((r) => ["D", "E", "N"].includes(r.row[dayIdx])).length;
}

export function computeKpi(patients: Patient[], leaves: Leave[]) {
  const todayIdx = new Date(TODAY + "T00:00:00").getDate() - 1;
  return {
    admitted: patients.length,
    oebak: patients.filter((p) => p.status === "외박").length,
    oechul: patients.filter((p) => p.status === "외출").length,
    onDuty: onDutyCount(todayIdx),
    outNow: leaves.filter((l) => l.status !== "복귀완료").length,
  };
}
