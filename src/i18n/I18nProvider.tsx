import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { detectLocale, saveLocale } from "./locale";
import { messages, type Locale } from "./messages";
import { I18nContext } from "./useI18n";

type I18nProviderProps = {
  children: ReactNode;
  /** Skips detection. Used by tests to render a fixed locale. */
  initialLocale?: Locale;
};

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? detectLocale(),
  );
  const t = messages[locale];

  // Keeps <html lang> and the tab title in sync, so screen readers pronounce
  // the page in the right language.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t.documentTitle;
  }, [locale, t]);

  // Only an explicit choice is saved; a detected locale keeps following the
  // browser settings.
  const setLocale = useCallback((next: Locale) => {
    saveLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}
