import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata = {
  title: "Privacy Notice | B&S Marketplace",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600 border border-slate-200">
          <strong>Note:</strong> This page should be reviewed before public launch.
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">Privacy Notice</h1>
        
        <div className="mt-10 space-y-10 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Collection & Visibility</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Account information:</strong> We securely store basic credentials to manage your access.</li>
              <li><strong>College email access checks:</strong> Used solely to verify your student status.</li>
              <li><strong>Profile data:</strong> Your display name, university affiliation, and avatar are public to facilitate trust.</li>
              <li><strong>Listings:</strong> The items you post, including images and descriptions, are publicly visible on the marketplace.</li>
              <li><strong>Data visibility:</strong> You control what listings are active. Marking items as sold hides them from public search.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Interactions & Safety</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Messages:</strong> Chat histories are stored securely to allow communication between buyers and sellers.</li>
              <li><strong>Ratings and reviews:</strong> Feedback left by others will be associated with your public profile.</li>
              <li><strong>Reporting:</strong> Flagged content is reviewed securely by our administrative team.</li>
              <li><strong>Moderation actions:</strong> Administrative interventions (like suspensions) are logged for platform safety but kept private.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact</h2>
            <p className="leading-7 text-lg">
              For privacy questions or data deletion requests, please reach out via our <Link href="/contact" className="text-emerald-700 font-semibold hover:underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
