export type AppLocale = "fr" | "en";

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "fr" || value === "en";
}

export function normalizeAppLocale(locale?: string | null): AppLocale {
  return locale === "en" ? "en" : "fr";
}

export function toIntlLocale(locale?: string | null): string {
  return normalizeAppLocale(locale) === "en" ? "en-CA" : "fr-CA";
}

export function getCurrentLocaleFromDocument(): AppLocale {
  if (typeof document === "undefined") {
    return "fr";
  }

  return normalizeAppLocale(document.documentElement.lang);
}

export function getCurrentIntlLocale(): string {
  return toIntlLocale(getCurrentLocaleFromDocument());
}
