import { describe, expect, test } from "vitest";
import { MAX_URL_BYTES, normalizeUrl, validateUrl } from "./url";

describe("normalizeUrl", () => {
  test.each([
    { input: "go.dev", expected: "https://go.dev" },
    { input: "  https://go.dev  ", expected: "https://go.dev" },
    { input: "\thttps://go.dev\n", expected: "https://go.dev" },
    { input: "http://x.com", expected: "http://x.com" },
    { input: "HTTPS://GO.DEV", expected: "HTTPS://GO.DEV" },
    { input: "go.dev:8080/doc", expected: "https://go.dev:8080/doc" },
    { input: "ftp://x.com", expected: "ftp://x.com" },
    { input: "mailto:a@b.com", expected: "mailto:a@b.com" },
    { input: "", expected: "" },
    { input: "   ", expected: "" },
  ])("$input -> $expected", ({ input, expected }) => {
    expect(normalizeUrl(input)).toBe(expected);
  });
});

describe("validateUrl after normalizeUrl", () => {
  const isValid = (input: string) => validateUrl(normalizeUrl(input));

  test.each([
    "go.dev",
    "https://go.dev/doc/tutorial/getting-started?x=1#top",
    "http://x.com",
    "HTTPS://GO.DEV",
    "go.dev:8080/doc",
    "sub.domain.co.uk/path",
    "https://pt.wikipedia.org/wiki/São_Paulo",
  ])("accepts %s", (input) => {
    expect(isValid(input)).toBe(true);
  });

  test.each([
    "ftp://x.com",
    "abc",
    "abc.",
    "mailto:a@b.com",
    "javascript:alert(1)",
    "https://abc",
    "https://",
    "go dev",
    "",
    "   ",
  ])("rejects %j", (input) => {
    expect(isValid(input)).toBe(false);
  });
});

describe("validateUrl length limit", () => {
  const base = "https://x.com/";

  test("accepts exactly 2048 bytes and rejects 2049", () => {
    const atLimit = base + "a".repeat(MAX_URL_BYTES - base.length);

    expect(atLimit).toHaveLength(2048);
    expect(validateUrl(atLimit)).toBe(true);
    expect(validateUrl(atLimit + "a")).toBe(false);
  });

  test("counts UTF-8 bytes like the API, not characters", () => {
    // "ã" takes 2 bytes, so this URL has far fewer than 2048 characters.
    const overLimit = base + "ã".repeat(1018);

    expect(overLimit.length).toBeLessThan(MAX_URL_BYTES);
    expect(validateUrl(overLimit)).toBe(false);
    expect(validateUrl(base + "ã".repeat(1017))).toBe(true);
  });
});
