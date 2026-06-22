// 기안 양식 정의 (소망병원 표준)

export type FormKind = "vacation" | "proposal" | "resignation";

export type ApprovalLine = { position: string; name?: string }[];

export type FormMeta = {
  kind: FormKind;
  label: string;
  approvalLine: ApprovalLine;
  attachmentPolicy: "required-when" | "optional" | "none";
  attachmentHint?: string;
};

export const FORMS: Record<FormKind, FormMeta> = {
  vacation: {
    kind: "vacation",
    label: "연차 신청서",
    approvalLine: [
      { position: "수간호사" },
      { position: "병원장" },
    ],
    attachmentPolicy: "required-when",
    attachmentHint: "병가(무급)은 진단서·입원확인서 등 증빙서류 첨부 필수",
  },
  proposal: {
    kind: "proposal",
    label: "품의서",
    approvalLine: [
      { position: "부서장" },
      { position: "총무과장" },
      { position: "이사장" },
    ],
    attachmentPolicy: "optional",
    attachmentHint: "견적서 등 증빙이 있을 경우 첨부",
  },
  resignation: {
    kind: "resignation",
    label: "사직원",
    approvalLine: [
      { position: "담당" },
      { position: "총무과장" },
      { position: "이사장" },
    ],
    attachmentPolicy: "none",
  },
};

// 연차 종류
export const VACATION_TYPES = [
  { value: "annual",  label: "연차" },
  { value: "sick",    label: "병가" },
  { value: "condolence", label: "경조휴가" },
  { value: "maternity", label: "출산" },
  { value: "childcare", label: "육아휴직" },
  { value: "halfday", label: "기타(반차)" },
] as const;

export type VacationType = (typeof VACATION_TYPES)[number]["value"];

// 병가일 때 첨부 필수
export function isAttachmentRequired(
  kind: FormKind,
  vacationType?: VacationType,
): boolean {
  if (kind === "vacation" && vacationType === "sick") return true;
  return false;
}