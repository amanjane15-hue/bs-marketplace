"use client";

import React, { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import ConversationView from "@/components/messages/ConversationView";
import InboxList from "@/components/messages/InboxList";

export default function MessagesPageClient({ conversationId }: { conversationId?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold">Messages</h1>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="col-span-1">
              <Suspense fallback={<div className="text-sm text-slate-500">Loading inbox...</div>}>
                <InboxList selectedConversationId={conversationId} />
              </Suspense>
            </div>
            <div className="col-span-2 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
              {conversationId ? (
                <ConversationView conversationId={conversationId} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">Select a conversation to view messages.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
