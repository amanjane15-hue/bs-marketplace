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

  // 0. Fetch the real listing row and validate
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, user_id, listing_status, moderation_status")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError) throw listingError;

  if (!listing) {
    throw new Error("Listing not found.");
  }

  if (listing.user_id !== sellerId) {
    throw new Error("Seller information is invalid.");
  }

  if (listing.listing_status !== "active") {
    throw new Error("This listing has already been sold.");
  }

  if (listing.moderation_status !== "active") {
    throw new Error("This listing is unavailable.");
  }

  // 1. Check if conversation already exists
  const { data: existingConversation, error: lookupError } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", currentUserId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existingConversation?.id) {
    return existingConversation.id;
  }

  const { data: insertedConversation, error: insertError } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      buyer_id: currentUserId,
      seller_id: sellerId,
    })
    .select("id")
    .single();

  if (insertError || !insertedConversation) {
    console.error("Error starting conversation", insertError);
    if (insertError?.code === "23505") {
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
    throw new Error(insertError?.message || "Unable to start conversation.");
  }

  return insertedConversation.id as string;
}
