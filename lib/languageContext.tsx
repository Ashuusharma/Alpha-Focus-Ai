"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUserId, readUserState, writeUserState } from "@/lib/dbUserState";

export type Language = "en" | "hi" | "ta" | "te" | "mr" | "bn";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
];

type TranslationKey = string;

type TranslationDictionary = Record<string, string>;

const translations: Record<Language, TranslationDictionary> = {
  en: {
    welcome: "Welcome to Oneman",
    getStarted: "Get Started",
    analyzePhoto: "Analyze Photo",
    myResults: "My Results",
    challenges: "Challenges",
    settings: "Settings",
  },
  hi: {},
  ta: {},
  te: {},
  mr: {},
  bn: {},
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      setMounted(true);
      const userId = await getCurrentUserId();
      if (!userId) return;
      const savedLang = await readUserState<Language>(userId, "oneman-language");
      if (savedLang && translations[savedLang] !== undefined) {
        setLanguageState(savedLang);
      }
    };

    void loadLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    void (async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;
      await writeUserState(userId, "oneman-language", lang);
    })();
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
