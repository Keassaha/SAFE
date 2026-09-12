import type { PaiementRangee } from "@/components/facturation/PaiementsTable";

/**
 * Cas limites du registre des paiements, pour le contrôle visuel : nom très
 * long, paiement sans facture, allocation partielle, encaissement annulé,
 * preuve jointe ou non, chaque mode de paiement.
 */
export const RANGEES: PaiementRangee[] = [
  { id: "p1", clientId: "c1", datePaiement: "2026-09-11", client: { id: "c1", raisonSociale: "Groupe immobilier Northfield et Associés inc.", prenom: null, nom: null }, invoice: { id: "i1", numero: "2026-0042" }, montant: 12500, allocatedAmount: 12500, unallocatedAmount: 0, allocationStatus: "ALLOCATED", paymentMethod: "bank_transfer", preuveStorageKey: "k1" },
  { id: "p2", clientId: "c2", datePaiement: "2026-09-10", client: { id: "c2", raisonSociale: "Boulangerie Saint-Roch inc.", prenom: null, nom: null }, invoice: null, montant: 2500, allocatedAmount: 0, unallocatedAmount: 2500, allocationStatus: "UNALLOCATED", paymentMethod: "e_transfer", preuveStorageKey: "k2" },
  { id: "p3", clientId: "c3", datePaiement: "2026-09-09", client: { id: "c3", raisonSociale: null, prenom: "Jean-Christophe", nom: "Tremblay-Beauchemin" }, invoice: { id: "i3", numero: "2026-0041" }, montant: 1500, allocatedAmount: 1500, unallocatedAmount: 0, allocationStatus: "ALLOCATED", paymentMethod: "cheque", preuveStorageKey: null },
  { id: "p4", clientId: "c4", datePaiement: "2026-09-08", client: { id: "c4", raisonSociale: "Coopérative de solidarité des Berges", prenom: null, nom: null }, invoice: { id: "i4", numero: "2026-0038" }, montant: 1000, allocatedAmount: 250, unallocatedAmount: 750, allocationStatus: "PARTIALLY_ALLOCATED", paymentMethod: "e_transfer", preuveStorageKey: "k4" },
  { id: "p5", clientId: "c5", datePaiement: "2026-09-05", client: { id: "c5", raisonSociale: "Succession de feu Roland Bergeron", prenom: null, nom: null }, invoice: { id: "i5", numero: "2026-0037" }, montant: 3105.2, allocatedAmount: 3105.2, unallocatedAmount: 0, allocationStatus: "ALLOCATED", paymentMethod: "bank_transfer", preuveStorageKey: null },
  { id: "p6", clientId: "c6", datePaiement: "2026-09-04", client: { id: "c6", raisonSociale: null, prenom: "Joséphine", nom: "Ntumba Kalala" }, invoice: null, montant: 1000, allocatedAmount: 0, unallocatedAmount: 1000, allocationStatus: "UNALLOCATED", paymentMethod: "e_transfer", preuveStorageKey: "k6" },
  { id: "p7", clientId: "c7", datePaiement: "2026-09-02", client: { id: "c7", raisonSociale: null, prenom: "Marie-Ève", nom: "Ouellet" }, invoice: { id: "i7", numero: "2026-0039" }, montant: 217.5, allocatedAmount: 0, unallocatedAmount: 0, allocationStatus: "REVERSED", paymentMethod: "card", preuveStorageKey: null },
  { id: "p8", clientId: "c8", datePaiement: "2026-08-29", client: { id: "c8", raisonSociale: "Constructions Béliveau & Fils ltée", prenom: null, nom: null }, invoice: { id: "i8", numero: "2026-0036" }, montant: 46780.9, allocatedAmount: 46780.9, unallocatedAmount: 0, allocationStatus: "ALLOCATED", paymentMethod: "trust", preuveStorageKey: "k8" },
  { id: "p9", clientId: null, datePaiement: "2026-08-27", client: null, invoice: null, montant: 1284300.5, allocatedAmount: 0, unallocatedAmount: 1284300.5, allocationStatus: "UNALLOCATED", paymentMethod: "cash", preuveStorageKey: null },
];
