"use client";

import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/language-provider";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white/90 p-1 shadow-sm">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm ${
            language === lang
              ? "bg-black text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100 hover:text-black"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
