"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-zinc-200/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold tracking-tight text-slate-950">
          B&S Marketplace
        </Link>

        <nav className="hidden items-center gap-8 md:flex text-sm text-slate-600">
          <a href="#featured" className="transition hover:text-slate-950">
            Featured
          </a>
          <a href="#categories" className="transition hover:text-slate-950">
            Categories
          </a>
          <a href="#go-free" className="transition hover:text-slate-950">
            Go Free
          </a>
          <Link href="/marketplace" className="transition hover:text-slate-950">
            Marketplace
          </Link>
        </nav>

        <div className="flex gap-3">
          <Link href="/marketplace" aria-label="Discover listings">
            <span className="inline-flex items-center rounded-full border border-slate-900 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Discover listings
            </span>
          </Link>
          <Link href="/create-listing" aria-label="Sell an item">
            <span className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
              Sell Item
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
