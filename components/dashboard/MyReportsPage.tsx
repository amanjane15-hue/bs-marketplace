"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  reviewed: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-slate-100 text-slate-500",
};

type Report = {
  id: string;
  listing_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listings?: { title: string } | null;
};

export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    const supabase = getSupabaseBrowserClient();

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("listing_reports")
        .select("id,listing_id,reason,details,status,created_at,listings(title)")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setReports((data ?? []) as Report[]);
      }
      setLoading(false);
    };

    void fetch();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-600">You must be signed in to view your reports.</p>
        <Link href="/login" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-sm text-slate-500">Loading reports…</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <svg className="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No reports submitted yet.</p>
          <Link href="/marketplace" className="text-sm font-semibold text-emerald-600 hover:underline">
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-5 py-3">Listing</th>
                <th className="px-5 py-3">Reason</th>
                <th className="hidden px-5 py-3 sm:table-cell">Details</th>
                <th className="px-5 py-3">Status</th>
                <th className="hidden px-5 py-3 md:table-cell">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/marketplace/${r.listing_id}`}
                      className="font-medium text-slate-900 hover:text-emerald-600 hover:underline"
                    >
                      {(r.listings as any)?.title ?? r.listing_id.substring(0, 8) + "…"}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{r.reason}</td>
                  <td className="hidden px-5 py-4 text-slate-500 sm:table-cell max-w-[200px] truncate">
                    {r.details ?? <span className="italic text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 text-slate-400 md:table-cell">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
