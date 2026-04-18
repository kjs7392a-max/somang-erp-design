"use client";

import type { MyInfoSection } from "@/types/navigation";

const POSITIONS = [
  "간호사",
  "수간호사",
  "간호부장",
  "주임",
  "과장",
  "부장",
  "원장",
  "행정직원",
  "의사",
  "전문의",
];

const DEPARTMENTS = [
  "내과 1병동",
  "내과 2병동",
  "외과 1병동",
  "외과 2병동",
  "응급실",
  "중환자실",
  "수술실",
  "소아과",
  "산부인과",
  "총무과",
  "행정팀",
  "교육팀",
  "시설관리팀",
  "원무팀",
];

const SECTION_TITLES: Record<MyInfoSection, string> = {
  main: "내정보",
  editProfile: "프로필 수정",
  changePassword: "비밀번호 변경",
  changePosition: "직책 변경",
  changeDepartment: "부서 변경",
};

export type MyInfoViewProps = {
  myInfoSection: MyInfoSection;
  onMyInfoSectionChange: (s: MyInfoSection) => void;
  currentPw: string;
  newPw: string;
  confirmPw: string;
  onCurrentPwChange: (v: string) => void;
  onNewPwChange: (v: string) => void;
  onConfirmPwChange: (v: string) => void;
  userPosition: string;
  onUserPositionChange: (v: string) => void;
  userDepartment: string;
  onUserDepartmentChange: (v: string) => void;
  editName: string;
  editPhone: string;
  editEmail: string;
  onEditNameChange: (v: string) => void;
  onEditPhoneChange: (v: string) => void;
  onEditEmailChange: (v: string) => void;
  onLogout: () => void;
};

