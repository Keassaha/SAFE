"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  formatCurrency as formatCurrencyBrut,
  formatDate as formatDateBrut,
  formatCalendarDate as formatCalendarDateBrut,
} from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";
import { formatDateShort as formatDateShortBrut, formatDateTimeHeader as formatDateTimeHeaderBrut } from "@/lib/formatDate";

/**
 * Formateurs liés à la locale du cabinet, pour les composants `"use client"`.
 *
 * Le repli de `lib/utils/format.ts` lit `document.documentElement.lang`, juste
 * dans le navigateur mais absent au rendu serveur — et le rendu serveur d'un
 * composant client passe par le build client de React, donc le magasin de
 * requête ne l'atteint pas non plus. Un cabinet en anglais recevait donc
 * « 1 234,56 $ » du serveur puis « $1,234.56 » après hydratation : deux
 * écritures du même montant, et une divergence d'hydratation React.
 *
 * `useLocale()` rend la même valeur des deux côtés, puisque
 * `NextIntlClientProvider` la reçoit du serveur. Ce hook est donc le seul
 * chemin juste dans un composant client.
 *
 * Usage — les noms sont ceux des fonctions brutes, pour que le corps du
 * composant ne change pas :
 *
 * ```tsx
 * const { formatCurrency, formatCalendarDate } = useFormatteurs();
 * ```
 *
 * Hors composant (module, helper de haut niveau, action serveur), ce hook n'est
 * pas appelable : passer la locale en dernier argument des fonctions brutes.
 */
export function useFormatteurs() {
  const locale = useLocale();
  return useMemo(
    () => ({
      // Chaque formateur garde la signature de sa fonction brute, dernier
      // argument compris : un appel qui passait déjà sa locale continue de
      // compiler et de gagner, et la migration d'un fichier se limite alors à
      // son import.
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
      /** Le code de langue du cabinet, « fr » ou « en ». */
      locale,
      /** « fr-CA » ou « en-CA », pour un `Intl.*` monté à la main dans l'écran. */
      intlLocale: toIntlLocale(locale),
    }),
    [locale],
  );
}
