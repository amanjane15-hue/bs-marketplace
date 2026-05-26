import Link from "next/link";
import type { Listing } from "@/data/mock-listings";

export default function MarketplaceListingCard(listing: Listing) {
  const { id, title, price, category, seller, university, posted, image, goFree, verified } = listing;

  return (
    <Link href={`/marketplace/${id}`} className="block">
      <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-md">
        <div className="group relative h-64 w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {goFree && (
              <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                Go Free
              </span>
            )}
            {verified && (
              <span className="rounded-full bg-slate-950/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                Verified
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
              {category}
            </span>
            <span className="text-sm font-semibold text-slate-900">{price}</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            <p className="text-sm leading-6 text-slate-600">{seller} · {university}</p>
          </div>
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>{verified ? "Verified seller" : "Community seller"}</span>
            <span>{posted}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
