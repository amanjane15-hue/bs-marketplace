import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata = {
  title: "Sustainability | B&S Marketplace",
};

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">Sustainability</h1>
        <div className="mt-8 space-y-6 text-lg text-slate-700">
          <p>
            B&S Marketplace is built on a foundation of sustainability. We believe in reducing the footprint of campus life by extending the useful life of goods and keeping usable items out of landfills.
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li>Reuse student essentials rather than buying new every semester</li>
            <li>Reduce unnecessary waste by offering items to your peers</li>
            <li>Donate items easily through our Go Free listing tag</li>
            <li>Prefer local campus exchanges over carbon-heavy shipping</li>
            <li>Extend the life of textbooks, electronics, and furniture</li>
          </ul>
        </div>
        <div className="mt-12">
          <Link href="/marketplace?goFree=1" className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            Explore Go Free listings
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
