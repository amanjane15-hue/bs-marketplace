"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const categories = [
  { value: "textbooks", label: "Textbooks" },
  { value: "electronics", label: "Electronics" },
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

const universities = [
  { value: "university-of-oregon", label: "University of Oregon" },
  { value: "oregon-state", label: "Oregon State University" },
  { value: "portland-state", label: "Portland State University" },
  { value: "pacific-university", label: "Pacific University" },
  { value: "other", label: "Other campus" },
];

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
};

export default function DashboardContent() {
  const { user } = useAuth();
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DashboardListing | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardListing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savedListings, setSavedListings] = useState<DashboardListing[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase
        .from("listings")
        .select("id,title,price,category,condition,university,description,is_free,image_urls,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message || "Unable to load your listings.");
      } else {
        setListings((data ?? []) as DashboardListing[]);
      }

      setLoading(false);
    };

    void fetchListings();
    // fetch saved listings
    const fetchSaved = async () => {
      if (!user) return;
      setLoadingSaved(true);
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("favorites")
        .select(`id, listing_id, created_at, listings(id,title,price,category,condition,university,description,is_free,image_urls,created_at)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = (data as any[]).map((row) => ({
          id: row.listings.id,
          title: row.listings.title,
          price: row.listings.price,
          category: row.listings.category,
          condition: row.listings.condition,
          university: row.listings.university,
          description: row.listings.description,
          is_free: row.listings.is_free,
          image_urls: row.listings.image_urls,
          created_at: row.listings.created_at,
        }));
        setSavedListings(mapped as DashboardListing[]);
      }
      setLoadingSaved(false);
    };

    void fetchSaved();
  }, [user]);

  const hasListings = listings.length > 0;

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
      setError(updateError.message || "Failed to save listing.");
    } else if (data) {
      setListings((current) => current.map((item) => (item.id === editing.id ? ({ ...item, ...data } as DashboardListing) : item)));
      setEditing({ ...editing, ...data } as DashboardListing);
      handleEditClose();
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
      setError(deleteError.message || "Failed to delete listing.");
    } else {
      setListings((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    }

    setDeleting(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Manage your listings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Edit or remove listings that belong to your account. Your latest updates are saved immediately.
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
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">{error}</div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl bg-slate-100 p-6 h-56" />
            ))}
          </div>
        ) : hasListings ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {listings.map((listing) => (
              <div key={listing.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{listing.category}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{listing.title}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-950">
                      {listing.is_free ? "$0" : listing.price != null ? `$${listing.price.toFixed(2)}` : "$0"}
                    </p>
                    <p className="text-sm text-slate-500">{listing.university}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{listing.description ?? "No description provided."}</p>

                <div className="mt-6 flex flex-wrap gap-3">
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
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70 text-center">
            <p className="text-lg font-semibold text-slate-950">No listings yet</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Create your first listing to start selling items to your campus community.
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
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-3xl bg-slate-100 p-6 h-56" />
              ))}
            </div>
          ) : savedListings.length > 0 ? (
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {savedListings.map((s) => (
                <div key={s.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{s.category}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">{s.title}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-950">{s.is_free ? "$0" : s.price != null ? `$${s.price.toFixed(2)}` : "$0"}</p>
                      <p className="text-sm text-slate-500">{s.university}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{s.description ?? "No description provided."}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">You haven't saved any listings yet.</p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Edit listing</h2>
                <p className="mt-1 text-sm text-slate-600">Update your listing details and save the changes.</p>
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
                    setEditing({ ...editing, price: event.target.value ? parseFloat(event.target.value) : null })
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
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
                <select
                  value={editing.university}
                  onChange={(event) => setEditing({ ...editing, university: event.target.value })}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {universities.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={editing.description ?? ""}
                onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                rows={4}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="mt-4 inline-flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={editing.is_free}
                onChange={(event) => setEditing({ ...editing, is_free: event.target.checked })}
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
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Modal */}
      {deleteTarget ? (
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
                className="inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
              >
                {deleting ? "Deleting..." : "Delete listing"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