export function MyInfoView({
  myInfoSection,
  onMyInfoSectionChange,
  currentPw,
  newPw,
  confirmPw,
  onCurrentPwChange,
  onNewPwChange,
  onConfirmPwChange,
  userPosition,
  onUserPositionChange,
  userDepartment,
  onUserDepartmentChange,
  editName,
  editPhone,
  editEmail,
  onEditNameChange,
  onEditPhoneChange,
  onEditEmailChange,
  onLogout,
}: MyInfoViewProps) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#f5f5f5]">
      <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-white px-5 py-4">
        {myInfoSection !== "main" ? (
          <button
            type="button"
            onClick={() => onMyInfoSectionChange("main")}
            className="cursor-pointer border-none bg-transparent p-1.5"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#333"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}
        <h1 className="m-0 text-lg font-bold text-[#1a1a1a]">
          {SECTION_TITLES[myInfoSection]}
        </h1>
        <div className="w-9" />
      </div>

      {myInfoSection === "main" && (
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="relative m-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#5bb5cf] to-[#3b5bdb] px-5 py-7">
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-[18px]">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                <span className="text-2xl font-bold text-[#3b5bdb]">
                  {editName.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{editName}</div>
                <div className="mt-1 text-sm text-white/85">
                  {userDepartment} · {userPosition}
                </div>
                <div className="mt-0.5 text-[0.8125rem] text-white/70">
                  {editEmail}
                </div>
              </div>
            </div>
            <div className="relative mt-4 flex gap-2">
              <div className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                소망의료재단
              </div>
              <div className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                사번 N2024-087
              </div>
            </div>
          </div>

          <div className="mx-4 mb-4 overflow-hidden rounded-[20px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
            {(
              [
                {
                  icon: "👤",
                  label: "프로필 수정",
                  section: "editProfile" as const,
                  color: "#5bb5cf",
                  sub: "",
                },
                {
                  icon: "🔒",
                  label: "비밀번호 변경",
                  section: "changePassword" as const,
                  color: "#6366f1",
                  sub: "",
                },
                {
                  icon: "💼",
                  label: "직책 변경",
                  section: "changePosition" as const,
                  color: "#f59e0b",
                  sub: userPosition,
                },
                {
                  icon: "🏥",
                  label: "부서 변경",
                  section: "changeDepartment" as const,
                  color: "#10b981",
                  sub: userDepartment,
                },
              ] as const
            ).map((item, idx, arr) => (
              <button
                key={item.section}
                type="button"
                onClick={() => onMyInfoSectionChange(item.section)}
                className={`flex w-full cursor-pointer items-center gap-3.5 border-none bg-transparent px-4.5 py-4 text-left ${
                  idx < arr.length - 1 ? "border-b border-[#f0f0f0]" : ""
                }`}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${item.color}15` }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[0.9375rem] font-semibold text-[#1a1a1a]">
                    {item.label}
                  </div>
                  {item.sub ? (
                    <div className="mt-0.5 text-xs text-[#999]">{item.sub}</div>
                  ) : null}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="#ccc"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>

          <div className="mx-4 mb-4 rounded-[20px] bg-white p-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
            <h3 className="m-0 mb-3.5 text-[0.9375rem] font-bold text-[#1a1a1a]">
              알림 설정
            </h3>
            {[
              { label: "결재 요청 알림", on: true },
              { label: "일정 리마인더", on: true },
              { label: "공지사항 알림", on: false },
            ].map(({ label, on }) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-[#f5f5f5] py-2.5 last:border-b-0"
              >
                <span className="text-sm text-[#333]">{label}</span>
                <div
                  className={`relative h-6 w-11 cursor-pointer rounded-xl ${
                    on ? "bg-[#5bb5cf]" : "bg-[#e0e0e0]"
                  }`}
                >
                  <div
                    className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] ${
                      on ? "left-[23px]" : "left-[3px]"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mx-4 mb-4 rounded-[20px] bg-white px-4.5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
            <div className="mb-2.5 flex justify-between">
              <span className="text-sm text-[#888]">앱 버전</span>
              <span className="text-sm font-semibold text-[#333]">v1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#888]">마지막 로그인</span>
              <span className="text-sm font-semibold text-[#333]">
                2026-04-18 08:32
              </span>
            </div>
          </div>

          <div className="mx-4 mb-6">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#ffd0d0] bg-[#fff0f0] py-[15px]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="text-[0.9375rem] font-bold text-red-500">
                로그아웃
              </span>
            </button>
          </div>
        </div>
      )}

      {myInfoSection === "editProfile" && (
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-5">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
            {(
              [
                {
                  label: "이름",
                  value: editName,
                  setter: onEditNameChange,
                },
                {
                  label: "이메일",
                  value: editEmail,
                  setter: onEditEmailChange,
                },
                {
                  label: "연락처",
                  value: editPhone,
                  setter: onEditPhoneChange,
                },
              ] as const
            ).map(({ label, value, setter }) => (
              <div key={label} className="mb-[18px]">
                <label className="mb-1.5 block text-[0.8125rem] font-semibold text-[#5bb5cf]">
                  {label}
                </label>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full rounded-xl border border-[#e0e0e0] bg-[#fafafa] px-3.5 py-3 text-[0.9375rem] text-[#1a1a1a] outline-none box-border"
                />
              </div>
            ))}
            <div className="mb-[18px]">
              <label className="mb-1.5 block text-[0.8125rem] font-semibold text-[#5bb5cf]">
                직책 (현재)
              </label>
              <div className="rounded-xl border border-[#e0eff3] bg-[#f5f9fa] px-3.5 py-3 text-[0.9375rem] text-[#888]">
                {userPosition}
              </div>
            </div>
            <div className="mb-[18px]">
              <label className="mb-1.5 block text-[0.8125rem] font-semibold text-[#5bb5cf]">
                부서 (현재)
              </label>
              <div className="rounded-xl border border-[#e0eff3] bg-[#f5f9fa] px-3.5 py-3 text-[0.9375rem] text-[#888]">
                {userDepartment}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onMyInfoSectionChange("main")}
              className="w-full cursor-pointer rounded-[14px] border-none bg-[#5bb5cf] py-[15px] text-base font-bold text-white"
            >
              저장하기
            </button>
          </div>
        </div>
      )}

      {myInfoSection === "changePassword" && (
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-5">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
            {(
              [
                {
                  label: "현재 비밀번호",
                  value: currentPw,
                  setter: onCurrentPwChange,
                },
                { label: "새 비밀번호", value: newPw, setter: onNewPwChange },
                {
                  label: "새 비밀번호 확인",
                  value: confirmPw,
                  setter: onConfirmPwChange,
                },
              ] as const
            ).map(({ label, value, setter }) => (
              <div key={label} className="mb-[18px]">
                <label className="mb-1.5 block text-[0.8125rem] font-semibold text-[#6366f1]">
                  {label}
                </label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder="●●●●●●●●"
                  className="w-full rounded-xl border border-[#e0e0e0] bg-[#fafafa] px-3.5 py-3 text-[0.9375rem] text-[#1a1a1a] outline-none box-border"
                />
              </div>
            ))}
            {newPw && confirmPw && newPw !== confirmPw ? (
              <div className="mb-3 rounded-[10px] bg-red-50 px-3.5 py-2.5 text-[0.8125rem] text-red-500">
                ⚠ 새 비밀번호가 일치하지 않습니다.
              </div>
            ) : null}
            {newPw && confirmPw && newPw === confirmPw ? (
              <div className="mb-3 rounded-[10px] bg-emerald-50 px-3.5 py-2.5 text-[0.8125rem] text-emerald-500">
                ✓ 비밀번호가 일치합니다.
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                onCurrentPwChange("");
                onNewPwChange("");
                onConfirmPwChange("");
                onMyInfoSectionChange("main");
              }}
              className={`w-full cursor-pointer rounded-[14px] border-none bg-[#6366f1] py-[15px] text-base font-bold text-white ${
                newPw && confirmPw && newPw === confirmPw
                  ? "opacity-100"
                  : "opacity-50"
              }`}
            >
              변경하기
            </button>
          </div>
        </div>
      )}

      {myInfoSection === "changePosition" && (
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
          <p className="mb-3.5 text-sm text-[#888]">
            현재:{" "}
            <strong className="text-amber-500">{userPosition}</strong>
          </p>
          <div className="flex flex-col gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => onUserPositionChange(pos)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-[14px] bg-white px-4.5 py-3.5 ${
                  userPosition === pos
                    ? "border-2 border-amber-500"
                    : "border border-[#e0e0e0]"
                }`}
              >
                <span
                  className={`text-[0.9375rem] ${
                    userPosition === pos
                      ? "font-bold text-amber-500"
                      : "font-medium text-[#333]"
                  }`}
                >
                  {pos}
                </span>
                {userPosition === pos ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onMyInfoSectionChange("main")}
            className="mt-5 w-full cursor-pointer rounded-[14px] border-none bg-amber-500 py-[15px] text-base font-bold text-white"
          >
            저장하기
          </button>
        </div>
      )}

      {myInfoSection === "changeDepartment" && (
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
          <p className="mb-3.5 text-sm text-[#888]">
            현재:{" "}
            <strong className="text-emerald-500">{userDepartment}</strong>
          </p>
          <div className="flex flex-col gap-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => onUserDepartmentChange(dept)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-[14px] bg-white px-4.5 py-3.5 ${
                  userDepartment === dept
                    ? "border-2 border-emerald-500"
                    : "border border-[#e0e0e0]"
                }`}
              >
                <span
                  className={`text-[0.9375rem] ${
                    userDepartment === dept
                      ? "font-bold text-emerald-500"
                      : "font-medium text-[#333]"
                  }`}
                >
                  {dept}
                </span>
                {userDepartment === dept ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onMyInfoSectionChange("main")}
            className="mt-5 w-full cursor-pointer rounded-[14px] border-none bg-emerald-500 py-[15px] text-base font-bold text-white"
          >
            저장하기
          </button>
        </div>
      )}
    </div>
  );
}
