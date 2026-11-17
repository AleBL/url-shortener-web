// Same limit as the API, which measures the URL in bytes, not characters.
export const MAX_URL_BYTES = 2048;

// "letters:" counts as a scheme unless a digit follows the colon, so
// "go.dev:8080" stays a host with a port while "mailto:a@b.com" keeps its
// scheme and fails validation.
const SCHEME = /^[a-z][a-z\d+.-]*:(?!\d)/i;

/** Trims the input and adds https:// when the user typed no scheme. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "" || SCHEME.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Checks a normalized URL against the same rules the API applies. */
export function validateUrl(url: string): boolean {
  if (new TextEncoder().encode(url).length > MAX_URL_BYTES) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  // Requires a dotted hostname, which rejects bare words such as "abc" that
  // normalization would otherwise turn into https://abc.
  return parsed.hostname.split(".").filter(Boolean).length >= 2;
}

/** True for an absolute http(s) URL, the only kind the UI renders as a link. */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
