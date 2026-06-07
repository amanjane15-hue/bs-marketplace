"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import StarRating from "./StarRating";
import Image from "next/image";

type Review = {
  id: string;
  listing_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  rating: number;
  review_text: string | null;
  rating_direction: string;
  created_at: string;
  updated_at: string;
};

type ReviewsListProps = {
  userId: string;
};

export default function ReviewsList({ userId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("get_profile_reviews", {
        p_user_id: userId,
        p_limit: 20,
        p_offset: 0,
      });

      if (!error && data) {
        setReviews(data as Review[]);
      }
      setLoading(false);
    }

    void loadReviews();

    // Listen for new reviews being added to this user
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("public:transaction_ratings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transaction_ratings",
          filter: `reviewee_id=eq.${userId}`,
        },
        () => {
          // simple refetch on any change
          void loadReviews();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-3 bg-slate-200 rounded w-1/6" />
              <div className="h-16 bg-slate-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-slate-500">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-4">
          <div className="shrink-0">
            {review.reviewer_avatar_url ? (
              <Image
                src={review.reviewer_avatar_url}
                alt={review.reviewer_name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-semibold text-slate-900 text-sm">{review.reviewer_name}</h4>
              <span className="text-xs text-slate-500">
                {new Date(review.updated_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="mb-2">
              <StarRating value={review.rating} size="sm" />
            </div>
            {review.review_text && (
              <p className="text-slate-700 text-sm whitespace-pre-wrap break-words leading-relaxed">
                {review.review_text}
              </p>
            )}
            <div className="mt-2 inline-block px-2 py-1 bg-slate-100 rounded-md text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {review.rating_direction === "buyer_to_seller" ? "Buyer" : "Seller"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
