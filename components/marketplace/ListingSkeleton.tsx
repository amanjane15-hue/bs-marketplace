import React from "react";

export default function ListingSkeleton() {
  return (
    <article className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="h-56 w-full bg-slate-100" />
      <div className="p-4">
        <div className="mb-2 h-3 w-32 rounded bg-slate-100" />
        <div className="mb-3 h-4 w-3/4 rounded bg-slate-100" />
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-3 w-16 rounded bg-slate-100" />
        </div>
      </div>
    </article>
  );
}
