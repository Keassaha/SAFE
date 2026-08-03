/**
 * Soldes débiteurs en fidéicommis, et versement des intérêts.
 *
 * Art. 50, 59, 60, 62 B-1 r.5 · s. 9(3), 14 By-Law 9.
 *
 * Avant ce chantier, un solde débiteur n'était vu qu'au moment de certifier le
 * rapprochement mensuel. Un découvert survenu le 3 pouvait donc vivre jusqu'au 25 du
 * mois suivant sans que personne ne le sache. L'art. 60 dit « SANS DÉLAI » et la
 * s. 14 dit « at all times » : détecter une fois par mois ne peut pas satisfaire
 * l'un ou l'autre.
 *
 * La détection est donc déclenchée à l'écriture, pas à la clôture.
 *
 * ⚠️ CE SERVICE NE BLOQUE RIEN. Les garde-fous du CH-00 empêchent déjà de CRÉER un
 * découvert (INSUFFICIENT_TRUST_BALANCE, CORRECTION_WOULD_CREATE_DEBIT_BALANCE). Un
 * découvert qui existe malgré eux vient d'ailleurs : reprise de données, écriture
 * antérieure aux garde-fous, chèque retourné. Le refuser une deuxième fois ne le
 * ferait pas disparaître — il faut le voir et le combler.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  assessInterestRemittance,
  assessShortfall,
  findShortfalls,
  getInterestRule,
  getRemediationOptions,
  toReportLine,
  totalShortfall,
  type RemediationSource,
  type ShortfallAssessment,
  type ShortfallReportLine,
} from "@/lib/compliance/trust-shortfall";
import { getTrustBalancesByDossier } from "./trust-balance-service";

/** Refus motivé, portant son article et sa porte de sortie (PR-2, PR-4). */
export class TrustShortfallError extends Error {
  readonly code:
    | "SHORTFALL_ALREADY_RESOLVED"
    | "REMEDIATION_SOURCE_REQUIRED"
    | "REMEDIATION_INSUFFICIENT"
    | "INTEREST_PROOF_REQUIRED";
  readonly reference: string;

  constructor(params: {
    code: TrustShortfallError["code"];
    message: string;
    reference: string;
    remedy: string;
  }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "TrustShortfallError";
    this.code = params.code;
    this.reference = params.reference;
  }
}

/* ════════════════════════════════════════════════════════════════
   DÉTECTION
   ════════════════════════════════════════════════════════════════ */

export interface DetectedShortfall {
  id: string;
  clientId: string;
  dossierId: string | null;
  amount: number;
  detectedAt: Date;
  isNew: boolean;
}

/**
 * Passe le registre au peigne et consigne tout découvert.
 *
 * Appelée après chaque écriture en fidéicommis, et par la vue conformité. Elle est
 * IDEMPOTENTE : un découvert déjà ouvert sur la même carte-client n'en crée pas un
 * second, il voit son montant remis à jour. Sans cela, dix consultations de l'écran
 * produiraient dix incidents pour un seul problème, et l'historique deviendrait
 * illisible au moment où il compte le plus.
 *
 * En revanche, un découvert COMBLÉ puis survenu de nouveau donne bien un NOUVEL
 * incident : ce sont deux événements distincts, et un inspecteur qui voit trois
 * récidives sur la même carte-client lit autre chose qu'un incident unique.
 */
export async function detectShortfalls(params: {
  cabinetId: string;
  trustBankAccountId?: string | null;
  now?: Date;
}): Promise<DetectedShortfall[]> {
  const now = params.now ?? new Date();
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const balances = await getTrustBalancesByDossier(params.cabinetId, params.trustBankAccountId);
  const lines = findShortfalls(balances);

  const open = await prisma.trustShortfall.findMany({
    where: { cabinetId: params.cabinetId, resolvedAt: null },
  });

  const results: DetectedShortfall[] = [];

  for (const line of lines) {
    const existing = open.find(
      (o) => o.clientId === line.clientId && o.dossierId === line.dossierId,
    );

    if (existing) {
      // Le montant bouge, l'incident non : c'est toujours le même découvert.
      if (Math.abs(existing.amount - line.shortfallAmount) > 0.005) {
        await prisma.trustShortfall.update({
          where: { id: existing.id },
          data: { amount: line.shortfallAmount, balanceAtDetection: line.balance },
        });
      }
      results.push({
        id: existing.id,
        clientId: line.clientId,
        dossierId: line.dossierId,
        amount: line.shortfallAmount,
        detectedAt: existing.detectedAt,
        isNew: false,
      });
      continue;
    }

    const created = await prisma.trustShortfall.create({
      data: {
        cabinetId: params.cabinetId,
        trustBankAccountId: params.trustBankAccountId ?? null,
        clientId: line.clientId,
        dossierId: line.dossierId,
        amount: line.shortfallAmount,
        balanceAtDetection: line.balance,
        detectedAt: now,
        province,
      },
    });

    await createAuditLog({
      cabinetId: params.cabinetId,
      entityType: "TrustAccount",
      entityId: created.id,
      action: "create",
      newValues: {
        type: "trust_shortfall_detected",
        clientId: line.clientId,
        dossierId: line.dossierId,
        amount: line.shortfallAmount,
        reference: province === "QC" ? "B-1 r.5, art. 59, 60" : "By-Law 9, s. 9(3), 14",
      },
    });

    results.push({
      id: created.id,
      clientId: line.clientId,
      dossierId: line.dossierId,
      amount: line.shortfallAmount,
      detectedAt: now,
      isNew: true,
    });
  }

  // Un découvert consigné dont la carte-client est repassée au positif est clos
  // automatiquement, avec la source LEDGER_CORRECTION quand aucun renflouement
  // explicite n'a été saisi : quelque chose l'a comblé, on ne sait pas quoi, et
  // l'écrire est plus honnête que de laisser l'incident ouvert à tort.
  const stillOpen = new Set(lines.map((l) => `${l.clientId}::${l.dossierId ?? ""}`));
  for (const o of open) {
    if (stillOpen.has(`${o.clientId}::${o.dossierId ?? ""}`)) continue;
    await prisma.trustShortfall.update({
      where: { id: o.id },
      data: {
        resolvedAt: now,
        remediationSource: o.remediationSource ?? "LEDGER_CORRECTION",
        remediationNote:
          o.remediationNote ??
          "Comblé par une écriture au registre. Source non déclarée explicitement.",
      },
    });
  }

  return results;
}

