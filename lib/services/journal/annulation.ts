/**
 * SAFE — Annulation d'une écriture du journal général.
 *
 * Doctrine: docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md
 *
 * Ce que le cabinet appelle « supprimer », la base l'écrit comme une
 * CONTREPASSATION : une écriture de sens inverse et de montant strictement égal,
 * liée à l'originale, motivée, datée et signée. L'originale ne bouge JAMAIS.
 *
 * Les deux lignes quittent la vue courante et les totaux, et vivent dans le
 * registre des corrections. Rien n'est effacé : art. 34 et 38 B-1 r.5 (QC) /
 * s. 18 By-Law 9 (ON) exigent des registres conservés et complets.
 *
 * Les garde-fous sont PURS et testables (`assertAnnulable`, `buildContrepassation`),
 * l'écriture est transaction-aware.
 */

import type {
  JournalCorrectionMotive,
  JournalSourceModule,
  JournalTransactionType,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { createJournalEntry } from "./journal-service";
import { createAuditLog } from "@/lib/services/audit";
import { JOURNAL_MOTIVE_LABELS } from "@/types/journal";

type JournalPrismaClient = PrismaClient | Prisma.TransactionClient;

/** Longueur minimale du texte quand le motif est `AUTRE` (doctrine §2). */
export const MOTIF_TEXTE_MIN = 10;

/* ════════════════════════════════════════════════════════════════
   GARDE-FOUS PURS
   ════════════════════════════════════════════════════════════════ */

/** Sous-ensemble d'une écriture nécessaire pour décider si elle est annulable. */
export interface AnnulableEntry {
  id: string;
  sourceModule: JournalSourceModule;
  montantEntree: number;
  montantSortie: number;
  /** Non nul si CETTE écriture est elle-même une contrepassation. */
  annuleId: string | null;
  /** Non nul si cette écriture est DÉJÀ annulée par une autre. */
  annuleParId: string | null;
}

export type AnnulationRefus =
  | "deja_annulee"
  | "est_une_annulation"
  | "module_metier"
  | "montant_nul";

export interface AnnulationVerdict {
  ok: boolean;
  refus?: AnnulationRefus;
  message?: string;
}

/**
 * Seules les écritures SAISIES À LA MAIN au journal s'annulent d'ici.
 *
 * Une écriture issue d'un module métier (facture, paiement, dépense, débours,
 * fidéicommis) est le REFLET d'un objet qui existe ailleurs. L'annuler au journal
 * seul ferait diverger le journal de la facture, ce qui est exactement le défaut
 * qu'on répare. Elle s'annule dans son module, qui contrepasse ensuite le journal.
 */
const MODULES_ANNULABLES_AU_JOURNAL: readonly JournalSourceModule[] = [
  "AJUSTEMENT_MANUEL",
] as const;

/** Où renvoyer le cabinet quand l'écriture appartient à un module métier. */
export const MODULE_DESTINATION: Record<JournalSourceModule, string> = {
  FACTURATION: "la facture d'origine",
  PAIEMENTS: "l'encaissement, dans Facturation puis Paiements",
  FIDEICOMMIS: "le registre de fidéicommis",
  DEPENSES: "le journal des dépenses",
  DEBOURS: "le débours du dossier",
  IMPORT_BANCAIRE: "l'import bancaire d'origine",
  AJUSTEMENT_MANUEL: "le journal général",
  CORRECTION_SYSTEME: "le journal général",
};

/** Décide si une écriture peut être annulée depuis le journal. Fonction pure. */
export function assertAnnulable(entry: AnnulableEntry): AnnulationVerdict {
  if (entry.annuleParId) {
    return {
      ok: false,
      refus: "deja_annulee",
      message: "Cette écriture est déjà annulée. Elle figure au registre des corrections.",
    };
  }
  if (entry.annuleId) {
    return {
      ok: false,
      refus: "est_une_annulation",
      message:
        "Une annulation ne s'annule pas : elle prouve la correction. " +
        "Pour rétablir le montant, passez une nouvelle écriture.",
    };
  }
  if (!MODULES_ANNULABLES_AU_JOURNAL.includes(entry.sourceModule)) {
    return {
      ok: false,
      refus: "module_metier",
      message:
        `Cette écriture vient d'un autre module. Annulez-la dans ${MODULE_DESTINATION[entry.sourceModule]} : ` +
        "le journal se corrigera tout seul. Sinon le journal et le module diraient deux choses différentes.",
    };
  }
  if (entry.montantEntree === 0 && entry.montantSortie === 0) {
    return {
      ok: false,
      refus: "montant_nul",
      message: "Cette écriture ne porte aucun montant : il n'y a rien à contrepasser.",
    };
  }
  return { ok: true };
}

export interface MotifInput {
  code: JournalCorrectionMotive;
  texte?: string | null;
}

export interface MotifVerdict {
  ok: boolean;
  message?: string;
  texte?: string | null;
}

/**
 * Valide le motif. `AUTRE` exige un texte réel : sans lui, le motif ne prouve rien
 * le jour de l'inspection, et le registre des corrections devient illisible.
 */
export function validateMotif(motif: MotifInput): MotifVerdict {
  const texte = motif.texte?.trim() || null;
  if (motif.code === "AUTRE") {
    if (!texte || texte.length < MOTIF_TEXTE_MIN) {
      return {
        ok: false,
        message: `Précisez le motif en ${MOTIF_TEXTE_MIN} caractères au moins.`,
      };
    }
  }
  return { ok: true, texte };
}

export interface Contrepassation {
  typeTransaction: JournalTransactionType;
  sourceModule: JournalSourceModule;
  montantEntree: number;
  montantSortie: number;
  description: string;
}

/**
 * Construit la contrepassation d'une écriture. Fonction pure.
 *
 * Les montants sont STRICTEMENT inversés, jamais recalculés : l'annulation doit
 * ramener l'effet net à zéro au centime près, quoi qu'il arrive en aval.
 */
export function buildContrepassation(
  entry: Pick<AnnulableEntry, "montantEntree" | "montantSortie" | "sourceModule">,
  descriptionOrigine: string,
  motif: MotifInput,
): Contrepassation {
  const precision = motif.texte?.trim();
  const libelleMotif = JOURNAL_MOTIVE_LABELS[motif.code];
  const description = [
    `Annulation — ${descriptionOrigine}`,
    `Motif : ${libelleMotif}${precision ? ` (${precision})` : ""}`,
  ]
    .join(" · ")
    .slice(0, 500);

  return {
    typeTransaction: "CORRECTION",
    // Une correction de fidéicommis reste du fidéicommis : `isTrustEntry` la classe
    // sur le solde client, jamais sur le cash du cabinet. Pour tout le reste, la
    // contrepassation est une correction système.
    sourceModule: entry.sourceModule === "FIDEICOMMIS" ? "FIDEICOMMIS" : "CORRECTION_SYSTEME",
    montantEntree: entry.montantSortie,
    montantSortie: entry.montantEntree,
    description,
  };
}

/* ════════════════════════════════════════════════════════════════
   ÉCRITURE
   ════════════════════════════════════════════════════════════════ */

export interface AnnulerEcritureParams {
  entryId: string;
  cabinetId: string;
  motifCode: JournalCorrectionMotive;
  motifTexte?: string | null;
  utilisateurId?: string | null;
}

export interface AnnulerEcritureResult {
  annulationId: string;
  montantNeutralise: number;
}

/**
 * Annule une écriture manuelle du journal en écrivant sa contrepassation.
 *
 * La contrepassation est datée d'AUJOURD'HUI, jamais à la date d'origine : si le
 * mois d'origine est verrouillé (rapprochement certifié, clôture), une écriture
 * antidatée serait refusée par `createJournalEntry`, et surtout elle rouvrirait un
 * mois déjà certifié par l'avocat. La date d'origine est rappelée en description.
 */
export async function annulerEcritureJournal(
  params: AnnulerEcritureParams,
): Promise<AnnulerEcritureResult> {
  const { entryId, cabinetId, motifCode, motifTexte, utilisateurId } = params;

  const motif = validateMotif({ code: motifCode, texte: motifTexte });
  if (!motif.ok) throw new Error(motif.message);

  const result = await prisma.$transaction(async (tx) => {
    // Sérialise deux annulations concurrentes de la même écriture. L'index UNIQUE
    // sur `annuleId` reste le garde-fou dur ; ce verrou évite juste que la seconde
    // requête aille jusqu'à l'erreur Postgres.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`journal-annulation:${entryId}`}))`;

    const entry = await tx.journalGeneralEntry.findFirst({
      where: { id: entryId, cabinetId },
      select: {
        id: true,
        dateTransaction: true,
        description: true,
        reference: true,
        clientId: true,
        dossierId: true,
        categorie: true,
        sourceModule: true,
        montantEntree: true,
        montantSortie: true,
        annuleId: true,
        annulePar: { select: { id: true } },
      },
    });
    if (!entry) throw new Error("Écriture introuvable");

    const verdict = assertAnnulable({
      id: entry.id,
      sourceModule: entry.sourceModule,
      montantEntree: entry.montantEntree,
      montantSortie: entry.montantSortie,
      annuleId: entry.annuleId,
      annuleParId: entry.annulePar?.id ?? null,
    });
    if (!verdict.ok) throw new Error(verdict.message);

    const contrepassation = buildContrepassation(
      entry,
      `${entry.description} du ${formatDateFr(entry.dateTransaction)}`,
      { code: motifCode, texte: motif.texte },
    );

    const created = await createJournalEntry(
      {
        cabinetId,
        dateTransaction: new Date(),
        typeTransaction: contrepassation.typeTransaction,
        reference: entry.reference,
        clientId: entry.clientId,
        dossierId: entry.dossierId,
        description: contrepassation.description,
        categorie: entry.categorie,
        montantEntree: contrepassation.montantEntree,
        montantSortie: contrepassation.montantSortie,
        sourceModule: contrepassation.sourceModule,
        sourceId: null,
        utilisateurId: utilisateurId ?? null,
        annuleId: entry.id,
        motifCode,
        motifTexte: motif.texte,
      },
      tx,
    );

    return {
      annulationId: created.id,
      montantNeutralise: Math.max(entry.montantEntree, entry.montantSortie),
    };
  });

  await createAuditLog({
    cabinetId,
    userId: utilisateurId ?? undefined,
    entityType: "JournalGeneralEntry",
    entityId: entryId,
    action: "reverse",
    newValues: {
      annulationId: result.annulationId,
      motifCode,
      motifTexte: motif.texte,
    },
    performedBy: utilisateurId ?? undefined,
    performedAt: new Date(),
  });

  return result;
}

/**
 * Écrit la contrepassation d'une écriture déjà journalisée par un MODULE MÉTIER.
 *
 * Appelé par les modules eux-mêmes (paiement annulé, etc.), jamais par l'écran du
 * journal : c'est le module qui reste maître de son objet, le journal ne fait que
 * refléter. Voir `assertAnnulable` / refus `module_metier`.
 */
export async function contrepasserEcritureSource(params: {
  cabinetId: string;
  sourceModule: JournalSourceModule;
  sourceId: string;
  motifCode: JournalCorrectionMotive;
  motifTexte?: string | null;
  utilisateurId?: string | null;
  client?: JournalPrismaClient;
}): Promise<{ annulationId: string; montantNeutralise: number } | null> {
  const {
    cabinetId,
    sourceModule,
    sourceId,
    motifCode,
    motifTexte,
    utilisateurId,
  } = params;
  const client = params.client ?? prisma;

  // On cherche l'écriture VIVANTE de cette source : l'initiale `sourceId`, ou le
  // dernier re-jeu `sourceId#vN` si l'objet a déjà été corrigé une fois. Les
  // versions antérieures portent déjà leur contrepassation, on ne les touche plus.
  const entry = await client.journalGeneralEntry.findFirst({
    where: {
      cabinetId,
      sourceModule,
      OR: [{ sourceId }, { sourceId: { startsWith: `${sourceId}#v` } }],
      annulePar: { is: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      dateTransaction: true,
      description: true,
      reference: true,
      clientId: true,
      dossierId: true,
      categorie: true,
      sourceModule: true,
      montantEntree: true,
      montantSortie: true,
    },
  });
  // Rien au journal (montant nul, écriture jamais passée, déjà contrepassée) :
  // il n'y a rien à faire, et ce n'est pas une erreur.
  if (!entry) return null;

  const contrepassation = buildContrepassation(
    entry,
    `${entry.description} du ${formatDateFr(entry.dateTransaction)}`,
    { code: motifCode, texte: motifTexte },
  );

  const created = await createJournalEntry(
    {
      cabinetId,
      dateTransaction: new Date(),
      typeTransaction: contrepassation.typeTransaction,
      reference: entry.reference,
      clientId: entry.clientId,
      dossierId: entry.dossierId,
      description: contrepassation.description,
      categorie: entry.categorie,
      montantEntree: contrepassation.montantEntree,
      montantSortie: contrepassation.montantSortie,
      sourceModule: contrepassation.sourceModule,
      sourceId: null,
      utilisateurId: utilisateurId ?? null,
      annuleId: entry.id,
      motifCode,
      motifTexte: motifTexte?.trim() || null,
    },
    client,
  );

  return {
    annulationId: created.id,
    montantNeutralise: Math.max(entry.montantEntree, entry.montantSortie),
  };
}

function formatDateFr(date: Date): string {
  return date.toISOString().slice(0, 10);
}
