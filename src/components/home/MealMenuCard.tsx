"use client";

import { useRouter } from "next/navigation";
import { UtensilsCrossed, CheckCircle2, ChevronRight } from "lucide-react";
import { useMealMenus } from "@/hooks/useMealMenus";
import { useMealReservation } from "@/hooks/useMealReservation";
import { ROUTES } from "@/lib/routes";
import { format, addDays, startOfToday } from "date-fns";
import { useT } from "@/context/LangContext";

const MEAL_ORDER = ["중식", "석식", "조식"];

const MEAL_COLOR: Record<string, string> = {
  조식: "#c2410c",
  중식: "#15803d",
  석식: "#1d4ed8",
};

const MEAL_KEY: Record<string, "meal_breakfast" | "meal_lunch" | "meal_dinner"> = {
  조식: "meal_breakfast",
  중식: "meal_lunch",
  석식: "meal_dinner",
};

type Props = { userId: string };

export function MealMenuCard({ userId }: Props) {
  const router = useRouter();
  const t = useT();
  const today = startOfToday();
  const todayStr = format(today, "yyyy-MM-dd");
  const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd");

  const { menus, loading } = useMealMenus(todayStr);
  const { reservedMenuIds } = useMealReservation(userId);

  const tomorrowMenus = menus.filter((m) => m.menu_date === tomorrowStr);
  const todayMenus = menus.filter((m) => m.menu_date === todayStr);
  const displayMenus = tomorrowMenus.length > 0 ? tomorrowMenus : todayMenus;
  const displayLabel = tomorrowMenus.length > 0 ? tomorrowStr : todayStr;

  if (loading) return null;
  if (displayMenus.length === 0) return null;

  const reservedCount = displayMenus.filter((m) => reservedMenuIds.has(m.id)).length;

  return (
    <div className="mb-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <UtensilsCrossed size={15} className="text-[#3b5bdb]" />
          <div>
            <h2 className="text-[0.875rem] font-bold text-zinc-900">
              {format(new Date(displayLabel), "M/d")} {t("home_meal_label")}
            </h2>
            {reservedCount > 0 && (
              <p className="text-[0.6875rem] text-blue-500 font-medium">
                {t("home_meal_reserved_n").replace("{n}", String(reservedCount))}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push(ROUTES.meal)}
          className="flex items-center gap-1 rounded-lg bg-[#3b5bdb] px-3 py-1.5 text-[0.75rem] font-bold text-white"
        >
          {t("home_meal_reserve_btn")} <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {[...displayMenus]
          .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type))
          .map((menu) => {
            const reserved = reservedMenuIds.has(menu.id);
            return (
              <div key={menu.id} className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2">
                {reserved && <CheckCircle2 size={13} className="text-blue-500 shrink-0" />}
                <span
                  className="shrink-0 text-[0.6875rem] font-bold"
                  style={{ color: MEAL_COLOR[menu.meal_type] }}
                >
                  {t(MEAL_KEY[menu.meal_type] ?? "meal_lunch")}
                </span>
                <span className="truncate text-[0.75rem] text-zinc-600">
                  {menu.items.join(" · ")}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
