import ListingCard from "@/components/marketplace/ListingCard";
import type { Listing } from "@/types/marketplace";

type Props = {
  listings: Listing[];
};

export default function GoFreeSection({ listings }: Props) {
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 py-16" id="go-free">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Go Free donation program
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Give items a second life.
          </h2>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            Support campus generosity. Grab essentials for free or pass on items you no longer need.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} item={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