/* ════════════════════════════════════════════════════════════════
   ÉTAT COURANT
   ════════════════════════════════════════════════════════════════ */

export interface ShortfallStatus {
  province: CabinetProvince;
  openCount: number;
  totalOpen: number;
  lines: Array<
    ShortfallReportLine & {
      id: string;
      clientId: string;
      assessment: ShortfallAssessment;
    }
  >;
  remediationOptions: ReturnType<typeof getRemediationOptions>;
}

/** Découverts ouverts, chacun avec sa qualification. */
export async function getOpenShortfalls(params: {
  cabinetId: string;
  now?: Date;
}): Promise<ShortfallStatus> {
  const now = params.now ?? new Date();
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const rows = await prisma.trustShortfall.findMany({
    where: { cabinetId: params.cabinetId, resolvedAt: null },
    include: { client: { select: { nom: true, prenom: true } } },
    orderBy: { amount: "desc" },
  });

  return {
    province,
    openCount: rows.length,
    totalOpen:
      Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100,
    lines: rows.map((r) => ({
      ...toReportLine({
        clientName: [r.client?.prenom, r.client?.nom].filter(Boolean).join(" ") || r.clientId,
        dossierRef: r.dossierId,
        amount: r.amount,
        detectedAt: r.detectedAt,
        resolvedAt: null,
        source: null,
      }),
      id: r.id,
      clientId: r.clientId,
      assessment: assessShortfall({
        province,
        detectedAt: r.detectedAt,
        now,
        amount: r.amount,
      }),
    })),
    remediationOptions: getRemediationOptions(province),
  };
}

/**
 * Découverts d'une période, RÉSOLUS COMPRIS.
 *
 * C'est la version qui alimente le rapport mensuel. Un découvert survenu le 3 et
 * comblé le 4 n'apparaîtrait nulle part si l'on ne regardait que les soldes de fin
 * de mois — or c'est précisément ce qu'un inspecteur cherche : non pas l'état à une
 * date, mais ce qui s'est passé.
 */
