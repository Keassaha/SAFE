/**
 * SAFE — Dates calendaires.
 *
 * Une DATE CALENDAIRE est un jour du calendrier : le 17 août 2026. Ce n'est pas un
 * instant. « Le paiement du 17 » reste le 17 qu'on le regarde de Montréal, de
 * Vancouver ou d'un serveur en Europe.
 *
 * Postgres n'a pas de type « jour » ici : `dateTransaction`, `datePaiement`,
 * `dateEmission` et les dates de dépenses sont des colonnes `DateTime`. La
 * convention du projet, déjà appliquée dans le gabarit de facture, est de stocker
 * ces jours à MINUIT UTC et de les relire en UTC.
 *
 * Le défaut que ce module ferme : `z.coerce.date()` sur "2026-08-17" produit bien
 * `2026-08-17T00:00:00Z`, mais toute lecture LOCALE de cette valeur (getDate(),
 * Intl sans `timeZone`) tombe la veille à 20 h côté Montréal, et affiche le 16.
 * Saisie le 17, affichée le 16.
 *
 * Deux règles, et il faut les deux :
 *   - à l'ÉCRITURE, tout jour passe par `toCalendarDayUTC` ;
 *   - à la LECTURE, tout jour se formate en UTC (`formatCalendarDate`, `toIsoDay`).
 */

/**
 * Fuseau de référence des cabinets servis (Québec et Ontario partagent le même
 * décalage toute l'année). Il sert uniquement à décider QUEL JOUR il est quand on
 * convertit un instant en date calendaire : à 21 h le 17 à Montréal, il est déjà
 * le 18 en UTC, et l'écriture doit porter le 17, celui que l'avocate a vécu.
 *
 * Le jour où un cabinet sortira de ce fuseau, cette constante devient un champ de
 * `Cabinet` et les appels prennent le fuseau en paramètre. La signature le permet
 * déjà, pour que ce changement reste local.
 */
export const CABINET_TIME_ZONE = "America/Toronto";

/**
 * Convertit un INSTANT en la date calendaire qu'il représente dans `timeZone`,
 * ramenée à minuit UTC.
 *
 * À utiliser sur tout `new Date()` destiné à une colonne de jour. Sans ça, une
 * écriture passée en soirée porte la date du lendemain.
 */
export function toCalendarDayUTC(instant: Date, timeZone: string = CABINET_TIME_ZONE): Date {
  // Idempotence. Une valeur déjà à minuit UTC EST une date calendaire selon la
  // convention du projet : on la rend telle quelle. Sans ce garde, appliquer la
  // fonction deux fois reculerait d'un jour à chaque passage (minuit UTC se relit
  // 20 h la veille à Montréal), et le symptôme serait exactement le défaut qu'on
  // répare, en plus discret. Avec 18 points d'écriture au journal, la double
  // application est une question de temps, pas d'hypothèse.
  //
  // Prix assumé : un instant tombant EXACTEMENT sur 00:00:00.000 UTC est traité
  // comme un jour déjà normalisé. C'est une fenêtre d'une milliseconde, et la
  // convention veut de toute façon qu'à cet instant précis la valeur soit lue
  // comme le jour UTC.
  if (instant.getTime() % 86_400_000 === 0) return new Date(instant.getTime());

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const read = (type: "year" | "month" | "day"): number => {
    const part = parts.find((p) => p.type === type);
    if (!part) throw new Error(`Date calendaire illisible : ${type} manquant`);
    return Number(part.value);
  };

  return new Date(Date.UTC(read("year"), read("month") - 1, read("day")));
}

/**
 * Sérialise une date calendaire en `YYYY-MM-DD`, en UTC.
 *
 * Remplace tout `getFullYear()/getMonth()/getDate()`, qui lisent en heure locale et
 * décalent d'un jour les valeurs stockées à minuit UTC. Compte pour les exports
 * comptables, où le décalage part chez QuickBooks, Xero ou Sage.
 */
export function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
