import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { COPIED_RESET_MS } from "../hooks/useClipboard";
import { messages } from "../i18n/messages";
import { renderWithI18n } from "../test/render";
import { ResultCard } from "./ResultCard";

const shortUrl = "https://url-shortener-mgpm.onrender.com/aZ3kP9";
const originalUrl = "https://go.dev/doc/tutorial/getting-started";
const t = messages["pt-BR"];

afterEach(() => {
  vi.useRealTimers();
});

function renderCard() {
  return renderWithI18n(
    <ResultCard shortUrl={shortUrl} originalUrl={originalUrl} />,
  );
}

describe("ResultCard", () => {
  test("shows the short link without the scheme and the full original URL", () => {
    renderCard();

    expect(
      screen.getByText("url-shortener-mgpm.onrender.com/aZ3kP9"),
    ).toBeVisible();
    expect(screen.getByText(originalUrl)).toHaveAttribute("title", originalUrl);
  });

  test("opens the short link in a new tab", () => {
    renderCard();

    const open = screen.getByRole("link", {
      name: `${t.open} ${t.newTabHint}`,
    });
    expect(open).toHaveAttribute("href", shortUrl);
    expect(open).toHaveAttribute("target", "_blank");
    expect(open).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("focuses Copy, copies the full URL and resets after 2 s", async () => {
    // shouldAdvanceTime keeps Testing Library's internal setTimeout(0) running.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard();

    const copy = screen.getByRole("button", { name: t.copy });
    expect(copy).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(copy).toHaveTextContent(t.copied);
    await expect(navigator.clipboard.readText()).resolves.toBe(shortUrl);

    act(() => {
      vi.advanceTimersByTime(COPIED_RESET_MS);
    });
    expect(copy).toHaveTextContent(t.copy);
  });

  test("selects the link text when the clipboard refuses", async () => {
    const user = userEvent.setup();
    renderCard();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new DOMException("denied", "NotAllowedError"),
    );

    await user.click(screen.getByRole("button", { name: t.copy }));

    expect(window.getSelection()?.toString()).toBe(
      "url-shortener-mgpm.onrender.com/aZ3kP9",
    );
    expect(screen.getByRole("button", { name: t.copy })).toBeInTheDocument();
  });
});
