"use client";

export type WebAuthnPromptProps = {
  onRegister: () => void;
  onSkip: () => void;
  loading?: boolean;
  error?: string | null;
};

export function WebAuthnPrompt({
  onRegister,
  onSkip,
  loading = false,
  error = null,
}: WebAuthnPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f0fd] text-2xl">
          👆
        </div>
        <h2 className="mb-2 text-lg font-bold text-[#1e293b]">
          빠른 로그인 설정
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-[#4b5d8a]">
          지문(또는 Face ID)으로 다음부터 비밀번호 없이 바로 로그인할 수
          있습니다.
        </p>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-2xl border border-[#cddcfa] bg-white py-3.5 text-sm font-semibold text-[#4b5d8a] active:opacity-70"
          >
            다음에
          </button>
          <button
            type="button"
            onClick={onRegister}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[#3b82f6] py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)] disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? "등록 중..." : "지금 등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
