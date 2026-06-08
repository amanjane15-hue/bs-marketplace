"use client";

import React, { useState } from "react";


type Props = {
  images?: string[];
  image?: string;
  title: string;
};

export default function ListingGallery({ images, image, title }: Props) {
  const initial = images && images.length > 0 ? images : image ? [image] : [];
  const [active, setActive] = useState(0);

  if (initial.length === 0) {
    return (
      <div className="w-full">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="aspect-square flex w-full items-center justify-center text-sm text-slate-400 sm:aspect-auto sm:h-[520px]">No image</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <img src={initial[active]} alt={title} className="w-full aspect-square object-cover sm:aspect-auto sm:h-[520px]" />
      </div>

      {initial.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {initial.map((src, idx) => (
            <button
              key={src + idx}
              type="button"
              onClick={() => setActive(idx)}
              className={`overflow-hidden rounded-2xl ${idx === active ? "ring-2 ring-emerald-500" : ""}`}
            >
              <img src={src} alt={`${title} ${idx + 1}`} className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
