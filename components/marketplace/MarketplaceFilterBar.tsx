type MarketplaceFilterBarProps = {
  query: string;
  category: string;
  goFreeOnly: boolean;
  categories: string[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onToggleGoFree: () => void;
};

export default function MarketplaceFilterBar({
  query,
  category,
  goFreeOnly,
  categories,
  onQueryChange,
  onCategoryChange,
  onToggleGoFree,
}: MarketplaceFilterBarProps) {
  return (
    <div className="sticky top-4 z-30 rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/80 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-600">Search listings</label>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search textbooks, electronics, dorm items..."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[220px_150px] lg:w-auto">
          <div>
            <label className="block text-sm font-semibold text-slate-600">Category</label>
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="All">All categories</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleGoFree}
            className={`mt-2 inline-flex h-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              goFreeOnly
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
            }`}
          >
            Go Free {goFreeOnly ? "on" : "off"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {categories.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onCategoryChange(chip)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              category === chip
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
