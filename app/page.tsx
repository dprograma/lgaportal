import TopBar from "@/components/landing/top-bar";
import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import ExploreLGAs from "@/components/landing/explore-lgas";
import FeaturedLGAs from "@/components/landing/featured-lgas";
import InvestNigeria from "@/components/landing/invest-nigeria";
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
      <Hero />
      <HowItWorks />
      <ExploreLGAs />
      <FeaturedLGAs />
      <InvestNigeria />
      <ProjectsFeed />
      <CitizenVoices />
      <NewsUpdates />
      <Transparency />
      <CTA />
      <Partners />
      <Footer />
      <FloatingElements />
    </main>
  );
}
