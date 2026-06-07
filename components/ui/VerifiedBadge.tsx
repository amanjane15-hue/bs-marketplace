import React from "react";

type VerifiedBadgeProps = {
  compact?: boolean;
};

export default function VerifiedBadge({
  compact = false,
}: VerifiedBadgeProps) {
  return (
    <span
      title="Verified student"
      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
    >
      <span aria-hidden="true">✓</span>
      {!compact && <span>Verified student</span>}
    </span>
  );
}
