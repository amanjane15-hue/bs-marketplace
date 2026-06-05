import MarketplaceFeed from "../../components/marketplace/MarketplaceFeed";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import type { Listing as MockListing } from "@/data/mock-listings";

export const metadata = {
  title: "Marketplace | B&S Marketplace",
  description: "Explore the B&S student marketplace feed for listings, filters, and Go Free donations.",
};

async function fetchListings(): Promise<MockListing[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select<string>(`id, title, price, category, university, is_free, image_urls, created_at`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  const rows = data ?? [];

  // Map to the UI Listing shape used by the client components.
  return (rows as any[]).map((r) => {
    const image = Array.isArray(r.image_urls) && r.image_urls.length > 0 ? r.image_urls[0] : "/placeholder.png";
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
      goFree: Boolean(r.is_free),
      verified: false,
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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="py-6">
          <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
          <p className="mt-1 text-sm text-slate-600">Buy, sell, and give away items on campus.</p>
        </header>
      </div>

      <MarketplaceFeed listings={listings} />

      {fetchError ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 text-sm text-rose-600">Error loading listings: {fetchError}</div>
      ) : null}
    </main>
  );
}
