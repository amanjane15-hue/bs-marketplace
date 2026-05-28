"use client";

import React, { useEffect, useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import MessageComposer from "./MessageComposer";

type Msg = { id: string; sender_id: string; body: string; created_at: string; read_at?: string | null };

export default function ConversationView({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = getSupabaseBrowserClient();

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,body,created_at,read_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (!error && data) setMessages(data as Msg[]);
      setLoading(false);
      setTimeout(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }), 50);

      // mark incoming unread messages as read for this user
      try {
        if (user?.id) {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .neq("sender_id", user.id)
            .is("read_at", null);
          // optimistically mark local messages as read
          setMessages((cur) => cur.map((m) => (m.sender_id !== user.id && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)));
        }
      } catch (e) {
        // ignore
      }
    };

    void fetch();

    const channel = supabase.channel("public:messages");

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        setMessages((m) => [...m, payload.new as Msg]);
        setTimeout(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }), 50);
      }
    );

    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const updated = payload.new as Msg;
        setMessages((cur) => cur.map((m) => (m.id === updated.id ? { ...m, read_at: (updated as any).read_at ?? m.read_at } : m)));
      }
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  if (!conversationId) return <div className="p-4">No conversation selected.</div>;

  return (
    <div className="flex h-[70vh] flex-col gap-4">
      <div ref={scroller} className="overflow-auto rounded-lg border border-slate-200 bg-white p-4">
        {loading ? (
          <div className="text-sm text-slate-500">Loading messages…</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`mb-3 flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className="flex flex-col items-end">
                <div className={`max-w-[80%] rounded-xl px-4 py-2 ${m.sender_id === user?.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <div>{new Date(m.created_at).toLocaleString()}</div>
                  {m.sender_id === user?.id && (
                    <div className="ml-2 flex items-center gap-1 text-xs text-slate-200">
                      {m.read_at ? (
                        <>
                          <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="text-[11px] text-white/80">Seen</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sent</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto">
        <MessageComposer conversationId={conversationId} />
      </div>
    </div>
  );
}
