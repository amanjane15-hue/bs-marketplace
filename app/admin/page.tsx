import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin Dashboard | B&S Marketplace",
  description: "Moderation dashboard.",
};

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();

  const [
    { count: openReports },
    { count: resolvedReports },
    { count: dismissedReports },
    { count: hiddenListings },
    { count: activeListings },
  ] = await Promise.all([
    supabase.from("listing_reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("listing_reports").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("listing_reports").select("*", { count: "exact", head: true }).eq("status", "dismissed"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("moderation_status", "hidden"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("moderation_status", "active"),
  ]);

  const cards = [
    { label: "Open Reports", value: openReports ?? 0, link: "/admin/reports?tab=open", color: "text-rose-600" },
    { label: "Resolved Reports", value: resolvedReports ?? 0, link: "/admin/reports?tab=resolved", color: "text-emerald-600" },
    { label: "Dismissed Reports", value: dismissedReports ?? 0, link: "/admin/reports?tab=dismissed", color: "text-slate-600" },
    { label: "Hidden Listings", value: hiddenListings ?? 0, link: "/admin/history", color: "text-amber-600" },
    { label: "Active Listings", value: activeListings ?? 0, link: "/admin/history", color: "text-blue-600" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">Overview of marketplace moderation activity.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.link}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className={`mt-2 text-3xl font-bold ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-950">Quick Navigation</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/admin/reports"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Review Reports
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/college-domains"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage College Domains
          </Link>
          <Link
            href="/admin/history"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Moderation History
          </Link>
        </div>
      </div>
    </main>
  );
}
