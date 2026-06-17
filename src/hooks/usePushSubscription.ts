"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase";

export function usePushSubscription() {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function setup() {
      const reg = await navigator.serviceWorker.register("/sw.js");

      // 이미 구독 중이면 저장만 하고 끝
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          ),
        });
      }

      const supabase = createClient();
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: profile!.id,
          endpoint: sub.endpoint,
          subscription: sub.toJSON(),
        },
        { onConflict: "user_id,endpoint" },
      );
    }

    setup().catch(() => {});
  }, [profile?.id]);
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const uint8 = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    uint8[i] = rawData.charCodeAt(i);
  }
  return uint8.buffer;
}
