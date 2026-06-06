"use client";

import React, { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type Msg = { id: string; sender_id: string; body: string; created_at: string; read_at?: string | null };

interface Props {
  conversationId: string;
  onMessageSent?: (msg: Msg) => void;
}

export default function MessageComposer({ conversationId, onMessageSent }: Props) {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const trimmed = value.trim();
    if (!user || !trimmed) return;
    setSending(true);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("messages")
      .insert([{ conversation_id: conversationId, sender_id: user.id, body: trimmed }])
      .select("id,sender_id,body,created_at,read_at")
      .single();

    if (error) {
      console.error("Failed to send message:", error);
    } else if (data) {
      // Optimistic: notify parent immediately so message appears without waiting for realtime
      onMessageSent?.(data as Msg);

      // Also bump conversation updated_at so inbox re-sorts
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    setValue("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white p-3 sm:static sm:rounded-lg sm:shadow-none">
      <div className="mx-auto max-w-4xl">
        <div className="flex gap-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message… (Enter to send)"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2"
          />
          <button
            onClick={() => void send()}
            disabled={sending || !value.trim()}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
