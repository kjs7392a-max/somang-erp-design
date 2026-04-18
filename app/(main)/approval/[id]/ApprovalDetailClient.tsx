"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

const mockDocument = {
  id: "1",
  title: "2024년 4분기 예산 집행 품의",
  type: "품의서",
  drafter: "김철수",
  department: "기획팀",
  createdAt: "2026-04-17",
  status: "pending" as const,
  summary: "2024년 4분기 운영 예산 중 미집행 잔액 12,000,000원에 대한 집행 승인을 요청합니다.\n\n- 집행 항목: 마케팅 홍보비, 교육훈련비\n- 집행 예정일: 2026년 4월 30일\n- 담당자: 기획팀 김철수",
  content: `품 의 서\n\n수  신: 대표이사\n기  안: 기획팀 김철수\n제  목: 2024년 4분기 예산 집행 품의\n\n1. 관련 근거\n  - 2024년 예산 운용 지침 제15조\n\n2. 품의 내용\n  2024년 4분기 미집행 예산 12,000,000원을 아래와 같이 집행하고자 품의드립니다.\n\n  가. 마케팅 홍보비: 7,000,000원\n  나. 교육훈련비: 5,000,000원\n\n3. 기대 효과\n  분기 내 예산 소진을 통한 내년도 예산 확보 및 조직 역량 강화\n\n위와 같이 품의하오니 재가 바랍니다.`,
};

type Tab = "summary" | "content";
type ModalType = "reject" | "hold" | null;

interface Props {
  id: string;
}

export default function ApprovalDetailClient({ id }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [reason, setReason] = useState("");

  const doc = mockDocument;

  const handleApprove = () => {
    alert("승인 처리되었습니다.");
    router.push("/approval");
  };

  const handleSubmitModal = () => {
    if (!reason.trim()) return;
    const action = modalType === "reject" ? "반려" : "보류";
    alert(`${action} 처리되었습니다.\n사유: ${reason}`);
    setModalType(null);
    setReason("");
    router.push("/approval");
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 flex items-center h-14 px-2 bg-white border-b border-gray-200">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-sm font-semibold text-gray-900 truncate pr-2">결재 상세</h1>
        <Badge status={doc.status} className="mr-2" />
      </header>

      <main className="flex-1 pb-28">
        {/* 문서 정보 카드 */}
        <div className="bg-white px-4 py-4 border-b border-gray-100">
          <p className="text-base font-semibold text-gray-900">{doc.title}</p>
          <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs text-gray-500">
            <div><span className="text-gray-400">문서 유형</span><span className="ml-2 text-gray-700">{doc.type}</span></div>
            <div><span className="text-gray-400">기안자</span><span className="ml-2 text-gray-700">{doc.drafter}</span></div>
            <div><span className="text-gray-400">부서</span><span className="ml-2 text-gray-700">{doc.department}</span></div>
            <div><span className="text-gray-400">기안일</span><span className="ml-2 text-gray-700">{doc.createdAt}</span></div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 bg-white">
          {(["summary", "content"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "text-[#2F80ED] border-b-2 border-[#2F80ED]"
                  : "text-gray-400"
              )}
            >
              {tab === "summary" ? "요약" : "원문"}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="px-4 py-5">
          {activeTab === "summary" ? (
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{doc.summary}</p>
          ) : (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{doc.content}</pre>
          )}
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => setModalType("hold")}
        >
          보류
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          onClick={() => setModalType("reject")}
        >
          반려
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleApprove}
        >
          승인
        </Button>
      </div>

      {/* 반려 / 보류 모달 */}
      <Modal
        open={modalType !== null}
        onClose={() => { setModalType(null); setReason(""); }}
        title={modalType === "reject" ? "반려 사유 입력" : "보류 사유 입력"}
      >
        <textarea
          className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#2F80ED]"
          placeholder={`${modalType === "reject" ? "반려" : "보류"} 사유를 입력해 주세요.`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { setModalType(null); setReason(""); }}
          >
            취소
          </Button>
          <Button
            variant={modalType === "reject" ? "danger" : "ghost"}
            className="flex-1"
            onClick={handleSubmitModal}
            disabled={!reason.trim()}
          >
            {modalType === "reject" ? "반려" : "보류"} 처리
          </Button>
        </div>
      </Modal>
    </div>
  );
}
