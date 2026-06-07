"use client";

import React, { useState } from "react";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function StarRating({
  value,
  onChange,
  editable = false,
  size = "md",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }[size];

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div
      className={`inline-flex items-center ${editable ? "gap-1" : "gap-0.5"}`}
      role={editable ? "radiogroup" : "img"}
      aria-label={editable ? "Rate transaction" : `${value} out of 5 stars`}
    >
      {stars.map((star) => {
        const isFilled = (hoverValue ?? value) >= star;
        const starIcon = (
          <svg
            className={`${starSizeClass} ${
              isFilled ? "text-amber-400" : "text-slate-200"
            } transition-colors`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );

        if (editable) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              onFocus={() => setHoverValue(star)}
              onBlur={() => setHoverValue(null)}
              className="rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition"
            >
              {starIcon}
            </button>
          );
        }

        return <span key={star}>{starIcon}</span>;
      })}
    </div>
  );
}
