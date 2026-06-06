"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import Skeleton from "@/components/ui/Skeleton";

type Message = { id: string; body: string; created_at: string; read_at?: string | null; sender_id?: string | null };

type Conversation = {
  id: string;
  listing_id?: string | null;
  buyer_id?: string | null;
  seller_id?: string | null;
  created_at?: string | null;
  messages?: Message[];
  unread_count?: number;
  listings?: { title: string } | null;
};

export default function InboxList({ selectedConversationId }: { selectedConversationId?: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();

    const fetchConvos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("id,listing_id,buyer_id,seller_id,created_at,updated_at,messages(id,body,created_at,read_at,sender_id),listings(title)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("updated_at", { ascending: false, nullsFirst: false });

      if (!error && data) {
        const mapped = (data as any[]).map((c) => {
          const msgs: Message[] = c.messages ?? [];
          const unread = msgs.filter((m) => !m.read_at && m.sender_id !== user.id).length;
          return { ...c, messages: msgs, unread_count: unread, listings: c.listings ? (Array.isArray(c.listings) ? c.listings[0] : c.listings) : null } as Conversation;
        });
        setConversations(mapped);
      }
      setLoading(false);
    };

    void fetchConvos();

    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, (payload) => {
        const r = payload.new as Conversation;
        if (r.buyer_id === user.id || r.seller_id === user.id) {
          // Note: newly inserted convos via realtime won't have listings(title) immediately,
          // but we prepend them and fetchConvos will re-run on full refresh if needed.
          setConversations((cur) => (cur.some((conversation) => conversation.id === r.id) ? cur : [r, ...cur]));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message & { conversation_id: string };
        setConversations((cur) => {
          return cur.map((c) => {
            if (c.id !== m.conversation_id) return c;
            const existingMessages = c.messages ?? [];
            const msgs = existingMessages.some((msg) => msg.id === m.id)
              ? existingMessages
              : [...existingMessages, { id: m.id, body: m.body, created_at: m.created_at, read_at: m.read_at, sender_id: m.sender_id }];
            const unread = msgs.filter((msg) => !msg.read_at && msg.sender_id !== user.id).length;
            return { ...c, messages: msgs, unread_count: unread } as Conversation;
          });
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message & { conversation_id: string };
        setConversations((cur) => {
          return cur.map((c) => {
            if (c.id !== m.conversation_id) return c;
            const msgs = (c.messages ?? []).map((msg) => (msg.id === m.id ? { ...msg, read_at: m.read_at } : msg));
            const unread = msgs.filter((msg) => !msg.read_at && msg.sender_id !== user.id).length;
            return { ...c, messages: msgs, unread_count: unread } as Conversation;
          });
        });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const filtered = useMemo(() => {
    if (!search) return conversations;
    const lower = search.toLowerCase();
    return conversations.filter((c) => {
      const t = c.listings?.title?.toLowerCase() || "";
      const m = c.messages?.[c.messages.length - 1]?.body?.toLowerCase() || "";
      return t.includes(lower) || m.includes(lower);
    });
  }, [conversations, search]);

  if (!user) return <div className="p-4">Sign in to view messages.</div>;

  return (
    <>
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">Messages</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {conversations.length}
          </span>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-500 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-1 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 border-b border-slate-100 p-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No conversations yet. Open a listing and message a seller.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No matching conversations.
          </div>
        ) : (
          filtered.map((c) => {
            const last = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
            const unread = c.unread_count ?? 0;
            const title = c.listings?.title || (c.listing_id ? `Listing ${c.listing_id.substring(0, 8)}` : "Conversation");
            
            return (
              <Link
                key={c.id}
                href={`/dashboard/messages/${c.id}`}
                className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
                  selectedConversationId === c.id
                    ? "bg-emerald-50 border-l-4 border-l-emerald-500"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className={`text-sm text-slate-950 truncate ${unread > 0 ? "font-bold" : "font-semibold"}`}>
                      {title}
                    </div>
                    <div className={`mt-1 text-sm truncate ${unread > 0 ? "text-slate-800 font-medium" : "text-slate-500"}`}>
                      {last?.body ?? "No messages yet"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="text-xs text-slate-400">
                      {last?.created_at ? new Date(last.created_at).toLocaleDateString() : ""}
                    </div>
                    {unread > 0 && (
                      <div className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {unread}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
