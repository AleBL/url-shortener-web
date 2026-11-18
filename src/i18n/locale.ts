import { DEFAULT_LOCALE, isLocale, type Locale } from "./messages";

export const LOCALE_STORAGE_KEY = "url-shortener:locale";

// Maps a BCP 47 tag to a supported locale: any Portuguese variant becomes
// pt-BR, any English variant becomes en, everything else is unsupported.
function matchLocale(tag: string): Locale | undefined {
  const language = tag.toLowerCase().split("-")[0];
  if (language === "pt") return "pt-BR";
  if (language === "en") return "en";
  return undefined;
}

function readSavedLocale(): Locale | undefined {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(saved) ? saved : undefined;
  } catch {
    // Storage blocked (private mode, disabled cookies): nothing to restore.
    return undefined;
  }
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages?.length) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

/**
 * Saved choice first; otherwise the first browser language we support, in
 * the user's order of preference; otherwise English.
 */
export function detectLocale(): Locale {
  const saved = readSavedLocale();
  if (saved) return saved;

  for (const tag of browserLanguages()) {
    const match = matchLocale(tag);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

export function saveLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Without storage the choice only lasts until the page reloads.
  }
}
