import React from "react";
import type { Listing } from "../../data/mock-listings";

type Props = {
  item: Listing;
};

export default function ListingCard({ item }: Props) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-56 w-full overflow-hidden">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />

        {item.goFree && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600/95 px-3 py-1 text-xs font-semibold text-white shadow">Go Free</span>
        )}

        <span className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-slate-900 shadow">
          <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          {item.price}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-slate-100">{item.category}</span>
          <span className="text-sm font-semibold text-slate-900">{item.price === "$0" ? "Free" : item.price}</span>
        </div>

        <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>

        <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-sm">
              <span className="font-medium">{item.seller}</span>
              {item.verified && (
                <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2L15 8l6 1-4.5 4 1 6L12 17l-5.5 2 1-6L3 9l6-1 3-6z" />
                </svg>
              )}
            </span>
            <span className="text-sm text-slate-400">·</span>
            <span className="text-sm text-slate-600">{item.university}</span>
          </div>

          <span className="text-sm text-slate-500">{item.posted}</span>
        </div>
      </div>
    </article>
  );
}
