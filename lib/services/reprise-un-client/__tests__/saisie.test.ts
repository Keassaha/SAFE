import { describe, it, expect } from "vitest";
import {
  calculer,
  champsDeTaxe,
  colonnesPaiement,
  controler,
  depuisExtraction,
  enregistrable,
  lireNombre,
  montantLigne,
  resteDu,
  versExtraction,
  type FactureSaisie,
  type LigneSaisie,
} from "@/lib/services/reprise-un-client/saisie";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";

const LE_JOUR = new Date("2026-09-30T12:00:00.000Z");
const ONTARIO = champsDeTaxe("hst", { hst: 13 });
const QUEBEC = champsDeTaxe("tps_tvq", { tps: 5, tvq: 9.975 });

let n = 0;
const ligne = (o: Partial<LigneSaisie> = {}): LigneSaisie => ({
  id: `l${++n}`,
  date: "2025-03-01",
  description: "Rédaction",
  nature: "horaire",
  heures: "1,75",
  taux: "460",
  montant: "",
  ...o,
});

/** La facture F-2025-118 de la maquette : 3 natures, TVH ontarienne. */
const f118 = (o: Partial<FactureSaisie> = {}): FactureSaisie => ({
  numero: "F-2025-118",
  dateEmission: "2025-03-14",
  lignes: [
    ligne({ description: "Étude du bail", heures: "1,75", taux: "460" }),
    ligne({ description: "Mise en demeure", nature: "forfait", heures: "", taux: "", montant: "1 150,00" }),
    ligne({ description: "Signification", heures: "1,50", taux: "460" }),
    ligne({ description: "Frais de greffe", nature: "debours", heures: "", taux: "", montant: "128" }),
    ligne({ description: "Huissier", nature: "debours", heures: "", taux: "", montant: "97,50" }),
  ],
  taxes: [""],
  total: "",
  statutPaiement: "partielle",
  datePaiement: "2025-04-15",
  montantRecu: "2 000,00",
  modePaiement: "cheque",
  ...o,
});

describe("lire ce qu'une adjointe tape", () => {
  it("comprend la virgule, les espaces et le signe dollar", () => {
    expect(lireNombre("1 150,00")).toBe(1150);
    expect(lireNombre("1 150,00 $")).toBe(1150);
    expect(lireNombre("97.5")).toBe(97.5);
  });
  it("rend null, jamais zéro, pour un champ vide ou illisible", () => {
    expect(lireNombre("")).toBeNull();
    expect(lireNombre("abc")).toBeNull();
    expect(lireNombre(null)).toBeNull();
  });
});

describe("les trois natures de ligne", () => {
  it("horaire : heures × taux, le montant saisi est ignoré", () => {
    expect(montantLigne(ligne({ heures: "2,5", taux: "460", montant: "9999" }))).toBe(1150);
  });
  it("forfait : le montant seul, sans heures", () => {
    expect(montantLigne(ligne({ nature: "forfait", heures: "", taux: "", montant: "1 150" }))).toBe(1150);
  });
  it("débours : le montant seul", () => {
    expect(montantLigne(ligne({ nature: "debours", heures: "", taux: "", montant: "128" }))).toBe(128);
  });
});

describe("les taxes suivent le régime du cabinet", () => {
  it("Ontario : un seul champ, la TVH à 13 %", () => {
    expect(ONTARIO).toEqual([{ cle: "tvh", taux: 13 }]);
  });
  it("Québec : TPS puis TVQ, dans cet ordre", () => {
    expect(QUEBEC.map((c) => c.cle)).toEqual(["tps", "tvq"]);
  });
  it("calcule la facture de la maquette au sou près", () => {
    const c = calculer(f118(), ONTARIO);
    expect(c.sousTotal).toBe(2870.5);
    expect(c.taxes).toEqual([373.17]);
    expect(c.total).toBe(3243.67);
    expect(c.heures).toBe(3.25); // le forfait ne compte pas d'heures
  });
  it("le total tapé l'emporte sur le calcul : le papier fait foi", () => {
    const c = calculer(f118({ total: "3 300,00" }), ONTARIO);
    expect(c.total).toBe(3300);
    expect(c.totalSaisi).toBe(true);
  });
  it("une taxe tapée l'emporte sur la taxe calculée", () => {
    expect(calculer(f118({ taxes: ["370"] }), ONTARIO).taxes).toEqual([370]);
  });
});

