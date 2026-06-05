import TopBar from "@/components/landing/top-bar";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Navbar />
      <main className="pt-[calc(2.25rem+4rem)]">{children}</main>
      <Footer />
    </>
  );
}
