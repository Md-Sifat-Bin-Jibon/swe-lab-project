"use client";

import { useState, type ChangeEvent } from "react";

export interface PasswordFieldProps {
  id: string;
  label: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  autocomplete?: string;
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

function EyeOpenIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.8-1.9" />
      <path d="M7.2 7.2C5.6 8.4 4.2 10 3 12c0 0 3.5 7 9 7 1.8 0 3.4-.5 4.8-1.3M14 9.3c.6-.3 1.3-.5 2-.5 3 0 5 2.5 5 2.5" />
      <path d="M21 12s-1.1 2.2-3.2 4.2" />
    </svg>
  );
}

export function PasswordField({
  id,
  label,
  name,
  value,
  defaultValue,
  required,
  autocomplete,
  placeholder,
  onChange,
  className = "",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name ?? id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autocomplete ?? "new-password"}
          value={value}
          defaultValue={defaultValue}
          required={required}
          onChange={onChange}
          className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-4 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600"
          aria-label="Toggle password visibility"
          onClick={() => setVisible((prev) => !prev)}
        >
          <span className={visible ? "hidden" : undefined}>
            <EyeOpenIcon />
          </span>
          <span className={visible ? undefined : "hidden"}>
            <EyeClosedIcon />
          </span>
        </button>
      </div>
    </div>
  );
}
