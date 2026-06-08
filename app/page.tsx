import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import CategoriesSection from "@/components/home/CategoriesSection";
import FeaturedListings from "@/components/home/FeaturedListings";
import GoFreeSection from "@/components/home/GoFreeSection";
import HeroSection from "@/components/home/HeroSection";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Listing } from "@/types/marketplace";

export const dynamic = "force-dynamic";

function mapListingRow(row: any): Listing {
  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
  const image = Array.isArray(row.image_urls) && row.image_urls.length > 0 ? row.image_urls[0] : "/placeholder-listing.svg";
  const price = row.is_free ? "₹0" : row.price != null ? formatPrice(row.price) : "₹0";
  const posted = row.created_at ? new Date(row.created_at).toLocaleDateString() : "";

  return {
    id: row.id,
    title: row.title ?? "Untitled",
    price,
    category: row.category ?? "Other",
    custom_category: row.custom_category,
    condition: row.condition ?? "good",
    seller: profile?.display_name ?? "Community",
    university: profile?.university ?? row.university ?? "",
    posted,
    image,
    image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
    goFree: Boolean(row.is_free),
    verified: profile?.is_verified === true,
    user_id: row.user_id ?? undefined,
  };
}

export default async function Home() {
  let recentListings: Listing[] = [];
  let goFreeListings: Listing[] = [];
  let activeListingsCount = 0;
  let goFreeCount = 0;
  let categoryCounts: Record<string, number> = { tickets: 0, electronics: 0, textbooks: 0, other: 0 };

  try {
    const supabase = await getSupabaseServerClient();

    const { data: recentData, error: recentError } = await supabase
      .from("listings")
      .select(`
        id, title, price, is_free, category, custom_category, condition, university, description, image_urls, created_at, user_id,
        profile:profiles!listings_user_id_profiles_fkey(display_name, is_verified, university)
      `)
      .eq("moderation_status", "active")
      .eq("listing_status", "active")
      .order("created_at", { ascending: false })
      .limit(6);

    if (recentError) throw recentError;
    recentListings = (recentData || []).map(mapListingRow);

    const { data: freeData, error: freeError } = await supabase
      .from("listings")
      .select(`
        id, title, price, is_free, category, custom_category, condition, university, description, image_urls, created_at, user_id,
        profile:profiles!listings_user_id_profiles_fkey(display_name, is_verified, university)
      `)
      .eq("moderation_status", "active")
      .eq("listing_status", "active")
      .eq("is_free", true)
      .order("created_at", { ascending: false })
      .limit(4);

    if (freeError) throw freeError;
    goFreeListings = (freeData || []).map(mapListingRow);

    const { data: aggData, error: aggError } = await supabase
      .from("listings")
      .select("category, is_free")
      .eq("moderation_status", "active")
      .eq("listing_status", "active");

    if (aggError) throw aggError;

    if (aggData) {
      activeListingsCount = aggData.length;
      for (const row of aggData) {
        if (row.is_free) goFreeCount++;
        const cat = row.category?.toLowerCase() || "other";
        if (categoryCounts[cat] !== undefined) {
          categoryCounts[cat]++;
        } else {
          categoryCounts["other"]++;
        }
      }
    }
  } catch (error: any) {
    console.error("Landing page listings query failed", {
      message: error.message,
      code: error.code,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-16">
        <HeroSection activeListingsCount={activeListingsCount} goFreeCount={goFreeCount} />
        <FeaturedListings listings={recentListings} />
        <CategoriesSection categoryCounts={categoryCounts} />
        <GoFreeSection listings={goFreeListings} />
      </main>
      <Footer />
    </div>
  );
}