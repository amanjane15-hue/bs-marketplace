export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-zinc-200/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#top" className="text-xl font-semibold tracking-tight text-slate-950">
          B&S Marketplace
        </a>

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
          <a href="#community" className="transition hover:text-slate-950">
            Community
          </a>
        </nav>

        <a
          href="#featured"
          className="inline-flex items-center rounded-full border border-slate-900 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Discover listings
        </a>
      </div>
    </header>
  );
}
