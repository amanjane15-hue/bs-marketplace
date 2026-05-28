"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Listing } from "@/data/mock-listings";
import ProfileCard from "@/components/profile/ProfileCard";

export default function ListingInfo({ id, title, price, category, seller, university, posted, user_id }: Listing) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchFav = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("listing_id", id).single();
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

  // fetch seller profile and stats if listing has user_id
  const [sellerProfile, setSellerProfile] = useState<any | null>(null);
  const [sellerStats, setSellerStats] = useState<{ listingCount: number; joinedAt?: string } | null>(null);
  useEffect(() => {
    if (!user_id) return;
    let mounted = true;
    const fetchSeller = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name,avatar_url,university,created_at")
          .eq("user_id", user_id)
          .single();

        const { data: listings, error, count } = await supabase
          .from("listings")
          .select("id", { count: "exact" })
          .eq("user_id", user_id);

        if (!mounted) return;
        if (profile) setSellerProfile(profile as any);
        setSellerStats({ listingCount: (count as number) || (Array.isArray(listings) ? listings.length : 0), joinedAt: profile?.created_at });
      } catch (e) {
        // ignore
      }
    };
    void fetchSeller();
    return () => {
      mounted = false;
    };
  }, [user_id]);

  const toggleSave = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!saved) {
      setSaved(true);
      const { data, error } = await supabase.from("favorites").insert([{ user_id: user.id, listing_id: id }]).select().single();
      if (error) setSaved(false);
      if (data) setFavId((data as any).id);
    } else {
      setSaved(false);
      if (favId) {
        const { error } = await supabase.from("favorites").delete().eq("id", favId).eq("user_id", user.id);
        if (error) setSaved(true);
        else setFavId(null);
      } else {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", id);
        if (error) setSaved(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">{category}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">{university}</span>
            <span className="text-sm text-slate-500">{posted}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-2xl font-bold text-slate-950">{price}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSave}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {saved ? "Saved" : "Save"}
            </button>
            <Link href={`#contact`} className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Contact seller</Link>
          </div>
        </div>
      </div>

      <div className="prose max-w-none text-slate-700">
        <h3 className="text-lg font-semibold">Details</h3>
        <p>
          This is a mock listing description to demonstrate layout and spacing. The real listing description will include condition, included items, pickup options, and any notes from the seller. For now this content is placeholder text to show the design.
        </p>
      </div>

      {sellerProfile && (
        <div className="mt-6">
          <ProfileCard
            displayName={sellerProfile.display_name}
            avatarUrl={sellerProfile.avatar_url}
            university={sellerProfile.university}
            bio={sellerProfile.bio}
            userId={user_id ?? null}
            createdAt={sellerProfile.created_at}
            listingCount={sellerStats?.listingCount ?? 0}
          />
          <div className="mt-3 text-sm text-slate-500">See more from this seller: <Link href={`/profile/${user_id}`} className="text-slate-900 underline">View profile</Link></div>
        </div>
      )}
    </div>
  );
}
