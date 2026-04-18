"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    document.cookie = "somang_auth=1; path=/; max-age=86400";
    router.push("/home");
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        {/* Logo + 병원명 */}
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo.svg"
            alt="소망병원 로고"
            width={120}
            height={136}
            priority
            className="mb-4"
          />
          <p className="text-base font-semibold text-gray-700 tracking-wide">소망병원 의료법인</p>
          <p className="text-xs text-gray-400 mt-1">통합 ERP 시스템</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="아이디"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 bg-[#2F80ED] text-white text-sm font-semibold rounded-xl active:bg-blue-700 transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
