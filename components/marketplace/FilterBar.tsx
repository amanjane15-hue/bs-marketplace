"use client";

"use client";

import React from "react";
import CategoryChips from "./CategoryChips";

type Props = {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (c: string | null) => void;
  goFreeOnly: boolean;
  onGoFreeChange: (v: boolean) => void;
  search: string;
  onSearchChange: (s: string) => void;
  condition: string | null;
  onConditionChange: (c: string | null) => void;
  university: string | null;
  onUniversityChange: (u: string | null) => void;
  minPrice: number | null;
  maxPrice: number | null;
  onPriceChange: (min: number | null, max: number | null) => void;
  sort: string;
  onSortChange: (s: string) => void;
};

export default function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  goFreeOnly,
  onGoFreeChange,
  search,
  onSearchChange,
  condition,
  onConditionChange,
  university,
  onUniversityChange,
  minPrice,
  maxPrice,
  onPriceChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-3">
            <label className="relative flex-1">
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search listings, e.g., bike, desk, textbook"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none"
              />
            </label>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={goFreeOnly} onChange={(e) => onGoFreeChange(e.target.checked)} className="h-4 w-4" />
                <span className="text-sm">Go Free</span>
              </label>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 md:mt-0">
            <CategoryChips categories={categories} selected={selectedCategory} onSelect={onCategoryChange} />

            <select value={condition ?? ""} onChange={(e) => onConditionChange(e.target.value || null)} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Any condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="used">Used</option>
            </select>

            <input
              value={university ?? ""}
              onChange={(e) => onUniversityChange(e.target.value || null)}
              placeholder="University"
              className="rounded border border-slate-200 bg-white px-3 py-2 text-sm"
            />

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice ?? ""}
                onChange={(e) => onPriceChange(e.target.value ? Number(e.target.value) : null, maxPrice)}
                placeholder="Min"
                className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-sm"
              />
              <span className="text-sm text-slate-400">—</span>
              <input
                type="number"
                value={maxPrice ?? ""}
                onChange={(e) => onPriceChange(minPrice, e.target.value ? Number(e.target.value) : null)}
                placeholder="Max"
                className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-sm"
              />
            </div>

            <select value={sort} onChange={(e) => onSortChange(e.target.value)} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="newest">Newest</option>
              <option value="price_asc">Lowest price</option>
              <option value="price_desc">Highest price</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
