import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingGallery from "@/components/marketplace/ListingGallery";
import ListingInfo from "@/components/marketplace/ListingInfo";
import SellerCard from "@/components/marketplace/SellerCard";
import RelatedListings from "@/components/marketplace/RelatedListings";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Listing | B&S Marketplace",
  description: "Marketplace listing detail page.",
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function fetchListingById(id: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      price,
      category,
      university,
      is_free,
      image_urls,
      created_at,
      description
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      fetch_error: error.message,
      fetch_details: error.details,
      fetch_hint: error.hint,
      fetch_code: error.code,
    };
  }

  return data;
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const listingRow: any = await fetchListingById(id);

  if (!listingRow) {
    notFound();
  }

  if (listingRow.fetch_error) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          Listing Fetch Error
        </h1>

        <pre className="rounded bg-slate-100 p-4 overflow-auto text-sm">
          {JSON.stringify(listingRow, null, 2)}
        </pre>
      </div>
    );
  }

  const images: string[] =
    Array.isArray(listingRow.image_urls) &&
    listingRow.image_urls.length > 0
      ? listingRow.image_urls
      : [];

  const listingForUI = {
    id: listingRow.id,
    title: listingRow.title ?? "Untitled",
    price: listingRow.is_free
      ? "₹0"
      : listingRow.price != null
      ? formatPrice(listingRow.price)
      : "₹0",
    category: listingRow.category ?? "Other",
    seller: "Community",
    university: listingRow.university ?? "",
    posted: listingRow.created_at
      ? new Date(listingRow.created_at).toLocaleDateString()
      : "",
    image: images[0] ?? "/placeholder.png",
    goFree: Boolean(listingRow.is_free),
    verified: false,
    description: listingRow.description ?? "",
    image_urls: images,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <main>
            <div className="space-y-6">
              <ListingGallery
                images={images}
                image={listingForUI.image}
                title={listingForUI.title}
              />

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <ListingInfo {...listingForUI} />
              </div>

              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                <RelatedListings currentId={listingForUI.id} />
              </div>
            </div>
          </main>

          <aside className="hidden lg:block">
            <SellerCard
              seller={listingForUI.seller}
              university={listingForUI.university}
              verified={listingForUI.verified}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}