// Welcome Message System
// A. Time-based (새벽/아침/점심/오후/저녁/밤)
// B. Day-of-week specials (월요일 아침, 금요일 저녁, 주말)
// C. Random rotation within each pool
// D. User name injection

export type TimeBandId =
  | "dawn"
  | "morning"
  | "lunch"
  | "afternoon"
  | "evening"
  | "night";

export const TIME_BANDS: Array<{
  id: TimeBandId;
  label: string;
  range: [number, number];
  icon: string;
}> = [
  { id: "dawn", label: "새벽", range: [0, 5], icon: "🌙" },
  { id: "morning", label: "아침", range: [5, 11], icon: "☀️" },
  { id: "lunch", label: "점심", range: [11, 14], icon: "🍱" },
  { id: "afternoon", label: "오후", range: [14, 18], icon: "☕" },
  { id: "evening", label: "저녁", range: [18, 22], icon: "🌇" },
  { id: "night", label: "밤", range: [22, 24], icon: "✨" },
];

export const BASE_MESSAGES: Record<TimeBandId, string[]> = {
  dawn: [
    "늦은 시간까지\n고생이 많으세요",
    "조용한 새벽,\n오늘도 수고 많으세요",
    "밤새 근무하시는군요,\n건강 챙기세요",
  ],
  morning: [
    "좋은 아침이에요,\n오늘도 힘내세요",
    "상쾌한 아침입니다,\n활기찬 하루 되세요",
    "안녕하세요,\n기분 좋은 아침이에요",
  ],
  lunch: [
    "점심은 드셨나요?\n오늘도 수고 많으세요",
    "맛있는 점심 되세요,\n오후도 힘내세요",
    "잠깐 한숨 돌리세요,\n수고하셨어요",
  ],
  afternoon: [
    "오후도 파이팅이에요,\n조금만 더 힘내세요",
    "나른한 오후,\n커피 한 잔 어떠세요?",
    "오후도 화이팅,\n차근차근 해봐요",
  ],
  evening: [
    "오늘 하루도\n수고 많으셨어요",
    "저녁 시간이네요,\n마무리 잘 해봐요",
    "하루를 정리할 시간,\n천천히 마무리하세요",
  ],
  night: [
    "늦은 시간까지\n수고 많으세요",
    "오늘 하루도 고생하셨어요,\n푹 쉬세요",
    "야근 중이신가요?\n건강 잘 챙기세요",
  ],
};

type SpecialRule = {
  match: (dayOfWeek: number, band: TimeBandId) => boolean;
  messages: string[];
};

export const SPECIAL_MESSAGES: SpecialRule[] = [
  {
    match: (d, b) => d === 1 && b === "morning",
    messages: [
      "새로운 한 주의 시작이에요,\n힘차게 출발해봐요",
      "월요일 아침이네요,\n이번 주도 화이팅이에요",
    ],
  },
  {
    match: (d, b) => d === 5 && (b === "afternoon" || b === "evening"),
    messages: [
      "한 주 마무리 잘 하세요,\n금요일이에요",
      "금요일 오후,\n조금만 더 힘내세요",
    ],
  },
  {
    match: (d) => d === 0 || d === 6,
    messages: [
      "주말에도 근무하시는군요,\n고생 많으세요",
      "주말인데 수고 많으세요,\n꼭 쉬는 시간도 챙기세요",
    ],
  },
  {
    match: (d, b) => d === 3 && b === "afternoon",
    messages: ["한 주의 중간이에요,\n이미 절반 왔어요"],
  },
];

export function getTimeBand(hour: number): TimeBandId {
  for (const band of TIME_BANDS) {
    const [start, end] = band.range;
    if (hour >= start && hour < end) return band.id;
  }
  return "morning";
}

export type ResolveWelcomeOpts = {
  hour?: number;
  dayOfWeek?: number;
  userName?: string;
  useSpecials?: boolean;
  useRandom?: boolean;
  seed?: number;
};

export type ResolveWelcomeResult = {
  message: string;
  band: TimeBandId;
  dayOfWeek: number;
  hour: number;
};

export function resolveWelcomeMessage(
  opts: ResolveWelcomeOpts = {},
): ResolveWelcomeResult {
  const now = new Date();
  const hour = opts.hour ?? now.getHours();
  const dayOfWeek = opts.dayOfWeek ?? now.getDay();
  const useSpecials = opts.useSpecials !== false;
  const useRandom = opts.useRandom !== false;
  const userName = opts.userName || "";

  const band = getTimeBand(hour);

  let pool: string[] = [];
  if (useSpecials) {
    for (const sp of SPECIAL_MESSAGES) {
      if (sp.match(dayOfWeek, band)) pool = pool.concat(sp.messages);
    }
  }
  if (pool.length === 0) {
    pool = BASE_MESSAGES[band] || BASE_MESSAGES.morning;
  }

  let picked: string;
  if (useRandom) {
    const seed = opts.seed ?? Math.floor(Date.now() / 60000);
    picked = pool[seed % pool.length];
  } else {
    picked = pool[0];
  }

  // Inject user name — prepend "○○○님, "
  if (userName) {
    const greetings = ["안녕하세요,", "좋은 아침이에요,", "상쾌한 아침입니다,"];
    const lines = picked.split("\n");
    const firstLine = lines[0];
    const rest = lines.slice(1).join("\n");
    if (greetings.some((g) => firstLine.startsWith(g.replace(",", "")))) {
      picked = `${userName}님, ${firstLine.replace(/,$/, ",")}\n${rest}`;
    } else {
      picked = `${userName}님,\n${firstLine}${rest ? "\n" + rest : ""}`;
    }
  }

  return { message: picked, band, dayOfWeek, hour };
}

export const PREVIEW_HOURS: Record<TimeBandId, number> = {
  dawn: 3,
  morning: 8,
  lunch: 12,
  afternoon: 15,
  evening: 19,
  night: 23,
};