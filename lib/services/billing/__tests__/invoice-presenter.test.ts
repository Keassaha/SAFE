/**
 * Tests phase 1 — refonte facturation.
 *
 * Le presenter est la source unique d'affichage : ces tests verrouillent les
 * comportements à ne plus régresser.
 */
import { describe, it, expect } from "vitest";
import {
  presentInvoice,
  presentClientDisplayName,
  type PresenterInput,
} from "../invoice-presenter";

const NOW = new Date("2026-04-30T12:00:00Z");

function baseInvoice(overrides: Partial<PresenterInput> = {}): PresenterInput {
  // Cast minimal : on simule juste les champs nécessaires au presenter.
  return {
    id: "inv-1",
    cabinetId: "cab-1",
    clientId: "cli-1",
    dossierId: "dos-1",
    numero: "2026-001",
    dateEmission: NOW,
    dateEcheance: NOW,
    statut: "brouillon" as never,
    invoiceStatus: "DRAFT" as never,
    montantTotal: 0,
    montantPaye: 0,
    subtotalTaxable: 0,
    tps: 0,
    tvq: 0,
    deboursNonTaxableTotal: 0,
    trustApplied: 0,
    balanceDue: 0,
    currency: "CAD",
    subtotalFees: 0,
    subtotalExpenses: 0,
    subtotalAdjustments: 0,
    subtotalInterest: 0,
    subtotalBeforeTax: 0,
    taxGst: 0,
    taxQst: 0,
    taxTotal: 0,
    trustAppliedAmount: 0,
    creditAppliedAmount: 0,
    totalInvoiceAmount: 0,
    totalPaidAmount: 0,
    interestAccrued: 0,
    paymentStatus: "UNPAID" as never,
    issueMethod: null,
    billingGroupKey: null,
    clientNote: null,
    internalNote: null,
    sentAt: null,
    approvedAt: null,
    approvedById: null,
    cancelledAt: null,
    cancelReason: null,
    createdById: null,
    shareToken: null,
    shareTokenExpiresAt: null,
    tauxInteret: null,
    dateLimiteInterets: null,
    lastReminderDay: null,
    lastInterestAppliedAt: null,
    validatedAt: null,
    validatedById: null,
    createdAt: NOW,
    updatedAt: NOW,
    cabinet: null,
    client: null,
    dossier: null,
    invoiceLines: [],
    invoiceItems: [],
    ...overrides,
  } as PresenterInput;
}

function fakeInvoiceLine(overrides: Record<string, unknown> = {}) {
  return {
    id: "line-1",
    invoiceId: "inv-1",
    timeEntryId: null,
    description: "Honoraires",
    quantite: 1,
    tauxUnitaire: 100,
    montant: 100,
    lineType: "fee",
    sourceType: "manual",
    sourceId: null,
    matterId: null,
    serviceDate: NOW,
    lineSubtotal: 100,
    taxable: true,
    gstAmount: 5,
    qstAmount: 9.975,
    lineTotal: 114.975,
    sortOrder: 0,
    validationComment: null,
    parentLineId: null,
    discountReason: null,
    createdAt: NOW,
    updatedAt: NOW,
    timeEntry: null,
    ...overrides,
  } as never;
}

function fakeInvoiceItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    invoiceId: "inv-1",
    type: "rabais",
    description: "Rabais — Courtoisie professionnelle",
    date: NOW,
    hours: null,
    rate: null,
    amount: 100,
    userId: null,
    professionalDisplayName: null,
    timeEntryId: null,
    parentItemId: null,
    parentLineId: null,
    validationComment: null,
    createdAt: NOW,
    user: null,
    ...overrides,
  } as never;
}

