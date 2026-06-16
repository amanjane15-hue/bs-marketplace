"use client";

import { useState, type InputHTMLAttributes } from "react";

type AuthInputProps = {
  label: string;
  name: string;
  helperText?: string;
  error?: string;
  showPasswordToggle?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export default function AuthInput({
  label,
  helperText,
  error,
  className = "",
  showPasswordToggle,
  type = "text",
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className={`mt-2 block w-full rounded-3xl border px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100 ${
            error ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"
          } ${showPasswordToggle ? "pr-12" : ""} ${className}`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 mt-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      <p className={`mt-2 min-h-[1.1rem] text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>
        {error ?? helperText ?? "\u00A0"}
      </p>
    </label>
  );
}
