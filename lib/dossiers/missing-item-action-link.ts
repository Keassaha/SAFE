/**
 * SAFE — Routage des "manquants" vers leur action concrète.
 *
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
 *
 * Quand on affiche un manquant, l'utilisateur doit pouvoir cliquer et arriver
 * directement à l'écran qui permet de traiter le manquant — pas seulement
 * sur la fiche dossier.
 *
 * Helper pur: aucune dépendance Prisma, aucune logique métier — juste un
 * mapping de `MissingItemKind` vers un chemin URL relatif.
 */

import { routes } from "@/lib/routes";
import type { MissingItem, MissingItemKind } from "./preparation-status";

export interface MissingItemActionContext {
  dossierId: string;
  clientId: string;
}

export type MissingItemAction =
  /** Lien classique (route relative). */
  | { kind: "link"; href: string; label: string }
  /** Action serveur — gérée par l'UI (ex: bouton "Assigner à moi"). */
  | { kind: "self_assign"; label: string }
  /** Aucune action automatisable — juste un libellé d'orientation. */
  | { kind: "info"; label: string };

/**
 * Retourne l'action recommandée pour un manquant donné.
 *
 * Convention V2 (couvre les `kind` les plus rentables) :
 *   - `assistant`           → action `self_assign` (bouton dédié dans la file)
 *   - `mandate`             → édition dossier (formulaire avec mandat)
 *   - `identity`            → page de vérification d'identité du client
 *   - `conflict`            → fiche dossier (section conflits)
 *   - `billing_mode`        → édition dossier
 *   - `checklist`           → fiche dossier (à proximité du mandat)
 *   - `cartable_section`    → fiche dossier
 *   - `debours`             → fiche dossier (section débours)
 *   - `event_deadline`      → LexTrack du dossier
 *   - `admin_task`          → fiche dossier
 */
export function getMissingItemAction(
  item: MissingItem,
  ctx: MissingItemActionContext,
): MissingItemAction {
  switch (item.kind) {
    case "assistant":
      return { kind: "self_assign", label: "Assigner à moi" };

    case "identity":
      return {
        kind: "link",
        href: routes.clientVerificationIdentite(ctx.clientId),
        label: "Vérifier l'identité",
      };

    case "mandate":
    case "billing_mode":
      return {
        kind: "link",
        href: `${routes.dossier(ctx.dossierId)}?edit=1`,
        label: "Éditer le dossier",
      };

    case "checklist":
    case "cartable_section":
    case "debours":
    case "conflict":
      return {
        kind: "link",
        href: routes.dossier(ctx.dossierId),
        label: "Ouvrir le dossier",
      };

    case "event_deadline":
      return {
        kind: "link",
        href: routes.gestionLexTrackDossier(ctx.dossierId),
        label: "Préparer dans LexTrack",
      };

    case "admin_task":
      return {
        kind: "link",
        href: routes.dossier(ctx.dossierId),
        label: "Voir les tâches",
      };
  }
}

/**
 * Helper inverse pratique: pour une catégorie de manquant donnée, on connait
 * la route — utile pour afficher un lien au-dessus d'un groupe de manquants
 * (par ex. plusieurs items de checklist tombant sur la même destination).
 */
export function getKindCanonicalLink(
  kind: MissingItemKind,
  ctx: MissingItemActionContext,
): string | null {
  switch (kind) {
    case "assistant":
      return null; // action et non lien
    case "identity":
      return routes.clientVerificationIdentite(ctx.clientId);
    case "mandate":
    case "billing_mode":
      return `${routes.dossier(ctx.dossierId)}?edit=1`;
    case "checklist":
    case "cartable_section":
    case "debours":
    case "conflict":
    case "admin_task":
      return routes.dossier(ctx.dossierId);
    case "event_deadline":
      return routes.gestionLexTrackDossier(ctx.dossierId);
  }
}
