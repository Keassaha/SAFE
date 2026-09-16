import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { capaciteIAAutorisee, CAPACITES_IA } from "@/lib/ai/politique-donnees-client";

const VARIABLES = [
  "SAFE_AI_DOCUMENT_CLASSIFICATION_CABINETS",
  "SAFE_AI_RESUME_DOSSIER_CABINETS",
  "SAFE_AI_LECTURE_PIECES_REFUSEE_CABINETS",
];

let sauvegarde: Record<string, string | undefined>;

beforeEach(() => {
  sauvegarde = Object.fromEntries(VARIABLES.map((v) => [v, process.env[v]]));
  for (const v of VARIABLES) delete process.env[v];
});

afterEach(() => {
  for (const [v, valeur] of Object.entries(sauvegarde)) {
    if (valeur === undefined) delete process.env[v];
    else process.env[v] = valeur;
  }
});

describe("ce qui sort de SAFE par défaut", () => {
  it("coupe la classification automatique des documents", () => {
    expect(capaciteIAAutorisee("classification_documents", "cab-1")).toBe(false);
  });

  it("coupe le résumé de dossier, qui envoie le dossier entier", () => {
    expect(capaciteIAAutorisee("resume_dossier", "cab-1")).toBe(false);
  });

  it("laisse passer la lecture d'une pièce déposée exprès", () => {
    expect(capaciteIAAutorisee("lecture_preuve_paiement", "cab-1")).toBe(true);
    expect(capaciteIAAutorisee("lecture_recu_depense", "cab-1")).toBe(true);
    expect(capaciteIAAutorisee("lecture_facture_reprise", "cab-1")).toBe(true);
  });
});

describe("activation et refus, cabinet par cabinet", () => {
  it("n'autorise le résumé que pour les cabinets nommés", () => {
    process.env.SAFE_AI_RESUME_DOSSIER_CABINETS = "cab-1, cab-2";
    expect(capaciteIAAutorisee("resume_dossier", "cab-1")).toBe(true);
    expect(capaciteIAAutorisee("resume_dossier", "cab-2")).toBe(true);
    expect(capaciteIAAutorisee("resume_dossier", "cab-3")).toBe(false);
  });

  it("laisse un cabinet refuser la lecture de ses pièces", () => {
    process.env.SAFE_AI_LECTURE_PIECES_REFUSEE_CABINETS = "cab-prudent";
    expect(capaciteIAAutorisee("lecture_facture_reprise", "cab-prudent")).toBe(false);
    expect(capaciteIAAutorisee("lecture_facture_reprise", "cab-1")).toBe(true);
  });

  it("n'accepte aucun joker : une étoile n'autorise personne", () => {
    process.env.SAFE_AI_RESUME_DOSSIER_CABINETS = "*";
    expect(capaciteIAAutorisee("resume_dossier", "cab-1")).toBe(false);
  });

  it("ignore les espaces et les entrées vides", () => {
    process.env.SAFE_AI_RESUME_DOSSIER_CABINETS = " , cab-1 ,, ";
    expect(capaciteIAAutorisee("resume_dossier", "cab-1")).toBe(true);
    expect(capaciteIAAutorisee("resume_dossier", "")).toBe(false);
  });
});

describe("l'inventaire dit ce qui sort", () => {
  it("décrit chaque capacité, pour qu'aucune ne sorte de l'inventaire en silence", () => {
    for (const [nom, reglage] of Object.entries(CAPACITES_IA)) {
      expect(reglage.envoie, `${nom} doit dire ce qu'elle envoie`).toBeTruthy();
      expect(reglage.variable.startsWith("SAFE_AI_")).toBe(true);
    }
  });
});
