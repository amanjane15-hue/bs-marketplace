import Skeleton from "@/components/ui/Skeleton";
import ListingCardSkeleton from "@/components/marketplace/ListingCardSkeleton";

export default function MarketplaceLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-2 h-5 w-48" />
        </div>
        <Skeleton className="h-12 w-full md:w-96 rounded-full" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Listings Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
