"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ContactSupportForm() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="mt-8 flex justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg text-slate-700">Please sign in to contact the B&S Marketplace support team.</p>
        <Link 
          href="/login?next=/contact" 
          className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Sign in to contact support
        </Link>
      </div>
    );
  }

  const isValid = subject.trim().length >= 3 && subject.trim().length <= 120 && message.trim().length >= 10 && message.trim().length <= 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || submitting) return;

    try {
      setSubmitting(true);
      const supabase = getSupabaseBrowserClient();
      
      const { data, error } = await supabase.rpc("submit_support_request", {
        p_subject: subject.trim(),
        p_message: message.trim()
      });

      if (error) {
        console.error("Support submission error:", error);
        toast(error.message || "Unable to submit support request.", "error");
        return;
      }

      toast("✓ Support request submitted successfully", "success");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast("Unable to submit support request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Support email</h2>
        <p className="mt-2 text-slate-600 font-mono bg-slate-100 px-3 py-1.5 rounded-md inline-block">
          aman2413226@akgec.ac.in
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-slate-700">
            Subject{" "}
            <span className="text-rose-600" aria-hidden="true">*</span>
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="subject"
              required
              aria-required="true"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-50"
              placeholder="How can we help?"
              disabled={submitting}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Subject: 3–120 characters</p>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700">
            Message{" "}
            <span className="text-rose-600" aria-hidden="true">*</span>
          </label>
          <div className="mt-1">
            <textarea
              id="message"
              required
              aria-required="true"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-50"
              placeholder="Please describe your issue or question in detail."
              disabled={submitting}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Message: 10–2000 characters</p>
        </div>

        <div>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full flex justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit support request"}
          </button>
        </div>
      </form>
    </div>
  );
}
