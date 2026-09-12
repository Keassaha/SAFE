import type { OperationRangee } from "@/components/fideicommis/TransactionsTable";
import type {
  TrustAlertsReport,
  TrustReconciliationStatus,
  TrustSummary,
} from "@/components/fideicommis/TrustSummaryBar";

export const RESUME: TrustSummary = {
  soldeTotal: 184312.4,
  depotsMois: 42500,
  retraitsMois: 18940,
  nbDossiersAvecProvision: 23,
};

export const RAPPROCHEMENT_OK: TrustReconciliationStatus = {
  expectedPeriode: "2026-08",
  daysSinceMonthEnd: 12,
  overdue: false,
  critical: false,
  lastCertifiedPeriode: "2026-08",
};

export const RAPPROCHEMENT_RETARD: TrustReconciliationStatus = {
  expectedPeriode: "2026-08",
  daysSinceMonthEnd: 34,
  overdue: true,
  critical: true,
  lastCertifiedPeriode: "2026-07",
};

export const ALERTES_RIEN: TrustAlertsReport = {
  soldesNegatifs: [],
  fondsDormants: [],
  ecartRapprochement: null,
  summary: { nbCritiques: 0, nbAvertissements: 0 },
};

export const ALERTES: TrustAlertsReport = {
  soldesNegatifs: [
    { accountId: "a1", clientNom: "Ouellet, Marie-Ève", dossierIntitule: "Contestation de saisie avant jugement", currentBalance: -412.5, derniereActivite: "2026-09-10", inactifJours: 2 },
    { accountId: "a2", clientNom: "Boulangerie Saint-Roch inc.", dossierIntitule: null, currentBalance: -1284300.5, derniereActivite: "2026-09-01", inactifJours: 11 },
  ],
  fondsDormants: [
    { accountId: "a3", clientNom: "Succession de feu Roland Bergeron", dossierIntitule: "Liquidation successorale", currentBalance: 3105.2, derniereActivite: "2026-02-14", inactifJours: 210 },
  ],
  ecartRapprochement: { periode: "2026-07", ecart: 25, status: "draft" },
  summary: { nbCritiques: 3, nbAvertissements: 1 },
};

const client = (id: string, raisonSociale: string | null, prenom: string | null, nom: string | null) => ({ id, raisonSociale, prenom, nom });

export const RANGEES: OperationRangee[] = [
  { id: "t1", date: "2026-09-11", amount: 12500, type: "deposit", balanceAfter: 184312.4, description: "Provision honoraires", note: null, reference: "VIR-8821", client: client("c1", "Groupe immobilier Northfield et Associés inc.", null, null), dossier: { id: "d1", intitule: "Northfield c. Ville de Laval — recours en annulation de règlement de zonage", numeroDossier: "2026-0042" } },
  { id: "t2", date: "2026-09-10", amount: -3105.2, type: "withdrawal", balanceAfter: 171812.4, description: "Honoraires facturés", note: null, reference: "CHQ 1042", client: client("c2", null, "Marie-Ève", "Ouellet"), dossier: { id: "d2", intitule: "Contestation de saisie avant jugement", numeroDossier: "2026-0039" } },
  { id: "t3", date: "2026-09-08", amount: 1000, type: "deposit", balanceAfter: 174917.6, description: null, note: null, reference: null, client: client("c3", "Coopérative de solidarité des Berges", null, null), dossier: { id: "d3", intitule: "Révision de la convention d'actionnaires", numeroDossier: "2026-0038" } },
  { id: "t4", date: "2026-09-05", amount: -15834.8, type: "withdrawal", balanceAfter: 173917.6, description: "Remise au client", note: null, reference: "VIR-8790", client: client("c4", "Succession de feu Roland Bergeron", null, null), dossier: { id: "d4", intitule: "Liquidation successorale", numeroDossier: "2026-0037" } },
  { id: "t5", date: "2026-09-02", amount: 4000, type: "deposit", balanceAfter: 189752.4, description: "Provision", note: null, reference: "INT-2291", client: client("c5", null, "Jean-Christophe", "Tremblay-Beauchemin"), dossier: null },
  { id: "t6", date: "2026-08-29", amount: -250, type: "correction", balanceAfter: 185752.4, description: "Somme déposée par inadvertance", note: null, reference: null, client: client("c6", "Constructions Béliveau & Fils ltée", null, null), dossier: { id: "d6", intitule: "Réclamation pour vices de construction", numeroDossier: "2026-0036" } },
  { id: "t7", date: "2026-08-27", amount: 1284300.5, type: "deposit", balanceAfter: 186002.4, description: "Une description très longue qui doit se tronquer proprement sans casser la rangée ni pousser les chiffres", note: null, reference: "VIR-0000001", client: client("c7", "Boulangerie Saint-Roch inc.", null, null), dossier: null },
];
