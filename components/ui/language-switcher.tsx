"use client";

import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/language-provider";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white/90 p-0.5 shadow-sm">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={`min-h-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight tracking-wide transition-all duration-300 sm:px-2.5 sm:py-1 sm:text-xs ${
            language === lang
              ? "bg-black text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-black"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
