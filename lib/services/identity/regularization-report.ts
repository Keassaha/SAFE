/**
 * Rapport « clients à régulariser ».
 *
 * C'est la contrepartie du mode observation : activer le garde-fou d'identité sans
 * savoir combien de clients il bloquera revient à décider à l'aveugle. Ce rapport
 * répond à la seule question qui compte avant de poser une date d'application —
 * **qui sera bloqué, et pourquoi ?**
 *
 * Il ne lit que des données existantes et n'écrit rien : on peut le produire à tout
 * moment, y compris avant d'avoir activé quoi que ce soit.
 *
 * Sources : B-1 r.5 art. 20, 21, 26 · By-Law 7.1 s. 22, 23(5)-(6).
 */

import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  evaluateIdentityForFundsMovement,
  exemptionReference,
  type IdentityVerdict,
} from "@/lib/compliance/identity";
import { resolveEnforcement, toSubjectKind, type IdentityGateEnforcement } from "./identity-gate";

export interface RegularizationLine {
  clientId: string;
  clientName: string;
  kind: "INDIVIDUAL" | "ORGANIZATION";
  verdict: IdentityVerdict["status"];
  /** Article qui fonde le blocage ou le délai. */
  reference: string | null;
  /** Échéance de vérification, si un délai court. */
  dueAt: Date | null;
  /** Le client détient-il des fonds en fidéicommis ? Priorise le travail. */
  hasTrustBalance: boolean;
  /** Solde détenu, pour trier par exposition réelle. */
  trustBalance: number;
}

export interface RegularizationReport {
  cabinetId: string;
  province: CabinetProvince;
  enforcement: IdentityGateEnforcement;
  generatedAt: Date;
  /** Clients qui seraient BLOQUÉS dès l'application. */
  blocking: RegularizationLine[];
  /** Clients sous délai courant : à traiter avant l'échéance. */
  pending: RegularizationLine[];
  /** Nombre de clients actifs examinés. */
  totalExamined: number;
  /** Somme des fonds en fidéicommis détenus pour des clients bloquants. */
  exposedTrustAmount: number;
}

/**
 * Produit le rapport pour un cabinet.
 *
 * `now` est injectable pour rendre le rapport reproductible et testable : deux
 * exécutions à la même date donnent le même résultat.
 */
export async function buildRegularizationReport(params: {
  cabinetId: string;
  now?: Date;
  province?: string | null;
}): Promise<RegularizationReport> {
  const now = params.now ?? new Date();
  const province = resolveProvince(
    params.province !== undefined ? params.province : await getCabinetProvince(params.cabinetId),
  );

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: params.cabinetId },
    select: { identityGateEnforcedFrom: true },
  });
  const enforcement = resolveEnforcement(cabinet?.identityGateEnforcedFrom ?? null, now);

  const clients = await prisma.client.findMany({
    where: { cabinetId: params.cabinetId, status: "actif" },
    select: {
      id: true,
      typeClient: true,
      raisonSociale: true,
      prenom: true,
      nom: true,
      identityVerified: true,
      verificationDate: true,
      identityExemption: true,
      firstFundsMovementAt: true,
    },
  });

  // Soldes fidéicommis par client, dérivés du registre append-only (PR-1). Sert à
  // trier : un client sans fonds détenus est moins urgent qu'un client à 40 000 $.
  const balances = await prisma.trustTransaction.groupBy({
    by: ["clientId"],
    where: { cabinetId: params.cabinetId },
    _sum: { amount: true },
  });
  const balanceByClient = new Map(balances.map((b) => [b.clientId, b._sum.amount ?? 0]));

  const blocking: RegularizationLine[] = [];
  const pending: RegularizationLine[] = [];

  for (const c of clients) {
    const kind = toSubjectKind(c.typeClient);
    const verdict = evaluateIdentityForFundsMovement(
      province,
      {
        kind,
        verified: c.identityVerified,
        verifiedAt: c.verificationDate,
        exemption:
          c.identityExemption && exemptionReference(province, c.identityExemption)
            ? c.identityExemption
            : null,
        firstFundsMovementAt: c.firstFundsMovementAt,
      },
      now,
    );

    if (verdict.status === "OK") continue;

    const trustBalance = balanceByClient.get(c.id) ?? 0;
    const line: RegularizationLine = {
      clientId: c.id,
      clientName: displayName(c),
      kind,
      verdict: verdict.status,
      reference: "reference" in verdict ? verdict.reference : null,
      dueAt: verdict.status === "DUE" || verdict.status === "OVERDUE" ? verdict.dueAt : null,
      hasTrustBalance: Math.abs(trustBalance) > 0.005,
      trustBalance,
    };

    if (verdict.status === "BLOCKING" || verdict.status === "OVERDUE") {
      blocking.push(line);
    } else {
      pending.push(line);
    }
  }

  // Tri par exposition décroissante : on régularise d'abord là où il y a de l'argent.
  const byExposure = (a: RegularizationLine, b: RegularizationLine) => b.trustBalance - a.trustBalance;
  blocking.sort(byExposure);
  pending.sort(byExposure);

  return {
    cabinetId: params.cabinetId,
    province,
    enforcement,
    generatedAt: now,
    blocking,
    pending,
    totalExamined: clients.length,
    exposedTrustAmount: Math.round(blocking.reduce((s, l) => s + l.trustBalance, 0) * 100) / 100,
  };
}

function displayName(c: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
}): string {
  if (c.raisonSociale?.trim()) return c.raisonSociale.trim();
  return [c.prenom, c.nom].filter(Boolean).join(" ").trim() || "(sans nom)";
}

/**
 * Date d'application recommandée : le rapport ne se contente pas de compter, il
 * propose une échéance tenable.
 *
 * Règle retenue : un minimum de 14 jours, plus un jour ouvré par tranche de cinq
 * clients à régulariser, plafonné à 90 jours. Ce n'est pas une exigence
 * réglementaire — c'est une heuristique de charge de travail, et elle est
 * documentée comme telle pour que personne ne la prenne pour une règle du Barreau.
 */
export function suggestEnforcementDate(report: RegularizationReport): Date {
  const workload = report.blocking.length + report.pending.length;
  const days = Math.min(90, 14 + Math.ceil(workload / 5));
  const d = new Date(report.generatedAt);
  d.setDate(d.getDate() + days);
  return d;
}
