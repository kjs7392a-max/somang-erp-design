"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DraftView } from "@/components/views/DraftView";
import type { DraftPrefill } from "@/components/views/DraftView";
import { ROUTES } from "@/lib/routes";

function DraftPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const form = params.get("form");
  const start = params.get("start") ?? undefined;
  const end   = params.get("end")   ?? undefined;

  const prefill: DraftPrefill | undefined =
    form === "vacation" || form === "proposal" || form === "resignation"
      ? { formKind: form, startDate: start, endDate: end }
      : undefined;

  return <DraftView onBack={() => router.push(ROUTES.home)} prefill={prefill} />;
}

export default function DraftPage() {
  return (
    <Suspense>
      <DraftPageInner />
    </Suspense>
  );
}
