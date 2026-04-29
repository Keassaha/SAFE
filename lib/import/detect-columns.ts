import type { DocumentType, ColumnMapping } from "./types";

type AliasMap = Record<string, string[]>;

const CLIENT_ALIASES: AliasMap = {
  raisonSociale: ["client", "raison sociale", "nom société", "company", "nom client", "raison_sociale"],
  partieAdverse: ["partie_adverse", "partie adverse", "opposing party", "adversaire"],
  categorieDossier: ["catégorie_dossier", "categorie_dossier", "catégorie dossier", "categorie dossier", "category"],
  typeDossier: ["type_dossier", "type dossier", "matter type", "type"],
  numeroDossier: ["n0_dossier", "no_dossier", "no dossier", "numéro dossier", "numero dossier", "dossier", "matter", "file number", "référence"],
  dateOuverture: ["date_ouverture", "date ouverture", "date d'ouverture", "opened", "open date"],
  email: ["courriel", "email", "e-mail", "adresse courriel", "courrier électronique"],
  telephone: ["téléphone", "telephone", "tél", "tel", "phone"],
  adresse: ["adresse", "address", "adresse complète"],
  langue: ["langue", "language", "lang"],
  statut: ["statut", "status", "état", "etat", "state"],
  districtJudiciaire: ["district", "district judiciaire", "district_judiciaire", "judicial district"],
  tribunal: ["tribunal", "cour", "court"],
  typeCause: ["type cause", "type_cause", "type de cause", "cause type"],
};

const TIME_ENTRY_ALIASES: AliasMap = {
  date: ["date", "date entrée", "date saisie", "work date"],
  clientName: ["client", "nom client", "raison sociale"],
  numeroDossier: ["no_dossier", "n0_dossier", "no dossier", "numéro dossier", "numero dossier", "dossier", "matter"],
  description: ["description", "activité", "activite", "tâche", "tache", "task", "memo", "notes"],
  dureeHeures: ["temps (h)", "temps(h)", "heures", "hours", "durée", "duree", "duration", "temps", "time"],
  avocatName: ["avocat", "avocate", "lawyer", "attorney", "professionnel", "utilisateur", "user"],
  tauxHoraire: ["taux $/h", "taux", "rate", "hourly rate", "taux horaire"],
  montant: ["montant ($)", "montant", "amount", "total", "fees"],
  statut: ["état", "etat", "statut", "status", "billing status"],
};

const BANK_ALIASES: AliasMap = {
  date: ["date", "transaction date", "date opération", "date operation", "trans date", "posting date"],
  description: ["description", "memo", "details", "libellé", "libelle", "narrative", "transaction", "payee"],
  amount: ["amount", "montant", "transaction amount", "somme"],
  debit: ["debit", "débit", "depense", "withdrawal", "retrait"],
  credit: ["credit", "crédit", "deposit", "dépôt", "revenu"],
  balance: ["balance", "solde", "running balance"],
  reference: ["reference", "ref", "référence", "numero", "number"],
};

const ACCOUNTING_LEDGER_ALIASES: AliasMap = {
  date: [
    "date", "date transaction", "date opération", "date operation",
    "date écriture", "date ecriture", "transaction date", "posting date",
    "date pièce", "date piece",
  ],
  description: [
    "description", "libellé", "libelle", "memo", "narration", "objet",
    "details", "détails", "explication",
  ],
  reference: [
    "reference", "référence", "ref", "réf", "numero pièce", "numero piece",
    "no pièce", "no piece", "numero facture", "no facture", "voucher",
    "numero", "number",
  ],
  clientName: [
    "client", "tiers", "fournisseur", "raison sociale", "nom client",
    "compte tiers", "supplier", "vendor",
  ],
  numeroDossier: [
    "no_dossier", "n0_dossier", "no dossier", "numéro dossier",
    "numero dossier", "dossier", "matter", "n° dossier",
  ],
  categorie: [
    "categorie", "catégorie", "category", "type compte", "compte cat",
    "rubrique", "classe", "famille",
  ],
  compte: [
    "compte", "account", "no compte", "n° compte", "numero compte",
    "compte gl", "gl account", "numéro compte",
  ],
  debit: ["debit", "débit", "dr", "withdrawal"],
  credit: ["credit", "crédit", "cr", "deposit"],
  amount: ["amount", "montant", "somme", "total", "valeur"],
  balance: ["balance", "solde", "solde courant", "running balance"],
  sourceModule: [
    "source", "source module", "module", "origine", "origin",
    "source_module",
  ],
  typeTransaction: [
    "type transaction", "type_transaction", "type", "transaction type",
    "type opération", "type operation", "nature",
  ],
};

