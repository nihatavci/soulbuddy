import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import { Prefs } from '@/store/mmkv';

import en from './en.json';
import de from './de.json';

export type SupportedLang = 'en' | 'de';

const SUPPORTED_LANGS: readonly SupportedLang[] = ['en', 'de'];
const FALLBACK_LANG: SupportedLang = 'en';

/** Prefs key under which the user's explicit language override is stored. */
export const LANG_OVERRIDE_KEY = 'lang_override';

function isSupportedLang(value: string | undefined | null): value is SupportedLang {
  return value != null && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

/** Reads the user's explicit language override, if one has been set. */
export function getLangOverride(): SupportedLang | undefined {
  const raw = Prefs.get(LANG_OVERRIDE_KEY);
  return isSupportedLang(raw) ? raw : undefined;
}

/** Sets (or clears, via `null`) the user's explicit language override. */
export function setLangOverride(lang: SupportedLang | null): void {
  if (lang == null) {
    Prefs.remove(LANG_OVERRIDE_KEY);
    return;
  }
  Prefs.set(LANG_OVERRIDE_KEY, lang);
}

function detectDeviceLang(): SupportedLang | undefined {
  try {
    const [primary] = getLocales();
    return isSupportedLang(primary?.languageCode) ? (primary.languageCode as SupportedLang) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolution priority:
 *   1. Explicit user override (Prefs-backed)
 *   2. Device locale (expo-localization)
 *   3. Fallback: 'en'
 */
export function resolveLang(): SupportedLang {
  return getLangOverride() ?? detectDeviceLang() ?? FALLBACK_LANG;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: resolveLang(),
    fallbackLng: FALLBACK_LANG,
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
