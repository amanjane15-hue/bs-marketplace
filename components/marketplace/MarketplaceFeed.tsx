"use client";

import React, { useMemo, useState } from "react";
import type { Listing } from "../../data/mock-listings";
import ListingCard from "./ListingCard";
import ListingSkeleton from "./ListingSkeleton";
import EmptyState from "./EmptyState";
import FilterBar from "./FilterBar";

type Props = {
  listings: Listing[];
};

export default function MarketplaceFeed({ listings }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [goFreeOnly, setGoFreeOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => set.add(l.category));
    return Array.from(set);
  }, [listings]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (goFreeOnly && !l.goFree) return false;
      if (selectedCategory && l.category !== selectedCategory) return false;
      if (search && !(`${l.title} ${l.category} ${l.seller} ${l.university}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [listings, goFreeOnly, selectedCategory, search]);

  const pageSize = 6;
  const visible = filtered.slice(0, page * pageSize);
  const hasMore = visible.length < filtered.length;

  function loadMore() {
    setLoading(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="w-full">
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(c) => {
          setSelectedCategory(c);
          setPage(1);
        }}
        goFreeOnly={goFreeOnly}
        onGoFreeChange={(v) => {
          setGoFreeOnly(v);
          setPage(1);
        }}
        search={search}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.length === 0 && !loading ? (
              <EmptyState message={goFreeOnly ? "No Go Free listings found." : "No listings match your search."} />
            ) : (
              visible.map((item) => <ListingCard key={item.id} item={item} />)
            )}

            {loading && Array.from({ length: 4 }).map((_, i) => <ListingSkeleton key={i} />)}
          </div>

          <div className="mt-8 flex items-center justify-center">
            {hasMore ? (
              <button onClick={loadMore} className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow">
                {loading ? "Loading..." : "Load more"}
              </button>
            ) : (
              filtered.length > 0 && <span className="text-sm text-slate-500">You've reached the end.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

