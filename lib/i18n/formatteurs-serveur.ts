import { getLocale } from "next-intl/server";
import {
  formatCurrency as formatCurrencyBrut,
  formatDate as formatDateBrut,
  formatCalendarDate as formatCalendarDateBrut,
} from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";
import {
  formatDateShort as formatDateShortBrut,
  formatDateTimeHeader as formatDateTimeHeaderBrut,
} from "@/lib/formatDate";

/**
 * Formateurs liés à la locale du cabinet, pour les composants serveur.
 *
 * Pendant du hook `useFormatteurs()` des composants client. Le repli de
 * `lib/utils/format.ts` lit `document.documentElement.lang` : sur le serveur,
 * `document` n'existe pas et tout retombait sur le français, quelle que soit
 * la langue du cabinet.
 *
 * Un magasin de locale posé par le layout racine et lu ici a été essayé, puis
 * abandonné : React rend `children` en parallèle du layout qui `await`, donc la
 * page peut se rendre avant que le layout n'ait écrit. Mesuré, pas supposé.
 * `getLocale()` de next-intl, lui, est mémorisé par requête et n'a pas d'ordre
 * à respecter.
 *
 * ```tsx
 * const { formatCurrency } = await getFormatteurs();
 * ```
 *
 * Un composant non asynchrone (gabarit PDF, fonction de rendu appelée hors
 * requête) ne peut pas l'attendre : lui passer la locale en argument depuis son
 * appelant.
 */
export async function getFormatteurs() {
  const locale = await getLocale();
  return {
    formatCurrency: (montant: number, devise = "CAD", localeChoisie?: string) =>
      formatCurrencyBrut(montant, devise, localeChoisie ?? locale),
    formatDate: (date: Date | string, localeChoisie?: string) =>
      formatDateBrut(date, localeChoisie ?? locale),
    formatCalendarDate: (date: Date | string, localeChoisie?: string) =>
      formatCalendarDateBrut(date, localeChoisie ?? locale),
    formatDateShort: (date: Date, localeChoisie?: string) =>
      formatDateShortBrut(date, localeChoisie ?? locale),
    formatDateTimeHeader: (date: Date, localeChoisie?: string) =>
      formatDateTimeHeaderBrut(date, localeChoisie ?? locale),
    locale,
    /** « fr-CA » ou « en-CA », pour un `Intl.*` monté à la main dans l'écran. */
    intlLocale: toIntlLocale(locale),
  };
}
