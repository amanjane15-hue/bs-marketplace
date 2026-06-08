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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value?: string | null) {
  return Boolean(value && UUID_REGEX.test(value));
}

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
      is_free,
      category,
      custom_category,
      condition,
      university,
      description,
      image_urls,
      created_at,
      user_id,
      listing_status,
      moderation_status,
      sold_to,
      sold_by,
      profile:profiles!listings_user_id_profiles_fkey(
        user_id,
        display_name,
        avatar_url,
        university,
        is_verified
      )
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
  
  if (listingRow.moderation_status === 'hidden' || listingRow.listing_status === 'sold') {
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

  // Normalize seller profile
  const sellerProfile = Array.isArray(listingRow.profile)
    ? listingRow.profile[0]
    : listingRow.profile;

  // Fetch rating summary for seller
  let averageRating = 0;
  let totalRatings = 0;
  if (isValidUuid(listingRow.user_id)) {
    const { data: ratingSummary } = await supabase
      .rpc("get_profile_rating_summary", { p_user_id: listingRow.user_id })
      .maybeSingle();

    if (ratingSummary) {
      averageRating = ratingSummary.average_rating ? Number(ratingSummary.average_rating) : 0;
      totalRatings = ratingSummary.total_ratings ? Number(ratingSummary.total_ratings) : 0;
    }
  }

  // Fetch current user's rating if eligible
  let myRatingData = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user && isValidUuid(id) && listingRow.listing_status === "sold" && (user.id === listingRow.sold_to || user.id === listingRow.sold_by)) {
    const { data: r } = await supabase
      .from("transaction_ratings")
      .select("rating, review_text")
      .eq("listing_id", id)
      .eq("reviewer_id", user.id)
      .maybeSingle();
    myRatingData = r;
  }

  const listingForUI = {
    id: listingRow.id,
    title: listingRow.title ?? "Untitled",
    price: listingRow.is_free
      ? "₹0"
      : listingRow.price != null
      ? formatPrice(listingRow.price)
      : "₹0",
    isFree: Boolean(listingRow.is_free),
    category: listingRow.category === "tickets" 
      ? "🎟 Tickets" 
      : listingRow.custom_category 
        ? `Other: ${listingRow.custom_category}` 
        : listingRow.category ?? "Other",
    customCategory: listingRow.custom_category,
    condition: listingRow.condition,
    university:
      sellerProfile?.university ??
      listingRow.university ??
      "College not provided",
    description: listingRow.description ?? "",
    imageUrls: listingRow.image_urls ?? [],
    createdAt: listingRow.created_at,

    sellerId: listingRow.user_id,
    sellerName: sellerProfile?.display_name ?? "Student seller",
    sellerAvatar: sellerProfile?.avatar_url ?? null,
    sellerUniversity:
      sellerProfile?.university ??
      listingRow.university ??
      "College not provided",
    sellerVerified: sellerProfile?.is_verified === true,

    listingStatus: listingRow.listing_status,
    moderationStatus: listingRow.moderation_status,
    soldTo: listingRow.sold_to,
    soldBy: listingRow.sold_by,

    averageRating,
    totalRatings,
    myRating: myRatingData?.rating,
    myReview: myRatingData?.review_text,
  };

  return listingForUI;
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const listingForUI = await fetchListingById(id);

  if (!listingForUI) {
    notFound();
  }

  const images: string[] =
    Array.isArray(listingForUI.imageUrls) &&
    listingForUI.imageUrls.length > 0
      ? listingForUI.imageUrls
      : [];

  const displayImage = images[0] ?? "/placeholder-listing.svg";

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
                image={displayImage}
                title={listingForUI.title}
              />

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <ListingInfo
                  listingId={listingForUI.id}
                  sellerId={listingForUI.sellerId}
                  listingStatus={listingForUI.listingStatus}
                  moderationStatus={listingForUI.moderationStatus}
                  soldTo={listingForUI.soldTo}
                  soldBy={listingForUI.soldBy}
                  title={listingForUI.title}
                  price={listingForUI.price}
                  category={listingForUI.category}
                  seller={listingForUI.sellerName}
                  university={listingForUI.university}
                  posted={listingForUI.createdAt ? new Date(listingForUI.createdAt).toLocaleDateString() : ""}
                  description={listingForUI.description}
                  sellerAvatar={listingForUI.sellerAvatar}
                  sellerUniversity={listingForUI.sellerUniversity}
                  verified={listingForUI.sellerVerified}
                  averageRating={listingForUI.averageRating}
                  totalRatings={listingForUI.totalRatings}
                  myRating={listingForUI.myRating}
                  myReview={listingForUI.myReview}
                />
              </div>

              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <RelatedListings currentId={listingForUI.id} />
              </div>
            </div>
          </main>

          <aside className="hidden lg:block">
            <SellerCard
              sellerId={listingForUI.sellerId}
              seller={listingForUI.sellerName}
              sellerAvatar={listingForUI.sellerAvatar}
              university={listingForUI.sellerUniversity}
              verified={listingForUI.sellerVerified}
              averageRating={listingForUI.averageRating}
              totalRatings={listingForUI.totalRatings}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
