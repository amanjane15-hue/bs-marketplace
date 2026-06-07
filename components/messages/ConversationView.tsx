"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import MessageComposer from "./MessageComposer";
import Skeleton from "@/components/ui/Skeleton";

import { Msg } from "./MessageComposer";

export default function ConversationView({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

    if (msg.image_path) {
      setSignedUrls((prev) => {
        if (prev[msg.image_path!]) return prev;
        
        getSupabaseBrowserClient().storage.from("chat-images").createSignedUrl(msg.image_path!, 60 * 60).then(({ data }) => {
          if (data?.signedUrl) {
            setSignedUrls((urls) => ({ ...urls, [msg.image_path!]: data.signedUrl }));
          }
        });
        
        return prev;
      });
    }
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
        .select("id,sender_id,body,created_at,read_at,image_path,message_type")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch messages:", error);
      } else if (data) {
        const msgs = data as Msg[];
        setMessages(msgs);
        
        const pathsToSign = msgs.map((m) => m.image_path).filter(Boolean) as string[];
        if (pathsToSign.length > 0) {
          const { data: urlData } = await supabase.storage.from("chat-images").createSignedUrls(pathsToSign, 60 * 60);
          if (urlData) {
            const newUrls: Record<string, string> = {};
            urlData.forEach((item) => {
              if (!item.error && item.signedUrl && item.path) {
                newUrls[item.path] = item.signedUrl;
              }
            });
            setSignedUrls((prev) => ({ ...prev, ...newUrls }));
          }
        }
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
          appendMessage(nextMessage);
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
                        ? `min-w-[3rem] max-w-[75%] rounded-2xl rounded-br-md ${m.message_type === 'image' && !m.body ? 'bg-transparent p-0 shadow-none' : 'bg-emerald-600 px-4 py-3 text-white shadow-sm'} text-sm`
                        : `min-w-[3rem] max-w-[75%] rounded-2xl rounded-bl-md ${m.message_type === 'image' && !m.body ? 'bg-transparent p-0 shadow-none' : 'bg-white px-4 py-3 text-slate-900 shadow-sm ring-1 ring-slate-200'} text-sm`
                    }
                  >
                    {m.image_path && (
                      <div className={m.body ? "mb-2" : ""}>
                        {signedUrls[m.image_path] ? (
                          <img
                            src={signedUrls[m.image_path]}
                            alt="Chat attachment"
                            className="max-h-80 max-w-full rounded-2xl object-cover cursor-pointer"
                            loading="lazy"
                            onClick={() => setPreviewImage(signedUrls[m.image_path!])}
                          />
                        ) : (
                          <Skeleton className="h-48 w-48 rounded-2xl" />
                        )}
                      </div>
                    )}
                    {m.body && <div className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</div>}
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

      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <img 
            src={previewImage} 
            alt="Full screen preview" 
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
