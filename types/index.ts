export type ApprovalStatus = "pending" | "approved" | "rejected" | "held";

export interface Document {
  id: string;
  title: string;
  type: string;
  drafter: string;
  department: string;
  createdAt: string;
  status: ApprovalStatus;
  summary?: string;
  content?: string;
}

export interface ApprovalStep {
  id: string;
  approver: string;
  department: string;
  status: ApprovalStatus;
  comment?: string;
  approvedAt?: string;
}
