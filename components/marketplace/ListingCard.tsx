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

    router.push(`/dashboard/messages/${data.id}`);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/marketplace/${item.id}`} className="block">
        <div className="relative h-56 w-full overflow-hidden">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />

          {item.goFree && (
            <span className="absolute left-3 top-3 rounded-full bg-emerald-600/95 px-3 py-1 text-xs font-semibold text-white shadow">Go Free</span>
          )}

          <span className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-slate-900 shadow">
            <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            {item.price}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">{item.category}</span>
            <span className="text-sm font-semibold text-slate-900">{item.goFree ? "Free" : item.price}</span>
          </div>

          <Link href={`/marketplace/${item.id}`} className="mt-3 block text-base font-semibold text-slate-900 hover:underline">
            {item.title}
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-sm">
              {item.user_id ? (
                <Link href={`/profile/${item.user_id}`} className="relative z-10 font-medium text-slate-900 hover:underline">
                  {item.seller}
                </Link>
              ) : (
                <span className="font-medium">{item.seller}</span>
              )}
              {item.verified && (
                <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2L15 8l6 1-4.5 4 1 6L12 17l-5.5 2 1-6L3 9l6-1 3-6z" />
                </svg>
              )}
            </span>
            <span className="text-sm text-slate-400">-</span>
            <span className="max-w-[100px] truncate text-sm text-slate-600" title={item.university}>{item.university}</span>
          </div>

          <span className="whitespace-nowrap text-sm text-slate-500">{item.posted}</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href={`/marketplace/${item.id}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={startConversation}
            disabled={isOwnListing || startingConversation}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {isOwnListing ? "Your listing" : startingConversation ? "Opening..." : "Message Seller"}
          </button>
        </div>

        {conversationError ? <p className="mt-2 text-sm text-rose-600">{conversationError}</p> : null}
      </div>
    </article>
  );
}
