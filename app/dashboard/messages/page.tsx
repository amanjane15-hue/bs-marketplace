"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import InboxList from "@/components/messages/InboxList";

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold">Messages</h1>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="col-span-1">
              <InboxList />
            </div>
            <div className="col-span-2">Select a conversation to view messages.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
