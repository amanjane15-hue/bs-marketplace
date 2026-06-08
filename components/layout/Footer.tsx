import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              B&S Marketplace
            </h2>
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              A student-first marketplace to buy, sell, and donate campus essentials with community values at the center.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Marketplace
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>
                <Link href="/marketplace" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Browse listings
                </Link>
              </li>
              <li>
                <Link href="/create-listing" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Post an item
                </Link>
              </li>
              <li>
                <Link href="/marketplace?goFree=1" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Go Free donations
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Student Links
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>
                <Link href="/campus-swaps" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Campus swaps
                </Link>
              </li>
              <li>
                <Link href="/sustainability" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/support" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Student support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Connect
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>
                <Link href="/about" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/70 pt-6 text-sm text-slate-500 sm:flex sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} B&S Marketplace. Built for a sustainable student community.</p>
          <p className="mt-4 sm:mt-0">Made for campus life, study swaps, and responsible living.</p>
        </div>
      </div>
    </footer>
  );
}
