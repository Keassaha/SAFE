import { describe, it, expect } from "vitest";
import {
  clientDuDepot,
  comparerCoordonnee,
  ouvrirEnCorrection,
  reconnaitreClient,
  reconnaitreMandat,
  resteACompleter,
} from "@/lib/services/reprise-un-client/depot";
import type { PastInvoiceExtraction } from "@/lib/ai/extract-past-invoice";
import type { ClientConnu } from "@/lib/services/reprise-un-client/contexte";

const lue = (o: Partial<PastInvoiceExtraction> = {}): PastInvoiceExtraction => ({
  numeroFacture: "F-1",
  clientNom: "Constructions Béliveau inc.",
  dossierIntitule: "Bail commercial, rue Laurier",
  dateEmission: "2025-03-14",
  montantTotal: 100,
  tps: null,
  tvq: null,
  lignes: [],
  confianceOcr: "haute",
  champsIllisibles: [],
  ...o,
});

const CLIENTS: ClientConnu[] = [
  {
    id: "c1",
    nom: "Transport Gatineau-Ottawa inc.",
    typeClient: "personne_morale",
    mandats: [
      { id: "m1", intitule: "Réclamation contractuelle", tauxHoraire: 475, enCours: true },
      { id: "m2", intitule: "Divorce", tauxHoraire: 300, enCours: false },
    ],
  },
  { id: "c2", nom: "Constructions Beliveau inc", typeClient: "personne_morale", mandats: [] },
];

describe("un dépôt ne concerne qu'un client", () => {
  it("retient le nom le plus fréquent et écarte la facture d'un autre client", () => {
    const d = clientDuDepot([
      { id: "a", extraction: lue() },
      { id: "b", extraction: lue() },
      { id: "c", extraction: lue({ clientNom: "Cabinet Duval et Associés" }) },
    ]);
    expect(d.nom).toBe("Constructions Béliveau inc.");
    expect(d.retenues).toEqual(["a", "b"]);
    expect(d.ecartees).toEqual([{ id: "c", nomLu: "Cabinet Duval et Associés" }]);
  });

  it("à égalité, la première facture déposée l'emporte", () => {
    const d = clientDuDepot([
      { id: "a", extraction: lue({ clientNom: "Nadine Ouellet" }) },
      { id: "b", extraction: lue() },
    ]);
    expect(d.nom).toBe("Nadine Ouellet");
  });

  it("garde une facture que la lecture n'a pas su nommer : rien ne la contredit", () => {
    const d = clientDuDepot([
      { id: "a", extraction: lue() },
      { id: "b", extraction: null },
      { id: "c", extraction: lue({ clientNom: null }) },
    ]);
    expect(d.retenues).toEqual(["a", "b", "c"]);
    expect(d.ecartees).toEqual([]);
  });

  it("ne voit pas deux clients dans la casse ou les accents", () => {
    const d = clientDuDepot([
      { id: "a", extraction: lue() },
      { id: "b", extraction: lue({ clientNom: "CONSTRUCTIONS BELIVEAU INC." }) },
    ]);
    expect(d.ecartees).toEqual([]);
  });

  it("prend les coordonnées sur la première facture retenue qui les porte", () => {
    const d = clientDuDepot([
      { id: "a", extraction: lue() },
      { id: "b", extraction: lue({ clientAdresse: "450, rue Rideau, Ottawa", clientTelephone: "613 555-0148" }) },
      { id: "c", extraction: lue({ clientNom: "Autre inc.", clientCourriel: "autre@x.ca" }) },
    ]);
    expect([d.adresse, d.telephone, d.courriel]).toEqual(["450, rue Rideau, Ottawa", "613 555-0148", null]);
  });

  it("propose l'objet de mandat le plus fréquent", () => {
    const d = clientDuDepot([
      { id: "a", extraction: lue({ dossierIntitule: "Litige fournisseur" }) },
      { id: "b", extraction: lue() },
      { id: "c", extraction: lue() },
    ]);
    expect(d.mandat).toBe("Bail commercial, rue Laurier");
  });

  it("un dépôt dont rien n'a pu être lu n'a pas de client", () => {
    expect(clientDuDepot([{ id: "a", extraction: null }]).nom).toBeNull();
  });
});

describe("le client est-il déjà au cabinet ?", () => {
  it("un nom identique, à la ponctuation près, est reconnu d'office", () => {
    const r = reconnaitreClient("Transport Gatineau-Ottawa Inc", CLIENTS);
    expect(r.statut).toBe("connu");
  });

  it("un nom seulement proche est proposé, jamais rattaché", () => {
    const r = reconnaitreClient("Constructions Bélivau inc.", CLIENTS);
    expect(r.statut).toBe("nouveau");
    if (r.statut === "nouveau") expect(r.proches.map((p) => p.id)).toEqual(["c2"]);
  });

  it("un nom inconnu est un nouveau client sans proche", () => {
    expect(reconnaitreClient("Maple Holdings Ltd.", CLIENTS)).toEqual({ statut: "nouveau", proches: [] });
  });

  it("sans nom lu, rien n'est reconnu", () => {
    expect(reconnaitreClient(null, CLIENTS)).toEqual({ statut: "nouveau", proches: [] });
  });
});

