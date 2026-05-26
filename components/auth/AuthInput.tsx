"use client";

import type { InputHTMLAttributes } from "react";

type AuthInputProps = {
  label: string;
  name: string;
  helperText?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function AuthInput({
  label,
  helperText,
  error,
  className = "",
  ...props
}: AuthInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        {...props}
        className={`mt-2 block w-full rounded-3xl border px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100 ${
          error ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"
        } ${className}`}
      />
      <p className={`mt-2 min-h-[1.1rem] text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>
        {error ?? helperText ?? "\u00A0"}
      </p>
    </label>
  );
}
