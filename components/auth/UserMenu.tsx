"use client";

import { useState } from "react";
import Link from "next/link";

type UserMenuProps = {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  onLogout: () => void;
};

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
          {user.avatar}
        </span>
        <span>{user.name}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-56 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-lg">
          <div className="space-y-3">
            <div className="rounded-3xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <Link
              href="/profile"
              className="block rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Profile
            </Link>
            <Link
              href="/dashboard"
              className="block rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
