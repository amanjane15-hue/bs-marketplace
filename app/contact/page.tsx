import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactSupportForm from "@/components/contact/ContactSupportForm";

export const metadata = {
  title: "Contact Us | B&S Marketplace",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">Need help?</h1>
        <div className="mt-8 text-lg text-slate-700">
          <p>
            For account, listing, reporting, or marketplace questions, contact the B&S Marketplace team.
          </p>
        </div>
        
        <ContactSupportForm />
      </main>
      <Footer />
    </div>
  );
}
