"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import type { Listing } from "../../data/mock-listings";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/formatPrice";
import ListingCard from "./ListingCard";
import ListingSkeleton from "./ListingSkeleton";
import EmptyState from "./EmptyState";
import FilterBar from "./FilterBar";

type Props = {
  listings: Listing[];
};

export default function MarketplaceFeed({ listings }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [university, setUniversity] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [goFreeOnly, setGoFreeOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Listing[]>(listings);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // initialize from props
  useEffect(() => {
    setItems(listings);
  }, [listings]);

  // realtime subscription for newly inserted listings
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
          const price = r.is_free ? "$0" : r.price != null ? `$${formatPrice(r.price)}` : "$0";
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

          // prepend new listing
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

  const universities = useMemo(() => {
    const s = new Set<string>();
    items.forEach((l) => l.university && s.add(l.university));
    return Array.from(s);
  }, [items]);

  const pageSize = 12;

  function loadMore() {
    if (!hasMore) return;
    setPage((p) => p + 1);
  }

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // read initial filters from URL params on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") ?? "";
      const cat = params.get("category");
      const cond = params.get("condition");
      const uni = params.get("university");
      const min = params.get("minPrice");
      const max = params.get("maxPrice");
      const gf = params.get("goFree");
      const s = params.get("sort");
      if (q) setSearch(q);
      if (cat) setSelectedCategory(cat);
      if (cond) setCondition(cond);
      if (uni) setUniversity(uni);
      if (min) setMinPrice(Number(min));
      if (max) setMaxPrice(Number(max));
      if (gf) setGoFreeOnly(gf === "1");
      if (s) setSort(s);
    } catch (e) {
      // ignore
    }
  }, []);

  // fetch listings from Supabase when filters or page change
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const supabase = getSupabaseBrowserClient();
      let query = supabase.from("listings").select(
        `id,title,price,is_free,category,condition,university,description,image_urls,created_at,user_id`
      );

      if (debouncedSearch) {
        const q = `%${debouncedSearch}%`;
        query = query.or(`title.ilike.${q},description.ilike.${q}`);
      }
      if (selectedCategory) query = query.eq("category", selectedCategory);
      if (condition) query = query.eq("condition", condition);
      if (university) query = query.ilike("university", `%${university}%`);
      if (goFreeOnly) query = query.eq("is_free", true);
      if (minPrice != null) query = query.gte("price", minPrice);
      if (maxPrice != null) query = query.lte("price", maxPrice);

      if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sort === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (sort === "price_desc") {
        query = query.order("price", { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = page * pageSize - 1;

      try {
        const { data, error } = await query.range(from, to).select();
        if (controller.signal.aborted) return;
        if (!error && data) {
          const mapped = (data as any[]).map((r) => {
            const image = Array.isArray(r.image_urls) && r.image_urls.length > 0 ? r.image_urls[0] : "/placeholder.png";
            const price = r.is_free ? "$0" : r.price != null ? `$${formatPrice(r.price)}` : "$0";
            const posted = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";
            return {
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
              user_id: r.user_id ?? null,
            } as Listing;
          });

          if (page === 1) setItems(mapped);
          else setItems((prev) => [...prev, ...mapped]);
          setHasMore((data as any[]).length === pageSize);
        }
      } catch (e) {
        // ignore network/abort errors
      }

      setLoading(false);

      // update URL params (shallow)
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("q", debouncedSearch);
        if (selectedCategory) params.set("category", selectedCategory);
        if (condition) params.set("condition", condition);
        if (university) params.set("university", university);
        if (minPrice != null) params.set("minPrice", String(minPrice));
        if (maxPrice != null) params.set("maxPrice", String(maxPrice));
        if (goFreeOnly) params.set("goFree", "1");
        if (sort) params.set("sort", sort);
        const url = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, "", url);
      } catch (e) {
        // ignore
      }
    };

    void fetchListings();
    return () => {
      abortRef.current?.abort();
    };
  }, [debouncedSearch, selectedCategory, condition, university, minPrice, maxPrice, goFreeOnly, sort, page]);

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
        condition={condition}
        onConditionChange={(c) => {
          setCondition(c);
          setPage(1);
        }}
        university={university}
        onUniversityChange={(u) => {
          setUniversity(u);
          setPage(1);
        }}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onPriceChange={(min, max) => {
          setMinPrice(min);
          setMaxPrice(max);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          setPage(1);
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.length === 0 && !loading ? (
              <EmptyState message={goFreeOnly ? "No Go Free listings found." : "No listings match your search."} />
            ) : (
              items.map((item) => <ListingCard key={item.id} item={item} />)
            )}

            {loading && Array.from({ length: 4 }).map((_, i) => <ListingSkeleton key={i} />)}
          </div>

          <div className="mt-8 flex items-center justify-center">
            {hasMore ? (
              <button onClick={loadMore} className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow">
                {loading ? "Loading..." : "Load more"}
              </button>
            ) : (
              items.length > 0 && <span className="text-sm text-slate-500">You've reached the end.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
