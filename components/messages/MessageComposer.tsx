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
    <div className="flex w-full items-center gap-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm text-slate-950 placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
      <button
        onClick={() => void send()}
        disabled={sending || !value.trim()}
        className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
