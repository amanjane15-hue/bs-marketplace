import ListingCard from "@/components/marketplace/ListingCard";
import type { Listing } from "@/types/marketplace";
import Link from "next/link";

type Props = {
  listings: Listing[];
};

export default function FeaturedListings({ listings }: Props) {
  return (
    <section className="bg-slate-50 py-16" id="featured">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Fresh listings
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Recently added to the marketplace.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 md:text-right">
            Browse the latest freshman essentials, study bundles, and sustainable student swaps.
          </p>
        </div>

        {listings.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} item={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">No active listings</h3>
            <p className="mt-2 text-sm text-slate-500">There are no recently added items. Be the first to list something!</p>
            <div className="mt-6">
              <Link href="/create-listing" className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
                Sell an item
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
