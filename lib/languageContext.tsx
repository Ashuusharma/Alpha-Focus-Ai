"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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

// Translation dictionary - expandable
type TranslationKey = 
  | "welcome"
  | "getStarted"
  | "analyzePhoto"
  | "myResults"
  | "challenges"
  | "settings"
  | "darkMode"
  | "lightMode"
  | "language"
  | "save"
  | "cancel"
  | "next"
  | "back"
  | "addToCart"
  | "wishlist"
  | "share"
  | "download"
  | "skinScore"
  | "hairScore"
  | "overallScore"
  | "issuesFound"
  | "recommendations"
  | "viewDetails"
  | "routine"
  | "morning"
  | "evening"
  | "week"
  | "ingredients"
  | "howToUse"
  | "whyItHelps"
  | "loading"
  | "noResults"
  | "tryAgain";

type Translations = Record<Language, Record<TranslationKey, string>>;

const translations: Translations = {
  en: {
    welcome: "Welcome to Oneman",
    getStarted: "Get Started",
    analyzePhoto: "Analyze Photo",
    myResults: "My Results",
    challenges: "Challenges",
    settings: "Settings",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",
    save: "Save",
    cancel: "Cancel",
    next: "Next",
    back: "Back",
    addToCart: "Add to Cart",
    wishlist: "Wishlist",
    share: "Share",
    download: "Download",
    skinScore: "Skin Score",
    hairScore: "Hair Score",
    overallScore: "Overall Score",
    issuesFound: "Issues Found",
    recommendations: "Recommendations",
    viewDetails: "View Details",
    routine: "Routine",
    morning: "Morning",
    evening: "Evening",
    week: "Week",
    ingredients: "Ingredients",
    howToUse: "How to Use",
    whyItHelps: "Why It Helps",
    loading: "Loading...",
    noResults: "No results found",
    tryAgain: "Try Again",
  },
  hi: {
    welcome: "वनमैन में आपका स्वागत है",
    getStarted: "शुरू करें",
    analyzePhoto: "फोटो विश्लेषण करें",
    myResults: "मेरे परिणाम",
    challenges: "चुनौतियाँ",
    settings: "सेटिंग्स",
    darkMode: "डार्क मोड",
    lightMode: "लाइट मोड",
    language: "भाषा",
    save: "सहेजें",
    cancel: "रद्द करें",
    next: "अगला",
    back: "वापस",
    addToCart: "कार्ट में जोड़ें",
    wishlist: "विशलिस्ट",
    share: "शेयर करें",
    download: "डाउनलोड",
    skinScore: "त्वचा स्कोर",
    hairScore: "बाल स्कोर",
    overallScore: "कुल स्कोर",
    issuesFound: "समस्याएं मिलीं",
    recommendations: "सिफारिशें",
    viewDetails: "विवरण देखें",
    routine: "दिनचर्या",
    morning: "सुबह",
    evening: "शाम",
    week: "सप्ताह",
    ingredients: "सामग्री",
    howToUse: "कैसे उपयोग करें",
    whyItHelps: "यह कैसे मदद करता है",
    loading: "लोड हो रहा है...",
    noResults: "कोई परिणाम नहीं मिला",
    tryAgain: "पुनः प्रयास करें",
  },
  ta: {
    welcome: "Oneman க்கு வரவேற்கிறோம்",
    getStarted: "தொடங்குங்கள்",
    analyzePhoto: "புகைப்படத்தை பகுப்பாய்வு செய்",
    myResults: "என் முடிவுகள்",
    challenges: "சவால்கள்",
    settings: "அமைப்புகள்",
    darkMode: "இருண்ட பயன்முறை",
    lightMode: "ஒளி பயன்முறை",
    language: "மொழி",
    save: "சேமி",
    cancel: "ரத்து செய்",
    next: "அடுத்து",
    back: "பின்",
    addToCart: "கார்ட்டில் சேர்",
    wishlist: "விருப்பப்பட்டியல்",
    share: "பகிர்",
    download: "பதிவிறக்கு",
    skinScore: "சரும மதிப்பெண்",
    hairScore: "முடி மதிப்பெண்",
    overallScore: "மொத்த மதிப்பெண்",
    issuesFound: "கண்டறியப்பட்ட பிரச்சினைகள்",
    recommendations: "பரிந்துரைகள்",
    viewDetails: "விவரங்களைக் காண்க",
    routine: "வழக்கம்",
    morning: "காலை",
    evening: "மாலை",
    week: "வாரம்",
    ingredients: "பொருட்கள்",
    howToUse: "பயன்படுத்துவது எப்படி",
    whyItHelps: "இது ஏன் உதவுகிறது",
    loading: "ஏற்றுகிறது...",
    noResults: "முடிவுகள் இல்லை",
    tryAgain: "மீண்டும் முயற்சி செய்",
  },
  te: {
    welcome: "Oneman కి స్వాగతం",
    getStarted: "ప్రారంభించండి",
    analyzePhoto: "ఫోటో విశ్లేషించండి",
    myResults: "నా ఫలితాలు",
    challenges: "సవాళ్లు",
    settings: "సెట్టింగ్‌లు",
    darkMode: "డార్క్ మోడ్",
    lightMode: "లైట్ మోడ్",
    language: "భాష",
    save: "సేవ్ చేయండి",
    cancel: "రద్దు చేయండి",
    next: "తదుపరి",
    back: "వెనుకకు",
    addToCart: "కార్ట్‌కు జోడించండి",
    wishlist: "విష్‌లిస్ట్",
    share: "షేర్ చేయండి",
    download: "డౌన్‌లోడ్",
    skinScore: "స్కిన్ స్కోర్",
    hairScore: "హెయిర్ స్కోర్",
    overallScore: "మొత్తం స్కోర్",
    issuesFound: "కనుగొన్న సమస్యలు",
    recommendations: "సిఫార్సులు",
    viewDetails: "వివరాలు చూడండి",
    routine: "రొటీన్",
    morning: "ఉదయం",
    evening: "సాయంత్రం",
    week: "వారం",
    ingredients: "పదార్థాలు",
    howToUse: "ఎలా ఉపయోగించాలి",
    whyItHelps: "ఇది ఎందుకు సహాయపడుతుంది",
    loading: "లోడ్ అవుతోంది...",
    noResults: "ఫలితాలు లేవు",
    tryAgain: "మళ్ళీ ప్రయత్నించండి",
  },
  mr: {
    welcome: "Oneman मध्ये आपले स्वागत आहे",
    getStarted: "सुरू करा",
    analyzePhoto: "फोटो विश्लेषण करा",
    myResults: "माझे निकाल",
    challenges: "आव्हाने",
    settings: "सेटिंग्ज",
    darkMode: "डार्क मोड",
    lightMode: "लाइट मोड",
    language: "भाषा",
    save: "जतन करा",
    cancel: "रद्द करा",
    next: "पुढे",
    back: "मागे",
    addToCart: "कार्टमध्ये जोडा",
    wishlist: "विशलिस्ट",
    share: "शेअर करा",
    download: "डाउनलोड",
    skinScore: "त्वचा स्कोअर",
    hairScore: "केस स्कोअर",
    overallScore: "एकूण स्कोअर",
    issuesFound: "आढळलेल्या समस्या",
    recommendations: "शिफारसी",
    viewDetails: "तपशील पहा",
    routine: "दिनचर्या",
    morning: "सकाळ",
    evening: "संध्याकाळ",
    week: "आठवडा",
    ingredients: "घटक",
    howToUse: "कसे वापरावे",
    whyItHelps: "हे कसे मदत करते",
    loading: "लोड होत आहे...",
    noResults: "कोणतेही निकाल नाहीत",
    tryAgain: "पुन्हा प्रयत्न करा",
  },
  bn: {
    welcome: "Oneman এ স্বাগতম",
    getStarted: "শুরু করুন",
    analyzePhoto: "ফটো বিশ্লেষণ করুন",
    myResults: "আমার ফলাফল",
    challenges: "চ্যালেঞ্জ",
    settings: "সেটিংস",
    darkMode: "ডার্ক মোড",
    lightMode: "লাইট মোড",
    language: "ভাষা",
    save: "সংরক্ষণ করুন",
    cancel: "বাতিল করুন",
    next: "পরবর্তী",
    back: "পিছনে",
    addToCart: "কার্টে যোগ করুন",
    wishlist: "উইশলিস্ট",
    share: "শেয়ার করুন",
    download: "ডাউনলোড",
    skinScore: "স্কিন স্কোর",
    hairScore: "হেয়ার স্কোর",
    overallScore: "সামগ্রিক স্কোর",
    issuesFound: "সমস্যা পাওয়া গেছে",
    recommendations: "সুপারিশ",
    viewDetails: "বিস্তারিত দেখুন",
    routine: "রুটিন",
    morning: "সকাল",
    evening: "সন্ধ্যা",
    week: "সপ্তাহ",
    ingredients: "উপাদান",
    howToUse: "কিভাবে ব্যবহার করবেন",
    whyItHelps: "এটি কেন সাহায্য করে",
    loading: "লোড হচ্ছে...",
    noResults: "কোন ফলাফল নেই",
    tryAgain: "আবার চেষ্টা করুন",
  },
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
    setMounted(true);
    const savedLang = localStorage.getItem("oneman-language") as Language | null;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("oneman-language", lang);
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
