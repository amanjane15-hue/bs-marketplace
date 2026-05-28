"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-20 text-center">
        <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70">
          <p className="text-lg font-semibold text-slate-900">Checking your account...</p>
          <p className="mt-3 text-sm text-slate-600">You will be redirected to login if you are not signed in.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
