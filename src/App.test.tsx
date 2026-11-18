import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import App from "./App";
import { APP_NAME } from "./config";
import { LOCALES, messages } from "./i18n/messages";
import { renderWithI18n } from "./test/render";

describe.each(LOCALES)("App in %s", (locale) => {
  const t = messages[locale];

  test("renders the app name, title and subtitle from the dictionary", () => {
    renderWithI18n(<App />, { locale });

    expect(screen.getByText(APP_NAME)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t.title,
    );
    expect(screen.getByText(t.subtitle)).toBeVisible();
  });

  test("sets the html lang and the document title", () => {
    renderWithI18n(<App />, { locale });

    expect(document.documentElement).toHaveAttribute("lang", locale);
    expect(document.title).toBe(t.documentTitle);
  });
});
