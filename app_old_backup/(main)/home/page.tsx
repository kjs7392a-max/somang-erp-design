import AppHeader from "@/components/layout/AppHeader";
import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";

function DraftIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4H14L20 10V20C20 20.55 19.55 21 19 21H5C4.45 21 4 20.55 4 20V4Z"/>
      <path d="M14 4V10H20"/>
      <path d="M8.2 14.8L15.9 7.1"/>
      <path d="M14.9 6.1L16.9 8.1"/>
      <path d="M7.7 16.7L10.8 16.1L8.3 13.6L7.7 16.7Z"/>
    </svg>
  );
}

function ApprovalIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M8 12l3 3 5-5"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  );
}

// SVG 도넛 차트: 승인대기 7, 보류 2, 완료 45 → 총 54
function DonutChart() {
  const total = 54;
  const r = 38;
  const cx = 50;
  const cy = 50;
  const circ = 2 * Math.PI * r;

  // 각 세그먼트 (순서: 완료 → 승인대기 → 보류)
  const segments = [
    { value: 45, color: "#4A90D9", label: "완료" },
    { value: 7,  color: "#00C9B1", label: "승인 대기" },
    { value: 2,  color: "#1A2B5F", label: "보류" },
  ];

  let offset = 0;
  const paths = segments.map((seg) => {
    const dash = (seg.value / total) * circ;
    const gap = circ - dash;
    const el = (
      <circle
        key={seg.label}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth="12"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50px 50px" }}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg width="80" height="80" viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" />
      {paths}
    </svg>
  );
}

const notices = [
  { id: "1", title: "2026년 4월 20일 통합 워크숍 안내" },
  { id: "2", title: "사내 시스템 정기 점검 공지" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <AppHeader
        title="소망 ERP"
        right={
          <button className="relative p-1 text-gray-500">
            <Bell size={22} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        }
      />

      <main className="flex-1 px-4 py-5 space-y-4 pb-24">
        {/* 인사말 */}
        <p className="text-xl font-bold text-gray-900">반갑습니다, 박지영님</p>

        {/* 내결재 현황 */}
        <Link href="/approval" className="block bg-white rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800">내결재 현황</span>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <div className="flex items-center gap-5">
            <DonutChart />
            <div className="space-y-2 flex-1">
              {[
                { label: "승인 대기", value: 7,  dot: "bg-[#00C9B1]", valueColor: "text-[#00C9B1]" },
                { label: "보류",     value: 2,  dot: "bg-[#1A2B5F]", valueColor: "text-[#1A2B5F]" },
                { label: "완료",     value: 45, dot: "bg-[#4A90D9]", valueColor: "text-[#4A90D9]" },
              ].map(({ label, value, dot, valueColor }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                  <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* 전체 공지 */}
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-3">전체 공지</p>
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4A90D9] shrink-0" />
                <p className="text-sm text-[#4A90D9]">{n.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Actions */}
        <div>
          <p className="text-sm font-bold text-gray-900 mb-3">Core Actions</p>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/draft" className="flex flex-col items-center gap-2.5">
              <div className="w-full aspect-square max-w-[110px] mx-auto bg-[#1E3A6E] rounded-2xl flex items-center justify-center text-white shadow-sm">
                <DraftIcon />
              </div>
              <span className="text-xs font-medium text-gray-700">기안하기</span>
            </Link>
            <Link href="/approval" className="flex flex-col items-center gap-2.5">
              <div className="w-full aspect-square max-w-[110px] mx-auto bg-[#00BFB3] rounded-2xl flex items-center justify-center text-white shadow-sm">
                <ApprovalIcon />
              </div>
              <span className="text-xs font-medium text-gray-700">결재하기</span>
            </Link>
            <Link href="/calendar" className="flex flex-col items-center gap-2.5">
              <div className="w-full aspect-square max-w-[110px] mx-auto bg-[#7BB8F5] rounded-2xl flex items-center justify-center text-white shadow-sm">
                <CalendarIcon />
              </div>
              <span className="text-xs font-medium text-gray-700">일정보기</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
