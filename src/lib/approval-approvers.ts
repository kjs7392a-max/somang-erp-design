const PLACEHOLDER = /^<.+>$/;

const POSITION_MAP: Record<string, string | null> = {
  "총무과장": "<h001-uuid>",
  "이사장":   "<e001-uuid>",
  "팀장":     null,
  "부서장":   null,
  "담당":     null,
};

export function getApproverByPosition(position: string): string | null {
  const uuid = POSITION_MAP[position] ?? null;
  if (uuid && PLACEHOLDER.test(uuid)) {
    throw new Error(`결재자 UUID 미설정: ${position} — approval-approvers.ts에 실제 UUID를 입력하세요`);
  }
  return uuid;
}
