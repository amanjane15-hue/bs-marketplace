import React from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/profile/ProfileCard";
import ListingCard from "@/components/marketplace/ListingCard";

type Props = {
  params: {
    id: string;
  };
};

export default async function SellerProfilePage({ params }: Props) {
  const supabase = getSupabaseServerClient();

  // fetch profile by user_id
  const { data: profileData } = await supabase.from("profiles").select("display_name,avatar_url,bio,university,created_at").eq("user_id", params.id).single();

  const { data: listings } = await supabase
    .from("listings")
    .select("id,title,price,is_free,category,condition,university,description,image_urls,created_at")
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const mappedListings = (listings ?? []).map((r: any) => {
    const image = Array.isArray(r.image_urls) && r.image_urls.length > 0 ? r.image_urls[0] : "/placeholder.png";
    const price = r.is_free ? "$0" : r.price != null ? `$${Number(r.price).toFixed(2)}` : "$0";
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
      verified: false,
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
            userId={params.id}
            createdAt={profileData?.created_at}
            listingCount={(listings ?? []).length}
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
