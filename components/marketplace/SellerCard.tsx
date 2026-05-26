import React from "react";
import type { Listing } from "@/data/mock-listings";

export default function SellerCard({ seller, university, verified }: Pick<Listing, "seller" | "university" | "verified">) {
  return (
    <aside className="sticky top-6 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-slate-100" />
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{seller}</div>
            {verified && <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Verified</div>}
          </div>
          <div className="text-sm text-slate-500">{university}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button id="contact" className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Contact seller</button>
        <button className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Save listing</button>
      </div>
    </aside>
  );
}
