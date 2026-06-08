import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata = {
  title: "Campus Swaps | B&S Marketplace",
};

export default function CampusSwapsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">Campus Swaps</h1>
        <div className="mt-8 space-y-6 text-lg text-slate-700">
          <p>
            Make trading and buying on campus easy, safe, and convenient. Our Campus Swaps program encourages students to bypass shipping and long-distance delays by trading directly within the campus community.
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li>Buy and sell useful student items locally</li>
            <li>Meet safely on campus in public, well-lit spaces</li>
            <li>Check seller profiles and verified student badges before transacting</li>
            <li>Use marketplace messaging to coordinate before meeting</li>
            <li>Report any suspicious listings immediately to moderators</li>
          </ul>
        </div>
        <div className="mt-12">
          <Link href="/marketplace" className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            Browse listings
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
