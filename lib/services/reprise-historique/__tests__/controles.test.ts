import { describe, it, expect } from "vitest";
import { controlerFacture, versable } from "@/lib/services/reprise-historique/controles";
import type { FactureRepriseSaisie, StatutPaiementReprise } from "@/lib/services/reprise-historique/construire-lot";
import type { PastInvoiceExtraction, PastInvoiceLigneExtraction } from "@/lib/ai/extract-past-invoice";

const ligne = (o: Partial<PastInvoiceLigneExtraction> = {}): PastInvoiceLigneExtraction => ({
  description: "Rédaction",
  date: "2026-04-01",
  montant: 400,
  heures: 2,
  tauxHoraire: 200,
  nature: "honoraire",
  ...o,
});

function facture(
  extraction: Partial<PastInvoiceExtraction> = {},
  saisie: { statutPaiement?: StatutPaiementReprise | null; datePaiement?: string | null; clientNom?: string } = {},
): FactureRepriseSaisie {
  const nom = saisie.clientNom ?? "Société Kaboré et fils";
  return {
    id: "f1",
    fichierNom: "f1.pdf",
    statutPaiement: saisie.statutPaiement === undefined ? "impayee" : saisie.statutPaiement,
    datePaiement: saisie.datePaiement ?? null,
    match: {
      client: { statut: "nouveau", clientId: null, clientNom: nom },
      dossier: { statut: "nouveau", dossierId: null, dossierIntitule: "Bail commercial" },
    },
    extraction: {
      numeroFacture: "F-2026-011",
      clientNom: nom,
      dossierIntitule: "Bail commercial",
      dateEmission: "2026-04-10",
      montantTotal: 528,
      tps: null,
      tvq: null,
      confianceOcr: "haute",
      champsIllisibles: [],
      // Un détail qui tombe juste : 400 + 128 = 528. Les contrôles comparent
      // la somme des lignes au total, un échantillon bancal les ferait parler.
      lignes: [
        ligne(),
        ligne({ description: "Frais de greffe", montant: 128, heures: null, tauxHoraire: null, nature: "debours" }),
      ],
      ...extraction,
    },
  };
}

describe("quand la facture se lit mal", () => {
  it("refuse de verser sans montant total", () => {
    const c = controlerFacture(facture({ montantTotal: null }));
    expect(versable(c)).toBe(false);
    expect(c.bloquants[0]).toContain("montant total");
  });

  it("refuse de verser sans date d'émission", () => {
    const c = controlerFacture(facture({ dateEmission: null }));
    expect(versable(c)).toBe(false);
    expect(c.bloquants.join(" ")).toContain("date d'émission");
  });

  it("refuse de créer une fiche client sans nom", () => {
    const c = controlerFacture(facture({}, { clientNom: "Client sans nom lu" }));
    expect(versable(c)).toBe(false);
    expect(c.bloquants.join(" ")).toContain("fiche sans nom");
  });

  it("laisse verser une ligne illisible, mais le dit", () => {
    const c = controlerFacture(facture({ lignes: [ligne(), ligne({ montant: null })] }));
    expect(versable(c)).toBe(true);
    expect(c.avertissements.join(" ")).toContain("ne sera pas reprise au détail");
  });

  it("compte les lignes perdues quand il y en a plusieurs", () => {
    const c = controlerFacture(
      facture({ lignes: [ligne({ montant: null }), ligne({ montant: null }), ligne()] }),
    );
    expect(c.avertissements.join(" ")).toContain("2 lignes");
  });

  it("signale une facture sans aucune ligne lue", () => {
    const c = controlerFacture(facture({ lignes: [] }));
    expect(versable(c)).toBe(true);
    expect(c.avertissements.join(" ")).toContain("seul le total sera repris");
  });

  it("dit en français les champs que la lecture a signalés illisibles", () => {
    const c = controlerFacture(facture({ champsIllisibles: ["dossierIntitule", "montantTotal"] }));
    // Jamais « dossierIntitule » à l'écran : ça ne veut rien dire pour une avocate.
    expect(c.avertissements.join(" ")).toContain("l'objet du mandat, le montant total");
    expect(c.avertissements.join(" ")).not.toContain("dossierIntitule");
  });

  it("laisse passer tel quel un champ qu'on ne sait pas traduire", () => {
    const c = controlerFacture(facture({ champsIllisibles: ["mention manuscrite"] }));
    expect(c.avertissements.join(" ")).toContain("mention manuscrite");
  });

  it("prévient quand la pièce se lit mal dans l'ensemble", () => {
    const c = controlerFacture(facture({ confianceOcr: "basse" }));
    expect(c.avertissements.join(" ")).toContain("se lit mal");
  });

  it("prévient qu'un numéro sera attribué si la facture n'en porte pas", () => {
    const c = controlerFacture(facture({ numeroFacture: null }));
    expect(versable(c)).toBe(true);
    expect(c.avertissements.join(" ")).toContain("numéro");
  });
});

