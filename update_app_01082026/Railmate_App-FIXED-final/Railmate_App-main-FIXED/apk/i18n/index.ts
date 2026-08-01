// i18n/index.ts

import { usePrefsStore } from '../stores/prefsStore';
import en from './en.json';
import bn from './bn.json';

// ─── Types ────────────────────────────────────────────────────────────────────

const translations = { en, bn } as const;

export type SupportedLocale = keyof typeof translations;

// TranslationKey is derived from en.json — it is the single source of truth.
// Any key that exists in en but not bn will fall back to en at runtime.
export type TranslationKey = keyof typeof en;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTranslation = () => {
  const { language, setLanguage } = usePrefsStore();

  const locale = language as SupportedLocale;

  const t = (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ): string => {
    // Prefer the current locale, fall back to English, fall back to the key itself
    const dict = translations[locale] as Record<string, string>;
    const fallback = translations.en as Record<string, string>;
    let text: string = dict[key] ?? fallback[key] ?? key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }

    return text;
  };

  // Convenience flag — avoids scattering `locale === 'bn'` checks everywhere
  const isBengali = locale === 'bn';

  return { t, locale, setLocale: setLanguage, isBengali };
};
