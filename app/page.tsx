import TopBar from "@/components/landing/top-bar";
import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import Symbiotic from "@/components/landing/symbiotic";
import InvestNigeria from "@/components/landing/invest-nigeria";
import ExploreLGAs from "@/components/landing/explore-lgas";
import FeaturedLGAs from "@/components/landing/featured-lgas";
import ProjectsFeed from "@/components/landing/projects-feed";
import CitizenVoices from "@/components/landing/citizen-voices";
import NewsUpdates from "@/components/landing/news-updates";
import Transparency from "@/components/landing/transparency";
import CTA from "@/components/landing/cta";
import Partners from "@/components/landing/partners";
import Footer from "@/components/landing/footer";
import FloatingElements from "@/components/landing/floating-elements";

export default function LandingPage() {
  return (
    <main className="bg-white">
      <TopBar />
      <Navbar />
      {/* 1. Hero — projection-first messaging */}
      <Hero />
      {/* 2. Features — three-audience value props */}
      <Features />
      {/* 3. How It Works — LGA/Investor/Citizen tabs */}
      <HowItWorks />
      {/* 4. Symbiotic Benefits — three-way value diagram */}
      <Symbiotic />
      {/* 5. Investment opportunities — moved up from 6th position */}
      <InvestNigeria />
      {/* 6. Explore & discover LGAs */}
      <ExploreLGAs />
      <FeaturedLGAs />
      {/* 7. Evidence of activity */}
      <ProjectsFeed />
      <CitizenVoices />
      <NewsUpdates />
      {/* 8. Platform impact (renamed from "Accountability") */}
      <Transparency />
      {/* 9. Three-way CTA */}
      <CTA />
      <Partners />
      <Footer />
      <FloatingElements />
    </main>
  );
}
