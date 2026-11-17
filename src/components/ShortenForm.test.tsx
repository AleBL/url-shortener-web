import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App from "../App";
import { LOCALES, messages, type Locale } from "../i18n/messages";
import { shortenUrl, warmUp, type ShortenResult } from "../lib/api";
import { renderWithI18n } from "../test/render";
import { COLD_START_NOTICE_MS, ShortenForm } from "./ShortenForm";

vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  warmUp: vi.fn(),
  shortenUrl: vi.fn(),
}));

const shortenMock = vi.mocked(shortenUrl);
const SHORT_URL = "https://url-shortener-mgpm.onrender.com/aZ3kP9";
const pt = messages["pt-BR"];

beforeEach(() => {
  shortenMock.mockReset();
  vi.mocked(warmUp).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderForm(locale: Locale = "pt-BR") {
  const user = userEvent.setup(
    vi.isFakeTimers() ? { advanceTimers: vi.advanceTimersByTime } : {},
  );
  renderWithI18n(<ShortenForm />, { locale });
  return { user, t: messages[locale] };
}

function input(t = pt) {
  return screen.getByRole("textbox", { name: t.inputLabel });
}

function submitButton(name: string) {
  return screen.getByRole("button", { name });
}

/** The message region the input points to through aria-describedby. */
function message(t = pt) {
  const id = input(t).getAttribute("aria-describedby");
  return id ? document.getElementById(id) : null;
}

function deferred() {
  let resolve!: (result: ShortenResult) => void;
  const promise = new Promise<ShortenResult>((done) => (resolve = done));
  return { promise, resolve };
}

describe("ShortenForm", () => {
  test("wakes the API up once on mount", () => {
    renderForm();

    expect(warmUp).toHaveBeenCalledOnce();
  });

  test("focuses the field and keeps Shorten disabled while it is empty", async () => {
    const { user } = renderForm();

    expect(input()).toHaveFocus();
    expect(submitButton(pt.submit)).toBeDisabled();

    await user.type(input(), "   ");
    expect(submitButton(pt.submit)).toBeDisabled();

    await user.type(input(), "go.dev");
    expect(submitButton(pt.submit)).toBeEnabled();
  });

  test("paste, Enter, Enter: shortens, focuses Copy and copies", async () => {
    shortenMock.mockResolvedValue({ ok: true, shortUrl: SHORT_URL });
    const { user } = renderForm();

    await user.click(input());
    await user.paste("  go.dev/doc  ");
    await user.keyboard("{Enter}");

    expect(shortenMock).toHaveBeenCalledWith("https://go.dev/doc");
    expect(
      await screen.findByText("url-shortener-mgpm.onrender.com/aZ3kP9"),
    ).toBeVisible();
    expect(screen.getByText("https://go.dev/doc")).toBeVisible();
    expect(input()).toHaveValue("");
    const copy = screen.getByRole("button", { name: pt.copy });
    expect(copy).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(copy).toHaveTextContent(pt.copied);
    await expect(navigator.clipboard.readText()).resolves.toBe(SHORT_URL);
  });

  test("an invalid link shows the error without calling the API", async () => {
    const { user } = renderForm();

    await user.type(input(), "abc{Enter}");

    expect(shortenMock).not.toHaveBeenCalled();
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(message()).toHaveTextContent(pt.invalidUrl);

    await user.type(input(), "d");

    expect(input()).toHaveAttribute("aria-invalid", "false");
    expect(message()).toBeNull();
  });

  describe.each(LOCALES)("API errors in %s", (locale) => {
    const t = messages[locale];

    test.each([
      { kind: "invalid", text: t.badRequest, invalid: "true" },
      { kind: "server", text: t.serverError, invalid: "false" },
      { kind: "network", text: t.networkError, invalid: "false" },
      { kind: "timeout", text: t.networkError, invalid: "false" },
    ] as const)("$kind", async ({ kind, text, invalid }) => {
      shortenMock.mockResolvedValue({ ok: false, error: { kind } });
      const { user } = renderForm(locale);

      await user.type(input(t), "go.dev{Enter}");

      expect(message(t)).toHaveTextContent(text);
      expect(input(t)).toHaveAttribute("aria-invalid", invalid);
      expect(input(t)).toHaveValue("go.dev");
      expect(input(t)).toHaveFocus();
    });
  });

  test("switching the language translates the error on screen", async () => {
    shortenMock.mockResolvedValue({ ok: false, error: { kind: "server" } });
    const user = userEvent.setup();
    renderWithI18n(<App />, { locale: "pt-BR" });

    await user.type(input(), "go.dev{Enter}");
    expect(message()).toHaveTextContent(pt.serverError);

    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(message(messages.en)).toHaveTextContent(messages.en.serverError);
  });

  test("429 counts down with the button disabled, then frees it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    shortenMock.mockResolvedValue({
      ok: false,
      error: { kind: "rate_limited", retryAfter: 3 },
    });
    const { user } = renderForm();

    await user.type(input(), "go.dev{Enter}");

    const visible = () =>
      within(message()!).getByText((_, element) =>
        Boolean(element?.matches('[aria-hidden="true"]:not(svg)')),
      );
    expect(visible()).toHaveTextContent(pt.rateLimited(3));
    expect(message()).toHaveTextContent(pt.rateLimited(3));
    expect(submitButton(pt.submit)).toBeDisabled();

    // Enter during the countdown does nothing: the submit button is disabled.
    await user.type(input(), "{Enter}");
    expect(shortenMock).toHaveBeenCalledOnce();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(visible()).toHaveTextContent(pt.rateLimited(2));

    // One tick per act: each second schedules the next one after rendering.
    for (const _ of [1, 2]) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(message()).toBeNull();
    expect(submitButton(pt.submit)).toBeEnabled();
  });

  test("shows the cold start notice after 3 s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const request = deferred();
    shortenMock.mockReturnValue(request.promise);
    const { user } = renderForm();

    await user.type(input(), "go.dev{Enter}");

    expect(submitButton(pt.submitting)).toBeDisabled();
    expect(screen.queryByText(pt.coldStart)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(COLD_START_NOTICE_MS);
    });
    expect(message()).toHaveTextContent(pt.coldStart);

    await act(async () => {
      request.resolve({ ok: true, shortUrl: SHORT_URL });
    });
    expect(screen.queryByText(pt.coldStart)).toBeNull();
    expect(
      screen.getByText("url-shortener-mgpm.onrender.com/aZ3kP9"),
    ).toBeVisible();
  });
});
