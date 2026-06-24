// src/features/approval/types.ts
export type ApprovalStepStatus = "승인" | "결재중" | "대기" | "반려";
export type ApprovalDocStatus = "결재대기" | "진행중" | "완료" | "반려";
export type ApprovalStepKind = "기안" | "검토" | "결재";
export type DocBox = "received" | "sent";

export interface ApprovalStep {
  name: string;
  role: string;
  kind: ApprovalStepKind;
  status: ApprovalStepStatus;
  at: string | null;
  me?: boolean;
  memo?: string;
}

export interface ApprovalDoc {
  id: string;
  box: DocBox;
  form: string;
  title: string;
  drafter: { name: string; role: string };
  date: string;
  status: ApprovalDocStatus;
  body: [string, string][];
  line: ApprovalStep[];
}

/** 기안 작성 양식 정의 (DraftPage가 props로 받음) */
export interface DocForm {
  id: string;
  label: string;
  icon: string;       // WardIcons 키 (예: "calendar")
  fields: string[];
}

/** 결재선 검토·결재자 (DraftPage가 props로 받음) */
export interface Approvers {
  head: { name: string; role: string };  // 검토
  exec: { name: string; role: string };  // 결재
}
