import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingGallery from "@/components/marketplace/ListingGallery";
import ListingInfo from "@/components/marketplace/ListingInfo";
import SellerCard from "@/components/marketplace/SellerCard";
import RelatedListings from "@/components/marketplace/RelatedListings";
import { mockListings } from "@/data/mock-listings";

export const metadata: Metadata = {
  title: "Listing | B&S Marketplace",
  description: "Marketplace listing detail page.",
};

type Props = {
  params: { id: string };
};

export default function ListingPage({ params }: Props) {
  const listing = mockListings.find((l) => l.id === params.id);

  if (!listing) return notFound();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <main>
            <div className="space-y-6">
              <ListingGallery image={listing.image} title={listing.title} />

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <ListingInfo {...listing} />
              </div>

              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                <RelatedListings currentId={listing.id} />
              </div>
            </div>
          </main>

          <aside className="hidden lg:block">
            <SellerCard seller={listing.seller} university={listing.university} verified={listing.verified} />
          </aside>
        </div>
      </div>
    </div>
  );
}
