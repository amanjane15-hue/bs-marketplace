export default function MarketplaceLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
        >
          <div className="h-64 bg-slate-200" />
          <div className="space-y-4 p-6">
            <div className="h-4 w-28 rounded-full bg-slate-200" />
            <div className="h-6 w-3/4 rounded-full bg-slate-200" />
            <div className="h-4 w-1/2 rounded-full bg-slate-200" />
            <div className="h-4 w-20 rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