function normalizeHeader(h: string): string {
  return h.replace(/[_\s]+/g, " ").trim().toLowerCase();
}

function findBestMatch(headers: string[], aliases: string[]): string | null {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const a = alias.toLowerCase();
    const exactIdx = normalized.findIndex((h) => h === a);
    if (exactIdx >= 0) return headers[exactIdx]!;
  }
  for (const alias of aliases) {
    const a = alias.toLowerCase();
    const partialIdx = normalized.findIndex((h) => h.includes(a) || a.includes(h));
    if (partialIdx >= 0) return headers[partialIdx]!;
  }
  return null;
}

function aliasMapFor(type: DocumentType): AliasMap {
  switch (type) {
    case "registre_clients":
      return CLIENT_ALIASES;
    case "fiches_temps":
      return TIME_ENTRY_ALIASES;
    case "releve_bancaire":
      return BANK_ALIASES;
    case "migration_comptable":
      return ACCOUNTING_LEDGER_ALIASES;
  }
}

export function detectColumns(headers: string[], type: DocumentType): ColumnMapping {
  const aliasMap = aliasMapFor(type);
  // On ignore les colonnes meta (préfixe `__`) afin qu'elles ne soient jamais mappées.
  const visibleHeaders = headers.filter((h) => !h.startsWith("__"));
  const mapping: ColumnMapping = {};
  for (const [field, aliases] of Object.entries(aliasMap)) {
    mapping[field] = findBestMatch(visibleHeaders, aliases);
  }
  return mapping;
}

export function getFieldLabels(type: DocumentType): Record<string, string> {
  if (type === "registre_clients") {
    return {
      raisonSociale: "Client / Raison sociale",
      partieAdverse: "Partie adverse",
      categorieDossier: "Catégorie dossier",
      typeDossier: "Type dossier",
      numeroDossier: "Numéro dossier",
      dateOuverture: "Date d'ouverture",
      email: "Courriel",
      telephone: "Téléphone",
      adresse: "Adresse",
      langue: "Langue",
      statut: "Statut",
      districtJudiciaire: "District judiciaire",
      tribunal: "Tribunal",
      typeCause: "Type de cause",
    };
  }
  if (type === "fiches_temps") {
    return {
      date: "Date",
      clientName: "Client",
      numeroDossier: "Numéro dossier",
      description: "Description",
      dureeHeures: "Durée (heures)",
      avocatName: "Avocat",
      tauxHoraire: "Taux horaire",
      montant: "Montant",
      statut: "Statut",
    };
  }
  if (type === "migration_comptable") {
    return {
      date: "Date",
      description: "Description",
      reference: "Référence / pièce",
      clientName: "Client / Tiers",
      numeroDossier: "Numéro dossier",
      categorie: "Catégorie / Rubrique",
      compte: "Compte (GL)",
      debit: "Débit",
      credit: "Crédit",
      amount: "Montant unique",
      balance: "Solde",
      sourceModule: "Source / Module",
      typeTransaction: "Type transaction",
    };
  }
  return {
    date: "Date",
    description: "Description",
    amount: "Montant",
    debit: "Débit",
    credit: "Crédit",
    balance: "Solde",
    reference: "Référence",
  };
}
