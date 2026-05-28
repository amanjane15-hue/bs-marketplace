"use client";

import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import ProfileEditor from "@/components/profile/ProfileEditor";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AuthGuard>
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Account</p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">{user?.name}</h1>
                <p className="mt-2 text-sm text-slate-600">{user?.email}</p>
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
        </AuthGuard>
      </main>
    </div>
  );
}
