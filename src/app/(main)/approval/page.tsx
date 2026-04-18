import AppHeader from "@/components/layout/AppHeader";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import type { ApprovalStatus } from "@/types";

const approvals: Array<{
  id: string;
  title: string;
  type: string;
  drafter: string;
  department: string;
  createdAt: string;
  status: ApprovalStatus;
}> = [
  { id: "1", title: "2024년 4분기 예산 집행 품의", type: "품의서", drafter: "김철수", department: "기획팀", createdAt: "2026-04-17", status: "pending" },
  { id: "2", title: "업무용 차량 구매 결재", type: "결재서", drafter: "이영희", department: "총무팀", createdAt: "2026-04-16", status: "pending" },
  { id: "3", title: "교육비 지원 신청서", type: "신청서", drafter: "박민수", department: "인사팀", createdAt: "2026-04-15", status: "pending" },
  { id: "4", title: "사무용품 구매 요청서", type: "품의서", drafter: "최지은", department: "총무팀", createdAt: "2026-04-10", status: "approved" },
  { id: "5", title: "외부 강의 초청 계약서", type: "계약서", drafter: "정대호", department: "교육팀", createdAt: "2026-04-08", status: "held" },
];

export default function ApprovalPage() {
  const pending = approvals.filter((a) => a.status === "pending");
  const done = approvals.filter((a) => a.status !== "pending");

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <AppHeader title="결재" />

      <main className="flex-1 px-4 py-5 pb-20 space-y-5">
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            결재 대기 <span className="text-[#2F80ED]">{pending.length}</span>
          </h2>
          <div className="space-y-2">
            {pending.map((item) => (
              <Link
                key={item.id}
                href={`/approval/${item.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.department} · {item.drafter} · {item.createdAt}</p>
                </div>
                <Badge status={item.status} className="ml-3 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">처리 완료</h2>
          <div className="space-y-2">
            {done.map((item) => (
              <Link
                key={item.id}
                href={`/approval/${item.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm opacity-70"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.department} · {item.drafter} · {item.createdAt}</p>
                </div>
                <Badge status={item.status} className="ml-3 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
