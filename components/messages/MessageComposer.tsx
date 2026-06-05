"use client";

import React, { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function MessageComposer({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!user || !value.trim()) return;
    setSending(true);
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.from("messages").insert([{ conversation_id: conversationId, sender_id: user.id, body: value.trim() }]).select().single();
    if (error) {
      console.error(error);
    }
    setValue("");
    setSending(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white p-3 sm:static sm:rounded-lg sm:shadow-none">
      <div className="mx-auto max-w-4xl">
        <div className="flex gap-3">
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write a message..." className="flex-1 rounded-full border border-slate-200 px-4 py-2" />
          <button onClick={send} disabled={sending || !value.trim()} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
