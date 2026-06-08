import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type StartConversationParams = {
  listingId: string;
  sellerId: string;
  userId: string;
};

export async function startConversation({
  listingId,
  sellerId,
  userId,
}: StartConversationParams): Promise<string> {
  if (!listingId) throw new Error("Missing listing id.");
  if (!sellerId) throw new Error("Missing seller id.");
  if (!userId) throw new Error("Missing current user id.");
  if (sellerId === userId) throw new Error("You cannot message your own listing.");

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

  const { data: sellerProfile, error: sellerProfileError } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("user_id", sellerId)
    .maybeSingle();

  if (sellerProfileError) throw sellerProfileError;

  if (sellerProfile?.is_suspended) {
    throw new Error("This seller account is suspended.");
  }

  const { data: buyerProfile, error: buyerProfileError } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("user_id", userId)
    .maybeSingle();
    
  if (buyerProfileError) throw buyerProfileError;

  if (buyerProfile?.is_suspended) {
    throw new Error("Your account is suspended. You cannot start new conversations.");
  }

  // 1. Check if conversation already exists
  const { data: existing, error: lookupError } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", userId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error: insertError } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      buyer_id: userId,
      seller_id: sellerId,
    })
    .select("id")
    .single();

  if (insertError?.code === "23505") {
    const { data: raced, error: racedError } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", userId)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (racedError) throw racedError;
    if (raced?.id) return raced.id;
  }

  if (insertError) throw insertError;
  if (!created?.id) throw new Error("Unable to start conversation.");

  return created.id as string;
}
