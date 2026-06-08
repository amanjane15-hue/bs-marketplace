import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "About Us | B&S Marketplace",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">About B&S Marketplace</h1>
        <div className="mt-8 space-y-6 text-lg text-slate-700">
          <p>
            B&S Marketplace is a student-first platform for campus buying, selling, swapping, and donating. It is designed to make local exchanges simpler, safer, and more sustainable.
          </p>
          <p>
            Our community relies on trust, which is why we've implemented several features to ensure a secure environment for all students:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li>Verified student badges to help you know who you are dealing with</li>
            <li>College-email signup access to ensure community exclusivity</li>
            <li>Marketplace reporting tools to flag inappropriate content</li>
            <li>A seamless sold listing workflow to keep search results clean</li>
            <li>Secure student-to-student messaging built right into the platform</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
