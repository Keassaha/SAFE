/**
 * SAFE — La PROVENANCE d'une écriture, à partir de ce que le journal stocke déjà.
 *
 * Le journal enregistre la méthode de paiement dans `categorie`, sous la forme
 * « Paiement bank_transfer » : le mot brut de la base sortait tel quel à
 * l'écran. Sur une facture émise, `categorie` vaut « Facturation client », ce
 * qui ne fait que répéter la colonne Type ; on n'affiche alors rien.
 *
 * Fonction PURE, partagée par les deux tableaux du journal (vue brute et vue
 * expliquée) pour qu'ils ne divergent jamais. Aucune migration : la donnée
 * était là, elle n'était pas montrée.
 *
 * Demande CEO du 2026-09-09 : « pour les paiements reçus n'a-t-on pas besoin de
 * savoir la provenance, virement Interac, paiement chèque, compte en fidéi ? »
 */

import type { JournalTransactionType } from "@prisma/client";

/** Les modes de paiement du produit, dans les deux vocabulaires du schéma. */
const METHODE: Record<string, string> = {
  // `PaymentMethodBilling`
  cash: "Comptant",
  cheque: "Chèque",
  e_transfer: "Interac",
  card: "Carte",
  bank_transfer: "Virement bancaire",
  trust: "Fidéicommis",
  other: "Autre",
  // `PaymentMethod`, vocabulaire historique
  virement: "Virement bancaire",
  carte: "Carte",
  autre: "Autre",
};

export function provenanceEcriture(e: {
  typeTransaction: JournalTransactionType;
  categorie: string | null;
}): string | null {
  // Sur une facture, la provenance répéterait le type. On ne l'affiche pas.
  if (e.typeTransaction === "FACTURE") return null;
  const c = e.categorie;
  if (!c) return null;
  if (c.startsWith("Paiement ")) {
    const brut = c.slice("Paiement ".length);
    return METHODE[brut] ?? brut;
  }
  // Pour une dépense, la catégorie EST la provenance (« Formation », « Loyer »).
  return c;
}
