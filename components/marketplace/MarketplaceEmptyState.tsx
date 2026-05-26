export default function MarketplaceEmptyState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-600 shadow-sm shadow-slate-200/50">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Nothing found</p>
      <h2 className="mt-4 text-3xl font-semibold text-slate-950">No listings match your filters</h2>
      <p className="mt-4 max-w-2xl mx-auto text-base leading-7">
        Try changing your search terms, expanding the category, or switching off the Go Free filter to see more items.
      </p>
    </div>
  );
}
