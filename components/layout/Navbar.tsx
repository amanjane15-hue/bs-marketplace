"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import UserMenu from "@/components/auth/UserMenu";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import NotificationsDropdown from "@/components/notifications/NotificationsDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const isMessagesRoute = pathname === "/dashboard/messages" || pathname.startsWith("/dashboard/messages/");

  const { user, logout } = useAuth();
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let convoIds: string[] = [];

    const load = async () => {
      const { data: convos } = await supabase.from("conversations").select("id").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      convoIds = (convos ?? []).map((c: any) => c.id);
      if (convoIds.length === 0) return setUnread(0);

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convoIds)
        .is("read_at", null)
        .neq("sender_id", user.id);

      setUnread((count as number) || 0);
    };

    void load();

    const channel = supabase
      .channel(`navbar-messages:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as any;
        if (convoIds.includes(m.conversation_id) && m.sender_id !== user.id && !m.read_at) setUnread((c) => c + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as any;
        if (convoIds.includes(m.conversation_id) && m.read_at && m.sender_id !== user.id) setUnread((c) => Math.max(0, c - 1));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-zinc-200/80">
      <div className="mx-auto flex flex-nowrap items-center justify-between gap-1 sm:flex-wrap sm:gap-3 px-2 py-2 sm:px-6 lg:px-8 sm:py-3">
        <Link href="/" className="text-base sm:text-xl font-semibold tracking-tight text-slate-950 shrink-0 whitespace-nowrap">
          <span className="sm:hidden">B&S Market</span>
          <span className="hidden sm:inline">B&S Marketplace</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex text-sm text-slate-600">
          <a href="#featured" className="transition hover:text-slate-950">
            Featured
          </a>
          <a href="#categories" className="transition hover:text-slate-950">
            Categories
          </a>
          <a href="#go-free" className="transition hover:text-slate-950">
            Go Free
          </a>
          <Link href="/marketplace" className="transition hover:text-slate-950">
            Marketplace
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/marketplace" aria-label="Discover listings" className="hidden md:inline-flex shrink-0">
            <span className="inline-flex items-center rounded-full border border-slate-900 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Discover listings
            </span>
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex md:hidden shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-2 py-1 sm:px-3 sm:py-2 text-[11px] sm:text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            aria-label="Browse marketplace listings"
          >
            <svg className="mr-1 h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Browse
          </Link>

          {user ? (
            <>
              <NotificationsDropdown />
              <Link href="/dashboard/messages" className="relative inline-flex items-center shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {unread > 0 && <span className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 inline-flex items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold text-white">{unread}</span>}
              </Link>
            </>
          ) : (
            <div className="flex flex-nowrap items-center gap-1 sm:flex-wrap sm:gap-3 shrink-0">
              <Link href="/login" className="text-[11px] sm:text-sm font-semibold text-slate-700 transition hover:text-slate-950 whitespace-nowrap">
                Login
              </Link>
              <Link href="/signup" className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-1 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-semibold text-white transition hover:bg-emerald-500 whitespace-nowrap">
                Sign Up
              </Link>
            </div>
          )}

          {!isMessagesRoute && (
            <Link href="/create-listing" aria-label="Sell an item" className="shrink-0">
              <span className="inline-flex items-center rounded-full bg-slate-950 px-2 py-1 sm:px-5 sm:py-2.5 text-[11px] sm:text-sm font-semibold text-white transition hover:bg-slate-800 whitespace-nowrap">
                <span className="hidden sm:inline">Sell Item</span>
                <span className="sm:hidden">+ Sell</span>
              </span>
            </Link>
          )}

          {user && (
            <div className="shrink-0 ml-1 sm:ml-2">
              <UserMenu user={user} onLogout={logout} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
