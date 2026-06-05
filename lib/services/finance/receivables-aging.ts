import { prisma } from "@/lib/db";

/** Statuts de facture représentant une créance (montant dû). */
const RECEIVABLE_STATUSES = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] as const;

export interface AgingClientRow {
  clientId: string;
  clientNom: string;
  totalDu: number;
  montantEnRetard: number;
  joursRetardMax: number;
  nbFactures: number;
}

export interface ReceivablesAgingReport {
  totals: {
    totalDu: number;
    courant: number;
    b1_30: number;
    b31_60: number;
    b61_90: number;
    b90plus: number;
    enRetard: number;
    nbFactures: number;
    nbClients: number;
  };
  /** Clients triés par montant en retard décroissant (priorité de relance). */
  clients: AgingClientRow[];
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
 * Aging des créances (déterministe) : factures émises avec solde dû, ventilées
 * par ancienneté de retard (vs date d'échéance), regroupées par client et
 * triées par montant en retard pour prioriser les relances.
 */
export async function getReceivablesAging(
  cabinetId: string,
  now: Date = new Date(),
): Promise<ReceivablesAgingReport> {
  const invoices = await prisma.invoice.findMany({
    where: {
      cabinetId,
      invoiceStatus: { in: [...RECEIVABLE_STATUSES] },
      balanceDue: { gt: 0 },
    },
    select: {
      id: true,
      balanceDue: true,
      dateEcheance: true,
      clientId: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true, typeClient: true } },
    },
  });

  const nowMs = now.getTime();
  const totals = { totalDu: 0, courant: 0, b1_30: 0, b31_60: 0, b61_90: 0, b90plus: 0, enRetard: 0, nbFactures: invoices.length, nbClients: 0 };
  const groups = new Map<string, AgingClientRow>();

  for (const inv of invoices) {
    const due = inv.balanceDue;
    const joursRetard = Math.floor((nowMs - inv.dateEcheance.getTime()) / 86_400_000);
    totals.totalDu += due;

    if (joursRetard <= 0) totals.courant += due;
    else {
      totals.enRetard += due;
      if (joursRetard <= 30) totals.b1_30 += due;
      else if (joursRetard <= 60) totals.b31_60 += due;
      else if (joursRetard <= 90) totals.b61_90 += due;
      else totals.b90plus += due;
    }

    const g = groups.get(inv.clientId);
    if (g) {
      g.totalDu += due;
      g.nbFactures += 1;
      if (joursRetard > 0) g.montantEnRetard += due;
      if (joursRetard > g.joursRetardMax) g.joursRetardMax = joursRetard;
    } else {
      groups.set(inv.clientId, {
        clientId: inv.clientId,
        clientNom: clientNom(inv.client),
        totalDu: due,
        montantEnRetard: joursRetard > 0 ? due : 0,
        joursRetardMax: Math.max(0, joursRetard),
        nbFactures: 1,
      });
    }
  }

  totals.nbClients = groups.size;
  const clients = Array.from(groups.values()).sort(
    (a, b) => b.montantEnRetard - a.montantEnRetard || b.totalDu - a.totalDu,
  );

  return { totals, clients };
}
