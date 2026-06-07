"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import ReportReviewModal from "./ReportReviewModal";
import Link from "next/link";

type Report = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  listings: {
    title: string;
    moderation_status: string;
  };
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"open" | "resolved" | "dismissed">("open");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    reportId: string;
    listingId: string;
    actionType: "hide_listing" | "restore_listing" | "resolve_report" | "dismiss_report";
  } | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("listing_reports")
      .select(`
        id, listing_id, reporter_id, reason, status, created_at,
        listings (title, moderation_status)
      `)
      .eq("status", activeTab)
      .order("created_at", { ascending: false });

    if (data) {
      setReports(data as unknown as Report[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Review Reports</h1>
        <p className="mt-2 text-slate-600">Review and resolve user-submitted reports.</p>
      </div>

      <div className="mb-6 flex space-x-4 border-b border-slate-200">
        {(["open", "resolved", "dismissed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-slate-500">No {activeTab} reports found.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Report reason: {report.reason}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Listing:{" "}
                    <Link href={`/marketplace/${report.listing_id}`} className="text-emerald-600 hover:underline">
                      {report.listings?.title || "Unknown Listing"}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Reported on: {new Date(report.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Listing Status:{" "}
                    <span className={report.listings?.moderation_status === "hidden" ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                      {report.listings?.moderation_status?.toUpperCase() || "ACTIVE"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {activeTab === "open" && (
                    <>
                      <button
                        onClick={() =>
                          setModalState({
                            isOpen: true,
                            reportId: report.id,
                            listingId: report.listing_id,
                            actionType: "hide_listing",
                          })
                        }
                        className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        Hide Listing & Resolve
                      </button>
                      <button
                        onClick={() =>
                          setModalState({
                            isOpen: true,
                            reportId: report.id,
                            listingId: report.listing_id,
                            actionType: "dismiss_report",
                          })
                        }
                        className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Dismiss Report
                      </button>
                    </>
                  )}
                  {activeTab !== "open" && report.listings?.moderation_status === "hidden" && (
                    <button
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          reportId: report.id,
                          listingId: report.listing_id,
                          actionType: "restore_listing",
                        })
                      }
                      className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200"
                    >
                      Restore Listing
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalState?.isOpen && (
        <ReportReviewModal
          reportId={modalState.reportId}
          listingId={modalState.listingId}
          actionType={modalState.actionType}
          onClose={() => setModalState(null)}
          onSuccess={() => {
            setModalState(null);
            fetchReports();
          }}
        />
      )}
    </div>
  );
}
