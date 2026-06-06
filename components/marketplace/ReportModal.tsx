"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

const REPORT_REASONS = [
  "Spam",
  "Fake Item",
  "Scam Attempt",
  "Inappropriate Content",
  "Counterfeit Product",
  "Wrong Category",
  "Other",
] as const;

type ReportReason = (typeof REPORT_REASONS)[number];

interface Props {
  listingId: string;
  listingOwnerId?: string;
  onClose: () => void;
}

type Status = "idle" | "submitting" | "success" | "error" | "duplicate" | "own-listing" | "login";

export default function ReportModal({ listingId, listingOwnerId, onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Trap scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setStatus("login");
      return;
    }

    if (listingOwnerId && user.id === listingOwnerId) {
      setStatus("own-listing");
      return;
    }

    if (!reason) {
      setErrorMsg("Please select a reason.");
      return;
    }

    if (details.length > 500) {
      setErrorMsg("Additional details must be 500 characters or fewer.");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("listing_reports").insert({
      listing_id: listingId,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    });

    if (!error) {
      setStatus("success");
      return;
    }

    // Unique constraint violation → duplicate report
    if (error.code === "23505") {
      setStatus("duplicate");
      return;
    }

    setStatus("error");
    setErrorMsg(error.message);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-4 w-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 id="report-modal-title" className="text-base font-semibold text-slate-900">
              Report Listing
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report modal"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Success state */}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-7 w-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Report submitted successfully.</p>
                <p className="mt-1 text-sm text-slate-500">Our team will review this listing. Thank you for keeping the marketplace safe.</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Duplicate report */}
          {status === "duplicate" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-7 w-7 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Already reported</p>
                <p className="mt-1 text-sm text-slate-500">You have already submitted a report for this listing.</p>
              </div>
              <button onClick={onClose} className="mt-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
                Close
              </button>
            </div>
          )}

          {/* Own listing */}
          {status === "own-listing" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-7 w-7 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Cannot report your own listing</p>
              </div>
              <button onClick={onClose} className="mt-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
                Close
              </button>
            </div>
          )}

          {/* Login required */}
          {status === "login" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-7 w-7 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Login required</p>
                <p className="mt-1 text-sm text-slate-500">You must be signed in to report a listing.</p>
              </div>
              <button
                onClick={() => { onClose(); router.push("/login"); }}
                className="mt-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Sign in
              </button>
            </div>
          )}

          {/* Form */}
          {(status === "idle" || status === "submitting" || status === "error") && (
            <form onSubmit={handleSubmit} className="space-y-4" id="report-listing-form">
              <div>
                <p className="mb-3 text-sm text-slate-600">
                  Help us keep the marketplace safe. Select the reason that best describes the issue.
                </p>
                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Reason *</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {REPORT_REASONS.map((r) => (
                      <label
                        key={r}
                        htmlFor={`reason-${r}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                          reason === r
                            ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          id={`reason-${r}`}
                          name="report-reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => { setReason(r); setErrorMsg(""); }}
                          className="sr-only"
                        />
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            reason === r ? "border-rose-500 bg-rose-500" : "border-slate-300"
                          }`}
                        >
                          {reason === r && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        {r}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div>
                <label htmlFor="report-details" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Additional details <span className="normal-case font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => { setDetails(e.target.value); setErrorMsg(""); }}
                  placeholder="Describe the issue in more detail…"
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
                />
                <div className="mt-1 flex justify-end text-xs text-slate-400">
                  {details.length}/500
                </div>
              </div>

              {(errorMsg || status === "error") && (
                <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 border border-rose-200">
                  {errorMsg || "Something went wrong. Please try again."}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60 transition-colors"
                >
                  {status === "submitting" ? "Submitting…" : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
