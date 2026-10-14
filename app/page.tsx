import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Background from "@/components/home/Background";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Stats from "@/components/home/Stats";
import Showcase from "@/components/home/Showcase";
import Roadmap from "@/components/home/Roadmap";
import Scholarships from "@/components/home/Scholarships";
import About from "@/components/home/About";
import Pricing from "@/components/home/Pricing";
import CTA from "@/components/home/CTA";
import CursorGlow from "@/components/home/CursorGlow";

export default function HomePage() {
  return (
    <>
      <Background />
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Showcase />
        <Roadmap />
        <Scholarships />
        <About />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
