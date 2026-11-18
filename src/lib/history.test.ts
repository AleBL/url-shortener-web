import { describe, expect, test, vi } from "vitest";
import {
  addToHistory,
  findInHistory,
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  loadHistory,
  saveHistory,
  type HistoryItem,
} from "./history";

function item(
  n: number,
  originalUrl = `https://example.com/${n}`,
): HistoryItem {
  return {
    shortUrl: `https://api.example.test/c${n}`,
    originalUrl,
    createdAt: new Date(Date.UTC(2026, 10, 17, 12, n)).toISOString(),
  };
}

describe("addToHistory", () => {
  test("puts the newest item first without changing the input", () => {
    const before = [item(1)];

    const after = addToHistory(before, item(2));

    expect(after).toEqual([item(2), item(1)]);
    expect(before).toEqual([item(1)]);
  });

  test(`keeps only the ${HISTORY_LIMIT} most recent items`, () => {
    let items: HistoryItem[] = [];
    for (let n = 1; n <= 12; n++) items = addToHistory(items, item(n));

    expect(items).toHaveLength(HISTORY_LIMIT);
    expect(items[0]).toEqual(item(12));
    expect(items.at(-1)).toEqual(item(3));
  });

  test("replaces an older entry for the same URL", () => {
    const items = addToHistory(
      [item(1, "https://go.dev"), item(2)],
      item(3, "https://GO.DEV/"),
    );

    expect(items).toEqual([item(3, "https://GO.DEV/"), item(2)]);
  });
});

describe("findInHistory", () => {
  const items = [item(1, "https://go.dev"), item(2, "https://x.com/a?b=1")];

  test.each(["https://go.dev", "https://go.dev/", "HTTPS://GO.DEV"])(
    "finds %s",
    (url) => {
      expect(findInHistory(items, url)).toEqual(items[0]);
    },
  );

  test.each(["http://go.dev", "https://go.dev/doc", "https://x.com/a?b=2"])(
    "does not find %s",
    (url) => {
      expect(findInHistory(items, url)).toBeUndefined();
    },
  );
});

describe("loadHistory and saveHistory", () => {
  test("round-trip through localStorage", () => {
    saveHistory([item(2), item(1)]);

    expect(loadHistory()).toEqual([item(2), item(1)]);
  });

  test("start empty and remove the key when the list is cleared", () => {
    expect(loadHistory()).toEqual([]);

    saveHistory([item(1)]);
    saveHistory([]);

    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  test.each([
    { name: "bad JSON", raw: "not json" },
    { name: "an object", raw: '{"shortUrl":"https://a.b/c"}' },
    { name: "a string", raw: '"hello"' },
  ])("ignore $name", ({ raw }) => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, raw);

    expect(loadHistory()).toEqual([]);
  });

  test("drop malformed items and non-http short links", () => {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([
        item(1),
        { ...item(2), shortUrl: "javascript:alert(1)" },
        { shortUrl: "https://api.example.test/x" },
        null,
        item(3),
      ]),
    );

    expect(loadHistory()).toEqual([item(1), item(3)]);
  });

  test(`cap a longer saved list at ${HISTORY_LIMIT}`, () => {
    const saved = Array.from({ length: 12 }, (_, n) => item(n));
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(saved));

    expect(loadHistory()).toEqual(saved.slice(0, HISTORY_LIMIT));
  });

  test("work without storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });

    expect(loadHistory()).toEqual([]);
    expect(() => saveHistory([item(1)])).not.toThrow();
    expect(setItem).toHaveBeenCalled();
  });
});
