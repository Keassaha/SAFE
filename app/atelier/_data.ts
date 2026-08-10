/**
 * Données de spécimen de l'atelier des trois plans.
 *
 * Cette route est une page de spécimens (SAFE_PREMIUM_DESIGN_STANDARD §7.2,
 * PS-092), pas une route produit. Les valeurs servent à éprouver la composition
 * avec des cas réels : montant à sept chiffres, solde négatif, zéro, nom de
 * partie long, référence longue. Aucune de ces données n'est branchée sur la
 * base et cette route n'a aucun équivalent en production.
 */

export type Blocker = {
  id: string;
  titre: string;
  pourquoi: string;
  dossier: string;
  reference: string;
  montant?: string;
  echeance: string;
  critique?: boolean;
  action: string;
};

export type WorkItem = {
  id: string;
  titre: string;
  source: string;
  reference: string;
  montant: string;
  echeance: string;
  enRetard?: boolean;
  statut: { texte: string; ton: "action" | "info" | "fait" };
};

export type EventItem = {
  id: string;
  qui: string;
  quoi: string;
  quand: string;
};

export const ledger = [
  {
    label: "Solde en fidéicommis",
    valeur: "1 284 750,00 $",
    note: "Rapproché le 28 juillet",
  },
  {
    label: "Heures à facturer",
    valeur: "42,75 h",
    note: "Sur 6 dossiers",
  },
  {
    label: "Créances en retard",
    valeur: "-8 420,00 $",
    note: "3 factures au delà de 60 jours",
    alerte: true,
  },
  {
    label: "Débours non refacturés",
    valeur: "0,00 $",
    note: "Rien en attente",
  },
] as const;

export const blockers: Blocker[] = [
  {
    id: "b1",
    titre: "Retrait de fidéicommis en attente de votre approbation",
    pourquoi:
      "Le montant dépasse le seuil de double signature du cabinet. Le retrait reste bloqué tant qu'une seconde personne autorisée n'a pas approuvé.",
    dossier: "Succession Beauchemin-Lapointe",
    reference: "2026-0184",
    montant: "24 500,00 $",
    echeance: "Demandé il y a 2 j",
    critique: true,
    action: "Examiner le retrait",
  },
  {
    id: "b2",
    titre: "Vérification d'identité incomplète avant l'ouverture du dossier",
    pourquoi:
      "Le Barreau exige la pièce d'identité au dossier avant la première opération en fidéicommis. Le dépôt reçu hier est retenu en attendant.",
    dossier: "Immobilier Rive-Sud inc.",
    reference: "2026-0191",
    echeance: "À faire aujourd'hui",
    action: "Compléter la vérification",
  },
];

export const work: WorkItem[] = [
  {
    id: "w1",
    titre: "Facture 2026-0142 prête à émettre",
    source: "Préparée par Marie-Claude Tremblay",
    reference: "2026-0142",
    montant: "3 187,50 $",
    echeance: "Aujourd'hui",
    statut: { texte: "À réviser", ton: "action" },
  },
  {
    id: "w2",
    titre: "Requête introductive à déposer, Cour supérieure du Québec",
    source: "Succession Beauchemin-Lapointe",
    reference: "2026-0184",
    montant: "1 240,00 $",
    echeance: "Dans 2 j",
    statut: { texte: "En cours", ton: "info" },
  },
  {
    id: "w3",
    titre:
      "Convention de services professionnels à faire signer par le client avant la mise en demeure",
    source: "Immobilier Rive-Sud inc.",
    reference: "2026-0191",
    montant: "0,00 $",
    echeance: "Retard 4 j",
    enRetard: true,
    statut: { texte: "En attente client", ton: "action" },
  },
  {
    id: "w4",
    titre: "Rapprochement du compte en fidéicommis, juillet",
    source: "Comptabilité",
    reference: "2026-FID-07",
    montant: "1 284 750,00 $",
    echeance: "Dans 5 j",
    statut: { texte: "Planifié", ton: "info" },
  },
  {
    id: "w5",
    titre: "Reçu de débours à joindre, huissier",
    source: "Gagnon c. Ville de Longueuil",
    reference: "2026-0177",
    montant: "182,45 $",
    echeance: "Dans 6 j",
    statut: { texte: "Rapproché", ton: "fait" },
  },
];

export const events: EventItem[] = [
  {
    id: "e1",
    qui: "Marie-Claude Tremblay",
    quoi: "a consigné un paiement de 4 200,00 $ sur la facture 2026-0138",
    quand: "il y a 12 min",
  },
  {
    id: "e2",
    qui: "Vous",
    quoi: "avez verrouillé la période comptable de juin",
    quand: "il y a 3 h",
  },
  {
    id: "e3",
    qui: "Système",
    quoi: "a retenu un dépôt de 15 000,00 $ faute de vérification d'identité",
    quand: "hier",
  },
  {
    id: "e4",
    qui: "Jean-Philippe Ouellet",
    quoi: "a ajouté 2,50 h au dossier 2026-0184",
    quand: "hier",
  },
];

export const commands = [
  { id: "c1", label: "Saisir du temps sur un dossier", kind: "Action" },
  { id: "c2", label: "Créer la facture", kind: "Action" },
  { id: "c3", label: "Consigner un paiement", kind: "Action" },
  { id: "c4", label: "Succession Beauchemin-Lapointe", kind: "Dossier" },
  { id: "c5", label: "Immobilier Rive-Sud inc.", kind: "Client" },
  { id: "c6", label: "Rapprochement du fidéicommis", kind: "Rapport" },
];

export const dossiers = [
  "Succession Beauchemin-Lapointe",
  "Immobilier Rive-Sud inc.",
  "Gagnon c. Ville de Longueuil",
];
