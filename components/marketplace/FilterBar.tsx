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
};

export default function FilterBar({ categories, selectedCategory, onCategoryChange, goFreeOnly, onGoFreeChange, search, onSearchChange }: Props) {
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

          <div className="mt-2 md:mt-0">
            <CategoryChips categories={categories} selected={selectedCategory} onSelect={onCategoryChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
