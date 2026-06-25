// src/features/general-dashboard/types.ts
export interface GeneralAccount {
  id: string;
  name: string;
  role: string;       // 총무과장 | 총무주임 | 사원 등
  dept: string;       // 소속 (총무과)
  canApprove: boolean;
}

export interface GeneralStaff {
  id: string;
  name: string;
  dept: string;       // 부서 (간호과/원무과/총무과 등)
  role: string;       // 직급/직책
  join: string;       // 입사일 YYYY-MM-DD
  contact: string;
  status: "재직" | "휴직";
}

export type LeaveKind = "년차" | "반차" | "병가" | "경조" | "공가";

export interface LeaveRequest {
  id: string;
  staffId: string;
  name: string;
  dept: string;
  kind: LeaveKind;
  start: string;      // YYYY-MM-DD
  end: string;        // YYYY-MM-DD
  days: number;       // 0.5 단위 허용 (반차=0.5)
  reason: string;
  status: "대기" | "승인" | "반려";
  docId?: string;     // 연동된 전자결재 문서 id
}

export interface LeaveBalance {
  staffId: string;
  name: string;
  dept: string;
  granted: number;    // 연차 부여일수
  used: number;       // 사용일수
  remain: number;     // 잔여일수
}

export type GeneralRoute = "general" | "approval" | "draft";
export type GeneralTab = "status" | "staff" | "leave";

export interface NewLeaveInput {
  staffId: string;
  kind: LeaveKind;
  start: string;
  end: string;
  reason: string;
}
