/**
 * SAFE — Écriture au journal général pour un `DeboursDossier`.
 *
 * Doctrine : docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md §4
 *            docs/accounting/EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md §3
 *
 * Règle métier centrale : un `DeboursDossier` représente un coût avancé par
 * le cabinet pour le compte d'un dossier. Tant qu'il n'est pas payé par
 * le cabinet (`payeParCabinet=true`), il n'y a aucune sortie de trésorerie
 * réelle — donc aucune écriture au journal. Dès qu'il est payé, on doit
 * journaliser une sortie en `DEBOURS`, indépendamment de la refacturation
 * future au client.
 *
 * Idempotence :
 *   - sourceModule = "DEBOURS"
 *   - sourceId     = debours.id
 *   - clé strictement identique au pattern `CabinetExpense`. Jamais sur `reference`.
 *
 * Append-only : aucune écriture existante n'est modifiée. Si `payeParCabinet`
 * repasse à `false` après journalisation, on laisse l'entrée existante en place
 * (la correction passe par `createCorrectiveJournalEntry`, hors scope ici).
 */

import type { Prisma, PrismaClient, DeboursDossier, DeboursType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createJournalEntry } from "./journal-service";
import { isJournalIdempotencyConflict } from "./idempotency";

type JournalPrismaClient = PrismaClient | Prisma.TransactionClient;

export const DEBOURS_DOSSIER_JOURNAL_SOURCE_MODULE = "DEBOURS" as const;

export interface WriteDeboursEntryOptions {
  /** Client Prisma — passez le `tx` quand vous êtes dans une transaction. */
  client?: JournalPrismaClient;
  /** Utilisateur qui valide le débours (alimente `utilisateurId`). */
  utilisateurId?: string | null;
  /**
   * `DeboursType` associé, si déjà chargé. Sert à enrichir la catégorie et la
   * description sans relancer une requête. Optionnel — le helper fonctionne
   * sans, en s'appuyant sur `debours.description`.
   */
  deboursType?: Pick<DeboursType, "nom" | "categorie" | "gouvernementRef"> | null;
}

export type WriteDeboursEntryResult =
  | {
      created: true;
      journalId: string;
      reason?: undefined;
    }
  | {
      created: false;
      /** Renseigné quand on a trouvé une écriture existante (idempotence). */
      journalId?: string;
      /** Raison d'absence d'écriture. */
      reason: "already_journalized" | "not_paid_by_cabinet" | "amount_zero";
    };

/**
 * Écrit (ou ré-utilise) l'entrée journal pour un `DeboursDossier` payé par le cabinet.
 *
 * Fonction idempotente : deux appels successifs avec le même `debours.id`
 * ne créeront jamais deux entrées au journal.
 *
 * Le `montant` du `DeboursDossier` est déjà un total (calculé `quantite × prixUnitaire`
 * à la création — voir `lib/actions/debours.ts:29` et `lib/services/forfait-billing-service.ts`).
 * Le helper l'utilise tel quel sans multiplier par `quantite`.
 */
export async function writeJournalForDeboursPaiement(
  debours: DeboursDossier,
  opts: WriteDeboursEntryOptions = {},
): Promise<WriteDeboursEntryResult> {
  const client = opts.client ?? prisma;

  // 1) Le débours doit être effectivement payé par le cabinet.
  if (!debours.payeParCabinet) {
    return { created: false, reason: "not_paid_by_cabinet" };
  }

  // 2) Montant > 0 obligatoire (déjà total — pas de multiplication ici).
  const amount = Math.abs(debours.montant ?? 0);
  if (amount <= 0) {
    return { created: false, reason: "amount_zero" };
  }

  // 3) Idempotence sur (cabinetId, sourceModule, sourceId).
  const existing = await client.journalGeneralEntry.findFirst({
    where: {
      cabinetId: debours.cabinetId,
      sourceModule: DEBOURS_DOSSIER_JOURNAL_SOURCE_MODULE,
      sourceId: debours.id,
    },
    select: { id: true },
  });
  if (existing) {
    return { created: false, journalId: existing.id, reason: "already_journalized" };
  }

  // 4) Crée l'entrée via le service journal (qui calcule le solde cumulé).
  //    Une course concurrente peut faire passer le findFirst à null pour
  //    deux callers en parallèle ; l'index unique partiel structurel
  //    `JournalGeneralEntry_idempotency_key` est le filet final. En cas
  //    de P2002, on transforme en no-op idempotent.
  try {
    const created = await createJournalEntry(
      {
        cabinetId: debours.cabinetId,
        dateTransaction: debours.date,
        typeTransaction: "DEBOURS",
        // La référence métier reste libre — pas utilisée pour l'idempotence.
        reference: null,
        clientId: debours.clientId,
        dossierId: debours.dossierId,
        description: pickDescription(debours, opts.deboursType ?? null),
        categorie: pickCategorie(opts.deboursType ?? null),
        montantEntree: 0,
        montantSortie: amount,
        sourceModule: DEBOURS_DOSSIER_JOURNAL_SOURCE_MODULE,
        sourceId: debours.id,
        utilisateurId: opts.utilisateurId ?? null,
      },
      client,
    );
    return { created: true, journalId: created.id };
  } catch (e) {
    if (!isJournalIdempotencyConflict(e)) throw e;
    const winner = await client.journalGeneralEntry.findFirst({
      where: {
        cabinetId: debours.cabinetId,
        sourceModule: DEBOURS_DOSSIER_JOURNAL_SOURCE_MODULE,
        sourceId: debours.id,
      },
      select: { id: true },
    });
    return {
      created: false,
      journalId: winner?.id,
      reason: "already_journalized",
    };
  }
}

/* ───────────────────── Mapping interne ───────────────────── */

function pickDescription(
  debours: DeboursDossier,
  deboursType: WriteDeboursEntryOptions["deboursType"],
): string {
  const description = (debours.description ?? "").trim();
  if (description) return description.slice(0, 500);
  const typeName = (deboursType?.nom ?? "").trim();
  if (typeName) return typeName.slice(0, 500);
  return "Débours dossier";
}

function pickCategorie(
  deboursType: WriteDeboursEntryOptions["deboursType"],
): string | null {
  if (!deboursType) return null;
  const cat = (deboursType.categorie ?? "").trim();
  return cat ? cat.slice(0, 200) : null;
}
