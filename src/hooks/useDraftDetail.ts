import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const DRAFT_DETAIL_SEED: DraftDetail[] = [
  {
    id: "D-0421-01",
    title: "연차 신청서",
    doc_type: "vacation",
    status: "in_progress",
    created_at: "2026-06-21T09:12:00.000Z",
    drafterName: "윤민주",
    drafterDept: "간호과",
    drafterPosition: "간호사",
    body: {
      vacationType: "annual",
      startDate: "2026-06-25",
      endDate: "2026-06-25",
      reason: "개인 사정으로 인한 연차 사용",
      contact: "010-5678-9012",
    },
    steps: [
      { id: "S-0421-01-1", order_index: 1, approver_id: "mock-sugang", approverName: "김미현", approverDept: "간호과", approverPosition: "수간호사", action: "pending", comment: null, acted_at: null },
      { id: "S-0421-01-2", order_index: 2, approver_id: "mock-chief",  approverName: "김태우", approverDept: "진료부", approverPosition: "병원장",   action: "waiting", comment: null, acted_at: null },
    ],
  },
  {
    id: "D-0420-03",
    title: "비품 구매 품의서",
    doc_type: "proposal",
    status: "in_progress",
    created_at: "2026-04-20T14:35:00.000Z",
    drafterName: "박지수",
    drafterDept: "총무과",
    drafterPosition: "대리",
    body: {
      "제목": "사무용 비품 구매 품의",
      "구매 항목": "복합기 토너 카트리지 5개, A4 용지 10박스",
      "금액": "385,000원",
      "구매처": "오피스디포",
      "사유": "소모품 재고 소진으로 인한 긴급 구매",
    },
    steps: [
      { id: "S-0420-03-1", order_index: 1, approver_id: "mock-han", approverName: "한기석", approverDept: "총무과", approverPosition: "과장", action: "pending", comment: null, acted_at: null },
      { id: "S-0420-03-2", order_index: 2, approver_id: "mock-lee", approverName: "이강표", approverDept: "경영진", approverPosition: "이사장", action: "waiting", comment: null, acted_at: null },
    ],
  },
  {
    id: "D-0419-07",
    title: "외부 교육 파견 신청서",
    doc_type: "proposal",
    status: "in_progress",
    created_at: "2026-04-19T11:00:00.000Z",
    drafterName: "최하늘",
    drafterDept: "행정팀",
    drafterPosition: "사원",
    body: {
      "제목": "병원행정 실무 교육 파견 신청",
      "교육기관": "한국병원행정협회",
      "교육일": "2026-05-10 ~ 2026-05-11 (2일)",
      "교육비": "280,000원",
      "사유": "병원 행정 역량 강화 및 자격증 취득 준비",
    },
    steps: [
      { id: "S-0419-07-1", order_index: 1, approver_id: "mock-han", approverName: "한기석", approverDept: "총무과", approverPosition: "과장", action: "pending", comment: null, acted_at: null },
      { id: "S-0419-07-2", order_index: 2, approver_id: "mock-lee", approverName: "이강표", approverDept: "경영진", approverPosition: "이사장", action: "waiting", comment: null, acted_at: null },
    ],
  },
];

export type StepDetail = {
  id: string;
  order_index: number;
  approver_id: string;
  approverName: string;
  approverDept: string;
  approverPosition: string;
  action: string;
  comment: string | null;
  acted_at: string | null;
};

export type DraftDetail = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  created_at: string;
  drafterName: string;
  drafterDept: string;
  drafterPosition: string;
  body: Record<string, unknown>;
  steps: StepDetail[];
};

export function useDraftDetail(draftId: string) {
  const [detail, setDetail] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!draftId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: dbError } = await supabase
      .from("drafts")
      .select(`
        id, title, doc_type, status, created_at,
        profiles!drafter_id(full_name, department, position),
        document_contents(body),
        draft_approval_steps(
          id, order_index, approver_id, action, comment, acted_at,
          profiles!approver_id(full_name, department, position)
        )
      `)
      .eq("id", draftId)
      .single();

    setLoading(false);
    if (dbError || !data) {
      const seed = DRAFT_DETAIL_SEED.find((d) => d.id === draftId);
      if (seed) { setDetail(seed); return; }
      setError(dbError?.message ?? "조회 실패");
      return;
    }

    const drafter = data.profiles as unknown as { full_name: string; department: string; position: string } | null;
    const contents = data.document_contents as unknown as { body: Record<string, unknown> } | null;
    const rawSteps = (data.draft_approval_steps as any[]) ?? [];

    setDetail({
      id: data.id,
      title: data.title,
      doc_type: data.doc_type,
      status: data.status,
      created_at: data.created_at,
      drafterName: drafter?.full_name ?? "",
      drafterDept: drafter?.department ?? "",
      drafterPosition: drafter?.position ?? "",
      body: contents?.body ?? {},
      steps: rawSteps
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((s: any) => {
          const approver = s.profiles as { full_name: string; department: string; position: string } | null;
          return {
            id: s.id,
            order_index: s.order_index,
            approver_id: s.approver_id,
            approverName: approver?.full_name ?? "",
            approverDept: approver?.department ?? "",
            approverPosition: approver?.position ?? "",
            action: s.action,
            comment: s.comment ?? null,
            acted_at: s.acted_at ?? null,
          };
        }),
    });
  }, [draftId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail };
}
