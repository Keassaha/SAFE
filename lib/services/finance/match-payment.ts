/**
 * Rapprochement déterministe d'une preuve de paiement extraite (L1) vers
 * un client / une facture / un dossier.
 *
 * Spec : docs/product/SPEC_IMPORT_PREUVE_PAIEMENT.md (Brique 2 + Brique 2bis, lot L2).
 *
 * DOCTRINE : aucun appel IA ici. Les montants et rapprochements sont déterministes
 * (cf. project_ai_agents). L'IA lit (L1) ; ce module raisonne sur des règles exactes.
 *
 * Fonction PURE : reçoit l'extraction + les candidats déjà chargés, ne touche pas Prisma.
 * Le chargement des candidats (clients, factures ouvertes, dossiers, règles) est fait par
 * l'appelant. Ça garde le cœur testable sans base de données.
 */

import type { PaymentProofExtraction } from "@/lib/ai/extract-payment-proof";

export interface MatchCandidateClient {
  id: string;
  email: string | null;
  emailSecondaire: string | null;
  billingEmail: string | null;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
}

export interface MatchCandidateInvoice {
  id: string;
  numero: string;
  clientId: string;
  dossierId: string | null;
  /** Solde restant dû (> 0 pour une facture ouverte). */
  balanceDue: number;
}

export interface MatchCandidateDossier {
  id: string;
  numeroDossier: string | null;
  clientId: string;
}

/** Règle de payeur tiers (Brique 2bis). `payerName` est stocké déjà normalisé. */
export interface PayerRuleInput {
  id: string;
  payerEmail: string | null;
  payerName: string | null;
  clientId: string | null;
  dossierId: string | null;
  scope: "CLIENT_UNIQUE" | "PAYEUR_CONNU";
  note: string | null;
  active: boolean;
}

export interface MatchCandidates {
  clients: MatchCandidateClient[];
  /** Factures ouvertes (ISSUED / PARTIALLY_PAID / OVERDUE, balanceDue > 0). */
  openInvoices: MatchCandidateInvoice[];
  dossiers: MatchCandidateDossier[];
  payerRules: PayerRuleInput[];
}

/** 🟢 certain · 🟠 à confirmer · 🔴 aucun. */
export type MatchConfidence = "certain" | "a_confirmer" | "aucun";

export interface PaymentMatch {
  confidence: MatchConfidence;
  clientId: string | null;
  invoiceId: string | null;
  dossierId: string | null;
  /** Montant suggéré à allouer à la facture (jamais > solde). */
  allocatedAmount: number | null;
  /** Le payeur (expéditeur) est-il différent du client résolu ? */
  isThirdPartyPayer: boolean;
  /** Note d'un payeur tiers connu (PAYEUR_CONNU), pour affichage. */
  knownPayerNote: string | null;
  /** Règle ayant résolu le client, le cas échéant. */
  matchedByRule: { ruleId: string; scope: PayerRuleInput["scope"]; note: string | null } | null;
  /** Explications lisibles (UI). */
  reasons: string[];
}

const EPSILON = 0.005;

