import Skeleton from "@/components/ui/Skeleton";

export default function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <Skeleton className="h-64 w-full rounded-none" />

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>

        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-5 w-1/2" />

        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 flex-1 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
