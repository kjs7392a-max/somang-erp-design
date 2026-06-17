"use client";

import { useState } from "react";
import { UtensilsCrossed, ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { useMealMenus, type MealMenu } from "@/hooks/useMealMenus";
import { useMealReservation } from "@/hooks/useMealReservation";
import { format, addDays, startOfToday } from "date-fns";
import { ko } from "date-fns/locale";
import { useT } from "@/context/LangContext";

const MEAL_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  조식: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  중식: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  석식: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
};

type Props = { userId: string };

export function MealReservationView({ userId }: Props) {
  const t = useT();
  const today = startOfToday();
  const [offset, setOffset] = useState(0);
  const selectedDate = addDays(today, offset);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { menus, loading } = useMealMenus(format(today, "yyyy-MM-dd"));
  const { reservedMenuIds, reserve, cancel } = useMealReservation(userId);

  const dayMenus = menus.filter((m) => m.menu_date === dateStr);

  const MEAL_ORDER = [
    { key: "중식", label: t("meal_lunch") },
    { key: "석식", label: t("meal_dinner") },
    { key: "조식", label: t("meal_breakfast") },
  ] as const;

  const handleToggle = async (menu: MealMenu) => {
    if (reservedMenuIds.has(menu.id)) {
      await cancel(menu.id);
    } else {
      await reserve(menu.id);
    }
  };

  return (
    <div className="flex flex-col min-h-0 px-4 pb-4">
      {/* 날짜 선택 */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="p-2 rounded-full disabled:opacity-30 active:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[1rem] font-bold text-gray-900">
            {format(selectedDate, "M월 d일 (EEE)", { locale: ko })}
          </p>
          {offset === 0 && (
            <span className="text-xs text-blue-500 font-medium">{t("meal_today")}</span>
          )}
        </div>
        <button
          onClick={() => setOffset((o) => Math.min(6, o + 1))}
          disabled={offset === 6}
          className="p-2 rounded-full disabled:opacity-30 active:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 식단 목록 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          {t("meal_loading")}
        </div>
      ) : dayMenus.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
          <UtensilsCrossed size={40} className="text-gray-200" />
          <p className="text-sm text-gray-400">{t("meal_empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {MEAL_ORDER.map(({ key, label }) => {
            const menu = dayMenus.find((m) => m.meal_type === key);
            if (!menu) return null;
            const reserved = reservedMenuIds.has(menu.id);
            const colors = MEAL_COLOR[key];

            return (
              <div
                key={menu.id}
                style={{ borderColor: colors.border }}
                className="rounded-2xl border bg-white overflow-hidden"
              >
                {/* 헤더 */}
                <div
                  style={{ background: colors.bg }}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span style={{ color: colors.text }} className="text-sm font-bold">
                    {label}
                  </span>
                  {reserved ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                      <CheckCircle2 size={14} />
                      {t("meal_reserved")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={14} />
                      {t("meal_pending")}
                    </span>
                  )}
                </div>

                {/* 메뉴 항목 */}
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {menu.items.join(" · ")}
                  </p>
                </div>

                {/* 예약 버튼 */}
                <div className="px-4 pb-3">
                  <button
                    onClick={() => handleToggle(menu)}
                    className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors active:scale-[0.98] ${
                      reserved ? "bg-gray-100 text-gray-500" : "bg-[#3b5bdb] text-white"
                    }`}
                  >
                    {reserved ? t("meal_cancel") : t("meal_reserve")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
