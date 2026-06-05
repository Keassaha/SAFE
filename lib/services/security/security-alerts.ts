import { prisma } from "@/lib/db";
import { getTrustAlerts, type TrustAlertsReport } from "@/lib/services/finance/trust-monitoring";
import { getReconciliationStatus } from "@/lib/services/fideicommis/reconciliation-service";

/** Horizon (jours) pour signaler une échéance légale à venir. */
export const ECHEANCE_HORIZON_DAYS = 14;
/** Horizon (jours) pour signaler un document d'immigration qui expire. */
export const DOC_EXPIRY_HORIZON_DAYS = 30;
/** Nombre d'exemples retournés par catégorie de conformité (le total est exact). */
const SAMPLE_SIZE = 5;

export interface EcheanceAlert {
  dossierId: string;
  intitule: string;
  numeroDossier: string | null;
  clientNom: string;
  libelle: string;
  date: string; // ISO AAAA-MM-JJ
  joursRestants: number; // négatif = dépassée
}

export interface DocumentExpiryAlert {
  dossierId: string;
  intitule: string;
  numeroDossier: string | null;
  clientNom: string;
  type: string;
  label: string | null;
  date: string; // ISO AAAA-MM-JJ
  joursRestants: number; // négatif = expiré
}

export interface ConformiteBucket {
  count: number;
  sample: { id: string; label: string }[];
}

