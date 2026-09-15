import type { ChangeEvent, InputHTMLAttributes } from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autocomplete?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "name" | "type" | "placeholder" | "autoComplete" | "value" | "defaultValue" | "required" | "onChange"
  >;
}

export function FormField({
  id,
  label,
  type = "text",
  placeholder = "",
  autocomplete,
  name,
  value,
  defaultValue,
  required,
  onChange,
  className = "",
  inputProps,
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-500">
        {label}
      </label>
      <input
        id={id}
        name={name ?? id}
        type={type}
        placeholder={placeholder}
        autoComplete={autocomplete}
        value={value}
        defaultValue={defaultValue}
        required={required}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
        {...inputProps}
      />
    </div>
  );
}