describe("le reste dû", () => {
  it("partielle : total moins reçu", () => {
    expect(resteDu(f118(), 3243.67)).toBe(1243.67);
  });
  it("payée : rien", () => {
    expect(resteDu(f118({ statutPaiement: "payee" }), 3243.67)).toBe(0);
  });
});

describe("ce qui empêche d'enregistrer", () => {
  const codes = (f: FactureSaisie, champs = ONTARIO) =>
    controler(f, champs, { aujourdhui: LE_JOUR }).bloquants.map((b) => b.code);

  it("la facture de la maquette s'enregistre", () => {
    expect(enregistrable(controler(f118(), ONTARIO, { aujourdhui: LE_JOUR }))).toBe(true);
  });
  it("sans date d'émission", () => {
    expect(codes(f118({ dateEmission: "" }))).toContain("DATE_MANQUANTE");
  });
  it("une date d'émission à venir", () => {
    expect(codes(f118({ dateEmission: "2027-01-01", datePaiement: "2027-02-01" }))).toContain("DATE_FUTURE");
  });
  it("sans statut de paiement : SAFE ne devine jamais", () => {
    expect(codes(f118({ statutPaiement: null }))).toContain("STATUT_MANQUANT");
  });
  it("payée sans mode de paiement (décision CEO : le mode se demande)", () => {
    expect(codes(f118({ statutPaiement: "payee", modePaiement: null }))).toContain("MODE_MANQUANT");
  });
  it("impayée : ni date, ni mode, ni montant exigés", () => {
    expect(
      codes(f118({ statutPaiement: "impayee", datePaiement: "", modePaiement: null, montantRecu: "" })),
    ).toEqual([]);
  });
  it("un paiement reçu avant l'émission de la facture", () => {
    expect(codes(f118({ datePaiement: "2025-03-01" }))).toContain("PAIEMENT_AVANT_EMISSION");
  });
  it("partielle dont le montant reçu atteint le total : elle est payée, pas partielle", () => {
    expect(codes(f118({ montantRecu: "3 243,67" }))).toContain("MONTANT_RECU_ATTEINT_TOTAL");
  });
  it("une ligne horaire sans taux", () => {
    const f = f118({ lignes: [ligne({ taux: "" })] });
    expect(codes(f)).toContain("LIGNE_HORAIRE_INCOMPLETE");
  });
  it("une ligne au forfait sans montant", () => {
    const f = f118({ lignes: [ligne({ nature: "forfait", heures: "", taux: "", montant: "" , description: "Forfait" })] });
    expect(codes(f)).toContain("LIGNE_SANS_MONTANT");
  });
  it("une ligne ajoutée puis laissée vide est ignorée, elle ne bloque pas", () => {
    const f = f118();
    f.lignes.push(ligne({ description: "", heures: "", taux: "", montant: "" }));
    expect(codes(f)).toEqual([]);
  });
  it("un formulaire encore vierge demande le total, il ne dit pas « supérieur à zéro »", () => {
    const vierge = f118({ lignes: [ligne({ description: "", heures: "", taux: "", montant: "" })], total: "" });
    expect(codes(vierge)).toContain("TOTAL_MANQUANT");
    expect(codes(vierge)).not.toContain("TOTAL_NUL");
  });
  it("une facture sans ligne et sans total ne peut pas s'enregistrer", () => {
    expect(codes(f118({ lignes: [], total: "" }))).toContain("TOTAL_MANQUANT");
  });
});

describe("ce qui mérite un coup d'œil, sans bloquer", () => {
  const avert = (f: FactureSaisie) =>
    controler(f, ONTARIO, { aujourdhui: LE_JOUR }).avertissements.map((a) => a.code);

  it("un total tapé qui ne tombe pas sur le détail", () => {
    const c = controler(f118({ total: "3 300" }), ONTARIO, { aujourdhui: LE_JOUR });
    expect(c.avertissements[0]).toEqual({ code: "ECART_DETAIL", valeurs: { ecart: 56.33 } });
    expect(enregistrable(c)).toBe(true);
  });
  it("un écart d'un sou n'est pas un écart, c'est un arrondi", () => {
    expect(avert(f118({ total: "3 243,68" }))).not.toContain("ECART_DETAIL");
  });
  it("une facture réglée à même le fidéicommis le dit", () => {
    expect(avert(f118({ modePaiement: "fideicommis" }))).toContain("FIDEICOMMIS");
  });
  it("une facture avec un total mais sans détail", () => {
    expect(avert(f118({ lignes: [], total: "500" }))).toContain("AUCUNE_LIGNE");
  });
});

