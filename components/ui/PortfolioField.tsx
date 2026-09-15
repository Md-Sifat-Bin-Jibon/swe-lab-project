import type { ChangeEvent } from "react";

export interface PortfolioFieldProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function PortfolioField({
  id = "portfolio-url",
  name = "portfolio-url",
  value,
  defaultValue,
  placeholder = "https://yourportfolio.com",
  required,
  onChange,
  className = "",
}: PortfolioFieldProps) {
  return (
    <div className={`max-w-xl space-y-2 ${className}`.trim()}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        Portfolio / Website URL (Optional)
      </label>
      <input
        id={id}
        name={name}
        type="url"
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        required={required}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
      />
      <p className="text-sm text-slate-500">
        Share a link to your work or personal website.
      </p>
    </div>
  );
}
