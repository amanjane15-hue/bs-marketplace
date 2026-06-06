import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type StartConversationProps = {
  listingId: string;
  sellerId: string;
  currentUserId: string;
};

export async function startConversation({
  listingId,
  sellerId,
  currentUserId,
}: StartConversationProps): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const payload = {
    listing_id: listingId,
    buyer_id: currentUserId,
    seller_id: sellerId,
  };

  const { data, error } = await supabase
    .from("conversations")
    .upsert(payload, { onConflict: "conversations_unique_listing_participants" })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error starting conversation", error);
    throw new Error("Unable to start conversation.");
  }

  return data.id as string;
}
