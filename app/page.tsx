import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import CategoriesSection from "@/components/home/CategoriesSection";
import FeaturedListings from "@/components/home/FeaturedListings";
import GoFreeSection from "@/components/home/GoFreeSection";
import HeroSection from "@/components/home/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-16">
        <HeroSection />
        <FeaturedListings />
        <CategoriesSection />
        <GoFreeSection />
      </main>
      <Footer />
    </div>
  );
}