"use client";

import React, { useState, useEffect } from "react";
import StarRating from "./StarRating";
import { useToast } from "@/components/ui/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RatingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  targetRole: "buyer" | "seller";
  existingRating?: number;
  existingReview?: string | null;
  onSuccess: () => void;
};

export default function RatingModal({
  isOpen,
  onClose,
  listingId,
  targetRole,
  existingRating = 0,
  existingReview = "",
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating);
  const [review, setReview] = useState(existingReview || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setRating(existingRating);
      setReview(existingReview || "");
    }
  }, [isOpen, existingRating, existingReview]);

  if (!isOpen) return null;

  const isUpdate = existingRating > 0;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      showToast("Please select a star rating", "error");
      return;
    }

    if (review.length > 500) {
      showToast("Review cannot exceed 500 characters", "error");
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.rpc("submit_transaction_rating", {
      p_listing_id: listingId,
      p_rating: rating,
      p_review_text: review.trim() || null,
    });

    setIsSubmitting(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast(isUpdate ? "Rating updated successfully" : "Rating submitted successfully", "success");
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 id="rating-modal-title" className="text-lg font-semibold text-slate-900">
            Rate your transaction
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-slate-600 mb-6 text-sm">
            How was your experience with this {targetRole}?
          </p>

          <div className="flex justify-center mb-8">
            <StarRating value={rating} onChange={setRating} editable size="lg" />
          </div>

          <div className="space-y-2">
            <label htmlFor="review" className="block text-sm font-medium text-slate-700">
              Review (optional)
            </label>
            <textarea
              id="review"
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
              placeholder="Share your experience (max 500 characters)"
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-900 resize-none text-sm"
            />
            <div className="text-right text-xs text-slate-400">
              {review.length}/500
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
