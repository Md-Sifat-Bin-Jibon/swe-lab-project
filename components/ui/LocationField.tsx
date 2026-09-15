import type { ChangeEvent } from "react";

export interface LocationFieldProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

function LocationPinIcon() {
  return (
    <svg
      className="h-5 w-5 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function LocationField({
  id = "location",
  name = "location",
  value,
  defaultValue,
  placeholder = "NY, USA",
  required,
  onChange,
  className = "",
}: LocationFieldProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        Location
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          required={required}
          onChange={onChange}
          className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-4 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <LocationPinIcon />
        </span>
      </div>
    </div>
  );
}
