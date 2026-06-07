import React from "react";
import StarRating from "./StarRating";

type RatingSummaryProps = {
  averageRating: number;
  totalRatings: number;
  className?: string;
  size?: "sm" | "md";
};

export default function RatingSummary({
  averageRating,
  totalRatings,
  className = "",
  size = "md",
}: RatingSummaryProps) {
  if (totalRatings === 0) {
    return (
      <div className={`text-slate-500 ${size === "sm" ? "text-xs" : "text-sm"} ${className}`}>
        No ratings yet
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <StarRating value={averageRating} size={size} />
      <span className={`font-medium text-slate-900 ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {averageRating.toFixed(1)}
      </span>
      <span className={`text-slate-500 ${size === "sm" ? "text-xs" : "text-sm"}`}>
        · {totalRatings} review{totalRatings !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