describe("vers le moteur de reprise", () => {
  const ext = versExtraction(f118(), ONTARIO, { clientNom: "Constructions Béliveau inc.", dossierIntitule: "Bail" });

  it("horaire → honoraire avec heures, forfait → honoraire sans heures, débours → débours", () => {
    expect(ext.lignes.map((l) => [l.nature, l.heures])).toEqual([
      ["honoraire", 1.75],
      ["honoraire", null],
      ["honoraire", 1.5],
      ["debours", null],
      ["debours", null],
    ]);
  });
  it("chaque ligne porte son montant, calculé pour l'horaire", () => {
    expect(ext.lignes.map((l) => l.montant)).toEqual([805, 1150, 690, 128, 97.5]);
  });
  it("en Ontario, la TVH va dans la colonne `tps` et `tvq` vaut zéro", () => {
    expect(ext.tps).toBe(373.17);
    expect(ext.tvq).toBe(0);
  });
  it("au Québec, TPS dans `tps`, TVQ dans `tvq`", () => {
    const q = versExtraction(f118({ taxes: ["", ""] }), QUEBEC, { clientNom: "X", dossierIntitule: "Y" });
    expect([q.tps, q.tvq]).toEqual([143.53, 286.33]);
  });
  it("le total est celui retenu à l'écran", () => {
    expect(ext.montantTotal).toBe(3243.67);
  });
  it("les lignes vierges ne partent pas", () => {
    const f = f118();
    f.lignes.push(ligne({ description: "", heures: "", taux: "", montant: "" }));
    expect(versExtraction(f, ONTARIO, { clientNom: "X", dossierIntitule: "Y" }).lignes).toHaveLength(5);
  });
});

describe("depuis une lecture de PDF", () => {
  let k = 0;
  const id = () => `x${++k}`;
  const lue: PastInvoiceExtraction = {
    numeroFacture: "F-2025-118",
    clientNom: "Constructions Béliveau inc.",
    dossierIntitule: "Bail",
    dateEmission: "2025-03-14",
    montantTotal: 3243.67,
    tps: null,
    tvq: 373.17, // la lecture a rangé la TVH dans la case TVQ
    confianceOcr: "haute",
    champsIllisibles: [],
    lignes: [
      { description: "Étude du bail", date: "2025-02-24", montant: 805, heures: 1.75, tauxHoraire: 460, nature: "honoraire" },
      { description: "Mise en demeure", date: "2025-03-02", montant: 1150, heures: null, tauxHoraire: null, nature: "honoraire" },
      { description: "Greffe", date: "2025-03-03", montant: 128, heures: null, tauxHoraire: null, nature: "debours" },
    ],
  };
  const f = depuisExtraction(lue, ONTARIO, 460, id);

  it("déduit la nature : heures → horaire, sans heures → forfait, débours → débours", () => {
    expect(f.lignes.map((l) => l.nature)).toEqual(["horaire", "forfait", "debours"]);
  });
  it("replace la TVH dans le champ TVH, quelle que soit la case lue", () => {
    expect(f.taxes).toEqual(["373,17"]);
  });
  it("ne devine jamais le paiement", () => {
    expect(f.statutPaiement).toBeNull();
    expect(f.modePaiement).toBeNull();
  });
});

describe("le mode de paiement, vers le paiement enregistré", () => {
  it("fidéicommis : marqué sur le paiement, compte source fidéicommis", () => {
    expect(colonnesPaiement("fideicommis")).toEqual({ method: "trust", paymentMethod: "trust", sourceAccountType: "trust" });
  });
  it("Interac : un virement électronique", () => {
    expect(colonnesPaiement("interac").paymentMethod).toBe("e_transfer");
  });
  it("sans mode : autre", () => {
    expect(colonnesPaiement(null).paymentMethod).toBe("other");
  });
});
