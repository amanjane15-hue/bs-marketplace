"use client";

import { useState, type FormEvent } from "react";
import FormInput from "@/components/ui/FormInput";
import FormSelect from "@/components/ui/FormSelect";
import FormTextarea from "@/components/ui/FormTextarea";
import ImageUploader from "@/components/ui/ImageUploader";

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

export default function ListingForm() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [condition, setCondition] = useState(conditions[2].value);
  const [university, setUniversity] = useState(universities[0].value);
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isGoFree, setIsGoFree] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    console.log({ title, price, category, condition, university, description, contact, images, isGoFree });
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
            Mock listing flow · no backend needed
          </div>
        </div>
      </div>

      <form id="create-listing-form" onSubmit={handleSubmit} className="space-y-6 pt-6">
        {submitted ? (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 shadow-sm">
            <p className="font-semibold">Listing ready to publish.</p>
            <p className="mt-1">This is a mock flow, but your listing details are now saved in the form state for the next backend step.</p>
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
          <FormSelect
            label="Category"
            name="category"
            options={categories}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          />
          <FormSelect
            label="Condition"
            name="condition"
            options={conditions}
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            required
          />
          <FormSelect
            label="University"
            name="university"
            options={universities}
            value={university}
            onChange={(event) => setUniversity(event.target.value)}
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

        <ImageUploader files={images} onChange={setImages} />

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
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Publish listing
          </button>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-16px_30px_rgba(15,23,42,0.12)] sm:hidden">
        <button
          type="submit"
          form="create-listing-form"
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Publish listing
        </button>
      </div>
    </section>
  );
}
