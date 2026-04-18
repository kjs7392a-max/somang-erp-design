import AppHeader from "@/components/layout/AppHeader";
import { ChevronRight, User, Bell, Lock, HelpCircle, LogOut, Building2 } from "lucide-react";

const menuGroups = [
  {
    title: "내 정보",
    items: [
      { icon: User, label: "프로필 수정" },
      { icon: Building2, label: "소속 정보" },
    ],
  },
  {
    title: "설정",
    items: [
      { icon: Bell, label: "알림 설정" },
      { icon: Lock, label: "비밀번호 변경" },
    ],
  },
  {
    title: "기타",
    items: [
      { icon: HelpCircle, label: "도움말" },
      { icon: LogOut, label: "로그아웃", danger: true },
    ],
  },
];

export default function MyPage() {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <AppHeader title="더보기" />

      <main className="flex-1 pb-20">
        {/* 프로필 카드 */}
        <div className="bg-white px-4 py-6 flex items-center gap-4 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-[#2F80ED] flex items-center justify-center text-white text-xl font-bold shrink-0">
            홍
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">홍길동</p>
            <p className="text-sm text-gray-400">기획팀 · 대리</p>
            <p className="text-xs text-gray-400 mt-0.5">hong@somang.co.kr</p>
          </div>
        </div>

        {/* 메뉴 그룹 */}
        <div className="px-4 py-4 space-y-5">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{group.title}</p>
              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                {group.items.map(({ icon: Icon, label, danger }) => (
                  <button
                    key={label}
                    className="w-full flex items-center justify-between px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={danger ? "text-red-400" : "text-gray-400"}
                      />
                      <span className={`text-sm ${danger ? "text-red-500" : "text-gray-800"}`}>
                        {label}
                      </span>
                    </div>
                    {!danger && <ChevronRight size={16} className="text-gray-300" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">소망 ERP v1.0.0</p>
      </main>
    </div>
  );
}