describe("invoice-presenter", () => {
  it("convertit un rabais legacy InvoiceItem en ligne visible avec montant négatif", () => {
    const invoice = baseInvoice({
      invoiceItems: [
        fakeInvoiceItem({
          type: "rabais",
          amount: 100,
          description: "Rabais — Entente client",
        }),
      ],
    });
    const presented = presentInvoice(invoice);
    expect(presented.lines).toHaveLength(1);
    const line = presented.lines[0];
    expect(line.type).toBe("rabais");
    expect(line.amount).toBe(-100);
    expect(line.description).toContain("Rabais");
    expect(line.description).toContain("Entente client");
    expect(line.source).toBe("invoice_item");
  });

  it("convertit un InvoiceLine adjustment en ligne rabais avec parentLineId", () => {
    const invoice = baseInvoice({
      invoiceLines: [
        fakeInvoiceLine({
          id: "parent-1",
          lineType: "fee",
          description: "Service forfaitaire — Demande d'immigration",
          lineSubtotal: 2500,
          quantite: 1,
          tauxUnitaire: 2500,
        }),
        fakeInvoiceLine({
          id: "discount-1",
          lineType: "adjustment",
          parentLineId: "parent-1",
          discountReason: "Entente client",
          description: "Rabais",
          lineSubtotal: 250,
          quantite: 1,
          tauxUnitaire: 250,
          sortOrder: 1,
        }),
      ],
    });
    const presented = presentInvoice(invoice);
    expect(presented.lines).toHaveLength(2);
    const rabais = presented.lines.find((l) => l.type === "rabais");
    expect(rabais).toBeDefined();
    expect(rabais!.amount).toBe(-250);
    expect(rabais!.description).toBe("Rabais — Entente client");
    expect(rabais!.parentLineId).toBe("parent-1");
    expect(rabais!.source).toBe("invoice_line");
  });

  it("affiche 'Rabais' sans tiret quand aucune raison n'est connue", () => {
    const invoice = baseInvoice({
      invoiceLines: [
        fakeInvoiceLine({
          lineType: "adjustment",
          parentLineId: null,
          discountReason: null,
          description: "Rabais",
          lineSubtotal: 50,
        }),
      ],
    });
    const [line] = presentInvoice(invoice).lines;
    expect(line.description).toBe("Rabais");
  });

  it("totalise les rabais (totalRabais informationnel)", () => {
    const invoice = baseInvoice({
      invoiceLines: [
        fakeInvoiceLine({
          lineType: "adjustment",
          discountReason: "A",
          lineSubtotal: 100,
        }),
      ],
      invoiceItems: [
        fakeInvoiceItem({ type: "rabais", amount: 50 }),
      ],
    });
    const presented = presentInvoice(invoice);
    expect(presented.totals.totalRabais).toBe(150);
  });

  it("préserve les totaux Invoice tels que persistés (le presenter ne recalcule pas)", () => {
    const invoice = baseInvoice({
      subtotalTaxable: 1000,
      tps: 50,
      tvq: 99.75,
      deboursNonTaxableTotal: 25,
      montantTotal: 1174.75,
      montantPaye: 0,
      balanceDue: 1174.75,
    });
    const t = presentInvoice(invoice).totals;
    expect(t.subtotalTaxable).toBe(1000);
    expect(t.tps).toBe(50);
    expect(t.tvq).toBe(99.75);
    expect(t.deboursNonTaxableTotal).toBe(25);
    expect(t.montantTotal).toBe(1174.75);
    expect(t.balanceDue).toBe(1174.75);
  });

  it("forfait : ne projette pas heures × taux sur les honoraires", () => {
    const invoice = baseInvoice({
      dossier: {
        id: "dos-1",
        intitule: "Demande EE",
        numeroDossier: "2026-001",
        modeFacturation: "forfait",
      },
      invoiceLines: [
        fakeInvoiceLine({
          lineType: "fee",
          quantite: 8,
          tauxUnitaire: 200,
          lineSubtotal: 2500,
          description: "Demande Express Entry — forfait",
        }),
      ],
    });
    const presented = presentInvoice(invoice);
    expect(presented.isForfait).toBe(true);
    const fee = presented.lines[0];
    expect(fee.type).toBe("honoraires");
    expect(fee.amount).toBe(2500);
    // En mode forfait, aucune projection horaire :
    expect(fee.hours).toBeNull();
    expect(fee.rate).toBeNull();
  });

  it("horaire : projette heures × taux sur les honoraires", () => {
    const invoice = baseInvoice({
      dossier: {
        id: "dos-1",
        intitule: "Litige",
        numeroDossier: "2026-002",
        modeFacturation: "horaire",
      },
      invoiceLines: [
        fakeInvoiceLine({
          lineType: "fee",
          quantite: 2.5,
          tauxUnitaire: 250,
          lineSubtotal: 625,
        }),
      ],
    });
    const fee = presentInvoice(invoice).lines[0];
    expect(fee.hours).toBe(2.5);
    expect(fee.rate).toBe(250);
  });

  it("verrouille la facture quand invoiceStatus = ISSUED", () => {
    expect(
      presentInvoice(baseInvoice({ invoiceStatus: "ISSUED" as never })).isLocked
    ).toBe(true);
    expect(
      presentInvoice(baseInvoice({ invoiceStatus: "DRAFT" as never })).isLocked
    ).toBe(false);
    expect(
      presentInvoice(baseInvoice({ invoiceStatus: "READY_TO_ISSUE" as never })).isLocked
    ).toBe(false);
    expect(
      presentInvoice(baseInvoice({ invoiceStatus: "PAID" as never })).isLocked
    ).toBe(true);
  });

  it("retourne une liste vide si aucune ligne, sans crasher", () => {
    const presented = presentInvoice(baseInvoice());
    expect(presented.lines).toEqual([]);
    expect(presented.totals.totalRabais).toBe(0);
  });

  it("trie les InvoiceLine par sortOrder", () => {
    const invoice = baseInvoice({
      invoiceLines: [
        fakeInvoiceLine({ id: "l-2", sortOrder: 2, description: "Deuxième" }),
        fakeInvoiceLine({ id: "l-1", sortOrder: 1, description: "Première" }),
      ],
    });
    const lines = presentInvoice(invoice).lines.map((l) => l.description);
    expect(lines).toEqual(["Première", "Deuxième"]);
  });
});

describe("presentClientDisplayName", () => {
  it("personne physique → prénom + nom", () => {
    expect(
      presentClientDisplayName({
        id: "x",
        typeClient: "personne_physique",
        prenom: "Marie",
        nom: "Tremblay",
        raisonSociale: null,
        email: null,
        billingAddress: null,
        billingCity: null,
        billingProvince: null,
        billingPostalCode: null,
        billingCountry: null,
      })
    ).toBe("Marie Tremblay");
  });

  it("personne morale → raison sociale", () => {
    expect(
      presentClientDisplayName({
        id: "x",
        typeClient: "personne_morale",
        prenom: null,
        nom: null,
        raisonSociale: "Acme Inc.",
        email: null,
        billingAddress: null,
        billingCity: null,
        billingProvince: null,
        billingPostalCode: null,
        billingCountry: null,
      })
    ).toBe("Acme Inc.");
  });

  it("client null → 'Client' générique", () => {
    expect(presentClientDisplayName(null)).toBe("Client");
  });
});
