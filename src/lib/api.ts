import { API_URL } from "../config";

/** Long enough to cover a Render cold start, which can take about a minute. */
export const REQUEST_TIMEOUT_MS = 90_000;

/** Used when a 429 arrives without a readable Retry-After header. */
export const DEFAULT_RETRY_AFTER_SECONDS = 10;

export type ShortenError =
  | { kind: "invalid" } // 400
  | { kind: "rate_limited"; retryAfter: number } // 429
  | { kind: "server" } // 5xx or an unexpected response
  | { kind: "network" } // fetch failed
  | { kind: "timeout" }; // took longer than REQUEST_TIMEOUT_MS

export type ShortenResult =
  { ok: true; shortUrl: string } | { ok: false; error: ShortenError };

/** Wakes the API up in the background. Failures do not matter here. */
export function warmUp(): void {
  try {
    fetch(`${API_URL}/health`, { method: "GET" }).catch(() => undefined);
  } catch {
    // Nothing to do: the next real request reports its own error.
  }
}

/**
 * Asks the API for a short link. Never throws: every outcome comes back as a
 * ShortenResult, and errors carry a kind for the UI to translate.
 */
export async function shortenUrl(url: string): Promise<ShortenResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/shorten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return failure(
      isTimeout(error) ? { kind: "timeout" } : { kind: "network" },
    );
  }

  if (response.status === 400) return failure({ kind: "invalid" });
  if (response.status === 429) {
    const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
    return failure({ kind: "rate_limited", retryAfter });
  }
  if (!response.ok) return failure({ kind: "server" });

  try {
    const shortUrl = readShortUrl(await response.json());
    return shortUrl ? { ok: true, shortUrl } : failure({ kind: "server" });
  } catch (error) {
    // The timeout also covers reading the body.
    return failure(isTimeout(error) ? { kind: "timeout" } : { kind: "server" });
  }
}

function failure(error: ShortenError): ShortenResult {
  return { ok: false, error };
}

// AbortSignal.timeout rejects with a DOMException named "TimeoutError"; any
// other rejection from fetch is a network failure. Checked by name because a
// DOMException is not always an instance of the current realm's Error.
function isTimeout(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "TimeoutError"
  );
}

/** Reads Retry-After in seconds; missing or invalid values fall back to 10. */
export function parseRetryAfter(header: string | null): number {
  const value = header?.trim() ?? "";
  if (!/^\d+$/.test(value)) return DEFAULT_RETRY_AFTER_SECONDS;
  return Math.max(1, Number(value));
}

// Only an absolute http(s) URL is accepted, since the UI renders it as a link.
function readShortUrl(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const value = (body as Record<string, unknown>).short_url;
  if (typeof value !== "string") return undefined;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}
