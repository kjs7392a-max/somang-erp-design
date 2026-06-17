"use client";

import React, { useState, useEffect, useRef } from "react";

// ── Design Tokens ──────────────────────────────────────────────
export const C = {
  primary: "#5bb5cf",
  primaryDeep: "#00a0c6",
  primarySoft: "#e3f4f8",
  ink: "#1a2b33",
  textDark: "#2d5c6e",
  text: "#3d5663",
  textMuted: "#6b8c9a",
  textFaint: "#8ba8b3",
  bg: "#f4f7f9",
  surface: "#ffffff",
  border: "#e4ecef",
  borderSoft: "#eef3f5",
  divider: "#f0f4f6",
  chipBg: "#f1f5f7",
  oebak: "#ef4444", oebakBg: "#fdecec",
  oechul: "#f97316", oechulBg: "#fff1e6",
  returned: "#94a3b8", returnedBg: "#eef1f4",
  shiftD: "#00a0c6", shiftDbg: "#e1f3f8",
  shiftE: "#8b5cf6", shiftEbg: "#f0ebfd",
  shiftN: "#1e40af", shiftNbg: "#e6ebf7",
  shiftO: "#94a3b8", shiftObg: "#eef1f3",
  warn: "#d97706", warnBg: "#fff3e0",
  danger: "#dc2626", dangerBg: "#fdecec",
  ok: "#0a8f5b", okBg: "#e6f5ee",
};

export const FONT = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
export const MONO = '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, monospace';
export const WD = ["일", "월", "화", "수", "목", "금", "토"];

// ── Date utils ────────────────────────────────────────────────
export function fmtK(d: string | Date, withWd?: boolean): string {
  const dd = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  const base = `${dd.getFullYear()}년 ${dd.getMonth() + 1}월 ${dd.getDate()}일`;
  return withWd ? `${base} (${WD[dd.getDay()]})` : base;
}
export function fmtDot(s: string): string {
  if (!s) return "";
  return s.slice(0, 10).replace(/-/g, ".");
}
export function fmtDT(s: string | null | undefined): string {
  if (!s) return "—";
  const [d, t] = s.split("T");
  return `${d.slice(5).replace("-", ".")} ${t || ""}`.trim();
}

// ── Btn ───────────────────────────────────────────────────────
type BtnVariant = "primary" | "ghost" | "soft" | "danger";
type BtnSize = "sm" | "md";
interface BtnProps {
  children?: React.ReactNode;
  variant?: BtnVariant;
  icon?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  size?: BtnSize;
  title?: string;
  disabled?: boolean;
}
export function WardBtn({ children, variant = "ghost", icon, onClick, style, size = "md", title, disabled }: BtnProps) {
  const sz = size === "sm"
    ? { padding: "6px 11px", fontSize: 12 }
    : { padding: "9px 15px", fontSize: 13 };
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: C.primaryDeep, color: "#fff", border: "1px solid transparent" },
    ghost: { background: C.surface, color: C.textDark, border: `1px solid ${C.border}` },
    soft: { background: C.primarySoft, color: C.primaryDeep, border: "1px solid transparent" },
    danger: { background: C.surface, color: C.danger, border: `1px solid ${C.border}` },
  };
  const [hov, setHov] = useState(false);
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...sz, ...variants[variant], borderRadius: 7, fontWeight: 600,
        fontFamily: FONT, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 7, lineHeight: 1,
        whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1,
        boxShadow: variant === "primary" ? "0 1px 2px rgba(0,160,198,0.25)" : "none",
        filter: hov && !disabled ? "brightness(0.97)" : "none",
        transition: "filter 0.12s", ...style,
      }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}
export function WardCard({ children, style, onClick }: CardProps) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={onClick ? () => setHov(true) : undefined}
      onMouseLeave={onClick ? () => setHov(false) : undefined}
      style={{
        background: C.surface, borderRadius: 12,
        border: `1px solid ${onClick && hov ? C.primary : C.border}`,
        boxShadow: onClick && hov ? "0 4px 14px rgba(45,92,110,0.08)" : "0 1px 2px rgba(45,92,110,0.03)",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}>{children}</div>
  );
}

