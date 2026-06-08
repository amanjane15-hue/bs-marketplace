"use client";

import React, { useState } from "react";
import CategoryChips from "./CategoryChips";
import CollegeCombobox from "@/components/ui/CollegeCombobox";

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

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 cursor-pointer";

const inputClass =
  "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="md:sticky md:top-0 md:z-20 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* MOBILE LAYOUT (visible below md) */}
        <div className="space-y-3 py-4 md:hidden">
          {/* Row 1: Search */}
          <div className="relative w-full">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search listings..."
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-5 text-base text-slate-950 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Row 2: Filters Toggle + Sort */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((current) => !current)}
              aria-expanded={mobileFiltersOpen}
              aria-controls="mobile-marketplace-filters"
              className="flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Filters
            </button>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className={selectClass + " w-full min-w-0"}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Lowest price</option>
              <option value="price_desc">Highest price</option>
            </select>
          </div>

          {/* Advanced Filters Panel (Mobile) */}
          <div
            id="mobile-marketplace-filters"
            className={mobileFiltersOpen ? "block md:hidden" : "hidden"}
          >
            <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 select-none">
                <input
                  type="checkbox"
                  checked={goFreeOnly}
                  onChange={(e) => {
                    onGoFreeChange(e.target.checked);
                    setMobileFiltersOpen(false);
                  }}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="text-sm font-semibold text-emerald-700">Go Free</span>
              </label>

              <div className="flex flex-wrap gap-2">
                <CategoryChips
                  categories={categories}
                  selected={selectedCategory}
                  onSelect={(c) => {
                    onCategoryChange(c);
                    setMobileFiltersOpen(false);
                  }}
                />
              </div>

              <select
                value={condition ?? ""}
                onChange={(e) => {
                  onConditionChange(e.target.value || null);
                  setMobileFiltersOpen(false);
                }}
                className={selectClass + " w-full"}
              >
                <option value="">Any condition</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="used">Used</option>
              </select>

              <div className="w-full">
                <CollegeCombobox
                  value={university ?? ""}
                  onChange={(val) => {
                    onUniversityChange(val || null);
                    setMobileFiltersOpen(false);
                  }}
                  label=""
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={minPrice ?? ""}
                  onChange={(e) =>
                    onPriceChange(e.target.value ? Number(e.target.value) : null, maxPrice)
                  }
                  placeholder="Min ₹"
                  className={inputClass + " w-full min-w-0"}
                />
                <input
                  type="number"
                  value={maxPrice ?? ""}
                  onChange={(e) =>
                    onPriceChange(minPrice, e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Max ₹"
                  className={inputClass + " w-full min-w-0"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT (visible at md and above) */}
        <div className="hidden md:block">
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search listings, e.g., bike, desk, textbook…"
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-5 text-base text-slate-950 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <label className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50 select-none">
              <input
                type="checkbox"
                checked={goFreeOnly}
                onChange={(e) => onGoFreeChange(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              <span className="text-sm font-semibold text-emerald-700">Go Free</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 py-3">
            <CategoryChips
              categories={categories}
              selected={selectedCategory}
              onSelect={onCategoryChange}
            />

            <div className="mt-2 sm:mt-0 sm:ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <select
                value={condition ?? ""}
                onChange={(e) => onConditionChange(e.target.value || null)}
                className={selectClass + " flex-1 sm:flex-none"}
              >
                <option value="">Any condition</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="used">Used</option>
              </select>

              <div className="w-full flex-1 sm:w-48 sm:flex-none">
                <CollegeCombobox
                  value={university ?? ""}
                  onChange={(val) => onUniversityChange(val || null)}
                  label=""
                />
              </div>

              <div className="flex w-full items-center gap-1.5 sm:w-auto">
                <input
                  type="number"
                  value={minPrice ?? ""}
                  onChange={(e) =>
                    onPriceChange(e.target.value ? Number(e.target.value) : null, maxPrice)
                  }
                  placeholder="Min ₹"
                  className={inputClass + " w-full flex-1 sm:w-24 sm:flex-none"}
                />
                <span className="text-slate-400">–</span>
                <input
                  type="number"
                  value={maxPrice ?? ""}
                  onChange={(e) =>
                    onPriceChange(minPrice, e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Max ₹"
                  className={inputClass + " w-full flex-1 sm:w-24 sm:flex-none"}
                />
              </div>

              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                className={selectClass + " w-full sm:w-auto"}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Lowest price</option>
                <option value="price_desc">Highest price</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
