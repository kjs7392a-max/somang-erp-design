"use client";

import { useRef } from "react";
import { Paperclip, X, FileText, Image as ImgIcon, File } from "lucide-react";

export type AttachmentItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
};

type Props = {
  items: AttachmentItem[];
  onChange: (items: AttachmentItem[]) => void;
  required?: boolean;
  hint?: string;
  maxCount?: number;
  maxSizeMB?: number;
};

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type.startsWith("image/")) return ImgIcon;
  if (type === "application/pdf") return FileText;
  return File;
}

export function AttachmentPicker({
  items,
  onChange,
  required,
  hint,
  maxCount = 5,
  maxSizeMB = 10,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (files: FileList | null) => {
    if (!files) return;
    const next = [...items];
    for (const f of Array.from(files)) {
      if (next.length >= maxCount) break;
      if (f.size > maxSizeMB * 1024 * 1024) {
        alert(`${f.name}\n최대 ${maxSizeMB}MB까지 첨부 가능합니다.`);
        continue;
      }
      next.push({
        id: `${Date.now()}-${f.name}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        file: f,
      });
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-zinc-900">첨부파일</span>
          {required && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-red-600">
              필수
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-400">
          {items.length}/{maxCount}
        </span>
      </div>

      {hint && (
        <p className="mb-2 text-xs text-zinc-500 leading-relaxed">{hint}</p>
      )}

      {/* Picker button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={items.length >= maxCount}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-4 text-sm font-semibold text-zinc-600 transition hover:border-[#3b5bdb] hover:bg-[#eef2ff] active:scale-[0.99] disabled:opacity-50"
      >
        <Paperclip className="h-4 w-4" strokeWidth={2.2} />
        파일 선택 (최대 {maxSizeMB}MB)
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handlePick(e.target.files)}
      />

      {/* File list */}
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((it) => {
            const Icon = fileIcon(it.type);
            return (
              <li
                key={it.id}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-white px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <Icon className="h-4 w-4 text-zinc-600" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {it.name}
                  </p>
                  <p className="text-xs text-zinc-400">{fmtSize(it.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(it.id)}
                  aria-label="삭제"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 active:scale-95"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}