import Skeleton from "@/components/ui/Skeleton";
import ListingCardSkeleton from "@/components/marketplace/ListingCardSkeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="mt-4 sm:ml-6 sm:mt-0">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>
        </div>
        
        <div className="mt-8 border-t border-slate-200 pt-8">
          <Skeleton className="h-6 w-32" />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
