"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {/* SW 등록 실패 시 앱은 정상 동작 */});
    }
  }, []);

  return null;
}
