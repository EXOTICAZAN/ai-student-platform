import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — EduForge AI",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#050816] text-white antialiased">{children}</div>;
}
