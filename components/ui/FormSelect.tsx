"use client";

import type { SelectHTMLAttributes } from "react";

type Option = {
  value: string;
  label: string;
};

type FormSelectProps = {
  label: string;
  name: string;
  options: Option[];
  helperText?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export default function FormSelect({
  label,
  options,
  helperText,
  className = "",
  ...props
}: FormSelectProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        {...props}
        className={`mt-2 block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100 ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? (
        <p className="mt-2 text-sm text-slate-500">{helperText}</p>
      ) : null}
    </label>
  );
}
