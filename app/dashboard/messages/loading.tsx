import Skeleton from "@/components/ui/Skeleton";

export default function MessagesLoading() {
  return (
    <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-[calc(100vh-140px)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <aside className="flex w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-6 w-8 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-12 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-1 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 border-b border-slate-100 p-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </aside>
        
        <section className="hidden md:flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="mt-1 h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-full" />
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 py-4">
              <Skeleton className="h-14 w-2/3 max-w-[75%] rounded-2xl rounded-bl-md self-start" />
              <Skeleton className="h-10 w-1/2 max-w-[75%] rounded-2xl rounded-br-md self-end" />
              <Skeleton className="h-16 w-3/4 max-w-[75%] rounded-2xl rounded-bl-md self-start" />
            </div>
          </div>
          <div className="border-t border-slate-200 bg-white p-4">
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </section>
      </div>
    </div>
  );
}
