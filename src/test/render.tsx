import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nProvider } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/messages";

type Options = Omit<RenderOptions, "wrapper"> & { locale?: Locale };

/** Renders inside <I18nProvider> with a fixed locale (pt-BR by default). */
export function renderWithI18n(
  ui: ReactElement,
  { locale = "pt-BR", ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <I18nProvider initialLocale={locale}>{children}</I18nProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
