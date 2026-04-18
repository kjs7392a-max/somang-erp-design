"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, CheckSquare, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/draft", label: "기안", icon: FileText },
  { href: "/approval", label: "결재", icon: CheckSquare },
  { href: "/calendar", label: "일정", icon: Calendar },
  { href: "/mypage", label: "더보기", icon: MoreHorizontal },
];

export default function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch h-14">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-0.5 text-xs font-medium transition-colors",
                  isActive ? "text-[#2F80ED]" : "text-gray-400"
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
