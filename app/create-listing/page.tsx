import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ListingForm from "@/components/marketplace/ListingForm";
import AuthGuard from "@/components/auth/AuthGuard";

export const metadata = {
  title: "Create Listing | B&S Marketplace",
  description: "Create a new student marketplace listing with a clean, mobile-first listing form.",
};

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-6 pb-28">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Create a listing for campus students
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Add your item details, upload images, and choose whether to sell or donate with Go Free.
            </p>
          </div>
        </div>
        <AuthGuard>
          <ListingForm />
        </AuthGuard>
      </main>
      <Footer />
    </div>
  );
}