describe("le statut de paiement se demande, et se tient", () => {
  it("refuse tant que le statut n'est pas choisi", () => {
    const c = controlerFacture(facture({}, { statutPaiement: null }));
    expect(c.bloquants.join(" ")).toContain("payée");
  });

  it("refuse une facture payée sans date de paiement", () => {
    const c = controlerFacture(facture({}, { statutPaiement: "payee", datePaiement: null }));
    expect(versable(c)).toBe(false);
    expect(c.bloquants.join(" ")).toContain("date du paiement");
  });

  it("refuse une partielle sans montant reçu", () => {
    const c = controlerFacture(
      facture({}, { statutPaiement: "partielle", datePaiement: "2026-05-02" }),
      { montantPaye: null },
    );
    expect(c.bloquants.join(" ")).toContain("montant réellement reçu");
  });

  it("refuse une partielle qui couvre tout le total : ce n'est plus partiel", () => {
    const c = controlerFacture(
      facture({}, { statutPaiement: "partielle", datePaiement: "2026-05-02" }),
      { montantPaye: 528 },
    );
    expect(c.bloquants.join(" ")).toContain("payée, pas partielle");
  });

  it("accepte une partielle en règle", () => {
    const c = controlerFacture(
      facture({}, { statutPaiement: "partielle", datePaiement: "2026-05-02" }),
      { montantPaye: 300 },
    );
    expect(versable(c)).toBe(true);
  });

  it("une impayée n'a besoin d'aucune date", () => {
    expect(versable(controlerFacture(facture({}, { statutPaiement: "impayee" })))).toBe(true);
  });
});

describe("le même fichier déposé deux fois dans un lot pas encore versé", () => {
  const empreintes = [
    { id: "f0", hash: "abc" },
    { id: "f1", hash: "abc" },
    { id: "f2", hash: "zzz" },
  ];

  it("bloque le second dépôt, pas le premier", () => {
    expect(versable(controlerFacture({ ...facture(), id: "f0" }, { empreintesDuLot: empreintes }))).toBe(true);
    const second = controlerFacture({ ...facture(), id: "f1" }, { empreintesDuLot: empreintes });
    expect(versable(second)).toBe(false);
    expect(second.bloquants.join(" ")).toContain("déjà dans le dépôt");
  });

  it("laisse passer un fichier différent", () => {
    expect(versable(controlerFacture({ ...facture(), id: "f2" }, { empreintesDuLot: empreintes }))).toBe(true);
  });
});

describe("les chiffres et les dates qui ne tiennent pas debout", () => {
  const LE_JOUR = new Date("2026-09-16T12:00:00.000Z");

  it("refuse un total nul ou négatif", () => {
    expect(controlerFacture(facture({ montantTotal: 0 })).bloquants.join(" ")).toContain("nul ou négatif");
    expect(controlerFacture(facture({ montantTotal: -50 })).bloquants.join(" ")).toContain("mal lu");
  });

  it("refuse une facture datée dans le futur : un exercice précédent est derrière nous", () => {
    const c = controlerFacture(facture({ dateEmission: "2027-04-10" }), { aujourdhui: LE_JOUR });
    expect(versable(c)).toBe(false);
    expect(c.bloquants.join(" ")).toContain("futur");
  });

  it("accepte une facture datée du jour même", () => {
    const c = controlerFacture(facture({ dateEmission: "2026-09-16" }), { aujourdhui: LE_JOUR });
    expect(versable(c)).toBe(true);
  });

  it("refuse une année invraisemblable", () => {
    const c = controlerFacture(facture({ dateEmission: "1902-04-10" }), { aujourdhui: LE_JOUR });
    expect(c.bloquants.join(" ")).toContain("invraisemblable");
  });

  it("refuse un paiement antérieur à la facture", () => {
    const c = controlerFacture(
      facture({ dateEmission: "2026-04-10" }, { statutPaiement: "payee", datePaiement: "2026-03-01" }),
      { aujourdhui: LE_JOUR },
    );
    expect(versable(c)).toBe(false);
    expect(c.bloquants.join(" ")).toContain("précède la facture");
  });

  it("signale quand le détail ne tombe pas sur le total", () => {
    // 528 lu au total, mais une ligne lue 5 280 : le zéro de trop se voit.
    const c = controlerFacture(facture({ montantTotal: 528, lignes: [ligne({ montant: 5280 })] }));
    expect(c.avertissements.join(" ")).toContain("ne tombe pas sur le total");
  });

  it("accepte l'écart quand les taxes lues l'expliquent", () => {
    const c = controlerFacture(
      facture({ montantTotal: 574.87, tps: 25, tvq: 49.87, lignes: [ligne({ montant: 500 })] }),
    );
    expect(c.avertissements.join(" ")).not.toContain("ne tombe pas sur le total");
  });

  it("se tait quand une ligne manque : la somme ne peut pas être comparée", () => {
    const c = controlerFacture(
      facture({ montantTotal: 528, lignes: [ligne({ montant: 400 }), ligne({ montant: null })] }),
    );
    expect(c.avertissements.join(" ")).not.toContain("ne tombe pas sur le total");
  });

  it("signale une ligne plus grosse que la facture entière", () => {
    const c = controlerFacture(facture({ montantTotal: 528, lignes: [ligne({ montant: 900 })] }));
    expect(c.avertissements.join(" ")).toContain("dépasse le total");
  });
});

