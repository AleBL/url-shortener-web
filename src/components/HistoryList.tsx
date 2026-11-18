import { Check, Copy } from "lucide-react";
import { useId, useRef } from "react";
import { selectText, useClipboard } from "../hooks/useClipboard";
import { useI18n } from "../i18n/useI18n";
import type { HistoryItem } from "../lib/history";
import { readableUrl } from "../lib/url";

type HistoryListProps = {
  items: HistoryItem[];
  onClear: () => void;
};

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "");
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const { t } = useI18n();
  const { copied, copy } = useClipboard();
  const link = useRef<HTMLAnchorElement>(null);
  const Icon = copied ? Check : Copy;

  async function handleCopy() {
    const ok = await copy(item.shortUrl);
    if (!ok && link.current) selectText(link.current);
  }

  return (
    <li className="flex items-center gap-3 py-2 pr-2 pl-4">
      <div className="min-w-0 flex-1">
        <a
          ref={link}
          href={item.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate font-medium text-violet-700 underline-offset-2 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none dark:text-violet-300 dark:focus-visible:ring-violet-400"
        >
          {displayUrl(item.shortUrl)}{" "}
          <span className="sr-only">{t.newTabHint}</span>
        </a>
        <p
          title={readableUrl(item.originalUrl)}
          className="truncate text-sm text-zinc-600 dark:text-zinc-400"
        >
          {displayUrl(readableUrl(item.originalUrl))}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-violet-400"
      >
        <Icon
          key={copied ? "copied" : "copy"}
          aria-hidden="true"
          className="size-4 motion-safe:animate-pop-in"
        />
        {copied ? t.copied : t.copy}{" "}
        {/* Tells the ten Copy buttons apart for screen readers. */}
        <span className="sr-only">{displayUrl(item.shortUrl)}</span>
      </button>
    </li>
  );
}

export function HistoryList({ items, onClear }: HistoryListProps) {
  const { t } = useI18n();
  const headingId = useId();

  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="mt-12">
      <div className="flex items-center justify-between gap-4">
        <h2
          id={headingId}
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          {t.historyTitle}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 rounded-lg px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:outline-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-violet-400"
        >
          {t.historyClear}
        </button>
      </div>
      <ul className="mt-2 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white/70 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/70">
        {items.map((item) => (
          <HistoryRow key={item.shortUrl} item={item} />
        ))}
      </ul>
    </section>
  );
}
