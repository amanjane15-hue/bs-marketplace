import React from "react";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import ProfileCard from "@/components/profile/ProfileCard";
import ListingCard from "@/components/marketplace/ListingCard";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SellerProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  // fetch profile by user_id
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("display_name,avatar_url,bio,university,created_at,is_verified")
    .eq("user_id", id)
    .single();

  if (profileError) {
    console.error("Profile page error", {
      code: profileError?.code,
      message: profileError?.message,
    });
  }

  if (profileError || !profileData) {
    notFound();
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("id,title,price,is_free,category,condition,university,description,image_urls,created_at,user_id,moderation_status")
    .eq("user_id", id)
    .eq("moderation_status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  const mappedListings = (listings ?? []).map((r: any) => {
    const image = Array.isArray(r.image_urls) && r.image_urls.length > 0 ? r.image_urls[0] : "/placeholder.png";
    const price = r.is_free ? "₹0" : r.price != null ? formatPrice(r.price) : "₹0";
    const posted = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";
    return {
      id: r.id,
      title: r.title ?? "Untitled",
      price,
      category: r.category ?? "Other",
      seller: profileData?.display_name ?? "Seller",
      university: r.university ?? "",
      posted,
      image,
      goFree: Boolean(r.is_free),
      verified: Boolean(profileData?.is_verified),
      user_id: r.user_id,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ProfileCard
            displayName={profileData?.display_name}
            avatarUrl={profileData?.avatar_url}
            university={profileData?.university}
            bio={profileData?.bio}
            userId={id}
            createdAt={profileData?.created_at}
            listingCount={(listings ?? []).length}
            verified={Boolean(profileData?.is_verified)}
          />

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Seller listings</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mappedListings.map((l) => (
                <ListingCard key={l.id} item={l} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
