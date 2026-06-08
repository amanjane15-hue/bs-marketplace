import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Contact Us | B&S Marketplace",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">Need help?</h1>
        <div className="mt-8 space-y-6 text-lg text-slate-700">
          <p>
            For account, listing, reporting, or marketplace questions, contact the B&S Marketplace team.
          </p>
          
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-semibold text-xl mb-2">Support Email</h2>
            <p className="font-mono bg-amber-100 px-3 py-1.5 rounded inline-block text-base">Support email required before launch</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
