import type { DossierType } from "@prisma/client";

export type PracticeDocketMode = "procedure" | "suivi" | "transaction" | "general";

export interface PracticeDocumentInput {
  dossierType?: DossierType | null;
  dossierSousType?: string | null;
  fileName: string;
  documentType?: string | null;
  richDocumentType?: string | null;
}

export interface PracticeDocumentSuggestion {
  sectionKey: string;
  subtype: string;
  docketMode: PracticeDocketMode;
  docketEntryType: string;
  title: string;
  confidence: number;
  needsReview: boolean;
  shouldCreateDocketEntry: boolean;
  reason: string;
}

const FALLBACK_BY_SECTION: Record<string, string[]> = {
  "offre-convention": ["formulaires"],
  "financement-hypotheque": ["formulaires", "fideicommis"],
  "recherche-titres": ["procedures", "formulaires"],
  "documents-cloture": ["fermeture", "formulaires"],
  "debours-ajustements": ["fideicommis", "notes-honoraires"],
  soumissions: ["immigration", "formulaires"],
  decisions: ["immigration", "correspondance"],
  "evaluations-medicales": ["pieces", "formulaires"],
  audiences: ["procedures", "jugements"],
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || fileName;
}

export function getDocketModeForDossier(
  dossierType?: DossierType | null,
  dossierSousType?: string | null
): PracticeDocketMode {
  const sousType = normalize(dossierSousType);
  if (dossierType === "immigration") return "suivi";
  if (dossierType === "immobilier") return "transaction";
  if (dossierType === "droit_famille" || dossierType === "criminel") return "procedure";
  if (dossierType === "litige_civil" && hasAny(sousType, ["protection", "tuf", "curatelle", "tutelle"])) {
    return "procedure";
  }
  return "general";
}

export function resolveAvailableSectionKey(sectionKey: string, availableSectionKeys?: string[]): string {
  if (!availableSectionKeys || availableSectionKeys.length === 0) return sectionKey;
  if (availableSectionKeys.includes(sectionKey)) return sectionKey;

  for (const fallback of FALLBACK_BY_SECTION[sectionKey] ?? []) {
    if (availableSectionKeys.includes(fallback)) return fallback;
  }

  if (availableSectionKeys.includes("formulaires")) return "formulaires";
  if (availableSectionKeys.includes("procedures")) return "procedures";
  return availableSectionKeys[0] ?? sectionKey;
}

