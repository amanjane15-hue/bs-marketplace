import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata = {
  title: "Student Support | B&S Marketplace",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">Student Support</h1>
        <div className="mt-8 space-y-6 text-lg text-slate-700">
          <p>
            Welcome to the B&S Marketplace support center. Here you can find guidance on how to safely navigate the platform and handle your transactions.
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>How to report a listing:</strong> Click the "Report" button on any listing page if the item violates our community standards.</li>
            <li><strong>How to message a seller:</strong> Click "Message Seller" to open a direct, secure conversation through your dashboard.</li>
            <li><strong>How student verification works:</strong> Accounts created with approved college email domains receive a verified student badge automatically.</li>
            <li><strong>What happens when a listing is marked sold:</strong> The listing is removed from public search results to prevent further inquiries.</li>
            <li><strong>How to get help:</strong> If you need direct assistance with your account or a safety concern, contact our support team.</li>
          </ul>
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/marketplace" className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            Browse listings
          </Link>
          <Link href="/contact" className="inline-flex rounded-full bg-white border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50">
            Contact support
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
