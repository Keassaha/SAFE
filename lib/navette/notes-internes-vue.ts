/**
 * SAFE — Notes internes : la logique de l'écran, sans écran.
 *
 * Pourquoi ce fichier existe : ce qui décide de la forme d'une entrée (une
 * demande à trancher, un message humain, un évènement terminé) et des boutons
 * qui l'accompagnent EST une règle métier. Laissée dans le composant, elle
 * n'était vérifiable qu'à l'œil, et c'est précisément là que l'écran s'était
 * mis à proposer « Approuver » à qui n'avait rien à approuver.
 *
 * Ces fonctions sont pures. Le composant les appelle, les tests aussi, et
 * elles s'appuient sur les MÊMES garde-fous que le serveur : l'interface ne
 * peut pas offrir un bouton que l'action refuserait.
 */

import type { NavetteMessageType } from "@prisma/client";
import { checkNavetteDecision, checkNavetteResolve } from "./navette-permissions";

/** Ligne sérialisée (dates en ISO) passée depuis le serveur. */
export interface SerializedNavetteRow {
  id: string;
  type: NavetteMessageType;
  body: string | null;
  authorId: string;
  authorName: string | null;
  authorRole: string;
  recipientId: string | null;
  recipientName: string | null;
  parentId: string | null;
  dueDate: string | null;
  confidentiel: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

/** Les types qui portent du texte écrit par une personne. */
export const TYPES_MESSAGE: NavetteMessageType[] = ["question", "info", "reply"];

export interface EntreeATraiter {
  row: SerializedNavetteRow;
  /** Approuver ou demander une correction (demande de révision seulement). */
  peutDecider: boolean;
  /** Marquer traité. */
  peutResoudre: boolean;
}

export interface RepartitionNotes {
  aTraiter: EntreeATraiter[];
  echanges: SerializedNavetteRow[];
  historique: SerializedNavetteRow[];
}

/**
 * Répartit les entrées en trois zones. Chacune tombe dans UNE seule, dans cet
 * ordre : ce qui attend un geste de ma part, ce que quelqu'un a écrit, le
 * reste. `dejaTranchees` porte les décisions prises dans cette page et pas
 * encore revenues du serveur, pour que la demande quitte « À traiter » sans
 * attendre un aller-retour.
 */
export function repartirNotes(args: {
  rows: SerializedNavetteRow[];
  userId: string;
  role: string;
  dejaTranchees?: string[];
}): RepartitionNotes {
  const { rows, userId, role } = args;
  const tranchees = new Set(args.dejaTranchees ?? []);
  const aTraiter: EntreeATraiter[] = [];
  const echanges: SerializedNavetteRow[] = [];
  const historique: SerializedNavetteRow[] = [];

  for (const r of rows) {
    const instantane = {
      type: r.type,
      recipientId: r.recipientId,
      resolvedAt: tranchees.has(r.id)
        ? new Date()
        : r.resolvedAt
          ? new Date(r.resolvedAt)
          : null,
      confidentiel: r.confidentiel,
    };
    const peutDecider = checkNavetteDecision({ role, userId, decision: "approve", request: instantane }).ok;
    const peutResoudre = checkNavetteResolve({ role, userId, message: instantane }).ok;

    if (peutDecider || peutResoudre) aTraiter.push({ row: r, peutDecider, peutResoudre });
    else if (TYPES_MESSAGE.includes(r.type)) echanges.push(r);
    else historique.push(r);
  }

  const asc = (a: { createdAt: string }, b: { createdAt: string }) =>
    +new Date(a.createdAt) - +new Date(b.createdAt);

  aTraiter.sort((a, b) => asc(a.row, b.row));
  echanges.sort(asc);
  historique.sort((a, b) => asc(b, a));
  return { aTraiter, echanges, historique };
}

export type ActionNote = "approve" | "request_correction" | "mark_addressed" | "reply";

/**
 * Les actions offertes sur une entrée à traiter, dans l'ordre d'affichage.
 * UNE seule action principale : c'est la première de la liste.
 */
export function actionsPour(entree: EntreeATraiter): ActionNote[] {
  if (entree.peutDecider) return ["approve", "request_correction", "reply"];
  if (entree.peutResoudre) {
    return entree.row.type === "question" || entree.row.type === "sent_back"
      ? ["mark_addressed", "reply"]
      : ["mark_addressed"];
  }
  return [];
}

/**
 * Le type d'une note libre.
 *
 * Ce que ça corrige : l'écran enregistrait TOUT en `question`, y compris une
 * note qui n'interrogeait personne. Le compteur « ce qui vous attend » comptait
 * donc des questions qui n'en étaient pas.
 */
export function typeDeNote(mode: "note" | "question" | "reply"): NavetteMessageType {
  if (mode === "question") return "question";
  if (mode === "reply") return "reply";
  return "info";
}

/**
 * Une soumission pour révision n'est proposée que si aucune n'est déjà
 * ouverte. Deux demandes vivantes sur un dossier, c'est la garantie qu'une
 * approbation en laisse une orpheline.
 */
export function revueDejaEnAttente(
  rows: SerializedNavetteRow[],
  dejaTranchees: string[] = [],
): boolean {
  const tranchees = new Set(dejaTranchees);
  return rows.some((r) => r.type === "ready_for_review" && !r.resolvedAt && !tranchees.has(r.id));
}

/**
 * Mouvement : le mode réduit conserve le fondu et retire toute interpolation
 * spatiale, jamais l'inverse. Une hauteur qui s'anime EST une interpolation
 * spatiale (WCAG 2.3.3).
 */
export function variantesEntree(reduceMotion: boolean) {
  return reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: "auto" as const },
        exit: { opacity: 0, height: 0 },
      };
}
