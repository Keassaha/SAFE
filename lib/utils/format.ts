import { getCurrentIntlLocale, toIntlLocale } from "@/lib/i18n/locale";

export function formatCurrency(amount: number, currency = "CAD", locale?: string): string {
  return new Intl.NumberFormat(locale ? toIntlLocale(locale) : getCurrentIntlLocale(), {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ? toIntlLocale(locale) : getCurrentIntlLocale(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}
