"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { startConversation as startConversationAction } from "@/lib/messages/startConversation";
import { useToast } from "@/components/ui/ToastProvider";


type Props = {
  id: string;
  title: string;
  price: string;
  category: string;
  custom_category?: string | null;
  seller: string;
  university: string;
  posted: string;
  image: string;
  user_id?: string;
  goFree?: boolean;
  verified?: boolean;
};

export default function MarketplaceListingCard(listing: Props) {
  const { id, title, price, category, custom_category, seller, university, posted, image, user_id, goFree, verified } = listing;
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const isOwnListing = Boolean(user?.id && user_id && user.id === user_id);

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
        .maybeSingle();
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

  const toggleSave = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    if (!saved) {
      setSaved(true);
      const { data, error } = await supabase.from("favorites").insert([{ user_id: user.id, listing_id: id }]).select().single();
      if (error) {
        setSaved(false);
      } else if (data) {
        setFavId((data as any).id);
      }
    } else {
      setSaved(false);
      if (favId) {
        const { error } = await supabase.from("favorites").delete().eq("id", favId).eq("user_id", user.id);
        if (error) {
          setSaved(true);
        } else {
          setFavId(null);
        }
      } else {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", id);
        if (error) setSaved(true);
      }
    }

    setLoading(false);
  };

  const { toast } = useToast();

  const handleMessageSeller = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setConversationError(null);

    if (!user) {
      router.push("/login");
      return;
    }

    const listingId = id;
    const sellerId = user_id;

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
    <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/marketplace/${id}`} className="group relative block h-64 w-full overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105" 
          onError={(event) => {
            event.currentTarget.src = "/placeholder-listing.svg";
          }}
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {goFree && <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">Go Free</span>}
        </div>
        {verified && (
          <span
            title="Verified student seller"
            className="absolute right-[4.5rem] top-4 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur"
          >
            <span aria-hidden="true">✓</span>
            <span>Verified</span>
          </span>
        )}
      </Link>

      <button
        onClick={toggleSave}
        disabled={loading}
        aria-pressed={saved}
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-sm hover:bg-white disabled:opacity-60"
        title={saved ? "Unsave" : "Save"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={saved ? "text-rose-600" : "text-slate-700"}>
          <path d="M12 21s-7-4.35-9.07-6.28C1.63 12.9 3.6 8.5 7 6.5 9.02 5 11.5 6 12 7.5c.5-1.5 2.98-2.5 5-1 3.4 2 5.37 6.4 4.07 8.22C19 16.65 12 21 12 21z" fill={saved ? "#FB7185" : "#374151"} />
        </svg>
      </button>

      <div className="flex flex-1 flex-col space-y-4 p-6">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            {category === "tickets" ? "🎟 Tickets" : custom_category ? `Other: ${custom_category}` : category}
          </span>
          <span className="text-sm font-semibold text-slate-900">{price}</span>
        </div>
        <div className="space-y-2">
          <Link href={`/marketplace/${id}`} className="block text-xl font-semibold text-slate-950 hover:underline">
            {title}
          </Link>
          <div className="flex min-w-0 items-center gap-1 text-sm text-slate-600">
            <span className="truncate">{seller}</span>
            <span>·</span>
            <span className="truncate">{university}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
          <span>{verified ? "Verified seller" : "Community seller"}</span>
          <span>{posted}</span>
        </div>

        <div className="mt-auto grid grid-cols-1 gap-2">
          <Link
            href={`/marketplace/${id}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={handleMessageSeller}
            disabled={isOwnListing || openingChat}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {isOwnListing ? "Your listing" : openingChat ? "Opening..." : "Message Seller"}
          </button>
        </div>

        {conversationError ? <p className="text-sm text-rose-600">{conversationError}</p> : null}
      </div>
    </article>
  );
}
