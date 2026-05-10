"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, Language, t as translate } from "@/lib/i18n";

const LANGUAGE_KEY = "glamora_language_v1";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_KEY) as Language | null;
    if (saved === "VN" || saved === "EN") {
      setLanguageState(saved);
      document.documentElement.lang = saved === "VN" ? "vi" : "en";
      return;
    }
    document.documentElement.lang = "vi";
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
        document.documentElement.lang = nextLanguage === "VN" ? "vi" : "en";
      },
      t(key) {
        return translate(language, key);
      },
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
