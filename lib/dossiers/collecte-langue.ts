/**
 * SAFE — La langue de la page de dépôt.
 *
 * LA LANGUE DU CLIENT, PAS CELLE DU NAVIGATEUR NI CELLE DU CABINET.
 *
 * Le reste de l'application choisit sa langue par un témoin `NEXT_LOCALE`, posé quand
 * quelqu'un se connecte. Le client qui ouvre son lien n'a pas de compte et n'a jamais
 * mis les pieds dans l'application : ce témoin n'existe pas, et la page tomberait
 * systématiquement en français. Au 2026-08-19, neuf clients de production sont
 * inscrits comme anglophones.
 *
 * La source est donc `Client.langue`, renseignée à l'ouverture de la fiche. Sans
 * valeur, on garde le français : c'est la langue de la majorité des cabinets servis,
 * et un défaut explicite vaut mieux qu'une déduction faite sur l'en-tête du
 * navigateur, qui dit la langue de l'appareil et non celle de la personne.
 */

import type { Locale } from "@/i18n/request";

export function localeDuClient(langue: string | null | undefined): Locale {
  return langue?.trim().toUpperCase() === "EN" ? "en" : "fr";
}

/** Les messages du seul namespace utile à cette page. */
export async function messagesCollecte(locale: Locale) {
  const all = (await import(`@/messages/${locale}.json`)).default as Record<
    string,
    Record<string, string>
  >;
  return all.collecte;
}

/**
 * Traduction hors React, pour la route de dépôt qui répond en JSON.
 * `{n}`, `{date}` : mêmes marqueurs que next-intl, remplacés bêtement.
 */
export function traduire(
  messages: Record<string, string>,
  cle: string,
  valeurs?: Record<string, string | number>,
): string {
  const brut = messages[cle] ?? cle;
  if (!valeurs) return brut;
  return Object.entries(valeurs).reduce(
    (texte, [k, v]) => texte.replaceAll(`{${k}}`, String(v)),
    brut,
  );
}
