import { ApprovalDetailClient } from "./approval-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApprovalDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-[#f5f5f5]">
      <ApprovalDetailClient id={id} />
    </div>
  );
}
