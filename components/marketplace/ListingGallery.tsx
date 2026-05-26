import React from "react";
import type { Listing } from "@/data/mock-listings";

export default function ListingGallery({ image, title }: Pick<Listing, "image" | "title">) {
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <img src={image} alt={title} className="w-full h-[420px] object-cover sm:h-[520px]" />
      </div>
    </div>
  );
}
