"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  id: string;
  title: string;
  price: string;
  category: string;
  seller: string;
  university: string;
  posted: string;
  image: string;
  goFree?: boolean;
  verified?: boolean;
};

export default function MarketplaceListingCard(listing: Props) {
  const { id, title, price, category, seller, university, posted, image, goFree, verified } = listing;
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchFavorite = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", id)
        .single();
      if (!mounted) return;
      if (data && !error) {
        setSaved(true);
        setFavId((data as any).id);
      } else {
        setSaved(false);
        setFavId(null);
      }
    };

    void fetchFavorite();
    return () => {
      mounted = false;
    };
  }, [user, id]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return; // optionally prompt login

    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    if (!saved) {
      // optimistic
      setSaved(true);
      const { data, error } = await supabase.from("favorites").insert([{ user_id: user.id, listing_id: id }]).select().single();
      if (error) {
        setSaved(false);
      } else if (data) {
        setFavId((data as any).id);
      }
    } else {
      // optimistic
      setSaved(false);
      if (favId) {
        const { error } = await supabase.from("favorites").delete().eq("id", favId).eq("user_id", user.id);
        if (error) {
          setSaved(true);
        } else {
          setFavId(null);
        }
      } else {
        // fallback: try delete by user/listing
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", id);
        if (error) {
          setSaved(true);
        }
      }
    }

    setLoading(false);
  };

  return (
    <Link href={`/marketplace/${id}`} className="block">
      <article className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-md">
        <div className="group relative h-64 w-full overflow-hidden">
          <img src={image} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />

          <button
            onClick={toggleSave}
            aria-pressed={saved}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-sm hover:bg-white"
            title={saved ? "Unsave" : "Save"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={saved ? "text-rose-600" : "text-slate-700"}>
              <path d="M12 21s-7-4.35-9.07-6.28C1.63 12.9 3.6 8.5 7 6.5 9.02 5 11.5 6 12 7.5c.5-1.5 2.98-2.5 5-1 3.4 2 5.37 6.4 4.07 8.22C19 16.65 12 21 12 21z" fill={saved ? "#FB7185" : "#374151"} />
            </svg>
          </button>

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {goFree && <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">Go Free</span>}
            {verified && <span className="rounded-full bg-slate-950/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">Verified</span>}
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">{category}</span>
            <span className="text-sm font-semibold text-slate-900">{price}</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            <p className="text-sm leading-6 text-slate-600">{seller} · {university}</p>
          </div>
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>{verified ? "Verified seller" : "Community seller"}</span>
            <span>{posted}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
