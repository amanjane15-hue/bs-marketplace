"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import MessageComposer from "./MessageComposer";
import Skeleton from "@/components/ui/Skeleton";

type Msg = { id: string; sender_id: string; body: string; created_at: string; read_at?: string | null };

export default function ConversationView({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingData, setListingData] = useState<{ id: string; title: string } | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scroller.current) {
        scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
      }
    }, 50);
  }, []);

  // Deduplicated append helper used by both optimistic updates and realtime
  const appendMessage = useCallback((msg: Msg) => {
    setMessages((cur) => (cur.some((m) => m.id === msg.id) ? cur : [...cur, msg]));
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = getSupabaseBrowserClient();

    const fetchAll = async () => {
      setLoading(true);

      // Fetch conversation metadata
      const { data: convData } = await supabase
        .from("conversations")
        .select("listing_id, listings(title)")
        .eq("id", conversationId)
        .single();
        
      if (convData) {
        const title = convData.listings ? (Array.isArray(convData.listings) ? convData.listings[0].title : convData.listings.title) : "Unknown Listing";
        setListingData({ id: convData.listing_id, title });
      }

      // Fetch all messages for this conversation
      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,body,created_at,read_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch messages:", error);
      } else if (data) {
        setMessages(data as Msg[]);
      }
      setLoading(false);
      scrollToBottom();

      // Mark incoming unread messages as read
      if (user?.id) {
        try {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .neq("sender_id", user.id)
            .is("read_at", null);
          setMessages((cur) =>
            cur.map((m) =>
              m.sender_id !== user.id && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m
            )
          );
        } catch {
          // ignore mark-read errors
        }
      }
    };

    void fetchAll();

    // Realtime subscription — filtered to this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const nextMessage = payload.new as Msg;
          setMessages((cur) =>
            cur.some((m) => m.id === nextMessage.id) ? cur : [...cur, nextMessage]
          );
          scrollToBottom();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Msg;
          setMessages((cur) =>
            cur.map((m) => (m.id === updated.id ? { ...m, read_at: updated.read_at ?? m.read_at } : m))
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, scrollToBottom]);

  if (!conversationId) return null;

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/messages" className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div>
            <h3 className="font-semibold text-slate-950">
              {loading ? <Skeleton className="h-5 w-32" /> : listingData?.title ?? "Unknown Listing"}
            </h3>
            <p className="text-sm text-slate-500">
              Conversation about this listing
            </p>
          </div>
        </div>

        {listingData?.id && (
          <Link
            href={`/marketplace/${listingData.id}`}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            View listing
          </Link>
        )}
      </header>

      <div
        ref={scroller}
        className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6"
      >
        {loading ? (
          <div className="flex flex-col gap-4 py-4">
            <Skeleton className="h-14 w-2/3 max-w-[75%] rounded-2xl rounded-bl-md self-start" />
            <Skeleton className="h-10 w-1/2 max-w-[75%] rounded-2xl rounded-br-md self-end" />
            <Skeleton className="h-16 w-3/4 max-w-[75%] rounded-2xl rounded-bl-md self-start" />
            <Skeleton className="h-10 w-1/3 max-w-[75%] rounded-2xl rounded-br-md self-end" />
            <Skeleton className="h-12 w-1/2 max-w-[75%] rounded-2xl rounded-bl-md self-start" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">No messages yet. Say hello!</div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={
                      isMe
                        ? "max-w-[75%] rounded-2xl rounded-br-md bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm"
                        : "max-w-[75%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200"
                    }
                  >
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <div>{new Date(m.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    {isMe && (
                      <div className="ml-1 flex items-center gap-1 text-slate-400">
                        {m.read_at ? (
                          <>
                            <svg className="h-3 w-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[11px] text-emerald-600">Seen</span>
                          </>
                        ) : (
                          <span className="text-[11px]">Sent</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-4 relative">
        {loading && <div className="absolute inset-0 bg-white/50 z-10" />}
        <MessageComposer conversationId={conversationId} onMessageSent={appendMessage} />
      </div>
    </>
  );
}
