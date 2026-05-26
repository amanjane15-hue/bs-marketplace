import React from "react";

type Props = {
  categories: string[];
  selected?: string | null;
  onSelect: (c: string | null) => void;
};

export default function CategoryChips({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-sm font-medium ${!selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
        All
      </button>

      {categories.map((c) => {
        const active = selected === c;
        return (
          <button
            key={c}
            onClick={() => onSelect(active ? null : c)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
            {c}
          </button>
        );
      })}
    </div>
  );
}
