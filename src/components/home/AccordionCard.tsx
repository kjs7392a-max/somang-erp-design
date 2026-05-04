"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type AccordionCardProps = {
  title: string;
  summary?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function AccordionCard({
  title,
  summary,
  icon,
  children,
  defaultOpen = false,
}: AccordionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left active:bg-zinc-50"
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff]">
            {icon}
          </span>
        )}
        <div className="flex-1">
          <p className="text-[0.9375rem] font-bold text-zinc-900">{title}</p>
          {summary && (
            <div className="mt-0.5 text-xs text-zinc-500">{summary}</div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {/* Smooth expand/collapse with CSS grid-rows trick */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`border-t border-zinc-100 px-5 py-4 transition-transform duration-300 ease-out ${
              open ? "translate-y-0" : "-translate-y-1"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}