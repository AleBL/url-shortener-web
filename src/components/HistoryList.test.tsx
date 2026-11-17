import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "../App";
import { I18nProvider } from "../i18n/I18nProvider";
import { messages } from "../i18n/messages";
import { shortenUrl } from "../lib/api";
import { HISTORY_STORAGE_KEY, type HistoryItem } from "../lib/history";
import { renderWithI18n } from "../test/render";

vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  warmUp: vi.fn(),
  shortenUrl: vi.fn(),
}));

const shortenMock = vi.mocked(shortenUrl);
const t = messages["pt-BR"];

const saved: HistoryItem = {
  shortUrl: "https://api.example.test/aZ3kP9",
  originalUrl: "https://go.dev",
  createdAt: "2026-11-17T12:00:00.000Z",
};

beforeEach(() => {
  shortenMock.mockReset();
});

function seed(items: HistoryItem[]) {
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
}

function history() {
  return screen.queryByRole("region", { name: t.historyTitle });
}

function input() {
  return screen.getByRole("textbox", { name: t.inputLabel });
}

describe("HistoryList", () => {
  test("stays hidden while there is no history", () => {
    renderWithI18n(<App />);

    expect(history()).toBeNull();
  });

  test("lists a new link and keeps it after a reload", async () => {
    shortenMock.mockResolvedValue({ ok: true, shortUrl: saved.shortUrl });
    const user = userEvent.setup();
    const first = renderWithI18n(<App />);

    await user.type(input(), "go.dev{Enter}");

    expect(
      within(history()!).getByRole("link", {
        name: /api\.example\.test\/aZ3kP9/,
      }),
    ).toHaveAttribute("href", saved.shortUrl);
    expect(
      JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY)!),
    ).toMatchObject([
      { shortUrl: saved.shortUrl, originalUrl: "https://go.dev" },
    ]);

    first.unmount();
    render(
      <I18nProvider initialLocale="pt-BR">
        <App />
      </I18nProvider>,
    );

    expect(
      within(history()!).getByRole("link", {
        name: /api\.example\.test\/aZ3kP9/,
      }),
    ).toHaveAttribute("href", saved.shortUrl);
  });

  test("a repeated URL shows the saved link without calling the API", async () => {
    seed([saved]);
    const user = userEvent.setup();
    renderWithI18n(<App />);

    await user.type(input(), "GO.DEV/{Enter}");

    expect(shortenMock).not.toHaveBeenCalled();
    expect(input()).toHaveValue("");
    const copy = screen.getByRole("button", { name: t.copy });
    expect(copy).toHaveFocus();

    // Enter again copies, like a fresh result.
    await user.keyboard("{Enter}");
    await expect(navigator.clipboard.readText()).resolves.toBe(saved.shortUrl);
  });

  test("copies an item from the list", async () => {
    seed([saved]);
    const user = userEvent.setup();
    renderWithI18n(<App />);

    const copy = within(history()!).getByRole("button", {
      name: `${t.copy} api.example.test/aZ3kP9`,
    });
    await user.click(copy);

    expect(copy).toHaveTextContent(t.copied);
    await expect(navigator.clipboard.readText()).resolves.toBe(saved.shortUrl);
  });

  test("Clear empties the list and the storage", async () => {
    seed([saved, { ...saved, shortUrl: "https://api.example.test/b" }]);
    const user = userEvent.setup();
    renderWithI18n(<App />);
    expect(within(history()!).getAllByRole("listitem")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: t.historyClear }));

    expect(history()).toBeNull();
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });
});
