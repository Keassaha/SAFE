import { describe, it, expect } from "vitest";
import {
  matchPaymentProof,
  normalizeText,
  type MatchCandidates,
  type PayerRuleInput,
} from "@/lib/services/finance/match-payment";
import type { PaymentProofExtraction } from "@/lib/ai/extract-payment-proof";

function extraction(over: Partial<PaymentProofExtraction> = {}): PaymentProofExtraction {
  return {
    montant: 750,
    devise: "CAD",
    expediteurNom: "Jean Tremblay",
    expediteurCourriel: "jean@exemple.com",
    message: null,
    date: "2026-06-28",
    referenceInterac: "C1ArqBDEgCn7",
    banqueSource: "TD",
    compteDest4Derniers: "0126",
    typePreuve: "interac_autodepot",
    confianceOcr: "haute",
    champsIllisibles: [],
    ...over,
  };
}

function candidates(over: Partial<MatchCandidates> = {}): MatchCandidates {
  return {
    clients: [
      {
        id: "cli_jean",
        email: "jean@exemple.com",
        emailSecondaire: null,
        billingEmail: null,
        raisonSociale: null,
        prenom: "Jean",
        nom: "Tremblay",
      },
    ],
    openInvoices: [
      { id: "inv_1", numero: "F-001", clientId: "cli_jean", dossierId: "dos_1", balanceDue: 750 },
    ],
    dossiers: [{ id: "dos_1", numeroDossier: "2024-0142", clientId: "cli_jean" }],
    payerRules: [],
    ...over,
  };
}

describe("normalizeText", () => {
  it("retire les accents et met en minuscules", () => {
    expect(normalizeText("Frédéric CÔTÉ")).toBe("frederic cote");
  });
});

describe("matchPaymentProof", () => {
  it("🟢 certain : courriel = client ET montant = solde exact d'une facture", () => {
    const m = matchPaymentProof(extraction(), candidates());
    expect(m.confidence).toBe("certain");
    expect(m.clientId).toBe("cli_jean");
    expect(m.invoiceId).toBe("inv_1");
    expect(m.allocatedAmount).toBe(750);
    expect(m.isThirdPartyPayer).toBe(false);
  });

  it("🟠 à confirmer : client trouvé par courriel mais montant ≠ solde exact", () => {
    const m = matchPaymentProof(extraction({ montant: 500 }), candidates());
    expect(m.confidence).toBe("a_confirmer");
    expect(m.clientId).toBe("cli_jean");
    expect(m.invoiceId).toBeNull();
  });

  it("🟠 à confirmer : nom seul (pas de courriel) même avec facture exacte", () => {
    const m = matchPaymentProof(
      extraction({ expediteurCourriel: null }),
      candidates(),
    );
    expect(m.confidence).toBe("a_confirmer");
    expect(m.clientId).toBe("cli_jean");
  });

  it("🔴 aucun : expéditeur inconnu", () => {
    const m = matchPaymentProof(
      extraction({ expediteurCourriel: "inconnu@x.com", expediteurNom: "Personne Inconnue" }),
      candidates(),
    );
    expect(m.confidence).toBe("aucun");
    expect(m.clientId).toBeNull();
  });

  it("🟢 via règle CLIENT_UNIQUE : un tiers paie pour le client (parent → enfant)", () => {
    const rule: PayerRuleInput = {
      id: "rule_1",
      payerEmail: "papa@exemple.com",
      payerName: null,
      clientId: "cli_jean",
      dossierId: null,
      scope: "CLIENT_UNIQUE",
      note: "Père de la cliente",
      active: true,
    };
    const m = matchPaymentProof(
      extraction({ expediteurCourriel: "papa@exemple.com", expediteurNom: "Papa Tremblay" }),
      candidates({ payerRules: [rule] }),
    );
    expect(m.confidence).toBe("certain");
    expect(m.clientId).toBe("cli_jean");
    expect(m.invoiceId).toBe("inv_1");
    expect(m.isThirdPartyPayer).toBe(true);
    expect(m.matchedByRule?.scope).toBe("CLIENT_UNIQUE");
  });

  it("PAYEUR_CONNU : payeur reconnu mais client non forcé (assureur multi-clients)", () => {
    const rule: PayerRuleInput = {
      id: "rule_2",
      payerEmail: "sinistres@intact.com",
      payerName: null,
      clientId: null,
      dossierId: null,
      scope: "PAYEUR_CONNU",
      note: "Assureur Intact",
      active: true,
    };
    const m = matchPaymentProof(
      extraction({ expediteurCourriel: "sinistres@intact.com", expediteurNom: "Intact Assurance" }),
      candidates({ payerRules: [rule] }),
    );
    expect(m.clientId).toBeNull(); // pas de client forcé
    expect(m.knownPayerNote).toBe("Assureur Intact");
    expect(m.isThirdPartyPayer).toBe(true);
    expect(m.confidence).toBe("aucun"); // client à choisir malgré payeur reconnu
  });

  it("🟢 via n° de dossier dans le message (flux manuel)", () => {
    const m = matchPaymentProof(
      extraction({
        expediteurCourriel: "autre@x.com",
        expediteurNom: "Tiers",
        message: "Dossier 2024-0142",
      }),
      candidates(),
    );
    expect(m.confidence).toBe("certain");
    expect(m.clientId).toBe("cli_jean");
    expect(m.dossierId).toBe("dos_1");
    expect(m.invoiceId).toBe("inv_1");
  });

  it("règle inactive ignorée", () => {
    const rule: PayerRuleInput = {
      id: "rule_3",
      payerEmail: "papa@exemple.com",
      payerName: null,
      clientId: "cli_jean",
      dossierId: null,
      scope: "CLIENT_UNIQUE",
      note: null,
      active: false,
    };
    const m = matchPaymentProof(
      extraction({ expediteurCourriel: "papa@exemple.com", expediteurNom: "Papa" }),
      candidates({ payerRules: [rule] }),
    );
    expect(m.clientId).toBeNull();
    expect(m.confidence).toBe("aucun");
  });

  it("montant illisible : jamais 🟢", () => {
    const m = matchPaymentProof(extraction({ montant: null }), candidates());
    expect(m.confidence).toBe("a_confirmer");
    expect(m.invoiceId).toBeNull();
    expect(m.reasons.some((r) => r.includes("illisible"))).toBe(true);
  });
});
