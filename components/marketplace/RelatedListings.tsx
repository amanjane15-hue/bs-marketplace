import React from "react";
import MarketplaceListingCard from "./MarketplaceListingCard";
import { mockListings } from "@/data/mock-listings";

export default function RelatedListings({ currentId }: { currentId?: string }) {
  const related = mockListings.filter((l) => l.id !== currentId).slice(0, 4);

  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Related listings</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((r) => (
          <MarketplaceListingCard key={r.id} {...r} />
        ))}
      </div>
    </section>
  );
}