export function suggestPracticeDocument(input: PracticeDocumentInput): PracticeDocumentSuggestion {
  const text = normalize([
    input.fileName,
    input.documentType,
    input.richDocumentType,
  ].filter(Boolean).join(" "));
  const title = titleFromFileName(input.fileName);
  const docketMode = getDocketModeForDossier(input.dossierType, input.dossierSousType);

  const base = (
    sectionKey: string,
    subtype: string,
    docketEntryType: string,
    confidence: number,
    shouldCreateDocketEntry: boolean,
    reason: string
  ): PracticeDocumentSuggestion => ({
    sectionKey,
    subtype,
    docketMode,
    docketEntryType,
    title,
    confidence,
    needsReview: confidence < 75,
    shouldCreateDocketEntry,
    reason,
  });

  const engagementHypothecaire = hasAny(text, ["hypotheque", "hypothecaire", "mortgage"]);
  if (hasAny(text, ["mandat", "retainer"]) || (text.includes("engagement") && !engagementHypothecaire)) {
    return base("mandat", "mandat", "mandat", 88, false, "Document d'ouverture de mandat.");
  }

  if (input.dossierType === "immigration") {
    if (hasAny(text, ["decision", "approbation", "refus", "rejet", "passport request", "ppr"])) {
      return base("decisions", "decision", "decision", 86, true, "Document de décision ou résultat IRCC/MIFI.");
    }
    if (hasAny(text, ["aor", "accuse", "reception", "biometrie", "biometric", "ircc", "mifi", "documents additionnels", "adr"])) {
      return base("correspondance", "lettre-ircc-mifi", "suivi_ircc", 82, true, "Correspondance ou étape de suivi avec l'autorité.");
    }
    if (hasAny(text, ["soumission", "submission", "representations", "lettre explicative", "cover letter"])) {
      return base("soumissions", "soumission", "soumission", 84, true, "Soumission ou représentation à produire au dossier.");
    }
    if (hasAny(text, ["imm ", "imm", "caq", "csq", "formulaire", "form"])) {
      return base("formulaires", "formulaire-immigration", "formulaire", 78, false, "Formulaire d'immigration.");
    }
    if (hasAny(text, ["passeport", "police", "certificat", "preuve", "photo", "diplome", "releve"])) {
      return base("pieces", "piece-client", "piece", 75, false, "Pièce justificative client.");
    }
  }

  if (input.dossierType === "immobilier") {
    if (hasAny(text, ["offre", "promesse", "achat", "vente", "convention"])) {
      return base("offre-convention", "offre-convention", "transaction_offer", 84, true, "Document structurant de la transaction.");
    }
    if (hasAny(text, ["hypotheque", "hypothecaire", "financement", "preteur", "mortgage"])) {
      return base("financement-hypotheque", "financement", "financement", 84, true, "Document de financement ou engagement hypothécaire.");
    }
    if (hasAny(text, ["titre", "titres", "index", "rdprm", "publication", "recherche"])) {
      return base("recherche-titres", "recherche-titres", "recherche_titres", 82, true, "Document lié à la recherche ou publication des titres.");
    }
    if (hasAny(text, ["debours", "ajustement", "etat des ajustements", "trust", "fideicommis"])) {
      return base("debours-ajustements", "ajustements", "ajustements", 80, true, "Document financier de clôture.");
    }
    if (hasAny(text, ["cloture", "closing", "quittance", "acte", "vente"])) {
      return base("documents-cloture", "cloture", "cloture", 80, true, "Document de clôture immobilière.");
    }
  }

  if (input.dossierType === "criminel") {
    if (hasAny(text, ["divulgation", "dpcp", "stinchcombe", "disclosure"])) {
      return base("divulgation", "divulgation", "divulgation", 88, true, "Divulgation de la poursuite.");
    }
    if (hasAny(text, ["comparution", "presence", "prochaine date", "avis d'audience"])) {
      return base("comparutions", "comparution", "comparution", 84, true, "Date ou événement de comparution.");
    }
    if (hasAny(text, ["jordan", "garofoli", "requete", "motion", "mise en accusation", "denonciation"])) {
      return base("procedures", "requete-criminelle", "procedure", 84, true, "Acte de procédure criminelle.");
    }
    if (hasAny(text, ["engagement", "ordonnance", "interdiction", "promesse"])) {
      return base("formulaires", "formulaire-criminel", "ordonnance_engagement", 80, true, "Formulaire ou ordonnance criminelle.");
    }
  }

  const protectionLike =
    input.dossierType === "litige_civil" &&
    hasAny(normalize(input.dossierSousType), ["protection", "tuf", "curatelle", "tutelle"]);

  if (input.dossierType === "droit_famille" || protectionLike) {
    if (hasAny(text, ["ordonnance", "jugement", "sauvegarde", "homologation"])) {
      return base("jugements", "ordonnance-jugement", "ordonnance", 84, true, "Ordonnance ou jugement à suivre.");
    }
    if (hasAny(text, ["demande", "requete", "procedure", "protocole", "defense", "reponse"])) {
      return base("procedures", "procedure-famille", "procedure", 82, true, "Acte de procédure familial ou protection.");
    }
    if (hasAny(text, ["evaluation", "medical", "psychosocial", "aptitude", "capacite"])) {
      return base(protectionLike ? "evaluations-medicales" : "pieces-madame", "evaluation", "piece", 78, true, "Évaluation ou pièce structurante.");
    }
    if (/\bp[-\s]?\d+\b/.test(text)) {
      return base("pieces-madame", "piece-p", "piece", 76, false, "Pièce demanderesse détectée.");
    }
    if (/\bd[-\s]?\d+\b/.test(text)) {
      return base("pieces-monsieur", "piece-d", "piece", 76, false, "Pièce défenderesse détectée.");
    }
  }

  if (hasAny(text, ["correspondance", "courriel", "email", "lettre"])) {
    return base("correspondance", "correspondance", "correspondance", 70, false, "Correspondance générale.");
  }
  if (hasAny(text, ["facture", "honoraire", "compte", "note"])) {
    return base("notes-honoraires", "facturation", "note_honoraires", 70, false, "Document lié aux honoraires ou notes.");
  }
  if (hasAny(text, ["procedure", "requete"])) {
    return base("procedures", "procedure", "procedure", 72, docketMode !== "general", "Acte de procédure probable.");
  }

  return base("formulaires", "autre", "document", 45, false, "Classification insuffisante; revue humaine requise.");
}
