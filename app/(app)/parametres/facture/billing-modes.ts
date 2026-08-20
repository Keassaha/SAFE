/**
 * Les trois modes de facturation, tenus hors du fichier « use server ».
 *
 * Next.js n'autorise QUE des fonctions asynchrones à sortir d'un fichier
 * marqué `"use server"`. Une simple constante exportée depuis `actions.ts`
 * fait échouer le module entier au chargement, et avec lui tout l'écran des
 * réglages de facture : le réglage du mode devenait inatteignable au moment
 * précis où on venait de le construire.
 *
 * La liste vit donc ici, où l'action serveur et le formulaire client peuvent
 * la lire tous les deux sans contrainte.
 */
export const BILLING_MODES = ["horaire", "forfait", "mixte"] as const;

export type BillingModeChoice = (typeof BILLING_MODES)[number];
