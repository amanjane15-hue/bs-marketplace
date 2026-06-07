import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingGallery from "@/components/marketplace/ListingGallery";
import ListingInfo from "@/components/marketplace/ListingInfo";
import SellerCard from "@/components/marketplace/SellerCard";
import RelatedListings from "@/components/marketplace/RelatedListings";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";

export const metadata: Metadata = {
  title: "Listing | B&S Marketplace",
  description: "Marketplace listing detail page.",
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function fetchListingById(id: string) {
  const supabase = await getSupabaseServerClient();

  const { data: listingRow, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      price,
      category,
      university,
      is_free,
      image_urls,
      created_at,
      description,
      user_id,
      custom_category,
      moderation_status
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Marketplace listing page error", {
      code: error?.code,
      message: error?.message,
    });
  }

  if (error || !listingRow) {
    return null;
  }
  
  if (listingRow.moderation_status === 'hidden') {
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .maybeSingle();
      isAdmin = profile?.is_admin === true;
    }
    
    if (!isAdmin && listingRow.user_id !== user?.id) {
      return null;
    }
  }
  
  let sellerProfile = null;
  if (listingRow.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, university, created_at, is_verified")
      .eq("user_id", listingRow.user_id)
      .maybeSingle();
    sellerProfile = profile;
  }

  return { ...listingRow, sellerProfile };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const listingRow: any = await fetchListingById(id);

  if (!listingRow) {
    notFound();
  }

  const images: string[] =
    Array.isArray(listingRow.image_urls) &&
    listingRow.image_urls.length > 0
      ? listingRow.image_urls
      : [];
      
  const sellerProfile = listingRow.sellerProfile;

  const listingForUI = {
    id: listingRow.id,
    title: listingRow.title ?? "Untitled",
    price: listingRow.is_free
      ? "₹0"
      : listingRow.price != null
      ? formatPrice(listingRow.price)
      : "₹0",
    category: listingRow.category === "tickets" 
      ? "🎟 Tickets" 
      : listingRow.custom_category 
        ? `Other: ${listingRow.custom_category}` 
        : listingRow.category ?? "Other",
    posted: listingRow.created_at
      ? new Date(listingRow.created_at).toLocaleDateString()
      : "",
    image: images[0] ?? "/placeholder.png",
    goFree: Boolean(listingRow.is_free),
    verified: Boolean(sellerProfile?.is_verified),
    description: listingRow.description ?? "",
    image_urls: images,
    user_id: listingRow.user_id ?? undefined,
    // Real seller details
    seller: sellerProfile?.display_name ?? "Seller",
    sellerAvatar: sellerProfile?.avatar_url ?? null,
    sellerUniversity: sellerProfile?.university ?? listingRow.university ?? "",
    sellerJoinedAt: sellerProfile?.created_at ?? null,
    university: listingRow.university ?? "",
    moderation_status: listingRow.moderation_status,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <main>
            <div className="space-y-6">
              {listingForUI.moderation_status === 'hidden' && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 font-medium">
                  This listing is hidden by moderation. It is not visible to the public.
                </div>
              )}
              <ListingGallery
                images={images}
                image={listingForUI.image}
                title={listingForUI.title}
              />

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <ListingInfo {...listingForUI} />
              </div>

              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <RelatedListings currentId={listingForUI.id} />
              </div>
            </div>
          </main>

          <aside className="hidden lg:block">
            <SellerCard
              listingId={listingForUI.id}
              sellerId={listingForUI.user_id}
              seller={listingForUI.seller}
              sellerAvatar={listingForUI.sellerAvatar}
              university={listingForUI.sellerUniversity}
              verified={listingForUI.verified}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
