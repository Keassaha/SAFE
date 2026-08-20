/**
 * La durée s'écrit en heures, jamais en minutes.
 *
 * Un cabinet facture en heures : la feuille de temps, le taux horaire et la
 * ligne de facture parlent tous la même langue. Le champ, lui, demandait des
 * minutes, ce qui obligeait l'avocate à faire la conversion de tête à chaque
 * saisie, et à la refaire en sens inverse pour relire ce qu'elle avait entré.
 *
 * Ce module tient la traduction à sa place : on lit ce que la personne a tapé
 * en heures, on rend des minutes entières, parce que la base de données stocke
 * `dureeMinutes` et qu'il n'y a aucune raison de la déranger pour une question
 * d'affichage.
 */

import { roundDurationMinutes } from "@/lib/temps/utils";

/** Au-delà, c'est une faute de frappe, pas une journée de travail. */
export const DUREE_MAX_HEURES = 24;

export type DureeParseError = "vide" | "illisible" | "zero" | "trop_longue";

export type DureeParseResult =
  | { ok: true; minutes: number }
  | { ok: false; error: DureeParseError };

/**
 * Lit une durée écrite à la main et rend des minutes entières.
 *
 * Formes acceptées, dans l'ordre où les gens les tapent réellement :
 *   1,5   1.5   1     ,5      → heures décimales (la virgule d'abord : c'est
 *                               celle du clavier francophone)
 *   1h30  1 h 30  1h  1:30    → heures et minutes dictées de tête
 *   90m   90 min  45 minutes  → sortie de secours pour qui pense en minutes
 *
 * Rend une erreur nommée plutôt que 0 : un zéro silencieux ferait passer une
 * saisie ratée pour une entrée valide, et c'est une heure facturable qui
 * disparaît sans que personne ne s'en aperçoive.
 */
export function parseDureeHeures(raw: string): DureeParseResult {
  const texte = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!texte) return { ok: false, error: "vide" };

  const minutes = lireMinutes(texte);
  if (minutes === null) return { ok: false, error: "illisible" };
  if (minutes <= 0) return { ok: false, error: "zero" };
  if (minutes > DUREE_MAX_HEURES * 60) return { ok: false, error: "trop_longue" };

  return { ok: true, minutes };
}

function lireMinutes(texte: string): number | null {
  // « 90m », « 45min », « 20 minutes » — on pense encore en minutes, on le dit.
  const enMinutes = /^(\d+(?:[.,]\d+)?)m(?:in(?:ute)?s?)?$/.exec(texte);
  if (enMinutes) {
    return Math.round(nombre(enMinutes[1]));
  }

  // « 1h30 », « 1h », « 1:30 ». Les minutes écrites après le séparateur sont
  // lues telles quelles : « 1h5 » vaut 1 h 05, comme sur une horloge.
  const heuresMinutes = /^(\d+)(?:h|:)(\d{1,2})?(?:m(?:in)?)?$/.exec(texte);
  if (heuresMinutes) {
    const h = Number(heuresMinutes[1]);
    const m = heuresMinutes[2] ? Number(heuresMinutes[2]) : 0;
    return h * 60 + m;
  }

  // « 1,5 », « 1.5 », « 1 », « ,5 » — la forme décimale, celle du champ.
  if (/^\d*[.,]?\d+$/.test(texte)) {
    return Math.round(nombre(texte) * 60);
  }

  return null;
}

function nombre(texte: string): number {
  return Number(texte.replace(",", "."));
}

/**
 * Écrit des minutes en heures décimales, dans la forme du lieu : « 1,5 » en
 * français, « 1.5 » en anglais. C'est le nombre qui finit sur la facture.
 */
export function formatHeuresDecimales(minutes: number, locale = "fr"): string {
  const heures = minutes / 60;
  return new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
    maximumFractionDigits: 2,
  }).format(heures);
}

/**
 * Écrit des minutes en heures et minutes : « 1 h 30 ».
 *
 * Sert d'écho sous le champ. Une avocate qui tape 1,5 doit voir « 1 h 30 »
 * apparaître, sinon rien ne lui confirme que le système a compris la même
 * chose qu'elle.
 */
export function formatDureeHM(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/** Valeur de départ du champ heures, à partir de minutes stockées. */
export function minutesVersChampHeures(minutes: number, locale = "fr"): string {
  return formatHeuresDecimales(minutes, locale);
}

/**
 * Traduit un chrono en cours en minutes facturables.
 *
 * Le même arrondi qu'à l'enregistrement, exprès : le nombre affiché pendant que
 * le chrono tourne doit être celui qui atterrira dans la fiche. Un chrono qui
 * annonce 0,75 h et une fiche qui enregistre 0,8 h font douter des deux.
 */
export function minutesFacturablesDuChrono(
  secondes: number,
  roundingMinutes: number
): number {
  if (secondes <= 0) return 0;
  const brutes = Math.max(1, Math.ceil(secondes / 60));
  return roundDurationMinutes(brutes, roundingMinutes);
}
