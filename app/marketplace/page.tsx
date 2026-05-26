import MarketplaceFeed from "../../components/marketplace/MarketplaceFeed";
import { mockListings } from "../../data/mock-listings";

export const metadata = {
  title: "Marketplace | B&S Marketplace",
  description: "Explore the B&S student marketplace feed for listings, filters, and Go Free donations.",
};

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="py-6">
          <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
          <p className="mt-1 text-sm text-slate-600">Buy, sell, and give away items on campus.</p>
        </header>
      </div>

      <MarketplaceFeed listings={mockListings} />
    </main>
  );
}
