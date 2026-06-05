import { prisma } from "@/lib/db";

/** Factures comptant comme revenu (émises et au-delà). */
const REVENUE_STATUSES = ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CREDITED"] as const;

export interface DossierProfitRow {
  dossierId: string;
  intitule: string;
  numeroDossier: string | null;
  clientNom: string;
  factureHT: number;
  coutsDirects: number;
  margeBrute: number;
  /** Marge / facturé HT (0..1), null si rien facturé. */
  margePct: number | null;
}

export interface DossierProfitabilityReport {
  totals: { factureHT: number; coutsDirects: number; margeBrute: number; nbDossiers: number };
  dossiers: DossierProfitRow[];
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

interface Acc {
  intitule: string;
  numeroDossier: string | null;
  clientNom: string;
  factureHT: number;
  coutsDirects: number;
}

/**
 * Rentabilité par dossier (déterministe) : marge brute = facturé HT − débours
 * payés par le cabinet. NE TIENT PAS COMPTE du coût du temps (pas de salaire
 * suivi) — c'est une marge brute « honoraires vs débours », à interpréter comme
 * telle.
 */
export async function getDossierProfitability(
  cabinetId: string,
): Promise<DossierProfitabilityReport> {
  const [invoices, debours] = await Promise.all([
    prisma.invoice.findMany({
      where: { cabinetId, dossierId: { not: null }, invoiceStatus: { in: [...REVENUE_STATUSES] } },
      select: {
        dossierId: true,
        totalInvoiceAmount: true,
        taxGst: true,
        taxQst: true,
        dossier: {
          select: {
            intitule: true,
            numeroDossier: true,
            client: { select: { raisonSociale: true, prenom: true, nom: true, typeClient: true } },
          },
        },
      },
    }),
    prisma.deboursDossier.findMany({
      where: { dossier: { cabinetId }, payeParCabinet: true },
      select: { dossierId: true, montant: true },
    }),
  ]);

  const acc = new Map<string, Acc>();

  for (const inv of invoices) {
    if (!inv.dossierId) continue;
    const ht = inv.totalInvoiceAmount - inv.taxGst - inv.taxQst;
    const a = acc.get(inv.dossierId);
    if (a) {
      a.factureHT += ht;
    } else {
      acc.set(inv.dossierId, {
        intitule: inv.dossier?.intitule ?? "(dossier supprimé)",
        numeroDossier: inv.dossier?.numeroDossier ?? null,
        clientNom: clientNom(inv.dossier?.client ?? null),
        factureHT: ht,
        coutsDirects: 0,
      });
    }
  }

  for (const d of debours) {
    const a = acc.get(d.dossierId);
    if (a) a.coutsDirects += d.montant;
    else
      acc.set(d.dossierId, {
        intitule: "(dossier sans facture)",
        numeroDossier: null,
        clientNom: "—",
        factureHT: 0,
        coutsDirects: d.montant,
      });
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const dossiers: DossierProfitRow[] = Array.from(acc.entries())
    .map(([dossierId, a]) => {
      const factureHT = round2(a.factureHT);
      const coutsDirects = round2(a.coutsDirects);
      const margeBrute = round2(factureHT - coutsDirects);
      return {
        dossierId,
        intitule: a.intitule,
        numeroDossier: a.numeroDossier,
        clientNom: a.clientNom,
        factureHT,
        coutsDirects,
        margeBrute,
        margePct: factureHT > 0 ? round2(margeBrute / factureHT) : null,
      };
    })
    .sort((x, y) => y.margeBrute - x.margeBrute);

  const totals = dossiers.reduce(
    (t, d) => ({
      factureHT: round2(t.factureHT + d.factureHT),
      coutsDirects: round2(t.coutsDirects + d.coutsDirects),
      margeBrute: round2(t.margeBrute + d.margeBrute),
      nbDossiers: t.nbDossiers + 1,
    }),
    { factureHT: 0, coutsDirects: 0, margeBrute: 0, nbDossiers: 0 },
  );

  return { totals, dossiers };
}
