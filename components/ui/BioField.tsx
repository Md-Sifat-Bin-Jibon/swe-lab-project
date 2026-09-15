"use client";

import { useState, type ChangeEvent } from "react";

export const BIO_MAX = 400;

export interface BioFieldProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  maxLength?: number;
  required?: boolean;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export function BioField({
  id = "bio",
  name = "bio",
  value,
  defaultValue = "",
  maxLength = BIO_MAX,
  required,
  onChange,
  className = "",
}: BioFieldProps) {
  const isControlled = value !== undefined;
  const [uncontrolledLength, setUncontrolledLength] = useState(
    defaultValue.length,
  );
  const currentLength = isControlled ? value.length : uncontrolledLength;
  const remaining = maxLength - currentLength;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (!isControlled) {
      setUncontrolledLength(event.target.value.length);
    }
    onChange?.(event);
  }

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        Short Bio
      </label>
      <textarea
        id={id}
        name={name}
        rows={5}
        maxLength={maxLength}
        placeholder='(e.g., "Freelance graphic designer passionate about sustainable design solutions.)'
        value={value}
        defaultValue={isControlled ? undefined : defaultValue}
        required={required}
        onChange={handleChange}
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
      />
      <p className="text-sm text-slate-400">{remaining} characters left</p>
    </div>
  );
}
