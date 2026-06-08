import React from "react";
import MarketplaceListingCard from "./MarketplaceListingCard";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getListingImage(imageUrls?: string[] | null) {
  return Array.isArray(imageUrls) && imageUrls.length > 0
    ? imageUrls[0]
    : "/placeholder-listing.svg";
}

export default async function RelatedListings({ currentId }: { currentId?: string }) {
  const supabase = await getSupabaseServerClient();
  
  let query = supabase
    .from("listings")
    .select(`
      id,
      title,
      price,
      is_free,
      category,
      custom_category,
      condition,
      university,
      image_urls,
      created_at,
      user_id,
      listing_status,
      moderation_status,
      profile:profiles!listings_user_id_profiles_fkey(
        display_name,
        university,
        is_verified
      )
    `)
    .eq("listing_status", "active")
    .eq("moderation_status", "active")
    .limit(4);
    
  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data: relatedListings, error } = await query;

  if (error || !relatedListings || relatedListings.length === 0) {
    return null;
  }

  // Map to the shape expected by MarketplaceListingCard
  const mappedRelated = relatedListings.map((r: any) => ({
    id: r.id,
    title: r.title,
    price: r.price,
    is_free: r.is_free,
    category: r.category,
    custom_category: r.custom_category,
    condition: r.condition,
    university: r.university,
    seller: r.profile?.display_name || "Unknown",
    sellerUniversity: r.profile?.university || null,
    verified: r.profile?.is_verified || false,
    image: getListingImage(r.image_urls),
    posted: r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
    listing_status: r.listing_status,
    moderation_status: r.moderation_status,
    user_id: r.user_id,
  }));

  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Related listings</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mappedRelated.map((r) => (
          <MarketplaceListingCard key={r.id} {...r} />
        ))}
      </div>
    </section>
  );
}
