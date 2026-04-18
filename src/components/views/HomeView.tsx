"use client";

import Image from "next/image";
import { useState } from "react";
import type { AppPage } from "@/types/navigation";

export type HomeViewProps = {
  editName: string;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
};

export function HomeView({
  editName,
  onNavigate,
  onLogout,
}: HomeViewProps) {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#f5f5f5]">
      <div className="flex items-center justify-between bg-white px-5 py-4">
        <button
          type="button"
          onClick={onLogout}
          className="cursor-pointer border-none bg-transparent p-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="16 17 21 12 16 7"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="21"
              y1="12"
              x2="9"
              y2="12"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          {logoOk ? (
            <Image
              src="/somang-logo.svg"
              alt="소망병원 로고"
              width={160}
              height={48}
              unoptimized
              className="mb-1 h-12 w-auto object-contain"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="mb-1 text-sm font-semibold text-[#333]">소망병원</span>
          )}
          <span className="text-sm font-semibold text-[#333]">소망의료재단</span>
        </div>
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent p-2"
          aria-label="알림"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <h1 className="mb-4 text-[1.375rem] font-bold text-[#1a1a1a]">
          반갑습니다, {editName}님
        </h1>

        <div className="mb-4 rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[1.0625rem] font-bold text-[#1a1a1a]">
              내결재 현황
            </h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18l6-6-6-6"
                stroke="#999"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative h-[100px] w-[100px] shrink-0">
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                className="-rotate-90"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="16"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#6b9ef5"
                  strokeWidth="16"
                  strokeDasharray="209 251.2"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#2c5aa0"
                  strokeWidth="16"
                  strokeDasharray="9.3 251.2"
                  strokeDashoffset="-209"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#37d5d6"
                  strokeWidth="16"
                  strokeDasharray="32.6 251.2"
                  strokeDashoffset="-218.3"
                />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-2.5">
              {[
                { color: "#37d5d6", label: "승인 대기", value: 7 },
                { color: "#2c5aa0", label: "보류", value: 2 },
                { color: "#6b9ef5", label: "완료", value: 45 },
              ].map(({ color, label, value }) => (
                <div key={label} className="flex items-center">
                  <div className="flex flex-1 items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-sm text-[#666]">{label}</span>
                  </div>
                  <span
                    className="ml-auto text-lg font-bold"
                    style={{ color }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="mb-3 text-[1.0625rem] font-bold text-[#1a1a1a]">
            전체 공지
          </h2>
          <div className="flex items-start gap-2">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4169e1]" />
            <span className="text-[0.9375rem] leading-relaxed text-[#333]">
              2026년 4월 20일 통합 워크숍 안내
            </span>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-[1.0625rem] font-bold text-[#1a1a1a]">
            Core Actions
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onNavigate("draft")}
              className="flex flex-col items-center gap-3 rounded-2xl border-none bg-[#3b5bdb] p-5 transition-transform active:scale-95"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 19l7-7 3 3-7 7-3-3z"
                  fill="#ffffff"
                />
                <path
                  d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"
                  fill="#ffffff"
                />
              </svg>
              <span className="text-sm font-semibold text-white">기안하기</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("approvalList")}
              className="flex flex-col items-center gap-3 rounded-2xl border-none bg-[#37d5d6] p-5 transition-transform active:scale-95"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 11l3 3L22 4"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-semibold text-white">결재하기</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("schedule")}
              className="flex flex-col items-center gap-3 rounded-2xl border-none bg-[#74c0fc] p-5 transition-transform active:scale-95"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <line
                  x1="16"
                  y1="2"
                  x2="16"
                  y2="6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="3"
                  y1="10"
                  x2="21"
                  y2="10"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-sm font-semibold text-white">일정보기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