describe("dans quel mandat ranger ?", () => {
  const mandats = CLIENTS[0].mandats;
  it("celui dont l'intitulé recoupe l'objet lu", () => {
    expect(reconnaitreMandat("réclamation contractuelle", mandats)?.id).toBe("m1");
  });
  it("un objet lu qui ne recoupe rien désigne un nouveau mandat", () => {
    expect(reconnaitreMandat("Bail commercial", mandats)).toBeNull();
  });
  it("« Divorce 2 » ne se range pas dans « Divorce »", () => {
    expect(reconnaitreMandat("Divorce 2", mandats)).toBeNull();
  });
  it("sans objet lu, le seul mandat en cours", () => {
    expect(reconnaitreMandat(null, mandats)?.id).toBe("m1");
  });
});

describe("la fiche contredit-elle la facture ?", () => {
  it("même adresse, autrement ponctuée : identique", () => {
    expect(comparerCoordonnee("12, chemin de la Savane, Gatineau", "12 chemin de la Savane Gatineau")).toBe("identique");
  });
  it("une fiche plus complète n'est pas une différence", () => {
    expect(comparerCoordonnee("12, chemin de la Savane", "12, chemin de la Savane, Gatineau J8T 8H7")).toBe("identique");
  });
  it("une autre adresse est montrée, pas remplacée", () => {
    expect(comparerCoordonnee("1200, boulevard Saint-Laurent, Ottawa", "12, chemin de la Savane, Gatineau")).toBe("differente");
  });
  it("une fiche sans adresse : à ajouter", () => {
    expect(comparerCoordonnee("1200, boulevard Saint-Laurent", null)).toBe("a_ajouter");
  });
  it("rien de lu : rien à dire", () => {
    expect(comparerCoordonnee(null, "12, chemin de la Savane")).toBe("rien");
  });
});

describe("relevé ou correction ?", () => {
  const net = { bloquants: [], avertissements: [] };
  it("une lecture sûre s'affiche en relevé", () => {
    expect(ouvrirEnCorrection({ saisieALaMain: false, extraction: lue(), controle: net })).toBe(false);
  });
  it("le paiement à choisir n'ouvre pas la correction : il se choisit dans les deux", () => {
    expect(
      ouvrirEnCorrection({ saisieALaMain: false, extraction: lue(), controle: { bloquants: [{ code: "STATUT_MANQUANT" }], avertissements: [] } }),
    ).toBe(false);
  });
  it("une lecture hésitante s'ouvre en correction", () => {
    expect(ouvrirEnCorrection({ saisieALaMain: false, extraction: lue({ confianceOcr: "moyenne" }), controle: net })).toBe(true);
    expect(ouvrirEnCorrection({ saisieALaMain: false, extraction: lue({ champsIllisibles: ["montantTotal"] }), controle: net })).toBe(true);
  });
  it("un défaut du papier (ligne incomplète, écart de total) ouvre la correction", () => {
    expect(
      ouvrirEnCorrection({ saisieALaMain: false, extraction: lue(), controle: { bloquants: [{ code: "LIGNE_HORAIRE_INCOMPLETE" }], avertissements: [] } }),
    ).toBe(true);
    expect(
      ouvrirEnCorrection({ saisieALaMain: false, extraction: lue(), controle: { bloquants: [], avertissements: [{ code: "ECART_DETAIL" }] } }),
    ).toBe(true);
  });
  it("une lecture muette ou une saisie à la main s'ouvrent en correction", () => {
    expect(ouvrirEnCorrection({ lectureEchouee: true, saisieALaMain: false, extraction: null, controle: net })).toBe(true);
    expect(ouvrirEnCorrection({ saisieALaMain: true, extraction: null, controle: net })).toBe(true);
  });
});

describe("ce qui reste à compléter sur la fiche", () => {
  it("nomme l'identité et le fidéicommis tant qu'ils manquent", () => {
    expect(resteACompleter({ identiteVerifiee: false, soldeFideicommisDeclare: false })).toEqual(["IDENTITE", "FIDEICOMMIS"]);
  });
  it("ne dit rien quand tout est fait", () => {
    expect(resteACompleter({ identiteVerifiee: true, soldeFideicommisDeclare: true })).toEqual([]);
  });
});
