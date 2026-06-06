"use client";

import React, { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Listing } from "../../data/mock-listings";

type Props = {
  item: Listing;
};

export default function ListingCard({ item }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [startingConversation, setStartingConversation] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const sellerId = item.user_id;
  const isOwnListing = Boolean(user?.id && sellerId && user.id === sellerId);

  async function startConversation(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setConversationError(null);

    if (!user) {
      router.push("/login");
      return;
    }

    if (!sellerId) {
      setConversationError("Seller unavailable.");
      return;
    }

    if (user.id === sellerId) {
      return;
    }

    setStartingConversation(true);
    const supabase = getSupabaseBrowserClient();

    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", item.id)
      .eq("buyer_id", user.id)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (existingError) {
      console.error(existingError);
      setConversationError("Unable to open conversation.");
      setStartingConversation(false);
      return;
    }

    if (existing?.id) {
      router.push(`/dashboard/messages?conversation=${existing.id}`);
      return;
    }

    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert([{ listing_id: item.id, buyer_id: user.id, seller_id: sellerId }])
      .select("id")
      .single();

    if (createError || !created?.id) {
      console.error(createError);
      setConversationError("Unable to start conversation.");
      setStartingConversation(false);
      return;
    }

    router.push(`/dashboard/messages/${created.id}`);
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">
      <Link href={`/marketplace/${item.id}`} className="block relative">
        <div className="relative w-full overflow-hidden">
          <img src={item.image} alt={item.title} className="h-64 w-full object-cover transition duration-300 hover:scale-105" />
          {item.goFree && (
            <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
              Go Free
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
            {item.verified && (
              <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2L15 8l6 1-4.5 4 1 6L12 17l-5.5 2 1-6L3 9l6-1 3-6z" />
              </svg>
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
            onClick={startConversation}
            disabled={isOwnListing || startingConversation}
            className={
              isOwnListing
                ? "inline-flex flex-1 cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                : "inline-flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
            }
          >
            {isOwnListing ? "Your Listing" : startingConversation ? "Opening..." : "Message Seller"}
          </button>
        </div>

        {conversationError && (
          <p className="mt-1 text-sm text-rose-600">{conversationError}</p>
        )}
      </div>
    </article>
  );
}
