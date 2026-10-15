"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

export default function DashboardProviders({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: string | null;
}) {
  return <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>;
}
