import MarketplaceFeed from "../../components/marketplace/MarketplaceFeed";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Listing as MockListing } from "@/data/mock-listings";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Marketplace | B&S Marketplace",
  description: "Explore the B&S student marketplace. Buy, sell, and give away items on campus.",
};

async function fetchListings(): Promise<MockListing[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select<string>(`id, title, price, category, university, is_free, image_urls, created_at, user_id, moderation_status`)
    .eq("moderation_status", "active")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const rows = data ?? [];
  return (rows as any[]).map((r) => {
    const image =
      Array.isArray(r.image_urls) && r.image_urls.length > 0
        ? r.image_urls[0]
        : "/placeholder.png";
    const price = r.is_free ? "₹0" : r.price != null ? formatPrice(r.price) : "₹0";
    const posted = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";
    return {
      id: r.id,
      title: r.title ?? "Untitled",
      price,
      category: r.category ?? "Other",
      seller: "Community",
      university: r.university ?? "",
      posted,
      image,
      image_urls: Array.isArray(r.image_urls) ? r.image_urls : [],
      goFree: Boolean(r.is_free),
      verified: false,
      user_id: r.user_id ?? undefined,
    } as MockListing;
  });
}

export default async function MarketplacePage() {
  let listings: MockListing[] = [];
  let fetchError: string | null = null;

  try {
    listings = await fetchListings();
  } catch (err) {
    fetchError = (err as Error)?.message ?? String(err);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      {/* Hero header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">Marketplace</h1>
          <p className="mt-2 text-lg text-slate-600">Buy, sell, and give away items on campus.</p>
        </div>
      </div>

      {/* Feed (sticky filter bar + grid inside) */}
      <MarketplaceFeed listings={listings} />

      {fetchError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">
          Error loading listings: {fetchError}
        </div>
      )}
    </div>
  );
}
