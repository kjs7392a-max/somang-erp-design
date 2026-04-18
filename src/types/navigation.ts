/**
 * 클라이언트 전역 화면 전환용.
 * 추후 App Router 세그먼트로 확장 시 이 키를 URL에 매핑하면 된다.
 */
export type AppPage =
  | "home"
  | "approvalList"
  | "approval"
  | "schedule"
  | "myInfo"
  | "draft";

export type ApprovalDetailTab = "summary" | "original";

export type MyInfoSection =
  | "main"
  | "editProfile"
  | "changePassword"
  | "changePosition"
  | "changeDepartment";
