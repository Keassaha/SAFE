import { describe, expect, it } from "vitest";
import {
  aucunEnvoiPossible,
  documentEstBrouillon,
  factureEstEnvoyable,
  filtrerEnvoyables,
  type SourcesEnvoyables,
} from "@/lib/services/correspondance/envoyables";

const DOC = { id: "d1", titre: "Mise en demeure", type: "lettre", statut: "final" };
const BROUILLON = { id: "d2", titre: "Lettre en cours", type: "lettre", statut: "brouillon" };
const F_BROUILLON = { id: "f1", numero: "2026-0142", invoiceStatus: "DRAFT", montantTotal: 1200 };
const F_PRETE = { id: "f2", numero: "2026-0143", invoiceStatus: "READY_TO_ISSUE", montantTotal: 900 };
const F_TRANSMISE = { id: "f3", numero: "2026-0140", invoiceStatus: "ISSUED", montantTotal: 400 };
const F_ANNULEE = { id: "f4", numero: "2026-0139", invoiceStatus: "CANCELLED", montantTotal: 0 };

const TOUT: SourcesEnvoyables = { documents: [DOC, BROUILLON], factures: [F_BROUILLON, F_PRETE, F_TRANSMISE, F_ANNULEE] };
const TOUS_DROITS = { peutEnvoyerDocuments: true, peutEnvoyerFactures: true };

describe("factureEstEnvoyable", () => {
  it("accepte le brouillon et la facture prête à émettre", () => {
    expect(factureEstEnvoyable("DRAFT")).toBe(true);
    expect(factureEstEnvoyable("READY_TO_ISSUE")).toBe(true);
  });

  it("refuse une facture déjà transmise, payée, annulée ou créditée", () => {
    for (const s of ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "CREDITED"]) {
      expect(factureEstEnvoyable(s), s).toBe(false);
    }
  });

  it("traite une colonne nulle comme un brouillon, comme le fait l'écran de la facture", () => {
    expect(factureEstEnvoyable(null)).toBe(true);
    expect(factureEstEnvoyable(undefined)).toBe(true);
  });

  it("refuse un statut inconnu", () => {
    expect(factureEstEnvoyable("N_IMPORTE_QUOI")).toBe(false);
  });
});

describe("documentEstBrouillon", () => {
  it("distingue le brouillon du document final", () => {
    expect(documentEstBrouillon("brouillon")).toBe(true);
    expect(documentEstBrouillon("final")).toBe(false);
    expect(documentEstBrouillon("archive")).toBe(false);
  });
});

describe("filtrerEnvoyables", () => {
  it("ne garde que les factures envoyables", () => {
    const out = filtrerEnvoyables(TOUT, TOUS_DROITS);
    expect(out.factures.map((f) => f.id)).toEqual(["f1", "f2"]);
  });

  it("garde le document brouillon : il est envoyable, l'écran avertit", () => {
    const out = filtrerEnvoyables(TOUT, TOUS_DROITS);
    expect(out.documents.map((d) => d.id)).toEqual(["d1", "d2"]);
  });

  it("cache entièrement les factures à qui ne les gère pas", () => {
    // Le filtre vit côté serveur : une liste envoyée au navigateur est une
    // liste divulguée, même si le bouton est masqué à l'affichage.
    const out = filtrerEnvoyables(TOUT, { peutEnvoyerDocuments: true, peutEnvoyerFactures: false });
    expect(out.factures).toEqual([]);
    expect(out.documents).toHaveLength(2);
  });

  it("cache entièrement les documents à qui ne gère pas le dossier", () => {
    const out = filtrerEnvoyables(TOUT, { peutEnvoyerDocuments: false, peutEnvoyerFactures: true });
    expect(out.documents).toEqual([]);
    expect(out.factures).toHaveLength(2);
  });

  it("ne rend rien quand aucun droit n'est accordé", () => {
    const out = filtrerEnvoyables(TOUT, { peutEnvoyerDocuments: false, peutEnvoyerFactures: false });
    expect(aucunEnvoiPossible(out)).toBe(true);
  });
});

describe("aucunEnvoiPossible", () => {
  it("est vrai sur un dossier sans document ni facture envoyable", () => {
    expect(aucunEnvoiPossible({ documents: [], factures: [] })).toBe(true);
  });

  it("est faux dès qu'une seule pièce est proposable", () => {
    expect(aucunEnvoiPossible({ documents: [], factures: [F_BROUILLON] })).toBe(false);
    expect(aucunEnvoiPossible({ documents: [DOC], factures: [] })).toBe(false);
  });
});
