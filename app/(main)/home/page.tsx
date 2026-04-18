import AppHeader from "@/components/layout/AppHeader";
import Badge from "@/components/ui/Badge";
import { Bell, ChevronRight, CheckSquare, Calendar, User } from "lucide-react";
import Link from "next/link";

function DraftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4H14L20 10V20C20 20.55 19.55 21 19 21H5C4.45 21 4 20.55 4 20V4Z"/>
      <path d="M14 4V10H20"/>
      <path d="M8.2 14.8L15.9 7.1"/>
      <path d="M14.9 6.1L16.9 8.1"/>
      <path d="M7.7 16.7L10.8 16.1L8.3 13.6L7.7 16.7Z"/>
    </svg>
  );
}

const pendingApprovals = [
  { id: "1", title: "2024년 4분기 예산 집행 품의", type: "품의서", drafter: "김철수", createdAt: "2026-04-17" },
  { id: "2", title: "업무용 차량 구매 결재", type: "결재서", drafter: "이영희", createdAt: "2026-04-16" },
  { id: "3", title: "교육비 지원 신청서", type: "신청서", drafter: "박민수", createdAt: "2026-04-15" },
];

const notices = [
  { id: "1", title: "2026년 하계 휴가 일정 안내", date: "2026-04-18" },
  { id: "2", title: "사내 시스템 정기 점검 공지", date: "2026-04-16" },
  { id: "3", title: "복리후생 제도 변경 안내", date: "2026-04-14" },
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

      <main className="flex-1 px-4 py-5 space-y-5 pb-20">
        {/* 인사말 */}
        <div className="bg-[#2F80ED] rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">안녕하세요</p>
          <p className="text-lg font-bold mt-1">홍길동 님</p>
          <p className="text-sm opacity-80 mt-3">결재 대기 <span className="font-semibold text-white">{pendingApprovals.length}건</span>이 있습니다</p>
        </div>

        {/* 코어액션 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">코어액션</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { href: "/draft", label: "기안하기", icon: <DraftIcon />, color: "text-[#2F80ED]", bg: "bg-blue-50" },
              { href: "/approval", label: "결재함", icon: <CheckSquare size={24} />, color: "text-emerald-600", bg: "bg-emerald-50" },
              { href: "/calendar", label: "일정", icon: <Calendar size={24} />, color: "text-violet-600", bg: "bg-violet-50" },
              { href: "/mypage", label: "마이페이지", icon: <User size={24} />, color: "text-orange-500", bg: "bg-orange-50" },
            ].map(({ href, label, icon, color, bg }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-sm`}>
                  {icon}
                </div>
                <span className="text-xs text-gray-600 font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 결재 대기 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">결재 대기</h2>
            <Link href="/approval" className="flex items-center text-xs text-[#2F80ED]">
              전체보기 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {pendingApprovals.map((item) => (
              <Link
                key={item.id}
                href={`/approval/${item.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.drafter} · {item.createdAt}</p>
                </div>
                <Badge status="pending" className="ml-3 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* 공지사항 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">공지사항</h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {notices.map((notice) => (
              <div key={notice.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-gray-800 truncate flex-1">{notice.title}</p>
                <span className="text-xs text-gray-400 ml-3 shrink-0">{notice.date}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
