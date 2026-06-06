"use client";

import React, { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import ConversationView from "@/components/messages/ConversationView";
import InboxList from "@/components/messages/InboxList";

export default function MessagesPageClient({ conversationId }: { conversationId?: string }) {
  const showChat = Boolean(conversationId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-[calc(100vh-140px)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          
          <aside className={`flex w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96 ${showChat ? "hidden md:flex" : "flex"}`}>
            <Suspense fallback={<div className="text-sm text-slate-500 p-4">Loading inbox...</div>}>
              <InboxList selectedConversationId={conversationId} />
            </Suspense>
          </aside>
          
          <section className={`flex min-w-0 flex-1 flex-col bg-white ${showChat ? "flex" : "hidden md:flex"}`}>
            {conversationId ? (
              <ConversationView conversationId={conversationId} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    Select a conversation
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Choose a chat from the inbox to start messaging.
                  </p>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
