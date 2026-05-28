"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Listing } from "../../data/mock-listings";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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
  const [items, setItems] = useState<Listing[]>(listings);

  // Subscribe to Supabase real-time inserts so new listings appear live
  useEffect(() => {
    setItems(listings);
  }, [listings]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("public:listings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listings" },
        (payload) => {
          const r = payload.new as any;
          const image = Array.isArray(r.image_urls) && r.image_urls.length > 0 ? r.image_urls[0] : "/placeholder.png";
          const price = r.is_free ? "$0" : r.price != null ? `$${Number(r.price).toFixed(2)}` : "$0";
          const posted = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";
          const mapped: Listing = {
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
          };

          setItems((prev) => [mapped, ...prev]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((l) => set.add(l.category));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((l) => {
      if (goFreeOnly && !l.goFree) return false;
      if (selectedCategory && l.category !== selectedCategory) return false;
      if (search && !(`${l.title} ${l.category} ${l.seller} ${l.university}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [items, goFreeOnly, selectedCategory, search]);

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

