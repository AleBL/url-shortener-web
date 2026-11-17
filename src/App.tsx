import { LinkIcon } from "lucide-react";
import { APP_NAME } from "./config";
import { useI18n } from "./i18n/useI18n";

export default function App() {
  const { t } = useI18n();

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-8 left-1/2 -z-10 h-80 w-3xl max-w-[150vw] -translate-x-1/2 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-500/15"
      />

      <header className="mx-auto flex w-full max-w-160 items-center justify-between px-4 py-5 sm:px-6">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm dark:bg-violet-400 dark:text-zinc-950">
            <LinkIcon aria-hidden="true" className="size-4" strokeWidth={2.5} />
          </span>
          {APP_NAME}
        </span>
      </header>

      <main className="mx-auto w-full max-w-160 flex-1 px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-base text-pretty text-zinc-600 sm:text-lg dark:text-zinc-400">
            {t.subtitle}
          </p>
        </div>
      </main>
    </div>
  );
}
