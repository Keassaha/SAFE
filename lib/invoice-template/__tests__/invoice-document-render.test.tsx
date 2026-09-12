/**
 * SAFE — Fumée de rendu du gabarit de facture standard.
 *
 * Le PDF produit un tampon binaire : on ne peut pas y lire « Honoraires
 * professionnels » à l'œil dans un test. Ce que ces cas vérifient, c'est qu'
 * AUCUNE des configurations réelles ne fait planter le rendu : au forfait
 * (colonnes heures/taux retirées), avec débours, avec rabais, sans dossier,
 * sans client, en anglais. Le calcul des groupes, lui, est vérifié pour de
 * vrai dans `groupes.test.ts`.
 */

import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "../InvoiceDocument";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";

const base = {
  id: "inv1",
  numero: "2026-042",
  dateEmission: new Date("2026-09-01"),
  dateEcheance: new Date("2026-10-01"),
  currency: "CAD",
  clientNote: null,
  isForfait: false,
  cabinet: {
    nom: "Cabinet Roy",
    adresse: "100 rue Saint-Jacques, Montréal",
    telephone: "514-555-0100",
    email: "info@cabinetroy.ca",
    logoUrl: null,
    taxNumbers: {
      hstNumber: null,
      gstNumber: "123456789RT0001",
      qstNumber: "1012345678TQ0001",
      businessNumber: null,
    },
    invoiceTemplate: "standard",
  },
  client: {
    typeClient: "personne_physique",
    raisonSociale: null,
    prenom: "Jean",
    nom: "Tremblay",
    email: "jean@example.com",
    billingAddress: "12 rue Test",
    billingCity: "Montréal",
    billingProvince: "QC",
    billingPostalCode: "H2Y 1A1",
    billingCountry: "Canada",
  },
  dossier: { numeroDossier: "2026-014", intitule: "Demande de résidence permanente" },
  lines: [
    { id: "l1", type: "honoraires", description: "Analyse du dossier", amount: 400, date: new Date("2026-08-12"), hours: 2, rate: 200, userNom: "Me Roy" },
    { id: "l2", type: "honoraires", description: "Rédaction des représentations", amount: 600, date: new Date("2026-08-18"), hours: 3, rate: 200, userNom: "Me Roy" },
    { id: "l3", type: "debours_taxable", description: "Photocopies certifiées", amount: 45, date: new Date("2026-08-19"), hours: null, rate: null, userNom: null },
    { id: "l4", type: "debours_non_taxable", description: "Frais gouvernementaux IRCC", amount: 1365, date: new Date("2026-08-20"), hours: null, rate: null, userNom: null },
  ],
  totals: {
    subtotalTaxable: 1045,
    tps: 52.25,
    tvq: 104.24,
    hst: 0,
    taxRegime: "GST_QST",
    deboursNonTaxableTotal: 1365,
    montantTotal: 2566.49,
    montantPaye: 0,
    balanceDue: 2566.49,
    totalRabais: 0,
  },
} as unknown as PresentedInvoice;

const rendu = (inv: PresentedInvoice, language: "fr" | "en" = "fr") =>
  renderToBuffer(<InvoiceDocument invoice={inv} language={language} />);

describe("InvoiceDocument — gabarit standard", () => {
  it("rend une facture horaire avec honoraires et débours", async () => {
    const buf = await rendu(base);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("rend la même facture en anglais", async () => {
    const buf = await rendu(base, "en");
    expect(buf.length).toBeGreaterThan(0);
  });

  it("rend un dossier au forfait (colonnes heures et taux retirées)", async () => {
    const forfait = {
      ...base,
      isForfait: true,
      lines: [
        { id: "f1", type: "honoraires", description: "Forfait — demande complète", amount: 2500, date: new Date("2026-08-01"), hours: null, rate: null, userNom: "Me Roy" },
      ],
    } as unknown as PresentedInvoice;
    const buf = await rendu(forfait);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("rend une facture avec rabais et paiement partiel", async () => {
    const avecRabais = {
      ...base,
      lines: [
        ...base.lines,
        { id: "r1", type: "rabais", description: "Rabais — geste commercial", amount: -100, date: new Date("2026-08-31"), hours: null, rate: null, userNom: null },
      ],
      totals: { ...base.totals, totalRabais: 100, montantPaye: 500, balanceDue: 1951.49 },
    } as unknown as PresentedInvoice;
    const buf = await rendu(avecRabais);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("rend sans dossier, sans client et sans numéro de taxe", async () => {
    const nu = {
      ...base,
      dossier: null,
      client: null,
      cabinet: {
        ...base.cabinet,
        taxNumbers: { hstNumber: null, gstNumber: null, qstNumber: null, businessNumber: null },
      },
    } as unknown as PresentedInvoice;
    const buf = await rendu(nu);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("rend une facture de débours seuls (aucun honoraire)", async () => {
    const deboursSeuls = {
      ...base,
      lines: base.lines.filter((l) => l.type !== "honoraires"),
    } as unknown as PresentedInvoice;
    const buf = await rendu(deboursSeuls);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("rend une note au client", async () => {
    const buf = await rendu({ ...base, clientNote: "Merci de votre confiance." } as PresentedInvoice);
    expect(buf.length).toBeGreaterThan(0);
  });
});
