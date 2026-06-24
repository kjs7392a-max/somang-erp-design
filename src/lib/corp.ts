type CorpConfig = { name: string; copyright: string };

const CORP_MAP: Record<string, CorpConfig> = {
  SM: {
    name: "소망의료재단",
    copyright: "© 2026 소망의료재단. All rights reserved.",
  },
  HD: {
    name: "현대병원",
    copyright: "© 2026 현대병원. All rights reserved.",
  },
};

export const corp: CorpConfig =
  CORP_MAP[process.env.NEXT_PUBLIC_CORP ?? "SM"] ?? CORP_MAP["SM"];
