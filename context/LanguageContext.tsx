import React, { createContext, useContext, useCallback, useMemo } from 'react';
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

// English-only for now; language switching is deferred. Kept stable (module
// scope) so it never changes identity and can't churn context consumers.
const NOOP_SET_LANG = (_l: Lang) => {};

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: NOOP_SET_LANG,
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  // Stabilise the wrapped translator: re-created only when i18next's `t`
  // identity changes (i.e. on language/resource load), NOT on every render.
  // Without this, every render minted a new `t` + a new context `value`,
  // forcing all useT()/useLanguage() consumers to re-render — which drove an
  // infinite render loop through unstable consumers (e.g. NativeTabs triggers).
  const translate = useCallback(
    (key: string, options?: Record<string, unknown>) => t(key, options) as string,
    [t],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang: 'en', setLang: NOOP_SET_LANG, t: translate }),
    [translate],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
