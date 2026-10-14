import type { Metadata, Viewport } from "next";
import "katex/dist/katex.min.css";
import { Toaster } from "sonner";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// The app is dark-only, so pin the colour scheme. Without this, mobile
// browsers render form controls and the overscroll area in light colours.
export const viewport: Viewport = {
  themeColor: "#050816",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  // Without this, Next.js resolves openGraph and Twitter URLs against
  // localhost and warns at build time.
  metadataBase: new URL(SITE_URL),
  title: "EduForge AI — Your AI Learning Companion",
  description:
    "Master any subject with personalized AI tutoring, smart flashcards, scholarship matching, and adaptive study plans.",
  openGraph: {
    title: "EduForge AI — Your AI Learning Companion",
    description:
      "Master any subject with personalized AI tutoring, smart flashcards, scholarship matching, and adaptive study plans.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
