"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type Message = { id: string; body: string; created_at: string; read_at?: string | null; sender_id?: string | null };

type Conversation = {
  id: string;
  listing_id?: string | null;
  buyer_id?: string | null;
  seller_id?: string | null;
  created_at?: string | null;
  messages?: Message[];
  unread_count?: number;
};

export default function InboxList() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();

    const fetchConvos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("id,listing_id,buyer_id,seller_id,created_at,messages(id,body,created_at,read_at,sender_id)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped = (data as any[]).map((c) => {
          const msgs: Message[] = c.messages ?? [];
          const unread = msgs.filter((m) => !m.read_at && m.sender_id !== user.id).length;
          return { ...c, messages: msgs, unread_count: unread } as Conversation;
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

  if (!user) return <div className="p-4">Sign in to view messages.</div>;

  if (loading) return <div className="p-4 text-sm text-slate-500">Loading messages...</div>;

  if (conversations.length === 0) return <div className="p-4 text-sm text-slate-500">No conversations yet.</div>;

  return (
    <div className="space-y-3">
      {conversations.map((c) => {
        const last = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
        const unread = c.unread_count ?? 0;
        return (
          <Link
            key={c.id}
            href={`/dashboard/messages/${c.id}`}
            className={`block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow ${unread > 0 ? "font-semibold" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900">{c.listing_id ? `Listing ${c.listing_id.substring(0, 8)}` : "Conversation"}</div>
                <div className="mt-1 text-sm text-slate-500 truncate">{last?.body ?? "No messages yet"}</div>
              </div>
              <div className="flex items-center gap-3">
                {unread > 0 && <div className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{unread}</div>}
                <div className="text-xs text-slate-400">{last?.created_at ? new Date(last.created_at).toLocaleString() : ""}</div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
