export default function SearchBar() {
  return (
    <form className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] lg:grid-cols-[2fr_1fr]">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Search items
          <input
            type="search"
            placeholder="Find textbooks, furniture, or gear"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Category
          <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-emerald-100">
            <option>All categories</option>
            <option>Textbooks</option>
            <option>Dorm Gear</option>
            <option>Electronics</option>
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
