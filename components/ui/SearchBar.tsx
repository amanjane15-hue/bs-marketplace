"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const normalizedSearch = searchTerm.trim();

    if (normalizedSearch) {
      params.set("q", normalizedSearch);
    }

    if (category) {
      params.set("category", category);
    }

    const query = params.toString();

    router.push(query ? `/marketplace?${query}` : "/marketplace");
  };

  return (
    <form onSubmit={handleSearch} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] lg:grid-cols-[2fr_1fr]">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Search items
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Find textbooks, furniture, or gear"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Category
          <select 
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All categories</option>
            <option value="tickets">Tickets</option>
            <option value="electronics">Electronics</option>
            <option value="textbooks">Textbooks</option>
            <option value="other">Other</option>
          </select>
        </label>

        <button
          type="submit"
          className="min-h-[56px] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Search listings
        </button>
      </div>
    </form>
  );
}
