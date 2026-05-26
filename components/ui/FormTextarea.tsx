"use client";

import type { TextareaHTMLAttributes } from "react";

type FormTextareaProps = {
  label: string;
  name: string;
  helperText?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function FormTextarea({
  label,
  helperText,
  className = "",
  rows = 6,
  ...props
}: FormTextareaProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        {...props}
        rows={rows}
        className={`mt-2 block w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100 ${className}`}
      />
      {helperText ? (
        <p className="mt-2 text-sm text-slate-500">{helperText}</p>
      ) : null}
    </label>
  );
}
