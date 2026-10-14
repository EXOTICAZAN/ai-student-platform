"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { messages, type Locale, type TranslationKey, isLocale, profileLanguageToLocale } from "@/lib/i18n";
import { saveLanguagePreference } from "@/app/dashboard/settings/actions";

interface LanguageContextValue { locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey) => string; }
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: string | null }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") { const stored = window.localStorage.getItem("eduforge-locale"); if (isLocale(stored)) return stored; }
    return profileLanguageToLocale(initialLanguage);
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  useEffect(() => {
    let active = true;
    fetch("/api/profile/language").then((r) => r.ok ? r.json() : null).then((data) => {
      if (!active || window.localStorage.getItem("eduforge-locale")) return;
      const next = profileLanguageToLocale(data?.language);
      setLocaleState(next);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try { window.localStorage.setItem("eduforge-locale", next); } catch { /* storage may be unavailable */ }
    void saveLanguagePreference(next).catch(() => undefined);
  };
  const value = useMemo(() => ({ locale, setLocale, t: (key: TranslationKey) => messages[locale][key] ?? messages.en[key] }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) return { locale: "en" as Locale, setLocale: () => undefined, t: (key: TranslationKey) => messages.en[key] };
  return context;
}
