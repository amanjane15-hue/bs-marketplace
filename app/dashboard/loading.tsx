import Skeleton from "@/components/ui/Skeleton";
import DashboardListingSkeleton from "@/components/dashboard/DashboardListingSkeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-10 w-64" />
            <Skeleton className="mt-3 h-5 w-80" />
          </div>
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <DashboardListingSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
