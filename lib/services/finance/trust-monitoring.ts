import { prisma } from "@/lib/db";
import { getLatestReconciliation } from "@/lib/services/fideicommis/reconciliation-service";

/** Inactivité (jours) au-delà de laquelle des fonds en fidéicommis sont signalés « dormants ». */
export const DORMANT_TRUST_DAYS = 180;

export interface TrustAccountAlert {
  accountId: string;
  clientId: string;
  clientNom: string;
  matterId: string | null;
  dossierIntitule: string | null;
  currentBalance: number;
  derniereActivite: string; // ISO AAAA-MM-JJ
  inactifJours: number;
}

export interface TrustAlertsReport {
  /** Soldes fiducie négatifs — drapeau rouge Barreau (jamais permis). */
  soldesNegatifs: TrustAccountAlert[];
  /** Fonds avec solde positif inactifs depuis > DORMANT_TRUST_DAYS. */
  fondsDormants: TrustAccountAlert[];
  /** Dernier rapprochement avec un écart non nul (non équilibré). */
  ecartRapprochement: { periode: string; ecart: number; status: string } | null;
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

/**
 * Surveillance fidéicommis (déterministe — chiffres exacts).
 *
 * Détecte : soldes négatifs (critique), fonds dormants (avertissement) et écart
 * de rapprochement non nul (critique). Complète `getReconciliationStatus`
 * (retard de rapprochement, déjà couvert ailleurs) — ne le duplique pas.
 */
export async function getTrustAlerts(
  cabinetId: string,
  now: Date = new Date(),
): Promise<TrustAlertsReport> {
  const accounts = await prisma.trustAccount.findMany({
    where: { cabinetId, NOT: { currentBalance: 0 } },
    select: {
      id: true,
      clientId: true,
      matterId: true,
      currentBalance: true,
      updatedAt: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true, typeClient: true } },
    },
  });

  // Noms de dossiers pour les comptes rattachés à un dossier.
  const matterIds = [...new Set(accounts.map((a) => a.matterId).filter((m): m is string => !!m))];
  const dossiers = matterIds.length
    ? await prisma.dossier.findMany({
        where: { id: { in: matterIds }, cabinetId },
        select: { id: true, intitule: true },
      })
    : [];
  const dossierNom = new Map(dossiers.map((d) => [d.id, d.intitule]));

  const nowMs = now.getTime();
  const toAlert = (a: (typeof accounts)[number]): TrustAccountAlert => {
    const inactifJours = Math.floor((nowMs - a.updatedAt.getTime()) / 86_400_000);
    return {
      accountId: a.id,
      clientId: a.clientId,
      clientNom: clientNom(a.client),
      matterId: a.matterId,
      dossierIntitule: a.matterId ? dossierNom.get(a.matterId) ?? null : null,
      currentBalance: a.currentBalance,
      derniereActivite: a.updatedAt.toISOString().slice(0, 10),
      inactifJours,
    };
  };

  const soldesNegatifs = accounts
    .filter((a) => a.currentBalance < 0)
    .map(toAlert)
    .sort((x, y) => x.currentBalance - y.currentBalance);

  const fondsDormants = accounts
    .filter((a) => a.currentBalance > 0 && nowMs - a.updatedAt.getTime() > DORMANT_TRUST_DAYS * 86_400_000)
    .map(toAlert)
    .sort((x, y) => y.inactifJours - x.inactifJours);

  const latest = await getLatestReconciliation(cabinetId);
  const ecartRapprochement =
    latest && Math.abs(latest.ecart) >= 0.01
      ? { periode: latest.periode, ecart: latest.ecart, status: latest.status }
      : null;

  return {
    soldesNegatifs,
    fondsDormants,
    ecartRapprochement,
    summary: {
      nbCritiques: soldesNegatifs.length + (ecartRapprochement ? 1 : 0),
      nbAvertissements: fondsDormants.length,
    },
  };
}
