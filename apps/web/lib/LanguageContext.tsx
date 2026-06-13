"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Lang } from "./i18n";

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "es",
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "es" || saved === "en") setLang(saved);
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === "es" ? "en" : "es";
      localStorage.setItem("lang", next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}