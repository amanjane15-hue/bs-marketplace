import React from "react";

export default function EmptyState({ message = "No listings found." }: { message?: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 p-12">
      <svg className="h-12 w-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" />
        <path strokeWidth="1.5" d="M16 3v4M8 3v4" />
      </svg>
      <h3 className="text-lg font-semibold text-slate-900">{message}</h3>
      <p className="text-sm text-slate-500">Try adjusting your filters or search terms.</p>
    </div>
  );
}
