import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthGuard from "@/components/auth/AuthGuard";
import MyReportsPage from "@/components/dashboard/MyReportsPage";

export const metadata = {
  title: "My Reports | B&S Marketplace",
  description: "View listing reports you have submitted on B&S Marketplace.",
};

export default function DashboardReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">My Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Listings you have flagged for review. Our team will investigate each report.
          </p>
        </div>
        <AuthGuard>
          <MyReportsPage />
        </AuthGuard>
      </main>
      <Footer />
    </div>
  );
}