export async function getShortfallsForPeriod(params: {
  cabinetId: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<ShortfallReportLine[]> {
  const rows = await prisma.trustShortfall.findMany({
    where: {
      cabinetId: params.cabinetId,
      detectedAt: { gte: params.periodStart, lte: params.periodEnd },
    },
    include: { client: { select: { nom: true, prenom: true } } },
    orderBy: { detectedAt: "asc" },
  });

  return rows.map((r) =>
    toReportLine({
      clientName: [r.client?.prenom, r.client?.nom].filter(Boolean).join(" ") || r.clientId,
      dossierRef: r.dossierId,
      amount: r.amount,
      detectedAt: r.detectedAt,
      resolvedAt: r.resolvedAt,
      source: (r.remediationSource as RemediationSource | null) ?? null,
    }),
  );
}

/* ════════════════════════════════════════════════════════════════
   RENFLOUEMENT
   ════════════════════════════════════════════════════════════════ */

/**
 * Consigne le comblement d'un découvert.
 *
 * Le service N'EFFECTUE PAS le dépôt : celui-ci passe par `createTrustDeposit`, avec
 * ses propres garde-fous. Ici on rattache l'écriture à l'incident et on déclare d'où
 * venaient les fonds. Faire les deux en un seul geste contournerait les contrôles du
 * dépôt, ce qui est exactement ce qu'un chantier de conformité ne doit pas faire.
 */
export async function recordRemediation(params: {
  cabinetId: string;
  shortfallId: string;
  source: RemediationSource;
  transactionId?: string | null;
  note?: string | null;
  userId: string;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  const row = await prisma.trustShortfall.findFirst({
    where: { id: params.shortfallId, cabinetId: params.cabinetId },
  });
  if (!row) throw new Error("Incident de solde débiteur introuvable.");

  if (row.resolvedAt) {
    throw new TrustShortfallError({
      code: "SHORTFALL_ALREADY_RESOLVED",
      message: "Cet incident a déjà été comblé.",
      reference: row.province === "QC" ? "B-1 r.5, art. 60" : "By-Law 9, s. 14",
      remedy:
        "Si un nouveau découvert est survenu sur la même carte-client, il fait l'objet d'un incident distinct.",
    });
  }

  await prisma.trustShortfall.update({
    where: { id: row.id },
    data: {
      resolvedAt: now,
      remediationSource: params.source,
      remediationTransactionId: params.transactionId ?? null,
      remediationNote: params.note ?? null,
      resolvedById: params.userId,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: row.id,
    action: "update",
    newValues: {
      type: "trust_shortfall_resolved",
      amount: row.amount,
      source: params.source,
      daysOpen: Math.floor((now.getTime() - row.detectedAt.getTime()) / 86_400_000),
      reference: row.province === "QC" ? "B-1 r.5, art. 60" : "By-Law 9, s. 14",
    },
  });
}

/* ════════════════════════════════════════════════════════════════
   INTÉRÊTS
   ════════════════════════════════════════════════════════════════ */

/**
 * Consigne un versement d'intérêts.
 *
 * ⚠️ Le service ne CALCULE aucun montant. Ni B-1 r.10 ni la s. 57 de la Law Society
 * Act n'ont été lus : le taux, la fréquence et le formulaire ne sont pas connus.
 * Le bénéficiaire, lui, découle des articles lus et est donc imposé.
 *
 * Le montant vient du relevé bancaire ou de l'avis du Fonds. Le calculer nous-mêmes
 * fabriquerait un chiffre que rien ne fonde, et un cabinet le verserait.
 */
export async function recordInterestRemittance(params: {
  cabinetId: string;
  trustBankAccountId: string;
  periode: string;
  amount: number;
  remittedAt?: Date | null;
  proofDocumentId?: string | null;
  note?: string | null;
  userId: string;
}): Promise<{ id: string; complete: boolean }> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const account = await prisma.trustBankAccount.findFirst({
    where: { id: params.trustBankAccountId, cabinetId: params.cabinetId },
    select: { type: true },
  });
  if (!account) throw new Error("Compte en fidéicommis introuvable.");

  const rule = getInterestRule({
    province,
    accountType: account.type === "PARTICULIER" ? "PARTICULIER" : "GENERAL",
  });

  const assessment = assessInterestRemittance({
    periode: params.periode,
    beneficiary: rule.beneficiary,
    amount: params.amount,
    province,
    remittedAt: params.remittedAt ?? null,
    hasProof: Boolean(params.proofDocumentId),
  });

  const row = await prisma.trustInterestRemittance.upsert({
    where: {
      trustBankAccountId_periode_beneficiary: {
        trustBankAccountId: params.trustBankAccountId,
        periode: params.periode,
        beneficiary: rule.beneficiary,
      },
    },
    create: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      periode: params.periode,
      beneficiary: rule.beneficiary,
      amount: params.amount,
      remittedAt: params.remittedAt ?? null,
      proofDocumentId: params.proofDocumentId ?? null,
      note: params.note ?? null,
      recordedById: params.userId,
      province,
    },
    update: {
      amount: params.amount,
      remittedAt: params.remittedAt ?? null,
      proofDocumentId: params.proofDocumentId ?? null,
      note: params.note ?? null,
      recordedById: params.userId,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: row.id,
    action: "create",
    newValues: {
      type: "trust_interest_remittance",
      periode: params.periode,
      beneficiary: rule.beneficiary,
      amount: params.amount,
      complete: assessment.complete,
      reference: assessment.reference,
    },
  });

  return { id: row.id, complete: assessment.complete };
}

/** Versements consignés pour une période, avec ce qui leur manque. */
export async function getInterestRemittances(params: {
  cabinetId: string;
  periode?: string;
}): Promise<
  Array<{
    id: string;
    periode: string;
    beneficiary: string;
    amount: number;
    remittedAt: Date | null;
    complete: boolean;
    missingFr: string[];
    reference: string;
  }>
> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const rows = await prisma.trustInterestRemittance.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(params.periode ? { periode: params.periode } : {}),
    },
    orderBy: [{ periode: "desc" }, { beneficiary: "asc" }],
  });

  return rows.map((r) => {
    const a = assessInterestRemittance({
      periode: r.periode,
      beneficiary: r.beneficiary as Parameters<typeof assessInterestRemittance>[0]["beneficiary"],
      amount: r.amount,
      province,
      remittedAt: r.remittedAt,
      hasProof: Boolean(r.proofDocumentId),
    });
    return {
      id: r.id,
      periode: r.periode,
      beneficiary: r.beneficiary,
      amount: r.amount,
      remittedAt: r.remittedAt,
      complete: a.complete,
      missingFr: a.missingFr,
      reference: a.reference,
    };
  });
}

/** Réexporté pour les vues, qui affichent le total sans refaire l'arithmétique. */
export { totalShortfall };
