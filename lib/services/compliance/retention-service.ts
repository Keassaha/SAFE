/**
 * Conservation : ce qui devient purgeable, et le refus de purger.
 *
 * Art. 30, 31, 32, 33 B-1 r.5 · By-Law 9 s. 21(2), 23(1), 23(2), 23(3).
 *
 * ⚠️ CE SERVICE NE SUPPRIME RIEN, ET C'EST VOULU.
 *
 * Il calcule les échéances, dresse la liste de ce qui devient purgeable, et refuse
 * quand la règle ne le permet pas. La destruction elle-même n'est pas implémentée :
 * aucun cabinet servi par SAFE n'a de pièce arrivée à échéance — le produit est trop
 * jeune pour cela. Écrire aujourd'hui du code de suppression que personne ne peut
 * tester sur des données réelles créerait un risque irréversible pour un besoin qui
 * n'existe pas encore.
 *
 * Ce qui est utile MAINTENANT, c'est l'inverse : pouvoir prouver qu'on conserve, et
 * savoir jusqu'à quand.
 */

import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  assessPurgeEligibility,
  getAllRetentionRules,
  getRetentionFormDuties,
  getRetentionRule,
  type PurgeEligibility,
  type RetainedRecordKind,
  type RetentionRule,
} from "@/lib/compliance/retention";

/* ════════════════════════════════════════════════════════════════
   LA FIN D'EXERCICE, SANS LAQUELLE RIEN NE SE CALCULE
   ════════════════════════════════════════════════════════════════ */

export interface FiscalYearEnd {
  month: number;
  day: number;
}

/**
 * Fin d'exercice du cabinet, depuis `Cabinet.fiscalYearEnd` (posé au CH-00).
 *
 * Renvoie `null` quand elle n'est pas réglée. Le service ne suppose JAMAIS le
 * 31 décembre : une supposition fausse déplacerait toutes les échéances de l'art. 32
 * et de la s. 23, dans le sens de la destruction prématurée.
 */
