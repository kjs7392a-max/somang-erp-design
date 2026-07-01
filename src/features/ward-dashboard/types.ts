export interface WardInfo {
  name: string;
  dept: string;
  code: string;
}

export interface WardAccount {
  id: string;
  name: string;
  role: "수간호사" | "간호부장" | "간호사" | "간호조무사";
  dept: string;
  ward: WardInfo;
  canApprove: boolean;
}

export interface Patient {
  id: string;
  bed: string;
  name: string;
  age: number;
  sex: "남" | "여";
  admit: string;
  doctor: string;
  status: "입원중" | "외박" | "외출";
  dx: string;
  guardian: string;
  contact: string;
  risk: string;
  note: string;
}

export interface Leave {
  id: string;
  name: string;
  bed: string;
  type: "외박" | "외출";
  depart: string;
  expect: string;
  returned: string | null;
  reason: string;
  registrar: string;
  status: "외박중" | "외출중" | "복귀완료";
}

export interface Exam {
  date: string;
  time: string;
  name: string;
  bed: string;
  type: string;
  room: string;
  staff: string;
  done?: boolean;
}

export interface ShiftRow {
  id: string;
  name: string;
  role: "수간호사" | "간호사" | "간호조무사";
  row: ShiftCode[];
}

export type ShiftCode = "D" | "E" | "N" | "휴";

export interface ShiftCodeMeta {
  label: string;
  time: string;
  bg: string;
  fg: string;
}

export interface Staff {
  id: string;
  name: string;
  role: "수간호사" | "간호사" | "간호조무사";
  join: string;
  contact: string;
  status: "재직" | "휴직";
}

export type {
  ApprovalStepStatus, ApprovalDocStatus, ApprovalStepKind, DocBox,
  ApprovalStep, ApprovalDoc, DocForm, Approvers,
} from "@/features/approval/types";

export type WardRoute = "ward" | "approval" | "draft";
export type WardTab = "status" | "patients" | "leave" | "exam" | "shift" | "staff";
