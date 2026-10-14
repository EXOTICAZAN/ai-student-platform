import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050816] text-white antialiased">
      <Navbar />
      <main className="pt-20 lg:pt-24">{children}</main>
      <Footer />
    </div>
  );
}
