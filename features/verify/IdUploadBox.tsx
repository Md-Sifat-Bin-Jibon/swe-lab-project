"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export function IdUploadBox({
  side,
  title,
  hint,
  file,
  onChange,
  error,
  disabled,
}: {
  side: "front" | "back";
  title: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null, error?: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | undefined | null) {
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return onChange(null, "Use a JPG, PNG or WebP image.");
    if (f.size > MAX_BYTES) return onChange(null, "Image must be under 8 MB.");
    onChange(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) pick(e.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-800">{title}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex aspect-[1.42] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${
          error
            ? "border-rose-300 bg-rose-50/40"
            : dragging
              ? "border-swapspot-blue bg-swapspot-blue/5"
              : file
                ? "border-transparent bg-slate-900"
                : "border-slate-200 bg-slate-50 hover:border-swapspot-blue/60"
        }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={`Passport ${side} preview`} className="h-full w-full object-contain" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
              <span className="truncate text-xs text-white/90">{file?.name}</span>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                  className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-white disabled:opacity-60"
                >
                  Replace
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(null)}
                  className="rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/30 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-swapspot-blue shadow-sm">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-slate-800">
              Drag & drop or <span className="text-swapspot-blue underline">browse</span>
            </span>
            <span className="text-xs text-slate-500">{hint}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
          aria-label={title}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
