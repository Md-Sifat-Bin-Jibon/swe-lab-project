import type { ChangeEvent } from "react";

export interface PhoneFieldProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PhoneField({
  id = "phone",
  name = "phone",
  value,
  defaultValue,
  placeholder = "e.g 812-3123-3123",
  required,
  onChange,
  className = "",
}: PhoneFieldProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        Phone Number
      </label>
      <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-swapspot-blue focus-within:ring-2 focus-within:ring-swapspot-blue/20">
        <div
          className="flex shrink-0 items-center gap-1.5 border-r border-slate-200 px-3 py-3 text-sm text-slate-600"
          aria-hidden="true"
        >
          <span className="text-base leading-none" aria-label="United States">
            US
          </span>
          <span className="font-medium">+1</span>
          <ChevronDownIcon />
        </div>
        <input
          id={id}
          name={name}
          type="tel"
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          required={required}
          onChange={onChange}
          className="min-w-0 flex-1 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
