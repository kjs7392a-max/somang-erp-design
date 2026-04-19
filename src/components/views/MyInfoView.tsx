"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Building2,
  BadgeCheck,
  KeyRound,
  Bell,
  Info,
  LogOut,
  Pencil,
  Check,
  X,
} from "lucide-react";

export type MyInfoViewProps = {
  editName: string;
  editPhone: string;
  editEmail: string;
  onEditNameChange: (v: string) => void;
  onEditPhoneChange: (v: string) => void;
  onEditEmailChange: (v: string) => void;

  userPosition: string;
  userDepartment: string;

 
 onOpenChangePassword?: () => void;
  onOpenNotifications?: () => void;
  onOpenAppInfo?: () => void;
  onLogout: () => void;

  /** 개발용 역할 전환 */
  role?: import("@/types/role").UserRole;
  onRoleChange?: (r: import("@/types/role").UserRole) => void;
};
export function MyInfoView({
  editName,
  editPhone,
  editEmail,
  onEditNameChange,
  onEditPhoneChange,
  onEditEmailChange,
  userPosition,
  userDepartment,
  onOpenChangePassword,
  onOpenNotifications,
  onOpenAppInfo,
  onLogout,
  role,
  onRoleChange,
}: MyInfoViewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: editName,
    phone: editPhone,
    email: editEmail,
  });

  const startEdit = () => {
    setDraft({ name: editName, phone: editPhone, email: editEmail });
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const saveEdit = () => {
    onEditNameChange(draft.name);
    onEditPhoneChange(draft.phone);
    onEditEmailChange(draft.email);
    setEditing(false);
  };

  return (
    <div className="px-5 py-5">
      {/* 프로필 카드 */}
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e7edff] text-2xl font-bold text-[#3b5bdb]">
            {editName?.[0] ?? "?"}
          </div>
          <div className="flex-1">
            <h2 className="text-[1.125rem] font-bold text-zinc-900">
              {editName}
            </h2>
            <p className="text-sm text-zinc-500">
              {userDepartment} · {userPosition}
            </p>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={startEdit}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100"
              aria-label="프로필 수정"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100"
                aria-label="취소"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b5bdb] text-white active:opacity-80"
                aria-label="저장"
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {/* 상세 필드 */}
        <div className="divide-y divide-zinc-100">
          <FieldRow
            icon={<User className="h-4 w-4 text-zinc-400" />}
            label="이름"
            value={editing ? draft.name : editName}
            editable={editing}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
          />
          <FieldRow
            icon={<Phone className="h-4 w-4 text-zinc-400" />}
            label="전화번호"
            value={editing ? draft.phone : editPhone}
            editable={editing}
            type="tel"
            onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
          />
          <FieldRow
            icon={<Mail className="h-4 w-4 text-zinc-400" />}
            label="이메일"
            value={editing ? draft.email : editEmail}
            editable={editing}
            type="email"
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
          />
          {/* 읽기 전용: 관리자 배정 */}
          <FieldRow
            icon={<Building2 className="h-4 w-4 text-zinc-400" />}
            label="부서"
            value={userDepartment}
            readonlyHint="관리자 배정"
          />
          <FieldRow
            icon={<BadgeCheck className="h-4 w-4 text-zinc-400" />}
            label="직급"
            value={userPosition}
            readonlyHint="관리자 배정"
          />
        </div>
      </section>

       {/* 역할 전환 (개발용) */}
      {role && onRoleChange && (
        <section className="mb-5">
          <h3 className="mb-2 px-1 text-[0.8125rem] font-semibold text-zinc-500">
            역할 전환 <span className="ml-1 text-zinc-400">(개발용)</span>
          </h3>
          <div className="flex gap-2 rounded-2xl bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            {(["staff", "manager", "exec"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRoleChange(r)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  role === r
                    ? "bg-[#3b5bdb] text-white"
                    : "text-zinc-600 active:bg-zinc-100"
                }`}
              >
                {r === "staff" ? "직원" : r === "manager" ? "관리자" : "임원"}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 설정 섹션 */}
      <section className="mb-5">
        <h3 className="mb-2 px-1 text-[0.8125rem] font-semibold text-zinc-500">
          설정
        </h3>
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <SettingRow
            icon={<KeyRound className="h-5 w-5 text-zinc-600" />}
            label="비밀번호 변경"
            onClick={onOpenChangePassword}
          />
          <SettingRow
            icon={<Bell className="h-5 w-5 text-zinc-600" />}
            label="알림 설정"
            onClick={onOpenNotifications}
          />
          <SettingRow
            icon={<Info className="h-5 w-5 text-zinc-600" />}
            label="앱 정보"
            valueHint="v0.1.0"
            onClick={onOpenAppInfo}
          />
        </div>
      </section>

      {/* 로그아웃 */}
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-[0.9375rem] font-semibold text-red-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:opacity-80"
      >
        <LogOut className="h-4 w-4" strokeWidth={2.2} />
        로그아웃
      </button>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function FieldRow({
  icon,
  label,
  value,
  editable,
  onChange,
  type = "text",
  readonlyHint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (v: string) => void;
  type?: "text" | "tel" | "email";
  readonlyHint?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-8 w-8 items-center justify-center">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-zinc-500">
          {label}
          {readonlyHint && (
            <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[0.625rem] font-medium text-zinc-500">
              {readonlyHint}
            </span>
          )}
        </p>
        {editable && onChange ? (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-0.5 w-full border-b border-[#3b5bdb]/40 bg-transparent py-0.5 text-[0.9375rem] font-medium text-zinc-900 outline-none focus:border-[#3b5bdb]"
          />
        ) : (
          <p className="text-[0.9375rem] font-medium text-zinc-900">{value}</p>
        )}
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  valueHint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  valueHint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-zinc-100 px-5 py-4 text-left last:border-b-0 active:bg-zinc-50"
    >
      <span className="flex h-8 w-8 items-center justify-center">{icon}</span>
      <span className="flex-1 text-[0.9375rem] font-medium text-zinc-900">
        {label}
      </span>
      {valueHint && (
        <span className="text-sm text-zinc-400">{valueHint}</span>
      )}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 18l6-6-6-6"
          stroke="#a1a1aa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}