"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";

type ReportReviewModalProps = {
  reportId: string;
  listingId: string;
  actionType: "hide_listing" | "restore_listing" | "resolve_report" | "dismiss_report";
  onClose: () => void;
  onSuccess: () => void;
};

export default function ReportReviewModal({
  reportId,
  listingId,
  actionType,
  onClose,
  onSuccess,
}: ReportReviewModalProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabaseBrowserClient();

    try {
      if (actionType === "hide_listing") {
        await supabase.from("listings").update({ moderation_status: "hidden", moderation_note: note, moderated_at: new Date().toISOString(), moderated_by: user.id }).eq("id", listingId);
        await supabase.from("listing_reports").update({ status: "resolved", admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("listing_id", listingId).eq("status", "open");
      } else if (actionType === "restore_listing") {
        await supabase.from("listings").update({ moderation_status: "active", moderation_note: note, moderated_at: new Date().toISOString(), moderated_by: user.id }).eq("id", listingId);
      } else if (actionType === "resolve_report") {
        await supabase.from("listing_reports").update({ status: "resolved", admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", reportId);
      } else if (actionType === "dismiss_report") {
        await supabase.from("listing_reports").update({ status: "dismissed", admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", reportId);
      }

      await supabase.from("moderation_actions").insert({
        admin_id: user.id,
        listing_id: listingId,
        report_id: reportId,
        action: actionType,
        note,
      });

      toast("Action applied successfully.", "success");
      onSuccess();
    } catch (error) {
      toast("Failed to apply action.", "error");
    } finally {
      setSaving(false);
    }
  };

  const labels: Record<string, string> = {
    hide_listing: "Hide Listing",
    restore_listing: "Restore Listing",
    resolve_report: "Resolve Report",
    dismiss_report: "Dismiss Report",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">{labels[actionType]}</h2>
        <p className="mt-2 text-sm text-slate-600">Please provide a moderation note (optional).</p>
        
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={4}
          className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          placeholder="Admin note..."
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            disabled={saving}
          >
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
