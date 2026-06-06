"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import CollegeCombobox from "@/components/ui/CollegeCombobox";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice, safePrice } from "@/lib/utils/formatPrice";

type DashboardListing = {
  id: string;
  title: string;
  price: number | null;
  category: string;
  condition: string;
  university: string;
  description: string | null;
  is_free: boolean;
  image_urls: string[] | null;
  created_at: string | null;
  custom_category?: string | null;
};

const categories = [
  { value: "tickets", label: "Tickets" },
  { value: "electronics", label: "Electronics" },
  { value: "textbooks", label: "Textbooks" },
  { value: "furniture", label: "Furniture" },
  { value: "clothing", label: "Clothing" },
  { value: "other", label: "Other" },
];

const conditions = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function DashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [savedListings, setSavedListings] = useState<DashboardListing[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<DashboardListing | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DashboardListing | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();

      const { data, error: fetchError } = await supabase
        .from("listings")
        .select(
          "id,title,price,category,custom_category,condition,university,description,is_free,image_urls,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Dashboard listings fetch error:", fetchError.message);
        setError(fetchError.message || "Unable to load your listings.");
        setListings([]);
      } else {
        const normalized = (data ?? []).map((row: any) => ({
          ...(row as DashboardListing),
          price: safePrice(row.price),
        }));
        setListings(normalized as DashboardListing[]);
      }

      setLoading(false);
    };

    const fetchSaved = async () => {
      if (!user) {
        setLoadingSaved(false);
        return;
      }

      setLoadingSaved(true);

      const supabase = getSupabaseBrowserClient();

      const { data, error: savedError } = await supabase
        .from("favorites")
        .select(
          `
          id,
          listing_id,
          created_at,
          listings (
            id,
            title,
            price,
            category,
            custom_category,
            condition,
            university,
            description,
            is_free,
            image_urls,
            created_at
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (savedError) {
        console.error("Saved listings fetch error:", savedError.message);
        setSavedListings([]);
      } else {
        const mapped = ((data ?? []) as any[])
          .filter((row) => row.listings)
          .map((row) => ({
            id: row.listings.id,
            title: row.listings.title ?? "Untitled",
            price: safePrice(row.listings.price),
            category: row.listings.category ?? "other",
            custom_category: row.listings.custom_category,
            condition: row.listings.condition ?? "good",
            university: row.listings.university ?? "",
            description: row.listings.description ?? null,
            is_free: Boolean(row.listings.is_free),
            image_urls: row.listings.image_urls ?? null,
            created_at: row.listings.created_at ?? null,
          }));

        setSavedListings(mapped as DashboardListing[]);
      }

      setLoadingSaved(false);
    };

    void fetchListings();
    void fetchSaved();
  }, [user]);

  const handleEditOpen = (listing: DashboardListing) => setEditing(listing);
  const handleEditClose = () => setEditing(null);

  const handleSave = async () => {
    if (!editing || !user) return;

    setSaving(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();

    const { data, error: updateError } = await supabase
      .from("listings")
      .update({
        title: editing.title,
        price: editing.price,
        category: editing.category,
        custom_category: editing.custom_category,
        condition: editing.condition,
        university: editing.university,
        description: editing.description,
        is_free: editing.is_free,
      })
      .eq("id", editing.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Listing update error:", updateError.message);
      setError(updateError.message || "Failed to save listing.");
    } else if (data) {
      setListings((current) =>
        current.map((item) =>
          item?.id === editing.id
            ? ({
                ...item,
                ...(data as any),
                price: safePrice((data as any).price),
              } as DashboardListing)
            : item
        )
      );
      toast?.success("Listing updated successfully");
      setEditing(null);
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;

    setDeleting(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();

    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Listing delete error:", deleteError.message);
      setError(deleteError.message || "Failed to delete listing.");
    } else {
      setListings((current) => current.filter((item) => item?.id !== deleteTarget.id));
      toast?.success("Listing deleted");
      setDeleteTarget(null);
    }

    setDeleting(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Manage your listings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Edit or remove listings that belong to your account.
            </p>
          </div>

          <Link
            href="/create-listing"
            className="inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create new listing
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-56 animate-pulse rounded-3xl bg-slate-100 p-6" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {listings.map((listing) => listing && (
              <div
                key={listing.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {listing.category === "tickets" 
                        ? "🎟 Tickets" 
                        : listing.custom_category 
                          ? `Other: ${listing.custom_category}` 
                          : listing.category}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 uppercase tracking-wide">{listing.condition} • {listing.university}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{listing.title}</h2>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-950">
                      {listing.is_free ? "₹0" : listing.price != null ? formatPrice(listing.price) : "₹0"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {listing.description ?? "No description provided."}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/marketplace/${listing.id}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    View
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleEditOpen(listing)}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(listing)}
                    className="inline-flex items-center rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/70">
            <p className="text-lg font-semibold text-slate-950">No listings yet</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Create your first listing to start selling items.
            </p>

            <Link
              href="/create-listing"
              className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create listing
            </Link>
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-slate-950">Saved Listings</h2>

          {loadingSaved ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-56 animate-pulse rounded-3xl bg-slate-100 p-6" />
              ))}
            </div>
          ) : savedListings.length > 0 ? (
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {savedListings.map((s) => s && (
                <Link
                  key={s.id}
                  href={`/marketplace/${s.id}`}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {s.category === "tickets" ? "🎟 Tickets" : s.custom_category ? `Other: ${s.custom_category}` : s.category}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">{s.title}</h3>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-950">
                        {s.is_free ? "₹0" : s.price != null ? formatPrice(s.price) : "₹0"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {s.description ?? "No description provided."}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">You haven't saved any listings yet.</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Edit listing</h2>
                <p className="mt-1 text-sm text-slate-600">Update your listing details.</p>
              </div>

              <button
                type="button"
                onClick={handleEditClose}
                className="text-slate-500 transition hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input
                  value={editing.title}
                  onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Price
                <input
                  value={editing.price ?? ""}
                  type="number"
                  min="0"
                  step="0.01"
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      price: event.target.value ? parseFloat(event.target.value) : null,
                    })
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Category
                <select
                  value={editing.category}
                  onChange={(event) => setEditing({ ...editing, category: event.target.value })}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {categories.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {editing.category === "other" && (
                <label className="block text-sm font-medium text-slate-700">
                  Other Category
                  <input
                    value={editing.custom_category ?? ""}
                    onChange={(event) => setEditing({ ...editing, custom_category: event.target.value })}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Condition
                <select
                  value={editing.condition}
                  onChange={(event) => setEditing({ ...editing, condition: event.target.value })}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {conditions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                University
                <CollegeCombobox
                  value={editing.university}
                  onChange={(val) => setEditing({ ...editing, university: val })}
                  required
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={editing.description ?? ""}
                onChange={(event) =>
                  setEditing({ ...editing, description: event.target.value })
                }
                rows={4}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="mt-4 inline-flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={editing.is_free}
                onChange={(event) =>
                  setEditing({ ...editing, is_free: event.target.checked })
                }
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Offer this item as Go Free
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleEditClose}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-950">Delete listing</h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Are you sure you want to delete "{deleteTarget.title}"? This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {deleting ? "Deleting..." : "Delete listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}