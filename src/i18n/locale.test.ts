import { describe, expect, test, vi } from "vitest";
import { detectLocale, LOCALE_STORAGE_KEY, saveLocale } from "./locale";

function stubLanguages(languages: string[]) {
  vi.stubGlobal("navigator", {
    languages,
    language: languages[0] ?? "",
  });
}

describe("detectLocale", () => {
  test("uses a valid saved locale over the browser languages", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    stubLanguages(["pt-BR"]);

    expect(detectLocale()).toBe("en");
  });

  test("ignores an invalid saved locale", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    stubLanguages(["pt-BR"]);

    expect(detectLocale()).toBe("pt-BR");
  });

  test.each([
    { languages: ["pt-BR"], expected: "pt-BR" },
    { languages: ["pt-PT"], expected: "pt-BR" },
    { languages: ["pt"], expected: "pt-BR" },
    { languages: ["en-US"], expected: "en" },
    { languages: ["en-GB", "pt-BR"], expected: "en" },
    { languages: ["fr"], expected: "en" },
    { languages: ["fr-FR", "pt-BR"], expected: "pt-BR" },
    { languages: ["PT-br"], expected: "pt-BR" },
    { languages: [], expected: "en" },
  ])("maps $languages to $expected", ({ languages, expected }) => {
    stubLanguages(languages);

    expect(detectLocale()).toBe(expected);
  });

  test("falls back to the browser when storage throws", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    stubLanguages(["pt-BR"]);

    expect(detectLocale()).toBe("pt-BR");
  });
});

describe("saveLocale", () => {
  test("stores the chosen locale", () => {
    saveLocale("pt-BR");

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("pt-BR");
  });

  test("does not throw when storage is unavailable", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

    expect(() => saveLocale("en")).not.toThrow();
    expect(setItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, "en");
  });
});
