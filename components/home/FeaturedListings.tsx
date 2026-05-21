import ListingCard from "@/components/ui/ListingCard";

const listings = [
  {
    title: "Secondhand desk setup",
    price: "$125",
    category: "Dorm Gear",
    seller: "Campus Seller",
    university: "State U",
    posted: "2h ago",
    image:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80",
    badge: "Go Free available",
  },
  {
    title: "Organic chemistry textbook",
    price: "$40",
    category: "Textbooks",
    seller: "StudyHub",
    university: "Community College",
    posted: "5h ago",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    badge: "Top rated",
  },
  {
    title: "Campus bike with lock",
    price: "$210",
    category: "Transport",
    seller: "GreenRider",
    university: "City Tech",
    posted: "1d ago",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    badge: "Student verified",
  },
];

export default function FeaturedListings() {
  return (
    <section className="bg-slate-50 py-16" id="featured">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Featured listings
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Latest campus finds ready to join your semester.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Browse the marketplace preview for freshman essentials, study bundles, and sustainable student swaps.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.title} {...listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
