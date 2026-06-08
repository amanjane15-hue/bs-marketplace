"use client";

import React from "react";
import Link from "next/link";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import RatingSummary from "@/components/ratings/RatingSummary";

export default function SellerCard({
  sellerId,
  seller,
  sellerAvatar,
  university,
  verified,
  averageRating,
  totalRatings,
}: {
  sellerId?: string;
  seller: string;
  sellerAvatar?: string | null;
  university: string;
  verified?: boolean;
  averageRating?: number;
  totalRatings?: number;
}) {
  return (
    <aside className="sticky top-6 w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-bold text-slate-600">
          {sellerAvatar ? (
            <img
              src={sellerAvatar}
              alt={`${seller} profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>
              {seller?.trim()?.charAt(0)?.toUpperCase() || "S"}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-950">
              {seller}
            </h3>

            {verified && <VerifiedBadge />}
          </div>

          <p className="truncate text-sm text-slate-600">
            {university}
          </p>

          {totalRatings !== undefined && totalRatings > 0 && (
            <div className="mt-1 flex items-center">
              <RatingSummary averageRating={averageRating || 0} totalRatings={totalRatings} size="sm" />
            </div>
          )}
        </div>
      </div>

      {sellerId && (
        <Link
          href={`/profile/${sellerId}`}
          className="mt-5 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          View profile
        </Link>
      )}
    </aside>
  );
}
