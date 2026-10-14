"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

interface DashboardShellProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  /** Use edge-to-edge workspace layout for immersive tools such as the tutor. */
  immersive?: boolean;
  initialLanguage?: string | null;
}

export default function DashboardShell({
  children,
  userName,
  userEmail,
  immersive = false,
  initialLanguage,
}: DashboardShellProps) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
    <div className="min-h-screen bg-[#050816]">
      <Sidebar />
      <div className="pl-0 transition-all duration-300 md:pl-64">
        <TopNav userName={userName} userEmail={userEmail} />
        <main className={immersive ? "p-0" : "p-4 sm:p-6 lg:p-8"}>{children}</main>
      </div>
    </div>
    </LanguageProvider>
  );
}