// ── SectionTitle ───────────────────────────────────────────────
interface SectionTitleProps {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
  sub?: string;
}
export function SectionTitle({ children, action, onAction, sub }: SectionTitleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{children}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 2, whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
      {action && (
        <div onClick={onAction} style={{ fontSize: 12, color: C.primaryDeep, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
          {action} <span style={{ fontSize: 11 }}>›</span>
        </div>
      )}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
type BadgeTone = "oebak" | "oechul" | "returned" | "ok" | "warn" | "danger" | "info" | "neutral";
interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
}
export function WardBadge({ tone = "neutral", children, dot }: BadgeProps) {
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    oebak: { bg: C.oebakBg, fg: C.oebak },
    oechul: { bg: C.oechulBg, fg: C.oechul },
    returned: { bg: C.returnedBg, fg: C.returned },
    ok: { bg: C.okBg, fg: C.ok },
    warn: { bg: C.warnBg, fg: C.warn },
    danger: { bg: C.dangerBg, fg: C.danger },
    info: { bg: C.primarySoft, fg: C.primaryDeep },
    neutral: { bg: C.chipBg, fg: C.textMuted },
  };
  const t = map[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
      background: t.bg, color: t.fg, whiteSpace: "nowrap", lineHeight: 1.3,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.fg, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

// ── SearchInput ───────────────────────────────────────────────
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number | string;
}
export function WardSearchInput({ value, onChange, placeholder, width }: SearchInputProps) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", borderRadius: 8, background: C.bg,
      border: `1px solid ${foc ? C.primary : "transparent"}`,
      width: width || "auto", flex: width ? "none" : 1, minWidth: 180,
      transition: "border-color 0.15s",
    }}>
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.textFaint} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-3.8-3.8" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: C.ink, fontFamily: FONT, width: "100%" }} />
      {value && (
        <span onClick={() => onChange("")} style={{ cursor: "pointer", color: C.textFaint, flexShrink: 0, display: "flex" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </span>
      )}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────
interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  width?: number | string;
}
export function WardSelect({ value, onChange, options, width }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: width || "auto" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between",
        padding: "8px 12px", borderRadius: 7, fontSize: 12.5, fontWeight: 600,
        border: `1px solid ${open ? C.primary : C.border}`, background: C.surface,
        color: C.textDark, cursor: "pointer", fontFamily: FONT, width: width || "auto",
        whiteSpace: "nowrap",
      }}>
        {value}
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.textFaint} strokeWidth={1.7} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 40,
          minWidth: "100%", background: C.surface, borderRadius: 8,
          border: `1px solid ${C.border}`, boxShadow: "0 8px 28px rgba(28,55,70,0.14)",
          padding: 5, maxHeight: 280, overflowY: "auto",
        }}>
          {options.map((o) => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }}
              style={{
                padding: "7px 10px", borderRadius: 5, fontSize: 12.5, cursor: "pointer",
                color: o === value ? C.primaryDeep : C.textDark,
                fontWeight: o === value ? 700 : 500,
                background: o === value ? C.primarySoft : "transparent",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (o !== value) (e.currentTarget as HTMLElement).style.background = C.bg; }}
              onMouseLeave={(e) => { if (o !== value) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Segmented ──────────────────────────────────────────────────
interface SegmentedOption { id: string; label: string; icon?: React.ReactNode }
interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
}
export function WardSegmented({ options, value, onChange }: SegmentedProps) {
  return (
    <div style={{ display: "inline-flex", background: C.bg, borderRadius: 8, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12.5, fontWeight: active ? 700 : 600,
            border: "none", cursor: "pointer", fontFamily: FONT,
            display: "inline-flex", alignItems: "center", gap: 6,
            background: active ? C.surface : "transparent",
            color: active ? C.primaryDeep : C.textMuted,
            boxShadow: active ? "0 1px 2px rgba(28,55,70,0.1)" : "none",
            transition: "all 0.14s",
          }}>
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── SlidePanel ─────────────────────────────────────────────────
interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}
export function WardSlidePanel({ open, onClose, width = 440, children }: SlidePanelProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: "rgba(20,40,50,0.28)",
        opacity: open ? 1 : 0, transition: "opacity 0.3s",
      }} />
      <div style={{
        position: "absolute", top: 0, right: 0, height: "100%", width,
        background: C.surface, boxShadow: "-12px 0 40px rgba(20,40,50,0.16)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}
export function WardModal({ open, onClose, width = 460, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function h(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 90,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,40,50,0.32)" }} />
      <div style={{
        position: "relative", width, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto",
        background: C.surface, borderRadius: 14, boxShadow: "0 24px 60px rgba(20,40,50,0.28)",
        animation: "nd-pop 0.22s cubic-bezier(0.22,1,0.36,1)",
      }}>{children}</div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────
export function WardToast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, background: C.ink, color: "#fff", padding: "12px 20px",
      borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 9,
      boxShadow: "0 12px 32px rgba(20,40,50,0.3)", animation: "nd-toast 0.3s ease-out",
      whiteSpace: "nowrap",
    }}>
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
      {msg}
    </div>
  );
}

// ── Small SVG icons ────────────────────────────────────────────
const p = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function svgIcon(paths: React.ReactNode, size: number, color: string, sw = 1.7) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      <g stroke={color} strokeWidth={sw} {...p}>{paths}</g>
    </svg>
  );
}
export const WardIcons = {
  grid: (s: number, c: string) => svgIcon(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>, s, c),
  bed: (s: number, c: string) => svgIcon(<><path d="M3 7v11M3 12h13a4 4 0 014 4v2M3 18h18" /><circle cx="8" cy="10" r="1.6" fill={c} stroke="none" /></>, s, c),
  door: (s: number, c: string) => svgIcon(<><path d="M14 3H6a1 1 0 00-1 1v17h9M14 3l4 1v16l-4 1M14 3v18" /><circle cx="15.2" cy="12" r="0.9" fill={c} stroke="none" /></>, s, c),
  clipboard: (s: number, c: string) => svgIcon(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a1 1 0 011-1h4a1 1 0 011 1v1H9V4zM8.5 11h7M8.5 15h4.5" /></>, s, c),
  calendar: (s: number, c: string) => svgIcon(<><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>, s, c),
  table: (s: number, c: string) => svgIcon(<><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M3.5 14.5h17M9 9.5v10M15 9.5v10" /></>, s, c),
  users: (s: number, c: string) => svgIcon(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0M16 6.5a3 3 0 010 6M17 14.5a5 5 0 013.5 5.5" /></>, s, c),
  bowl: (s: number, c: string) => svgIcon(<><path d="M3.5 11h17a8.5 8.5 0 01-17 0zM12 11V4M9.5 6.5C9.5 5 12 4.5 12 4M14.5 7c0-1.5-1-2-1-2.5M5 20h14" /></>, s, c),
  search: (s: number, c: string) => svgIcon(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-3.8-3.8" /></>, s, c),
  bell: (s: number, c: string) => svgIcon(<><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6zM9.5 19a2.5 2.5 0 005 0" /></>, s, c),
  plus: (s: number, c: string) => svgIcon(<><path d="M12 5v14M5 12h14" /></>, s, c),
  download: (s: number, c: string) => svgIcon(<><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></>, s, c),
  close: (s: number, c: string) => svgIcon(<><path d="M6 6l12 12M18 6L6 18" /></>, s, c),
  chevL: (s: number, c: string) => svgIcon(<path d="M14 6l-6 6 6 6" />, s, c),
  chevR: (s: number, c: string) => svgIcon(<path d="M10 6l6 6-6 6" />, s, c),
  chevD: (s: number, c: string) => svgIcon(<path d="M6 9l6 6 6-6" />, s, c),
  check: (s: number, c: string) => svgIcon(<path d="M5 12.5l4.5 4.5L19 7" />, s, c),
  logout: (s: number, c: string) => svgIcon(<><path d="M15 4h3a1 1 0 011 1v14a1 1 0 01-1 1h-3M10 12h10m0 0l-3.5-3.5M20 12l-3.5 3.5" /></>, s, c),
  clock: (s: number, c: string) => svgIcon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>, s, c),
  flame: (s: number, c: string) => svgIcon(<path d="M12 3s5 4 5 9a5 5 0 01-10 0c0-2 1-3 1-3s0 2 2 2c1.5 0 1-3 2-9z" />, s, c),
  phone: (s: number, c: string) => svgIcon(<path d="M6 3h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z" />, s, c),
  stamp: (s: number, c: string) => svgIcon(<><path d="M9.5 3.5a2.5 2.5 0 015 0c0 1.6-1.2 2.4-1.5 4.5h-2c-.3-2.1-1.5-2.9-1.5-4.5zM6 13.5h12M5 17h14v3H5v-3z" /><path d="M9 8.5h6l1 5H8l1-5z" /></>, s, c),
  edit: (s: number, c: string) => svgIcon(<><path d="M5 19h14M14 4l4 4-9 9H5v-4l9-9z" /></>, s, c),
  file: (s: number, c: string) => svgIcon(<><path d="M6 3h8l4 4v14H6V3z" /><path d="M14 3v4h4M8.5 12h7M8.5 16h5" /></>, s, c),
  inbox: (s: number, c: string) => svgIcon(<><path d="M3.5 13l3-8.5a1.5 1.5 0 011.4-1h8.2a1.5 1.5 0 011.4 1l3 8.5M3.5 13v5a1.5 1.5 0 001.5 1.5h14a1.5 1.5 0 001.5-1.5v-5M3.5 13h5l1.5 2.5h4L15.5 13h5" /></>, s, c),
  send: (s: number, c: string) => svgIcon(<path d="M21 4L3 11l6 2.5M21 4l-6 16-4-8.5M21 4L9 13.5" />, s, c),
  building: (s: number, c: string) => svgIcon(<><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></>, s, c),
};