export interface SecurityAlertsReport {
  fideicommis: {
    alerts: TrustAlertsReport;
    rapprochementEnRetard: { periode: string; joursDepuisFinMois: number; critique: boolean } | null;
  };
  echeances: {
    ircc: EcheanceAlert[];
    appels: EcheanceAlert[];
    documentsExpirant: DocumentExpiryAlert[];
  };
  conformite: {
    identiteNonVerifiee: ConformiteBucket;
    consentementManquant: ConformiteBucket;
    fintracManquant: ConformiteBucket;
    conflitsNonVerifies: ConformiteBucket;
    piecesManquantes: ConformiteBucket;
  };
  summary: { nbCritiques: number; nbAvertissements: number };
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

const CLIENT_SELECT = { raisonSociale: true, prenom: true, nom: true, typeClient: true } as const;
const ACTIVE_DOSSIER_STATUSES = ["ouvert", "actif", "en_attente"] as const;

/**
 * Agent de sécurité / conformité (déterministe) : agrège les signaux de RISQUE
 * qui pourraient déclencher une mesure du Barreau ou un préjudice client —
 * fidéicommis, échéances légales (IRCC, appel) et conformité KYC / Loi 25.
 *
 * Dates et chiffres exacts, aucune estimation IA.
 */
export async function getSecurityAlerts(
  cabinetId: string,
  now: Date = new Date(),
): Promise<SecurityAlertsReport> {
  const nowMs = now.getTime();
  const horizon = new Date(nowMs + ECHEANCE_HORIZON_DAYS * 86_400_000);
  const docHorizon = new Date(nowMs + DOC_EXPIRY_HORIZON_DAYS * 86_400_000);
  const joursRestants = (d: Date) => Math.ceil((d.getTime() - nowMs) / 86_400_000);

  const [trustAlerts, reconStatus, irccDossiers, jugements, identiteCount, identiteSample, consentCount, consentSample, fintracCount, fintracSample, docsExpirant, conflitCount, conflitSample, piecesCount, piecesSample] =
    await Promise.all([
      getTrustAlerts(cabinetId, now),
      getReconciliationStatus(cabinetId),
      prisma.dossier.findMany({
        where: {
          cabinetId,
          type: "immigration",
          statut: { in: [...ACTIVE_DOSSIER_STATUSES] },
          submissionDeadline: { not: null, lte: horizon },
        },
        select: { id: true, intitule: true, numeroDossier: true, submissionDeadline: true, client: { select: CLIENT_SELECT } },
        orderBy: { submissionDeadline: "asc" },
      }),
      prisma.dossierJudgment.findMany({
        where: {
          dossier: { cabinetId },
          dateLimiteAppel: { not: null, lte: horizon },
          OR: [{ statutAppel: "En cours" }, { statutAppel: null }],
        },
        select: {
          typeJugement: true,
          dateLimiteAppel: true,
          dossier: { select: { id: true, intitule: true, numeroDossier: true, client: { select: CLIENT_SELECT } } },
        },
        orderBy: { dateLimiteAppel: "asc" },
      }),
      prisma.client.count({ where: { cabinetId, status: "actif", identityVerified: false } }),
      prisma.client.findMany({
        where: { cabinetId, status: "actif", identityVerified: false },
        select: { id: true, ...CLIENT_SELECT },
        take: SAMPLE_SIZE,
      }),
      prisma.client.count({ where: { cabinetId, status: "actif", consentementCollecteAt: null } }),
      prisma.client.findMany({
        where: { cabinetId, status: "actif", consentementCollecteAt: null },
        select: { id: true, ...CLIENT_SELECT },
        take: SAMPLE_SIZE,
      }),
      prisma.dossier.count({
        where: { cabinetId, type: "immobilier", statut: { in: [...ACTIVE_DOSSIER_STATUSES] }, fintracVerified: false },
      }),
      prisma.dossier.findMany({
        where: { cabinetId, type: "immobilier", statut: { in: [...ACTIVE_DOSSIER_STATUSES] }, fintracVerified: false },
        select: { id: true, intitule: true, client: { select: CLIENT_SELECT } },
        take: SAMPLE_SIZE,
      }),
      prisma.immigrationDocument.findMany({
        where: {
          dossier: { cabinetId, statut: { in: [...ACTIVE_DOSSIER_STATUSES] } },
          expiresAt: { not: null, lte: docHorizon },
        },
        select: {
          type: true,
          label: true,
          expiresAt: true,
          dossier: { select: { id: true, intitule: true, numeroDossier: true, client: { select: CLIENT_SELECT } } },
        },
        orderBy: { expiresAt: "asc" },
      }),
      prisma.client.count({ where: { cabinetId, status: "actif", conflictChecked: false } }),
      prisma.client.findMany({
        where: { cabinetId, status: "actif", conflictChecked: false },
        select: { id: true, ...CLIENT_SELECT },
        take: SAMPLE_SIZE,
      }),
      prisma.dossier.count({
        where: { cabinetId, statut: { in: [...ACTIVE_DOSSIER_STATUSES] }, pieces: { some: { statut: "Manquant" } } },
      }),
      prisma.dossier.findMany({
        where: { cabinetId, statut: { in: [...ACTIVE_DOSSIER_STATUSES] }, pieces: { some: { statut: "Manquant" } } },
        select: { id: true, intitule: true, client: { select: CLIENT_SELECT } },
        take: SAMPLE_SIZE,
      }),
    ]);

  const ircc: EcheanceAlert[] = irccDossiers
    .filter((d) => d.submissionDeadline)
    .map((d) => ({
      dossierId: d.id,
      intitule: d.intitule,
      numeroDossier: d.numeroDossier,
      clientNom: clientNom(d.client),
      libelle: "Échéance de soumission IRCC",
      date: d.submissionDeadline!.toISOString().slice(0, 10),
      joursRestants: joursRestants(d.submissionDeadline!),
    }));

  const appels: EcheanceAlert[] = jugements
    .filter((j) => j.dateLimiteAppel)
    .map((j) => ({
      dossierId: j.dossier.id,
      intitule: j.dossier.intitule,
      numeroDossier: j.dossier.numeroDossier,
      clientNom: clientNom(j.dossier.client),
      libelle: `Délai d'appel — ${j.typeJugement}`,
      date: j.dateLimiteAppel!.toISOString().slice(0, 10),
      joursRestants: joursRestants(j.dateLimiteAppel!),
    }));

  const documentsExpirant: DocumentExpiryAlert[] = docsExpirant
    .filter((d) => d.expiresAt)
    .map((d) => ({
      dossierId: d.dossier.id,
      intitule: d.dossier.intitule,
      numeroDossier: d.dossier.numeroDossier,
      clientNom: clientNom(d.dossier.client),
      type: d.type,
      label: d.label,
      date: d.expiresAt!.toISOString().slice(0, 10),
      joursRestants: joursRestants(d.expiresAt!),
    }));

  const rapprochementEnRetard = reconStatus.overdue
    ? {
        periode: reconStatus.expectedPeriode,
        joursDepuisFinMois: reconStatus.daysSinceMonthEnd,
        critique: reconStatus.critical,
      }
    : null;

  // Sévérité : fidéicommis (négatifs/écart/rapprochement critique) + échéances/documents dépassés = critiques.
  const totalEcheances = [...ircc, ...appels, ...documentsExpirant];
  const echeancesDepassees = totalEcheances.filter((e) => e.joursRestants < 0).length;
  const nbCritiques =
    trustAlerts.summary.nbCritiques +
    (rapprochementEnRetard?.critique ? 1 : 0) +
    echeancesDepassees;
  const echeancesAVenir = totalEcheances.length - echeancesDepassees;
  const nbAvertissements =
    trustAlerts.summary.nbAvertissements +
    (rapprochementEnRetard && !rapprochementEnRetard.critique ? 1 : 0) +
    echeancesAVenir +
    (identiteCount > 0 ? 1 : 0) +
    (consentCount > 0 ? 1 : 0) +
    (fintracCount > 0 ? 1 : 0) +
    (conflitCount > 0 ? 1 : 0) +
    (piecesCount > 0 ? 1 : 0);

  return {
    fideicommis: { alerts: trustAlerts, rapprochementEnRetard },
    echeances: { ircc, appels, documentsExpirant },
    conformite: {
      identiteNonVerifiee: {
        count: identiteCount,
        sample: identiteSample.map((c) => ({ id: c.id, label: clientNom(c) })),
      },
      consentementManquant: {
        count: consentCount,
        sample: consentSample.map((c) => ({ id: c.id, label: clientNom(c) })),
      },
      fintracManquant: {
        count: fintracCount,
        sample: fintracSample.map((d) => ({ id: d.id, label: `${clientNom(d.client)} — ${d.intitule}` })),
      },
      conflitsNonVerifies: {
        count: conflitCount,
        sample: conflitSample.map((c) => ({ id: c.id, label: clientNom(c) })),
      },
      piecesManquantes: {
        count: piecesCount,
        sample: piecesSample.map((d) => ({ id: d.id, label: `${clientNom(d.client)} — ${d.intitule}` })),
      },
    },
    summary: { nbCritiques, nbAvertissements },
  };
}
