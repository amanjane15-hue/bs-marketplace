import Skeleton from "@/components/ui/Skeleton";

export default function DashboardListingSkeleton() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-2 h-4 w-32" />
          <Skeleton className="mt-3 h-7 w-48" />
        </div>

        <div className="sm:text-right">
          <Skeleton className="h-8 w-20 sm:ml-auto" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
    </div>
  );
}
