import { ApprovalDetailClient } from "./approval-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApprovalDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ApprovalDetailClient id={id} />;
}