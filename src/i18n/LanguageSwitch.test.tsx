import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "../App";
import { renderWithI18n } from "../test/render";
import { I18nProvider } from "./I18nProvider";
import { LOCALE_STORAGE_KEY } from "./locale";
import { messages } from "./messages";

function heading() {
  return screen.getByRole("heading", { level: 1 });
}

describe("LanguageSwitch", () => {
  test("exposes a labelled group with one button per language", () => {
    renderWithI18n(<App />, { locale: "pt-BR" });

    const group = screen.getByRole("group", {
      name: messages["pt-BR"].languageLabel,
    });
    const pt = screen.getByRole("button", { name: "PT" });
    const en = screen.getByRole("button", { name: "EN" });

    expect(group).toContainElement(pt);
    expect(group).toContainElement(en);
    expect(pt).toHaveAttribute("lang", "pt-BR");
    expect(en).toHaveAttribute("lang", "en");
    expect(pt).toHaveAttribute("aria-pressed", "true");
    expect(en).toHaveAttribute("aria-pressed", "false");
  });

  test("switching translates the page, updates <html lang> and persists", async () => {
    const user = userEvent.setup();
    renderWithI18n(<App />, { locale: "pt-BR" });
    expect(heading()).toHaveTextContent(messages["pt-BR"].title);

    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(heading()).toHaveTextContent(messages.en.title);
    expect(
      screen.getByRole("group", { name: messages.en.languageLabel }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.title).toBe(messages.en.documentTitle);
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "PT" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  test("a saved choice survives a reload", async () => {
    const user = userEvent.setup();
    const first = renderWithI18n(<App />, { locale: "en" });
    await user.click(screen.getByRole("button", { name: "PT" }));
    first.unmount();

    // A fresh provider without a fixed locale runs detection, like a reload.
    render(
      <I18nProvider>
        <App />
      </I18nProvider>,
    );

    expect(heading()).toHaveTextContent(messages["pt-BR"].title);
    expect(document.documentElement).toHaveAttribute("lang", "pt-BR");
  });
});
