import { isHttpUrl } from "./url";

export const HISTORY_STORAGE_KEY = "curto:history:v1";
export const HISTORY_LIMIT = 10;

export type HistoryItem = {
  shortUrl: string;
  originalUrl: string;
  /** ISO 8601, UTC. */
  createdAt: string;
};

function isHistoryItem(value: unknown): value is HistoryItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.shortUrl === "string" &&
    isHttpUrl(item.shortUrl) &&
    typeof item.originalUrl === "string" &&
    typeof item.createdAt === "string"
  );
}

/**
 * Reads the saved list, newest first. Anything unreadable (no storage, bad
 * JSON, unexpected items) is dropped, so the page works without history.
 */
export function loadHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryItem).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    } else {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Without storage the list only lasts until the page reloads.
  }
}

// Compares URLs the way the browser resolves them, so "https://go.dev" and
// "https://GO.DEV/" count as the same link.
function sameUrl(a: string, b: string): boolean {
  try {
    return new URL(a).href === new URL(b).href;
  } catch {
    return a === b;
  }
}

export function findInHistory(
  items: HistoryItem[],
  originalUrl: string,
): HistoryItem | undefined {
  return items.find((item) => sameUrl(item.originalUrl, originalUrl));
}

/** Puts the item first, drops older entries for the same URL, keeps 10. */
export function addToHistory(
  items: HistoryItem[],
  item: HistoryItem,
): HistoryItem[] {
  const others = items.filter(
    (existing) => !sameUrl(existing.originalUrl, item.originalUrl),
  );
  return [item, ...others].slice(0, HISTORY_LIMIT);
}
