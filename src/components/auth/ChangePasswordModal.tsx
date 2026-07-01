"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { X } from "lucide-react";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setStatus("loading");
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) {
      setStatus("idle");
      setError("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
      return;
    }
    setStatus("success");
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-white px-5 pb-10 pt-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[1.0625rem] font-bold text-zinc-900">비밀번호 변경</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
            <p className="text-center font-semibold text-zinc-800">비밀번호가 변경됐습니다.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-2xl bg-[#3b5bdb] py-4 text-[0.9375rem] font-semibold text-white active:opacity-80"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                placeholder="8자 이상 입력"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3.5 text-[0.9375rem] outline-none focus:border-[#3b5bdb]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">비밀번호 확인</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                placeholder="비밀번호를 다시 입력"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3.5 text-[0.9375rem] outline-none focus:border-[#3b5bdb]"
              />
            </div>
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-2 w-full rounded-2xl bg-[#3b5bdb] py-4 text-[0.9375rem] font-semibold text-white active:opacity-80 disabled:opacity-50"
            >
              {status === "loading" ? "변경 중..." : "변경하기"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
