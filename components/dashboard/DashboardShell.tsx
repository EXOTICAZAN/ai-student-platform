"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

interface DashboardShellProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  /** Use edge-to-edge workspace layout for immersive tools such as the tutor. */
  immersive?: boolean;
}

export default function DashboardShell({
  children,
  userName,
  userEmail,
  immersive = false,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#050816]">
      <Sidebar />
      <div className="pl-0 transition-all duration-300 md:pl-64">
        <TopNav userName={userName} userEmail={userEmail} />
        <main className={immersive ? "p-0" : "p-4 sm:p-6 lg:p-8"}>{children}</main>
      </div>
    </div>
  );
}
