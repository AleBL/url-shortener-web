import { CircleAlert, LoaderCircle } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { Messages } from "../i18n/messages";
import { useI18n } from "../i18n/useI18n";
import { shortenUrl, warmUp, type ShortenError } from "../lib/api";
import { findInHistory, type HistoryItem } from "../lib/history";
import { normalizeUrl, validateUrl } from "../lib/url";
import { ResultCard } from "./ResultCard";

export const COLD_START_NOTICE_MS = 3000;

type FormError = { kind: "invalid_url" } | ShortenError;

// `id` remounts the card even when the same link shows again, so focus
// returns to Copy every time.
type Result = { id: number; shortUrl: string; originalUrl: string };

type ShortenFormProps = {
  /** Links already shortened in this browser; a match skips the API. */
  history?: HistoryItem[];
  onShortened?: (item: HistoryItem) => void;
};

function errorText(t: Messages, error: FormError, seconds: number): string {
  switch (error.kind) {
    case "invalid_url":
      return t.invalidUrl;
    case "invalid":
      return t.badRequest;
    case "rate_limited":
      return t.rateLimited(seconds);
    case "server":
      return t.serverError;
    case "network":
    case "timeout":
      return t.networkError;
  }
}

export function ShortenForm({ history = [], onShortened }: ShortenFormProps) {
  const { t } = useI18n();
  const messageId = useId();
  const input = useRef<HTMLInputElement>(null);
  const warmedUp = useRef(false);
  const resultCount = useRef(0);

  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (warmedUp.current) return;
    warmedUp.current = true;
    warmUp();
  }, []);

  useEffect(() => {
    if (!submitting) return;
    const timer = setTimeout(() => setSlow(true), COLD_START_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [submitting]);

  // 429 countdown: one tick per second, then the button comes back.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
      if (cooldown === 1) {
        setError((current) =>
          current?.kind === "rate_limited" ? null : current,
        );
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    if (error && error.kind !== "rate_limited") setError(null);
  }

  function showResult(shortUrl: string, originalUrl: string) {
    resultCount.current += 1;
    setResult({ id: resultCount.current, shortUrl, originalUrl });
    setValue("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || cooldown > 0) return;

    const url = normalizeUrl(value);
    if (!url) return;
    if (!validateUrl(url)) {
      setError({ kind: "invalid_url" });
      input.current?.focus();
      return;
    }

    setError(null);

    // Same link as before: show the saved one, which saves a request and
    // avoids a second code for the same URL.
    const saved = findInHistory(history, url);
    if (saved) {
      showResult(saved.shortUrl, saved.originalUrl);
      return;
    }

    setSubmitting(true);
    const outcome = await shortenUrl(url);
    setSubmitting(false);
    setSlow(false);

    if (outcome.ok) {
      onShortened?.({
        shortUrl: outcome.shortUrl,
        originalUrl: url,
        createdAt: new Date().toISOString(),
      });
      showResult(outcome.shortUrl, url);
      return;
    }

    setError(outcome.error);
    if (outcome.error.kind === "rate_limited") {
      setCooldown(outcome.error.retryAfter);
    }
    input.current?.focus();
  }

  const urlRejected =
    error?.kind === "invalid_url" || error?.kind === "invalid";
  const showNotice = submitting && slow;
  const hasMessage = error !== null || showNotice;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor={`${messageId}-input`} className="sr-only">
            {t.inputLabel}
          </label>
          <input
            ref={input}
            id={`${messageId}-input`}
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            value={value}
            onChange={handleChange}
            placeholder={t.inputPlaceholder}
            aria-invalid={urlRejected}
            aria-describedby={hasMessage ? messageId : undefined}
            className="min-h-12 w-full min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-4 text-base shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:border-violet-600 focus-visible:ring-2 focus-visible:ring-violet-600/30 focus-visible:outline-none aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-400 dark:focus-visible:border-violet-400 dark:focus-visible:ring-violet-400/30 dark:aria-invalid:border-red-400"
          />
          <button
            type="submit"
            disabled={!value.trim() || submitting || cooldown > 0}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-violet-600 dark:bg-violet-400 dark:text-zinc-950 dark:hover:bg-violet-300 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950 dark:disabled:hover:bg-violet-400"
          >
            {submitting && (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 motion-safe:animate-spin"
              />
            )}
            {submitting ? t.submitting : t.submit}
          </button>
        </div>

        <p
          id={messageId}
          aria-live="polite"
          className={`mt-3 flex min-h-5 items-start gap-2 text-sm ${
            error
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {error && (
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
          )}
          {error?.kind === "rate_limited" ? (
            <>
              <span aria-hidden="true">{errorText(t, error, cooldown)}</span>
              <span className="sr-only">
                {errorText(t, error, error.retryAfter)}
              </span>
            </>
          ) : error ? (
            <span>{errorText(t, error, 0)}</span>
          ) : showNotice ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 motion-safe:animate-spin"
              />
              <span>{t.coldStart}</span>
            </>
          ) : null}
        </p>
      </form>

      <div aria-live="polite" className="mt-6">
        {result && (
          <ResultCard
            key={result.id}
            shortUrl={result.shortUrl}
            originalUrl={result.originalUrl}
          />
        )}
      </div>
    </>
  );
}