export async function getFiscalYearEnd(cabinetId: string): Promise<FiscalYearEnd | null> {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { fiscalYearEnd: true },
  });
  const raw = cabinet?.fiscalYearEnd;
  if (!raw) return null;

  // Format attendu : "MM-DD".
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(String(raw).trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

/* ════════════════════════════════════════════════════════════════
   L'ÉTAT DE CONSERVATION
   ════════════════════════════════════════════════════════════════ */

export interface RetentionStatus {
  province: CabinetProvince;
  fiscalYearEnd: FiscalYearEnd | null;
  /** Bloquant : sans fin d'exercice, aucune échéance ancrée dessus n'est calculable. */
  blockedFr: string | null;
  rules: RetentionRule[];
  formDuties: ReturnType<typeof getRetentionFormDuties>;
}

/** Ce que le cabinet doit conserver, et pour combien de temps. */
export async function getRetentionStatus(cabinetId: string): Promise<RetentionStatus> {
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const fiscalYearEnd = await getFiscalYearEnd(cabinetId);

  return {
    province,
    fiscalYearEnd,
    blockedFr: fiscalYearEnd
      ? null
      : "La fin de l'exercice financier du cabinet n'est pas réglée. Les durées ancrées sur l'exercice (art. 32 QC, s. 23 ON) ne peuvent pas être calculées tant qu'elle manque.",
    rules: getAllRetentionRules(province),
    formDuties: getRetentionFormDuties(province),
  };
}

/* ════════════════════════════════════════════════════════════════
   CE QUI DEVIENT PURGEABLE
   ════════════════════════════════════════════════════════════════ */

export interface PurgeCandidate {
  kind: RetainedRecordKind;
  labelFr: string;
  /** Dossier concerné, quand la règle est ancrée sur sa fermeture. */
  dossierId: string | null;
  dossierRef: string | null;
  clientId: string;
  eligibility: PurgeEligibility;
}

/**
 * Dossiers fermés dont les registres arrivent à échéance.
 *
 * Ne parcourt QUE les règles ancrées sur la fermeture : les pièces ancrées sur
 * l'exercice ne dépendent d'aucun dossier, et les mélanger dans une même liste
 * ferait croire qu'un dossier fermé emporte ses pièces justificatives avec lui — ce
 * que l'art. 32 contredit.
 */
export async function getPurgeCandidates(params: {
  cabinetId: string;
  now?: Date;
  /** Inclure ce qui n'est pas encore purgeable, pour montrer l'échéance. */
  includeBlocked?: boolean;
}): Promise<PurgeCandidate[]> {
  const now = params.now ?? new Date();
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const fy = await getFiscalYearEnd(params.cabinetId);

  const closed = await prisma.dossier.findMany({
    where: { cabinetId: params.cabinetId, statut: { in: ["cloture", "archive"] } },
    select: {
      id: true,
      reference: true,
      updatedAt: true,
      dateCloture: true,
      clientId: true,
    },
    orderBy: { dateCloture: "asc" },
  });

  const fileAnchored = getAllRetentionRules(province).filter((r) => r.anchor === "FILE_CLOSURE");
  const out: PurgeCandidate[] = [];

  for (const d of closed) {
    // Pas de date de fermeture explicite = le compte à rebours n'a pas démarré.
    // `updatedAt` ne sert PAS de substitut : ce serait dater la fermeture d'un dossier
    // sur la dernière fois que quelqu'un l'a touché, ce qui n'a aucun rapport.
    const closedAt = d.dateCloture ?? null;

    for (const rule of fileAnchored) {
      const eligibility = assessPurgeEligibility({
        kind: rule.kind,
        province,
        now,
        recordDate: closedAt ?? d.updatedAt,
        fileClosedAt: closedAt,
        fiscalYearEndMonth: fy?.month ?? null,
        fiscalYearEndDay: fy?.day ?? null,
      });
      if (!eligibility.purgeable && !params.includeBlocked) continue;
      out.push({
        kind: rule.kind,
        labelFr: rule.labelFr,
        dossierId: d.id,
        dossierRef: d.reference,
        clientId: d.clientId,
        eligibility,
      });
    }
  }

  return out;
}

/* ════════════════════════════════════════════════════════════════
   LE REFUS
   ════════════════════════════════════════════════════════════════ */

export class RetentionError extends Error {
  readonly code = "RETENTION_NOT_EXPIRED";
  readonly reference: string;

  constructor(params: { message: string; reference: string; remedy: string }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "RetentionError";
    this.reference = params.reference;
  }
}

/**
 * Garde-fou à poser devant toute suppression de pièce comptable.
 *
 * Refuse par défaut. Un appelant qui ne fournit ni date de fermeture ni fin
 * d'exercice se voit refuser, et c'est le comportement voulu : se tromper en
 * conservant coûte du stockage, se tromper en détruisant est irréversible et
 * constitue le manquement lui-même.
 */
export async function assertPurgeAllowed(params: {
  cabinetId: string;
  kind: RetainedRecordKind;
  recordDate: Date;
  fileClosedAt?: Date | null;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const fy = await getFiscalYearEnd(params.cabinetId);

  const e = assessPurgeEligibility({
    kind: params.kind,
    province,
    now,
    recordDate: params.recordDate,
    fileClosedAt: params.fileClosedAt ?? null,
    fiscalYearEndMonth: fy?.month ?? null,
    fiscalYearEndDay: fy?.day ?? null,
  });

  if (!e.purgeable) {
    const rule = getRetentionRule({ kind: params.kind, province });
    throw new RetentionError({
      message: e.blockedReasonFr ?? "Cette pièce est encore soumise à conservation.",
      reference: rule.reference,
      remedy: rule.noteFr ?? "",
    });
  }
}
