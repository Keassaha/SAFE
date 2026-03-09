import { getCurrentIntlLocale, toIntlLocale } from "@/lib/i18n/locale";

/**
 * Format de date court pour le design system — ex. "4 mars", "10 juin".
 * Utilisé dans les en-têtes, cartes et listes pour une lecture rapide.
 */
export function formatDateShort(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale ? toIntlLocale(locale) : getCurrentIntlLocale(), {
    day: "numeric",
    month: "short",
  });
}

/**
 * Format date + heure pour en-tête de dashboard.
 */
export function formatDateTimeHeader(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale ? toIntlLocale(locale) : getCurrentIntlLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
