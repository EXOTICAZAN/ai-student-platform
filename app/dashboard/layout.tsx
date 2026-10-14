import type { Metadata } from "next";

// Everything under /dashboard is behind auth, so it must never be indexed.
// Declaring it once here covers every child route, including the ones that
// are client components and cannot export metadata themselves.
export const metadata: Metadata = {
  title: "Dashboard — EduForge AI",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
