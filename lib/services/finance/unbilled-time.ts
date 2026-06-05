import { prisma } from "@/lib/db";
import { buildBillableTimeEntryWhere } from "@/lib/billing/queries";
import { getTimeEntryBillableAmount } from "@/lib/billing";

/** Seuil (jours) au-delà duquel du temps facturable non facturé est considéré « dormant ». */
export const DORMANT_DAYS = 90;

export interface UnbilledDossierRow {
  dossierId: string | null;
  dossierIntitule: string;
  numeroDossier: string | null;
  clientId: string | null;
  clientNom: string;
  montant: number;
  nbEntries: number;
  /** Date de la fiche la plus ancienne (ISO AAAA-MM-JJ). */
  plusAncienneDate: string | null;
  ageMaxJours: number;
  montantDormant: number;
}

export interface UnbilledTimeReport {
  totals: {
    montantTotal: number;
    nbEntries: number;
    nbDossiers: number;
    montantDormant: number;
    nbDossiersDormants: number;
    plusAncienneDate: string | null;
    ageMaxJours: number;
  };
  /** Répartition du montant par tranche d'âge (jours). */
  parTranche: { t0_30: number; t31_60: number; t61_90: number; t90plus: number };
  /** Dossiers triés par montant non facturé décroissant. */
  dossiers: UnbilledDossierRow[];
}

function clientNom(client: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
  typeClient: string;
} | null): string {
  if (!client) return "Client inconnu";
  if (client.typeClient === "personne_physique" && (client.prenom || client.nom)) {
    return [client.nom, client.prenom].filter(Boolean).join(", ");
  }
  return client.raisonSociale ?? "Client";
}

/**
 * Détecte le temps FACTURABLE jamais facturé (WIP non facturé) et le « dormant ».
 *
 * Déterministe et exact : réutilise le filtre canonique `buildBillableTimeEntryWhere`
 * (facturable, jamais lié à une facture, non radié) et le montant canonique
 * `getTimeEntryBillableAmount` (feeAmount ?? montant). Aucune estimation IA — les
 * chiffres financiers doivent être justes.
 */
export async function getUnbilledTimeReport(
  cabinetId: string,
  now: Date = new Date(),
): Promise<UnbilledTimeReport> {
  const entries = await prisma.timeEntry.findMany({
    where: buildBillableTimeEntryWhere(cabinetId),
    select: {
      id: true,
      date: true,
      montant: true,
      feeAmount: true,
      billingStatus: true,
      facturable: true,
      isWrittenOff: true,
      clientId: true,
      dossierId: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true, typeClient: true } },
      dossier: {
        select: {
          intitule: true,
          numeroDossier: true,
          clientId: true,
          client: { select: { raisonSociale: true, prenom: true, nom: true, typeClient: true } },
        },
      },
    },
  });

  const nowMs = now.getTime();
  const ageDays = (d: Date) => Math.floor((nowMs - d.getTime()) / 86_400_000);

  const parTranche = { t0_30: 0, t31_60: 0, t61_90: 0, t90plus: 0 };
  const groups = new Map<string, UnbilledDossierRow & { _oldestMs: number }>();

  let montantTotal = 0;
  let montantDormant = 0;
  let oldestMs = Number.POSITIVE_INFINITY;

  for (const e of entries) {
    const montant = getTimeEntryBillableAmount({
      id: e.id,
      montant: e.montant,
      feeAmount: e.feeAmount,
      billingStatus: e.billingStatus,
      facturable: e.facturable,
      isWrittenOff: e.isWrittenOff,
    });
    if (montant <= 0) continue;

    const age = ageDays(e.date);
    montantTotal += montant;
    if (e.date.getTime() < oldestMs) oldestMs = e.date.getTime();

    if (age <= 30) parTranche.t0_30 += montant;
    else if (age <= 60) parTranche.t31_60 += montant;
    else if (age <= 90) parTranche.t61_90 += montant;
    else parTranche.t90plus += montant;

    const dormant = age > DORMANT_DAYS;
    if (dormant) montantDormant += montant;

    const key = e.dossierId ?? `client:${e.clientId ?? "none"}`;
    const nom = clientNom(e.dossier?.client ?? e.client);
    const existing = groups.get(key);
    if (existing) {
      existing.montant += montant;
      existing.nbEntries += 1;
      existing.montantDormant += dormant ? montant : 0;
      if (e.date.getTime() < existing._oldestMs) existing._oldestMs = e.date.getTime();
    } else {
      groups.set(key, {
        dossierId: e.dossierId,
        dossierIntitule: e.dossier?.intitule ?? "(sans dossier)",
        numeroDossier: e.dossier?.numeroDossier ?? null,
        clientId: e.dossierId ? e.dossier?.clientId ?? null : e.clientId,
        clientNom: nom,
        montant,
        nbEntries: 1,
        plusAncienneDate: null,
        ageMaxJours: 0,
        montantDormant: dormant ? montant : 0,
        _oldestMs: e.date.getTime(),
      });
    }
  }

  const dossiers: UnbilledDossierRow[] = Array.from(groups.values())
    .map(({ _oldestMs, ...row }) => ({
      ...row,
      plusAncienneDate: new Date(_oldestMs).toISOString().slice(0, 10),
      ageMaxJours: Math.floor((nowMs - _oldestMs) / 86_400_000),
    }))
    .sort((a, b) => b.montant - a.montant);

  return {
    totals: {
      montantTotal,
      nbEntries: entries.length,
      nbDossiers: dossiers.length,
      montantDormant,
      nbDossiersDormants: dossiers.filter((d) => d.montantDormant > 0).length,
      plusAncienneDate: Number.isFinite(oldestMs) ? new Date(oldestMs).toISOString().slice(0, 10) : null,
      ageMaxJours: Number.isFinite(oldestMs) ? Math.floor((nowMs - oldestMs) / 86_400_000) : 0,
    },
    parTranche,
    dossiers,
  };
}
