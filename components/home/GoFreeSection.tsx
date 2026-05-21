export default function GoFreeSection() {
  return (
    <section className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 py-16" id="go-free">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Go Free donation program
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Give items a second life and support students in need.
            </h2>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Encourage campus generosity with donation-friendly listings that make it easy to give away supplies and essentials to students who need them most.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/80">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Fast pick-up</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">Flexible</p>
                <p className="mt-2 text-sm text-slate-600">Schedule free handoffs with campus neighbors.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/80">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Joyful reuse</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">Impactful</p>
                <p className="mt-2 text-sm text-slate-600">Help students save money while reducing waste.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)]">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Community impact</p>
                <h3 className="text-3xl font-semibold">Student donations made simple</h3>
              </div>
              <ul className="space-y-4 text-sm leading-7 text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  List an item with Go Free label and select free donation.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Connect with students who can pick up within the week.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Give away what you no longer need and keep campus green.
                </li>
              </ul>
              <div className="rounded-3xl bg-white/10 px-5 py-4 text-sm text-slate-200 ring-1 ring-white/10">
                <p className="font-semibold">Community highlight</p>
                <p className="mt-2 text-slate-300">Over 1,400 donated items have been reused by students this semester.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
