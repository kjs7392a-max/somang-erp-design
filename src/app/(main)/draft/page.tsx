"use client";

import { useRouter } from "next/navigation";
import { DraftView } from "@/components/views/DraftView";
import { ROUTES } from "@/lib/routes";

export default function DraftPage() {
  const router = useRouter();
  return <DraftView onBack={() => router.push(ROUTES.home)} />;
}