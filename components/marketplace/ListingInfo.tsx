"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import ProfileCard from "@/components/profile/ProfileCard";
import { useRouter } from "next/navigation";
import ReportModal from "@/components/marketplace/ReportModal";
import { startConversation } from "@/lib/messages/startConversation";
import { useToast } from "@/components/ui/ToastProvider";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import RatingModal from "@/components/ratings/RatingModal";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value?: string | null) {
  return Boolean(value && UUID_REGEX.test(value));
}

export type ListingInfoProps = {
  id: string;
  title: string;
  price: string;
  category: string;
  seller: string;
  university: string;
  posted: string;
  user_id?: string;
  description?: string;
  sellerAvatar?: string | null;
  sellerJoinedAt?: string | null;
  sellerUniversity?: string | null;
  verified?: boolean;
  listing_status?: string;
  averageRating?: number;
  totalRatings?: number;
  soldTo?: string | null;
  soldBy?: string | null;
  myRating?: number;
  myReview?: string | null;
};

export default function ListingInfo({
  id,
  title,
  price,
  category,
  seller,
  university,
  posted,
  user_id,
  description,
  sellerAvatar,
  sellerJoinedAt,
  sellerUniversity,
  verified,
  listing_status = "active",
  averageRating = 0,
  totalRatings = 0,
  soldTo,
  soldBy,
  myRating = 0,
  myReview = "",
}: ListingInfoProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [justRemoved, setJustRemoved] = useState(false);
  const { toast } = useToast();

  const isOwnListing = !!user && !!user_id && user.id === user_id;
  const isBuyer = !!user && !!soldTo && user.id === soldTo;

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [currentMyRating, setCurrentMyRating] = useState(myRating || 0);
  const [currentMyReview, setCurrentMyReview] = useState(myReview || "");

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchFav = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("listing_id", id).maybeSingle();
      if (!mounted) return;
      if (data) {
        setSaved(true);
        setFavId((data as any).id);
      } else {
        setSaved(false);
        setFavId(null);
      }
    };
    void fetchFav();
    return () => {
      mounted = false;
    };
  }, [user, id]);

  const [sellerListingCount, setSellerListingCount] = useState(0);
  useEffect(() => {
    if (!user_id) return;
    let mounted = true;
    const fetchSellerStats = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { count } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user_id);
        if (!mounted) return;
        setSellerListingCount(count || 0);
      } catch (e) {
        // ignore
      }
    };
    void fetchSellerStats();
    return () => {
      mounted = false;
    };
  }, [user_id]);

  const toggleSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setJustRemoved(false);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!saved) {
        setSaved(true);
        const { data, error } = await supabase.from("favorites").insert([{ user_id: user.id, listing_id: id }]).select().single();
        if (error) {
          setSaved(false);
          throw error;
        }
        if (data) {
          setFavId((data as any).id);
        }
        toast("✓ Listing saved", "success");
      } else {
        setSaved(false);
        setJustRemoved(true);
        if (favId) {
          const { error } = await supabase.from("favorites").delete().eq("id", favId).eq("user_id", user.id);
          if (error) {
            setSaved(true);
            setJustRemoved(false);
            throw error;
          }
          else setFavId(null);
        } else {
          const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", id);
          if (error) {
            setSaved(true);
            setJustRemoved(false);
            throw error;
          }
        }
        toast("✓ Listing removed", "success");
      }
    } catch (e: any) {
      toast("✕ Failed to save listing", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user_id || isOwnListing) return;

    setStartingChat(true);
    try {
      const convId = await startConversation({
        listingId: id,
        sellerId: user_id,
        currentUserId: user.id,
      });
      router.push(`/dashboard/messages/${convId}`);
    } catch (e: any) {
      console.error(e);
      const err = e?.message || "Failed to open conversation";
      toast(err, "error");
      setStartingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">{category}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">{university}</span>
            {verified && <VerifiedBadge compact />}
            <span className="text-sm text-slate-500">{posted}</span>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-3">
          <div className="text-2xl font-bold text-slate-950">
            {listing_status === 'sold' && (
              <span className="mr-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800 border border-slate-200 align-middle">
                Sold ✓
              </span>
            )}
            {price}
          </div>
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
            {listing_status === 'active' && (
              <>
                <button
                  onClick={toggleSave}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? "Saving..." : saved ? "Saved ✓" : justRemoved ? "Removed ✓" : "Save Listing"}
                </button>
                <button
                  id="message-seller-btn"
                  onClick={handleMessageSeller}
                  disabled={isOwnListing || startingChat}
                  className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    isOwnListing
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  }`}
                >
                  {isOwnListing ? "Your listing" : startingChat ? "Opening chat..." : "Message seller"}
                </button>
              </>
            )}
            {listing_status === 'sold' && (isOwnListing || isBuyer) && (
              <button
                onClick={() => setRatingModalOpen(true)}
                className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 lg:hidden"
              >
                {currentMyRating > 0 ? "Edit rating" : (isOwnListing ? "Rate buyer" : "Rate seller")}
              </button>
            )}
            {!isOwnListing && (
              <button
                id="open-report-modal-btn"
                onClick={() => setShowReport(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors"
                aria-label="Report this listing"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Report
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="prose max-w-none text-slate-700">
        <h3 className="text-lg font-semibold text-slate-950">Details</h3>
        <p className="whitespace-pre-wrap">
          {description || "No description provided."}
        </p>
      </div>

      {user_id && (
        <div className="mt-6 lg:hidden">
          <h3 className="text-lg font-semibold text-slate-950 mb-3">About the seller</h3>
          <ProfileCard
            displayName={seller}
            avatarUrl={sellerAvatar}
            university={sellerUniversity || university}
            userId={user_id}
            createdAt={sellerJoinedAt}
            listingCount={sellerListingCount}
            verified={verified}
            averageRating={averageRating}
            totalRatings={totalRatings}
          />
        </div>
      )}

      {showReport && (
        <ReportModal
          listingId={id}
          listingOwnerId={user_id}
          onClose={() => setShowReport(false)}
        />
      )}

      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        listingId={id}
        targetRole={isOwnListing ? "buyer" : "seller"}
        existingRating={currentMyRating}
        existingReview={currentMyReview}
        onSuccess={() => {
          if (!isValidUuid(id)) return;
          const supabase = getSupabaseBrowserClient();
          if (user) {
            supabase
              .from("transaction_ratings")
              .select("rating, review_text")
              .eq("listing_id", id)
              .eq("reviewer_id", user.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setCurrentMyRating(data.rating);
                  setCurrentMyReview(data.review_text);
                }
              });
          }
        }}
      />
    </div>
  );
}
