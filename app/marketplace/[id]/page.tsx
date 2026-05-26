import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listing | B&S Marketplace",
  description: "Placeholder listing detail page for future implementation.",
};

type Props = {
  params: { id: string };
};

export default function ListingPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Listing {params.id}</h1>
        <p className="mt-4 text-slate-600">This is a placeholder page for individual listing details. It will be implemented later without changing marketplace card UI.</p>
      </div>
    </div>
  );
}
