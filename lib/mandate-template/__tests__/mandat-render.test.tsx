import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  MandatRepresentationDocument,
  type MandatRepresentationData,
} from "../MandatRepresentationDocument";

const fullData: MandatRepresentationData = {
  cabinet: {
    nom: "Derisier Law",
    adresse: "1000 Thomas Spratt Place, Suite 201\nOttawa, ON K1G 5L5",
    telephone: "T. 613-909-0042  ·  F. 360-768-3136",
    email: "info@derisierlaw.com",
    logoUrl: null,
    signature: { name: "Marjorie-Alexandra Derisier", title: { fr: "Avocate", en: "Lawyer" } },
  },
  clientName: "Jean Tremblay",
  lieu: "Ottawa",
  date: "le 30 mai 2026",
  objet: "Demande de résidence permanente (IRCC)",
  finsDuMandat: "la préparation et la soumission d'une demande de résidence permanente",
  honoraires: "2 500,00 $",
  tvh: "325,00 $",
  total: "2 825,00 $",
};

describe("MandatRepresentationDocument render", () => {
  it("renders a fully-populated mandate without throwing", async () => {
    const buf = await renderToBuffer(<MandatRepresentationDocument data={fullData} language="fr" />);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("renders with placeholders when variable fields are empty", async () => {
    const minimal: MandatRepresentationData = {
      cabinet: { nom: "Derisier Law", signature: null },
    };
    const buf = await renderToBuffer(<MandatRepresentationDocument data={minimal} language="fr" />);
    expect(buf.length).toBeGreaterThan(0);
  });
});
