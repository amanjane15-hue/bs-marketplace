"use client";

import React from "react";
import MessagesPageClient from "@/components/messages/MessagesPageClient";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesPageSearchParams />
    </Suspense>
  );
}

function MessagesPageSearchParams() {
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get("conversation") ?? undefined;
  return <MessagesPageClient conversationId={conversationId} />;
}
