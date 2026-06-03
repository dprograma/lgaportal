import TopBar from "@/components/landing/top-bar";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";

export default function AllocationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Navbar />
      <div className="pt-[calc(2.25rem+4rem)]">{/* TopBar + Navbar height */}
        {children}
      </div>
      <Footer />
    </>
  );
}
