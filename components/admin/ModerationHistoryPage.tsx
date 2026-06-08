"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ModerationAction = {
  id: string;
  admin_id: string;
  listing_id: string | null;
  report_id: string | null;
  target_user_id: string | null;
  action: string;
  note: string | null;
  created_at: string;
  profiles: {
    display_name: string;
  };
};

export default function ModerationHistoryPage() {
  const [history, setHistory] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("moderation_actions")
        .select(`
          id, admin_id, listing_id, report_id, target_user_id, action, note, created_at,
          profiles:admin_id (display_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) setHistory(data as unknown as ModerationAction[]);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Moderation History</h1>
        <p className="mt-2 text-slate-600">Audit log of all moderation actions.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-slate-500">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-slate-500">No moderation actions found.</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Action: {item.action.replace("_", " ").toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500">
                    By Admin: {item.profiles?.display_name || "Unknown Admin"}
                  </p>
                  {item.note && (
                    <p className="mt-2 text-sm italic text-slate-700">Note: "{item.note}"</p>
                  )}
                  <div className="mt-2 flex gap-4 text-xs text-slate-400">
                    {item.listing_id && <span>Listing ID: {item.listing_id}</span>}
                    {item.report_id && <span>Report ID: {item.report_id}</span>}
                    {item.target_user_id && <span>Target User ID: {item.target_user_id}</span>}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
