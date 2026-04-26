const PLACEHOLDER = /^<.+>$/;

const POSITION_MAP: Record<string, string | null> = {
  "총무과장": "0cab6761-8cb2-44ab-bb24-00acebe9dfde",
  "이사장":   "271b25cb-84d5-43ea-9056-559fd75f4de5",
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
