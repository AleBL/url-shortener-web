import { APP_NAME } from "../config";

export const LOCALES = ["pt-BR", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

// Each language is named in itself, so these labels are the same in every
// locale and live outside the dictionaries.
export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  "pt-BR": { short: "PT", name: "Português" },
  en: { short: "EN", name: "English" },
};

const ptBR = {
  documentTitle: `${APP_NAME} | Encurte qualquer link em segundos`,
  title: "Encurte qualquer link em segundos",
  subtitle: "Cole o endereço e aperte Encurtar.",
  inputLabel: "Link para encurtar",
  inputPlaceholder: "Cole seu link aqui",
  submit: "Encurtar",
  submitting: "Encurtando...",
  copy: "Copiar",
  copied: "Copiado!",
  open: "Abrir",
  historyTitle: "Links recentes (só neste navegador)",
  historyClear: "Limpar",
  languageLabel: "Idioma",
  invalidUrl: "Isso não parece um link. Exemplo: https://site.com/pagina",
  coldStart:
    "O servidor estava dormindo e está acordando. Na primeira vez pode levar até 1 minuto.",
  badRequest:
    "Não foi possível encurtar esse link. Confira o endereço e tente de novo.",
  rateLimited: (seconds: number) =>
    `Muitos links em pouco tempo. Tente de novo em ${seconds} s.`,
  serverError: "Algo deu errado do nosso lado. Tente de novo em instantes.",
  networkError:
    "Não consegui falar com o servidor. Verifique sua conexão e tente de novo.",
};

export type Messages = typeof ptBR;

// Typed as Messages: a missing or extra key fails the type check.
const en: Messages = {
  documentTitle: `${APP_NAME} | Shorten any link in seconds`,
  title: "Shorten any link in seconds",
  subtitle: "Paste the address and press Shorten.",
  inputLabel: "Link to shorten",
  inputPlaceholder: "Paste your link here",
  submit: "Shorten",
  submitting: "Shortening...",
  copy: "Copy",
  copied: "Copied!",
  open: "Open",
  historyTitle: "Recent links (this browser only)",
  historyClear: "Clear",
  languageLabel: "Language",
  invalidUrl: "That doesn't look like a link. Example: https://site.com/page",
  coldStart:
    "The server was asleep and is waking up. The first time can take up to 1 minute.",
  badRequest: "Couldn't shorten this link. Check the address and try again.",
  rateLimited: (seconds: number) =>
    `Too many links in a short time. Try again in ${seconds}s.`,
  serverError: "Something went wrong on our side. Try again in a moment.",
  networkError:
    "Couldn't reach the server. Check your connection and try again.",
};

export const messages: Record<Locale, Messages> = { "pt-BR": ptBR, en };

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
