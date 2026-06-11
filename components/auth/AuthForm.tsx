"use client";

import type { FormEventHandler, ReactNode } from "react";

type AuthFormProps = {
  title: string;
  description: string;
  actionLabel: string;
  loading: boolean;
  disabled?: boolean;
  error?: string | null;
  success?: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  footer?: ReactNode;
  children: ReactNode;
};

export default function AuthForm({
  title,
  description,
  actionLabel,
  loading,
  disabled,
  error,
  success,
  onSubmit,
  footer,
  children,
}: AuthFormProps) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70 sm:p-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Account</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </header>

        {success ? (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {children}

          <button
            type="submit"
            disabled={loading || disabled}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Working..." : actionLabel}
          </button>
        </form>

        {footer ? <div className="mt-6 text-center text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  );
}
