"use client";

import type { InputHTMLAttributes } from "react";

type FormInputProps = {
  label: string;
  name: string;
  helperText?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function FormInput({
  label,
  helperText,
  className = "",
  ...props
}: FormInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        {...props}
        className={`mt-2 block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100 ${className}`}
      />
      {helperText ? (
        <p className="mt-2 text-sm text-slate-500">{helperText}</p>
      ) : null}
    </label>
  );
}
