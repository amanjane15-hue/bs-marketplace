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
  if (!listingId) throw new Error("Missing listing id.");
  if (!sellerId) throw new Error("Missing seller id.");
  if (!currentUserId) throw new Error("Missing current user id.");
  if (sellerId === currentUserId) throw new Error("You cannot message your own listing.");

  const supabase = getSupabaseBrowserClient();

  // 0. Check if listing is active
  const { data: listingData } = await supabase
    .from("listings")
    .select("listing_status, moderation_status")
    .eq("id", listingId)
    .single();

  if (listingData?.listing_status === "sold") {
    throw new Error("Cannot message seller. This listing has been sold.");
  }
  if (listingData?.moderation_status === "hidden") {
    throw new Error("Cannot message seller. This listing is unavailable.");
  }

  // 1. Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", currentUserId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const payload = {
    listing_id: listingId,
    buyer_id: currentUserId,
    seller_id: sellerId,
  };

  const { data, error } = await supabase
    .from("conversations")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error starting conversation", error);
    if (error?.code === "23505") {
      // Race condition fallback
      const { data: raceExisting } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", currentUserId)
        .eq("seller_id", sellerId)
        .maybeSingle();
      if (raceExisting?.id) return raceExisting.id;
    }
    throw new Error(error?.message || "Unable to start conversation.");
  }

  return data.id as string;
}
