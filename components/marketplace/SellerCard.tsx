"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { startConversation } from "@/lib/messages/startConversation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SellerCard({
  listingId,
  sellerId,
  seller,
  sellerAvatar,
  university,
  verified,
}: {
  listingId: string;
  sellerId?: string;
  seller: string;
  sellerAvatar?: string | null;
  university: string;
  verified?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [startingChat, setStartingChat] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const isOwnListing = !!user && !!sellerId && user.id === sellerId;

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchFav = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("listing_id", listingId).single();
      if (!mounted) return;
      if (data) {
        setSaved(true);
        setFavId((data as any).id);
      }
    };
    void fetchFav();
    return () => {
      mounted = false;
    };
  }, [user, listingId]);

  const toggleSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    if (!saved) {
      setSaved(true);
      const { data, error } = await supabase.from("favorites").insert([{ user_id: user.id, listing_id: listingId }]).select().single();
      if (error) setSaved(false);
      if (data) setFavId((data as any).id);
    } else {
      setSaved(false);
      if (favId) {
        const { error } = await supabase.from("favorites").delete().eq("id", favId).eq("user_id", user.id);
        if (error) setSaved(true);
        else setFavId(null);
      } else {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
        if (error) setSaved(true);
      }
    }
    setSaving(false);
  };

  const handleMessageSeller = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!sellerId || isOwnListing) return;

    setStartingChat(true);
    try {
      const convId = await startConversation({
        listingId,
        sellerId,
        currentUserId: user.id,
      });
      router.push(`/dashboard/messages/${convId}`);
    } catch (e) {
      console.error(e);
      alert("Failed to open conversation. Please try again.");
      setStartingChat(false);
    }
  };

  return (
    <aside className="sticky top-6 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 flex-shrink-0">
          {sellerAvatar ? (
            <img src={sellerAvatar} alt={seller} className="h-full w-full object-cover" />
          ) : (
            <svg className="h-full w-full text-slate-400 p-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-base font-bold text-slate-950">{seller}</div>
            {verified && <div className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Verified</div>}
          </div>
          <div className="truncate text-sm text-slate-500">{university}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <button
          onClick={handleMessageSeller}
          disabled={isOwnListing || startingChat}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
            isOwnListing
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          }`}
        >
          {isOwnListing ? "Your listing" : startingChat ? "Opening..." : "Message seller"}
        </button>

        <button
          onClick={toggleSave}
          disabled={saving}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {saved ? "Saved" : "Save listing"}
        </button>
        
        {sellerId && (
          <Link
            href={`/profile/${sellerId}`}
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View profile
          </Link>
        )}
      </div>
    </aside>
  );
}
