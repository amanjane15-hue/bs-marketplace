import React from "react";
import MessagesPageClient from "@/components/messages/MessagesPageClient";

export default function ConversationPage({ params }: { params: { id: string } }) {
  return <MessagesPageClient conversationId={params.id} />;
}
