import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function initVapid() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails("mailto:kjs7392a@gmail.com", pub, priv);
}

function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  try { initVapid(); } catch {
    return NextResponse.json({ ok: false, error: "Push not configured" }, { status: 503 });
  }
  const { userId, title, body, url } = await request.json();
  if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    subs.map(({ subscription }) =>
      webpush.sendNotification(subscription as webpush.PushSubscription, payload)
    ),
  );

  // 만료된 구독 삭제
  const expired: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected" && subs[i]) {
      const sub = subs[i].subscription as { endpoint?: string };
      if (sub?.endpoint) expired.push(sub.endpoint);
    }
  });
  if (expired.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expired);
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ ok: true, sent });
}
