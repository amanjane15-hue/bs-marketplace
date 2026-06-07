"use client";

import { useState } from "react";
import Link from "next/link";

type UserMenuProps = {
  user: {
    name: string;
    email: string;
    avatar: string;
    avatarUrl?: string | null;
    isAdmin?: boolean;
    isVerified?: boolean;
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
        aria-label="Open profile menu"
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-950 text-sm font-bold text-white shadow-sm transition hover:ring-2 hover:ring-slate-300"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{user.avatar}</span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-56 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-lg">
          <div className="space-y-3">
            <div className="rounded-3xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              {user.isVerified && <p className="mt-1 text-xs font-semibold text-emerald-700">✓ Verified student</p>}
            </div>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Profile
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
            {user.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
              >
                Admin Dashboard
              </Link>
            )}
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
