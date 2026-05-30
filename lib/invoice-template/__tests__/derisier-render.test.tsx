import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { DerisierInvoiceDocument } from "../DerisierInvoiceDocument";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";

const invoice = {
  id: "inv1",
  numero: "2026-001",
  dateEmission: new Date("2026-05-01"),
  dateEcheance: new Date("2026-06-15"),
  currency: "CAD",
  clientNote: null,
  cabinet: {
    nom: "Derisier Law",
    adresse: null,
    telephone: null,
    email: "info@derisierlaw.com",
    logoUrl: null,
    taxNumbers: { hstNumber: "748964277RT0001", gstNumber: null, qstNumber: null, businessNumber: null },
    invoiceTemplate: "derisier",
    invoiceNotice: {
      fr: [
        "TOUS LES SERVICES SONT ASSUJETTIS À LA TVH",
        "Tous les paiements doivent être effectués par virement bancaire direct sur le compte en fiducie, par virement électronique sur le compte en fiducie ou par chèque déposé sur le compte en fiducie.",
        "Si le client paie 50 % au début, il doit émettre un chèque postdaté. Le chèque pour le solde doit être daté de 45 jours après le dépôt initial, le solde incluant la TPS complète.",
        "Tous les chèques doivent être libellés à l'ordre d'Alexandra Derisier en fiducie.",
      ],
      en: ["ALL SERVICES ARE SUBJECT TO HST", "Payment in trust."],
    },
    invoiceSignature: { name: "Marjorie-Alexandra Derisier", title: { fr: "Avocate", en: "Lawyer" } },
  },
  client: {
    typeClient: "personne_physique",
    raisonSociale: null,
    prenom: "Jean",
    nom: "Tremblay",
    email: "jean@example.com",
    billingAddress: "12 rue Test",
    billingCity: "Ottawa",
    billingProvince: "ON",
    billingPostalCode: "K1A 0A1",
    billingCountry: "Canada",
  },
  dossier: { numeroDossier: "D-1", intitule: "Litige civil" },
  lines: [
    { id: "l1", type: "honoraires", description: "Consultation", amount: 200, date: new Date("2026-05-01"), hours: 1, rate: 200, userNom: "Me X" },
  ],
  totals: {
    subtotalTaxable: 200,
    montantTotal: 226,
    montantPaye: 0,
    balanceDue: 226,
    tps: 26,
    tvq: 0,
    totalRabais: 0,
    deboursNonTaxableTotal: 0,
  },
} as unknown as PresentedInvoice;

describe("DerisierInvoiceDocument render", () => {
  it("renders to a PDF buffer without throwing", async () => {
    const buf = await renderToBuffer(<DerisierInvoiceDocument invoice={invoice} language="fr" />);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("renders with the signature block (showSignature) without throwing", async () => {
    const buf = await renderToBuffer(
      <DerisierInvoiceDocument invoice={invoice} language="fr" showSignature />,
    );
    expect(buf.length).toBeGreaterThan(0);
  });

  it("renders in English with signature without throwing", async () => {
    const buf = await renderToBuffer(
      <DerisierInvoiceDocument invoice={invoice} language="en" showSignature />,
    );
    expect(buf.length).toBeGreaterThan(0);
  });
});
