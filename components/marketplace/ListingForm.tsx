"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import FormTextarea from "@/components/ui/FormTextarea";
import CollegeCombobox from "@/components/ui/CollegeCombobox";
import ImageUploader from "@/components/ui/ImageUploader";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";
import { aktuColleges } from "@/data/aktu-colleges";

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



export default function ListingForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [customCategory, setCustomCategory] = useState("");
  const [condition, setCondition] = useState(conditions[2].value);
  const [university, setUniversity] = useState(aktuColleges[0].value);
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isGoFree, setIsGoFree] = useState(false);
  const [createdListing, setCreatedListing] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    console.log("[ListingForm] Submit started", { user });

    if (!user) {
      setErrorMessage("You must be signed in to create a listing.");
      setSubmitting(false);
      return;
    }

    if (category === "other" && !customCategory.trim()) {
      setErrorMessage("Please enter a custom category.");
      setSubmitting(false);
      return;
    }
    
    if (category === "other" && customCategory.length > 50) {
      setErrorMessage("Custom category must be 50 characters or less.");
      setSubmitting(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();

      const insertPayload = {
        title: title.trim(),
        price: price === "" ? null : parseFloat(price),
        description: description.trim(),
        category,
        custom_category: category === "other" ? customCategory.trim() : null,
        condition,
        university,
        contact: contact.trim(),
        is_free: isGoFree,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        user_id: user.id,
      } as const;

      console.log("[ListingForm] Insert payload:", insertPayload);

      // @ts-ignore: bypass Supabase row typing for insert payload
      const { data, error } = await supabase.from("listings").insert([insertPayload] as any).select();

      console.log("[ListingForm] Supabase response:", { data, error });

      if (error) {
        console.error("[ListingForm] Supabase error details:", error);
        throw error;
      }

      const created = Array.isArray(data) && data.length > 0 ? data[0] : null;
      console.log("[ListingForm] Created listing:", created);
      setCreatedListing(created);

      toast("✓ Listing created successfully", "success");
      
      // Redirect to the new listing after a short delay
      if (created?.id) {
        setTimeout(() => {
          router.push(`/marketplace/${created.id}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error("[ListingForm] Exception caught:", err);
      setErrorMessage(err?.message ?? String(err));
      toast("✕ Failed to create listing", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-28 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Sell with B&amp;S</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Create a new listing.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Share the details of your item with students on campus. Keep it clear, visual, and easy to contact.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Your listing will be created for your account.
          </div>
        </div>
      </div>

      <form id="create-listing-form" onSubmit={handleSubmit} className="space-y-6 pt-6">
        {errorMessage ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900 shadow-sm">
            <p className="font-semibold">Error</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        ) : null}

        {createdListing ? (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 shadow-sm">
            <p className="font-semibold">Listing published</p>
            <p className="mt-1">Your listing has been published successfully.</p>
            <p className="mt-2">
              <a href={`/marketplace/${createdListing.id}`} className="font-semibold text-emerald-900 underline">
                View listing
              </a>
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Title"
            name="title"
            placeholder="e.g. Campus desk lamp"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <FormInput
            label="Price"
            name="price"
            type="number"
            placeholder="e.g. 35"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4">
            <FormSelect
              label="Category"
              name="category"
              options={categories}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            />
            {category === "other" && (
              <FormInput
                label="Custom category"
                name="customCategory"
                placeholder="e.g., Lab coat, calculator, cycle accessories"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                required
              />
            )}
          </div>
          <FormSelect
            label="Condition"
            name="condition"
            options={conditions}
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            required
          />
          <CollegeCombobox
            value={university}
            onChange={setUniversity}
            required
          />
        </div>

        <FormTextarea
          label="Description"
          name="description"
          placeholder="Share the condition, wear, and best use for your item."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          helperText="A strong description helps students buy with confidence."
          required
        />

        <ImageUploader
          onUploadComplete={(urls) => setImageUrls(urls)}
          onUploadingChange={(v) => setUploadingImage(v)}
        />

        <div className="grid gap-4 lg:grid-cols-[1.75fr_1fr]">
          <FormInput
            label="Contact"
            name="contact"
            type="email"
            placeholder="jane@student.edu"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            helperText="Students will use this to reach you about the item."
            required
          />
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Go Free</p>
                <p className="mt-1 text-sm text-slate-600">Offer this item as a donation instead of a sale.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isGoFree}
                  onChange={(event) => setIsGoFree(event.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full border border-slate-300 bg-slate-200 transition peer-checked:bg-emerald-600"></div>
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </label>
            </div>
          </div>
        </div>

        <div className="hidden sm:block">
          <button
            type="submit"
            disabled={submitting || uploadingImage || !!createdListing}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
              {createdListing ? "Listing published ✓" : submitting ? "Creating listing..." : uploadingImage ? "Uploading image..." : "Publish listing"}
          </button>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-16px_30px_rgba(15,23,42,0.12)] sm:hidden">
        <button
          type="submit"
          form="create-listing-form"
          disabled={submitting || uploadingImage || !!createdListing}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {createdListing ? "Listing published ✓" : submitting ? "Creating listing..." : uploadingImage ? "Uploading image..." : "Publish listing"}
        </button>
      </div>
    </section>
  );
}
