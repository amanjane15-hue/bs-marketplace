import SearchBar from "@/components/ui/SearchBar";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 py-16" id="top">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              Student-first marketplace
            </span>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Buy, sell, and donate campus essentials with community care.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                Discover a marketplace designed for student life, where every listing supports sustainability, affordability, and connection.
              </p>
            </div>

            <div className="grid gap-4 sm:max-w-md">
              <SearchBar />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/80">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Trusted community</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">12k+</p>
                <p className="mt-2 text-sm text-slate-600">Campus members buying and selling weekly.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/80">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Go Free donations</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">1.4k</p>
                <p className="mt-2 text-sm text-slate-600">Items donated to support students and local charities.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -left-10 top-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 right-0 h-40 w-40 rounded-full bg-sky-100/80 blur-3xl" />

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)]">
              <img
                src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80"
                alt="Students browsing marketplace listings"
                className="h-[420px] w-full object-cover"
              />
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                    Featured
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                    New drop
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-slate-950">Campus study bundle</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    A curated set of study must-haves for the semester — textbooks, desk gear, and a cozy lamp.
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <p>Seller: Campus Curator</p>
                  <p>Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
