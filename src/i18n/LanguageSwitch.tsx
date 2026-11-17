import { LOCALE_LABELS, LOCALES } from "./messages";
import { useI18n } from "./useI18n";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div role="group" aria-label={t.languageLabel} className="flex gap-1">
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            title={LOCALE_LABELS[option].name}
            aria-pressed={active}
            onClick={() => setLocale(option)}
            className={`min-h-11 min-w-11 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none dark:focus-visible:ring-violet-400 ${
              active
                ? "bg-white text-violet-700 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-violet-300 dark:ring-zinc-800"
                : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
            }`}
          >
            {LOCALE_LABELS[option].short}
          </button>
        );
      })}
    </div>
  );
}
