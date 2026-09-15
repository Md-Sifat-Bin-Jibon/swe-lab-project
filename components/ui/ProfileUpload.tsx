"use client";

import { useState, type ChangeEvent } from "react";

export interface ProfileUploadProps {
  id?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileChange?: (file: File | null) => void;
  className?: string;
}

function ImageIcon() {
  return (
    <svg
      className="h-10 w-10 text-slate-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.5" r="1.5" />
      <path
        d="m21 17-5.5-5.5a2 2 0 0 0-2.8 0L5 19"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileUpload({
  id = "profile-photo",
  accept = "image/jpeg,image/png",
  maxSizeMb = 2,
  onFileChange,
  className = "",
}: ProfileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("No file attached");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setPreviewUrl(null);
      setStatus("No file attached");
      onFileChange?.(null);
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setStatus(`File too large (max ${maxSizeMb}MB)`);
      event.target.value = "";
      onFileChange?.(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setStatus(file.name);
    onFileChange?.(file);
  }

  return (
    <div className={`flex flex-col gap-6 sm:flex-row sm:items-start ${className}`.trim()}>
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <input
            id={id}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleChange}
          />
          <label
            htmlFor={id}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Upload a photo
          </label>
          <span className="text-sm text-slate-400">{status}</span>
        </div>
        <p className="text-xs text-slate-400">JPG, PNG, Max 2MB</p>
      </div>
    </div>
  );
}
