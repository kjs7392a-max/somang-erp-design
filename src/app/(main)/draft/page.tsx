import AppHeader from "@/components/layout/AppHeader";
import Badge from "@/components/ui/Badge";
import { Plus } from "lucide-react";
import Link from "next/link";

const drafts = [
  { id: "d1", title: "해외출장 경비 정산 품의", type: "품의서", status: "pending" as const, createdAt: "2026-04-17" },
  { id: "d2", title: "사무용품 구매 요청", type: "품의서", status: "approved" as const, createdAt: "2026-04-10" },
  { id: "d3", title: "외부 교육 참가 신청", type: "신청서", status: "rejected" as const, createdAt: "2026-04-05" },
];

export default function DraftPage() {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <AppHeader
        title="기안"
        right={
          <button className="flex items-center gap-1 bg-[#2F80ED] text-white text-xs font-medium px-3 py-1.5 rounded-lg">
            <Plus size={14} />새 기안
          </button>
        }
      />

      <main className="flex-1 px-4 py-5 pb-20">
        <div className="space-y-2">
          {drafts.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl px-4 py-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.type} · {item.createdAt}</p>
                </div>
                <Badge status={item.status} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
