import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { selectText, useClipboard } from "../hooks/useClipboard";
import { useI18n } from "../i18n/useI18n";

type ResultCardProps = {
  shortUrl: string;
  originalUrl: string;
};

export function ResultCard({ shortUrl, originalUrl }: ResultCardProps) {
  const { t } = useI18n();
  const { copied, copy } = useClipboard();
  const copyButton = useRef<HTMLButtonElement>(null);
  const linkText = useRef<HTMLParagraphElement>(null);

  // "Paste, Enter, Enter": the second Enter copies the new link.
  useEffect(() => {
    copyButton.current?.focus();
  }, [shortUrl]);

  async function handleCopy() {
    const ok = await copy(shortUrl);
    if (!ok && linkText.current) selectText(linkText.current);
  }

  const Icon = copied ? Check : Copy;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm motion-safe:animate-card-in sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p
        ref={linkText}
        className="text-lg font-semibold break-all text-violet-700 dark:text-violet-300"
      >
        {shortUrl.replace(/^https?:\/\//, "")}
      </p>
      <p
        title={originalUrl}
        className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400"
      >
        {originalUrl}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          ref={copyButton}
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none dark:bg-violet-400 dark:text-zinc-950 dark:hover:bg-violet-300 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-900"
        >
          <Icon
            key={copied ? "copied" : "copy"}
            aria-hidden="true"
            className="size-4 motion-safe:animate-pop-in"
          />
          {copied ? t.copied : t.copy}
        </button>
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-300 px-4 font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-violet-400"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          {t.open} <span className="sr-only">{t.newTabHint}</span>
        </a>
      </div>
    </div>
  );
}
