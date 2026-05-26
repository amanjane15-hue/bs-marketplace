import React from "react";
import Link from "next/link";
import type { Listing } from "@/data/mock-listings";

export default function ListingInfo({
  id,
  title,
  price,
  category,
  seller,
  university,
  posted,
}: Listing) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">{category}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">{university}</span>
            <span className="text-sm text-slate-500">{posted}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-2xl font-bold text-slate-950">{price}</div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              Save
            </button>
            <Link href={`#contact`} className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Contact seller</Link>
          </div>
        </div>
      </div>

      <div className="prose max-w-none text-slate-700">
        <h3 className="text-lg font-semibold">Details</h3>
        <p>
          This is a mock listing description to demonstrate layout and spacing. The real listing description will include condition, included items, pickup options, and any notes from the seller. For now this content is placeholder text to show the design.
        </p>
      </div>
    </div>
  );
}
