"use client";

"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/auth/AuthProvider";
import ProfileEditor from "@/components/profile/ProfileEditor";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {user ? (
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Account</p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">{user.name}</h1>
                <p className="mt-2 text-sm text-slate-600">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                Sign out
              </button>
            </div>

            <div className="mt-8">
              <ProfileEditor />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70">
            <h1 className="text-3xl font-semibold text-slate-950">Profile placeholder</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">Sign in to access your profile and manage listings.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Login
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50">
                Sign up
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
