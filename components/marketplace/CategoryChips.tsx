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
        className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
          !selected
            ? "bg-slate-950 text-white shadow-sm"
            : "bg-slate-100 text-slate-800 hover:bg-slate-200"
        }`}
      >
        All
      </button>

      {categories.map((c) => {
        const active = selected === c;
        return (
          <button
            key={c}
            onClick={() => onSelect(active ? null : c)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              active
                ? "bg-slate-950 text-white shadow-sm"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        );
      })}
    </div>
  );
}
