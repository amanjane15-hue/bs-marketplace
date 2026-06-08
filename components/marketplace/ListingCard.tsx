"use client";

import React, { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { startConversation as startConversationAction } from "@/lib/messages/startConversation";
import { useToast } from "@/components/ui/ToastProvider";
import type { Listing } from "@/types/marketplace";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

type Props = {
  item: Listing;
};

export default function ListingCard({ item }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [openingChat, setOpeningChat] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const sellerId = item.user_id;
  const isOwnListing = Boolean(user?.id && sellerId && user.id === sellerId);

  const { toast } = useToast();

  const handleMessageSeller = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setConversationError(null);

    if (!user) {
      router.push("/login");
      return;
    }

    const listingId = item.id;

    if (!sellerId) {
      setConversationError("Seller unavailable.");
      return;
    }

    if (user.id === sellerId) {
      return;
    }

    try {
      setOpeningChat(true);

      const conversationId = await startConversationAction({
        listingId,
        sellerId,
        userId: user.id,
      });

      if (!conversationId) {
        throw new Error("Unable to start conversation.");
      }

      router.push(`/dashboard/messages/${conversationId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to start conversation.";
      setConversationError(msg);
      toast(msg, "error");
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">
      <Link href={`/marketplace/${item.id}`} className="block relative">
        <div className="relative w-full overflow-hidden">
          <img 
            src={item.image} 
            alt={item.title} 
            className="h-64 w-full object-cover transition duration-300 hover:scale-105" 
            onError={(event) => {
              event.currentTarget.src = "/placeholder-listing.svg";
            }}
          />
          {item.goFree && (
            <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
              Go Free
            </span>
          )}
          {item.verified && (
            <span
              title="Verified student seller"
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur"
            >
              <span aria-hidden="true">✓</span>
              <span>Verified</span>
            </span>
          )}
        </div>
      </Link>

      <div className="space-y-4 p-5 flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className="inline-flex rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {item.category}
          </span>
          <span className={item.goFree ? "text-base font-bold text-emerald-700" : "text-base font-bold text-slate-950"}>
            {item.goFree ? "Free" : item.price}
          </span>
        </div>

        <Link href={`/marketplace/${item.id}`} className="block">
          <h3 className="text-xl font-semibold text-slate-950 hover:underline line-clamp-2">
            {item.title}
          </h3>
        </Link>

        <div className="text-sm text-slate-600 mt-1">
          <div className="flex items-center gap-1.5 truncate">
            {item.user_id ? (
              <Link href={`/profile/${item.user_id}`} className="font-medium hover:underline text-slate-900">
                {item.seller}
              </Link>
            ) : (
              <span className="font-medium text-slate-900">{item.seller}</span>
            )}
            <span>·</span>
            <span className="truncate">{item.university}</span>
          </div>
          <div className="mt-1">{item.posted}</div>
        </div>

        <div className="mt-auto pt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href={`/marketplace/${item.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={handleMessageSeller}
            disabled={isOwnListing || openingChat}
            className={
              isOwnListing
                ? "inline-flex flex-1 cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                : "inline-flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
            }
          >
            {isOwnListing ? "Your Listing" : openingChat ? "Opening..." : "Message Seller"}
          </button>
        </div>

        {conversationError && (
          <p className="mt-1 text-sm text-rose-600">{conversationError}</p>
        )}
      </div>
    </article>
  );
}
