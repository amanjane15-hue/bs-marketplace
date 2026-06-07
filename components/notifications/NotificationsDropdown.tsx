"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title?: string | null;
  body?: string | null;
  link?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    // Disabled for MVP to prevent Supabase errors on missing table
    setLoading(false);
  }, [user]);

  const markRead = async (id: string) => {
    // Disabled
  };

  const markAllRead = async () => {
    // Disabled
  };

  const unreadCount = items.filter((it) => !it.read_at).length;

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setOpen((v) => !v)} 
        aria-label="Open notifications"
        className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3.6c0 .538-.214 1.055-.595 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <div className="text-sm font-semibold">Notifications</div>
            <div className="flex items-center gap-2">
              <button onClick={markAllRead} className="text-xs text-slate-500 hover:underline">Mark all read</button>
              <button onClick={() => setOpen(false)} className="text-xs text-slate-500">Close</button>
            </div>
          </div>
          <div className="max-h-64 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">You're all caught up.</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-slate-100 ${!n.read_at ? "bg-slate-50" : ""}`}>
                  <a href={n.link ?? "#"} onClick={() => markRead(n.id)} className="block">
                    <div className="text-sm font-medium text-slate-900">{n.title ?? n.type}</div>
                    <div className="mt-1 text-sm text-slate-600">{n.body}</div>
                    <div className="mt-1 text-xs text-slate-400">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</div>
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
