import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardContent from "@/components/dashboard/DashboardContent";

export const metadata = {
  title: "Dashboard | B&S Marketplace",
  description: "Manage your marketplace listings and keep your content up to date.",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-6 pb-28">
        <AuthGuard>
          <DashboardContent />
        </AuthGuard>
      </main>
      <Footer />
    </div>
  );
}
