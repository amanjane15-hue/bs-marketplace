"use client";

import React, { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";

const MAX_MESSAGE_LENGTH = 1000;
const SEND_COOLDOWN_MS = 1000;

type Msg = { id: string; sender_id: string; body: string; created_at: string; read_at?: string | null };

interface Props {
  conversationId: string;
  onMessageSent?: (msg: Msg) => void;
}

export default function MessageComposer({ conversationId, onMessageSent }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  const send = async () => {
    if (sending) return;
    
    const trimmedMessage = value.trim();
    if (!trimmedMessage) {
      toast("Message cannot be empty.", "error");
      return;
    }

    if (!user) return;

    const now = Date.now();
    if (now - lastSentAt < SEND_COOLDOWN_MS) {
      return;
    }

    setSending(true);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc("send_message", {
      p_conversation_id: conversationId,
      p_content: trimmedMessage,
    });

    if (error) {
      console.error("Failed to send message:", error);
      if (error.message === "Too many messages. Please wait a minute and try again." || 
          error.message.includes("Message cannot exceed") ||
          error.message.includes("Message cannot be empty")) {
        toast(error.message, "error");
      } else {
        toast("Failed to send message.", "error");
      }
    } else if (data) {
      setLastSentAt(Date.now());
      // Optimistic: notify parent immediately so message appears without waiting for realtime
      onMessageSent?.(data as Msg);

      // Also bump conversation updated_at so inbox re-sorts
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
        
      setValue("");
    }

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
      <div className="relative flex-1">
        <input
          maxLength={MAX_MESSAGE_LENGTH}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full rounded-full border border-slate-300 bg-white py-3 pl-5 pr-20 text-sm text-slate-950 placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <div 
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] sm:text-xs font-medium ${
            value.length >= MAX_MESSAGE_LENGTH ? 'text-rose-600' : value.length > 900 ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          {value.length} / {MAX_MESSAGE_LENGTH}
        </div>
      </div>
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
