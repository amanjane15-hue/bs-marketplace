import React from "react";
import MessagesPageClient from "@/components/messages/MessagesPageClient";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MessagesPageClient conversationId={id} />;
}
