"use client";

import React from "react";
import Link from "next/link";

type Props = {
  displayName?: string | null;
  avatarUrl?: string | null;
  university?: string | null;
  bio?: string | null;
  userId?: string | null;
  createdAt?: string | null;
  listingCount?: number;
};

export default function ProfileCard({ displayName, avatarUrl, university, bio, userId, createdAt, listingCount }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 flex-none overflow-hidden rounded-full bg-slate-100">
          {avatarUrl ? <img src={avatarUrl} alt={displayName ?? "Avatar"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xl font-semibold text-slate-600">{(displayName || "?").charAt(0)}</div>}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{displayName ?? "Seller"}</h2>
              {university && <p className="text-sm text-slate-600">{university}</p>}
            </div>
            {userId && (
              <Link href={`/profile/${userId}`} className="text-sm font-medium text-slate-900 underline">
                View profile
              </Link>
            )}
          </div>

          {bio && <p className="mt-3 text-sm text-slate-600">{bio}</p>}

          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <div>{listingCount ?? 0} listings</div>
            {createdAt && <div>Joined {new Date(createdAt).toLocaleDateString()}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
