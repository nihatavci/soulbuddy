import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n'; // ensure init side-effect runs (belt+suspenders, _layout.tsx also imports it)
import type { SupportedLang } from '@/i18n';

// Preserve original Lang type alias — call sites use Lang
export type Lang = SupportedLang;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <LanguageContext.Provider value={{
      lang: 'en',
      setLang: () => {}, // English-only; no-op
      t: (key, options) => t(key, options) as string,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