describe("deux factures du lot qui portent le même numéro", () => {
  const numeros = [
    { id: "f0", numero: "F-2026-011" },
    { id: "f1", numero: "F-2026-011" },
    { id: "f2", numero: "F-2026-012" },
  ];

  it("bloque la seconde, pas la première", () => {
    expect(versable(controlerFacture({ ...facture(), id: "f0" }, { numerosDuLot: numeros }))).toBe(true);
    const seconde = controlerFacture({ ...facture(), id: "f1" }, { numerosDuLot: numeros });
    expect(seconde.bloquants.join(" ")).toContain("porte déjà le numéro F-2026-011");
  });

  it("laisse passer un numéro unique", () => {
    expect(versable(controlerFacture({ ...facture(), id: "f2" }, { numerosDuLot: numeros }))).toBe(true);
  });

  it("ne rapproche pas deux factures sans numéro lu", () => {
    const sansNumero = [
      { id: "f0", numero: null },
      { id: "f1", numero: null },
    ];
    expect(versable(controlerFacture({ ...facture(), id: "f1" }, { numerosDuLot: sansNumero }))).toBe(true);
  });
});

describe("l'en-tête du cabinet pris pour le client", () => {
  it("prévient quand le nom lu porte une marque de cabinet", () => {
    // Cas mesuré : la lecture a pris la deuxième ligne de l'en-tête.
    const c = controlerFacture(facture({}, { clientNom: "Avocats - Gatineau" }));
    expect(c.avertissements.join(" ")).toContain("en-tête de cabinet");
    // Un cabinet peut facturer un autre cabinet : ça ne bloque pas.
    expect(versable(c)).toBe(true);
  });

  it("ne dit rien sur un nom de client ordinaire", () => {
    const c = controlerFacture(facture({}, { clientNom: "Société Kaboré et fils" }));
    expect(c.avertissements.join(" ")).not.toContain("en-tête de cabinet");
  });

  it("se tait quand le client est déjà au dossier, même s'il est avocat", () => {
    const f = facture({}, { clientNom: "Untel Avocats inc." });
    f.match.client = { statut: "existant", clientId: "c1", clientNom: "Untel Avocats inc." };
    expect(controlerFacture(f).avertissements.join(" ")).not.toContain("en-tête de cabinet");
  });
});

describe("une facture bien lue ne dit rien", () => {
  it("ne bloque ni n'avertit", () => {
    const c = controlerFacture(facture());
    expect(c.bloquants).toEqual([]);
    expect(c.avertissements).toEqual([]);
  });
});

describe("une facture tapée sans pièce", () => {
  /** Même facture, mais déclarée sans aucun scan à l'appui. */
  const sansPiece = (extraction: Partial<PastInvoiceExtraction> = {}): FactureRepriseSaisie => ({
    ...facture(extraction),
    sansPiece: true,
  });

  it("ne renvoie pas relire un papier qui n'existe pas", () => {
    const c = controlerFacture(sansPiece({ confianceOcr: "basse" }), {});
    expect(c.avertissements).not.toContain("La facture se lit mal : relisez les montants avant de verser.");
  });

  it("ne parle pas de champs « illisibles » sur une saisie volontaire", () => {
    const c = controlerFacture(sansPiece({ champsIllisibles: ["montantTotal"] }), {});
    expect(c.avertissements.some((a) => a.includes("À vérifier sur la facture"))).toBe(false);
  });

  it("dit quand même que SAFE donnera un numéro, sans prétendre l'avoir lu", () => {
    const c = controlerFacture(sansPiece({ numeroFacture: null }), {});
    expect(c.avertissements).toContain("Sans numéro de facture, SAFE lui en donnera un.");
    expect(c.avertissements).not.toContain("Le numéro de facture n'a pas été lu : SAFE lui en donnera un.");
  });

  it("signale l'absence de détail sans invoquer une lecture", () => {
    const c = controlerFacture(sansPiece({ lignes: [], montantTotal: 528 }), {});
    expect(c.avertissements).toContain("Aucune ligne de détail : seul le total sera repris.");
  });

  it("garde tous les blocages de fond : un total manquant reste un blocage", () => {
    const c = controlerFacture(sansPiece({ montantTotal: null }), {});
    expect(versable(c)).toBe(false);
  });

  it("se verse quand elle est complète, comme une facture lue", () => {
    expect(versable(controlerFacture(sansPiece(), {}))).toBe(true);
  });
});
