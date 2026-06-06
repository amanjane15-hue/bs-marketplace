import Skeleton from "@/components/ui/Skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Skeleton className="h-[420px] w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
          </div>

          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