/** Normalise pour comparaison : minuscules, sans accents, espaces compactés. */
export function normalizeText(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function clientEmails(c: MatchCandidateClient): string[] {
  return [c.email, c.emailSecondaire, c.billingEmail]
    .map((e) => normalizeText(e))
    .filter((e) => e.length > 0);
}

function clientFullNames(c: MatchCandidateClient): string[] {
  const names: string[] = [];
  if (c.raisonSociale) names.push(normalizeText(c.raisonSociale));
  const person = [c.prenom, c.nom].filter(Boolean).join(" ");
  if (person.trim()) names.push(normalizeText(person));
  return names.filter((n) => n.length > 0);
}

/** Extrait un jeton ressemblant à un n° de dossier depuis un texte libre. */
function extractDossierTokens(message: string | null): string[] {
  if (!message) return [];
  // Formats courants : 2024-0142, 2024-142, AB-2024-01, 12345
  const matches = message.match(/\b[A-Za-z]{0,3}-?\d{2,4}-?\d{1,5}\b|\b\d{3,8}\b/g);
  return matches ? matches.map((m) => normalizeText(m)) : [];
}

type Resolution = {
  clientId: string | null;
  dossierId: string | null;
  strength: "rule_unique" | "email" | "dossier" | "name" | "none";
  isThirdParty: boolean;
  rule: PaymentMatch["matchedByRule"];
  knownPayerNote: string | null;
  reasons: string[];
};

function resolveClient(
  extraction: PaymentProofExtraction,
  candidates: MatchCandidates,
): Resolution {
  const reasons: string[] = [];
  const senderEmail = normalizeText(extraction.expediteurCourriel);
  const senderName = normalizeText(extraction.expediteurNom);
  const activeRules = candidates.payerRules.filter((r) => r.active);

  // --- Signal 0 : règles de payeur tiers ---
  const ruleMatch = activeRules.find(
    (r) =>
      (r.payerEmail && normalizeText(r.payerEmail) === senderEmail && senderEmail.length > 0) ||
      (r.payerName && r.payerName === senderName && senderName.length > 0),
  );

  if (ruleMatch?.scope === "CLIENT_UNIQUE" && ruleMatch.clientId) {
    reasons.push(`Règle de payeur : ce payeur paie pour ce client${ruleMatch.note ? ` (${ruleMatch.note})` : ""}.`);
    return {
      clientId: ruleMatch.clientId,
      dossierId: ruleMatch.dossierId,
      strength: "rule_unique",
      isThirdParty: true,
      rule: { ruleId: ruleMatch.id, scope: ruleMatch.scope, note: ruleMatch.note },
      knownPayerNote: ruleMatch.note,
      reasons,
    };
  }

  const knownPayerNote =
    ruleMatch?.scope === "PAYEUR_CONNU" ? ruleMatch.note ?? "Payeur tiers connu" : null;
  if (knownPayerNote) {
    reasons.push(`Payeur tiers connu${ruleMatch?.note ? ` (${ruleMatch.note})` : ""} — choisissez le client concerné.`);
  }

  // --- Signal 1 : courriel expéditeur = un client (fort) ---
  if (senderEmail.length > 0) {
    const byEmail = candidates.clients.filter((c) => clientEmails(c).includes(senderEmail));
    if (byEmail.length === 1) {
      reasons.push("Courriel de l'expéditeur reconnu comme celui d'un client.");
      return {
        clientId: byEmail[0].id,
        dossierId: null,
        strength: "email",
        isThirdParty: false,
        rule: null,
        knownPayerNote,
        reasons,
      };
    }
  }

  // --- Signal 4 (bonus) : n° de dossier dans le message ---
  const tokens = extractDossierTokens(extraction.message);
  if (tokens.length > 0) {
    const dossier = candidates.dossiers.find(
      (d) => d.numeroDossier && tokens.includes(normalizeText(d.numeroDossier)),
    );
    if (dossier) {
      reasons.push("Numéro de dossier trouvé dans le message du virement.");
      return {
        clientId: dossier.clientId,
        dossierId: dossier.id,
        strength: "dossier",
        isThirdParty: knownPayerNote !== null,
        rule: null,
        knownPayerNote,
        reasons,
      };
    }
  }

  // --- Signal 3 : nom expéditeur (faible) ---
  if (senderName.length > 0 && knownPayerNote === null) {
    const byName = candidates.clients.filter((c) => clientFullNames(c).includes(senderName));
    if (byName.length === 1) {
      reasons.push("Nom de l'expéditeur rapproché d'un client (à vérifier).");
      return {
        clientId: byName[0].id,
        dossierId: null,
        strength: "name",
        isThirdParty: false,
        rule: null,
        knownPayerNote,
        reasons,
      };
    }
  }

  if (knownPayerNote === null) {
    reasons.push("Expéditeur non reconnu — sélectionnez le client à la main.");
  }
  return {
    clientId: null,
    dossierId: null,
    strength: "none",
    isThirdParty: knownPayerNote !== null,
    rule: null,
    knownPayerNote,
    reasons,
  };
}

/**
 * Rapproche une preuve de paiement extraite vers client / facture / dossier.
 *
 * Ne décide jamais seul : produit une suggestion + un niveau de confiance destiné
 * à un écran de confirmation humain (L3). N'écrit rien.
 */
export function matchPaymentProof(
  extraction: PaymentProofExtraction,
  candidates: MatchCandidates,
): PaymentMatch {
  const res = resolveClient(extraction, candidates);
  const montant = extraction.montant;

  let invoiceId: string | null = null;
  let dossierId: string | null = res.dossierId;
  let allocatedAmount: number | null = null;
  const reasons = [...res.reasons];

  if (res.clientId && montant !== null) {
    let invoices = candidates.openInvoices.filter((inv) => inv.clientId === res.clientId);
    // Si un dossier est identifié, on privilégie ses factures.
    if (dossierId) {
      const inDossier = invoices.filter((inv) => inv.dossierId === dossierId);
      if (inDossier.length > 0) invoices = inDossier;
    }
    const exact = invoices.filter((inv) => Math.abs(inv.balanceDue - montant) < EPSILON);
    if (exact.length === 1) {
      invoiceId = exact[0].id;
      dossierId = dossierId ?? exact[0].dossierId;
      allocatedAmount = Math.min(montant, exact[0].balanceDue);
      reasons.push("Montant égal au solde exact d'une facture ouverte.");
    } else if (invoices.length === 0) {
      reasons.push("Aucune facture ouverte pour ce client (paiement d'avance ?).");
    } else {
      reasons.push("Montant ne correspond pas exactement à une seule facture — à répartir.");
    }
  } else if (montant === null) {
    reasons.push("Montant illisible sur la preuve — à saisir manuellement.");
  }

  // --- Niveau de confiance ---
  let confidence: MatchConfidence;
  const strongResolution = res.strength === "email" || res.strength === "dossier" || res.strength === "rule_unique";
  if (res.clientId && invoiceId && montant !== null && strongResolution) {
    confidence = "certain"; // 🟢
  } else if (res.clientId) {
    confidence = "a_confirmer"; // 🟠 (client trouvé mais montant/facture à valider, ou nom seul)
  } else {
    confidence = "aucun"; // 🔴
  }

  return {
    confidence,
    clientId: res.clientId,
    invoiceId,
    dossierId,
    allocatedAmount,
    isThirdPartyPayer: res.isThirdParty,
    knownPayerNote: res.knownPayerNote,
    matchedByRule: res.rule,
    reasons,
  };
}
