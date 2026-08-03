import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-06.6 — Les deux règles qui rendent une vérification opposable.
 *
 * Le formulaire existait déjà, mais il consignait des méthodes qui ne sont pas au
 * règlement (« Vidéo », « En personne ») et n'attachait aucune pièce. Une
 * vérification ainsi enregistrée mettait pourtant `identityVerified = true`, donc
 * débloquait le garde-fou des mouvements de fonds — sur une simple affirmation.
 *
 * Deux refus le corrigent :
 *   1. une méthode inconnue de la province est rejetée (art. 22-24 QC / s. 23(7) ON) ;
 *   2. « vérifié » sans pièce justificative est rejeté (art. 22 QC / s. 23(13) ON).
 */

let clientRow: Record<string, unknown> | null;
let province: "QC" | "ON";
let createdData: Record<string, unknown> | null = null;

const prismaMock = {
  client: {
    findFirst: vi.fn(async () => clientRow),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  cabinet: {
    // Le service lit la province ET le réglage `identityProofRequired` sur le même
    // modèle : un seul mock sert les deux appels.
    findUnique: vi.fn(async () => ({
      config: JSON.stringify({ province }),
      identityProofRequired: true,
    })),
  },
  dossier: { findMany: vi.fn(async () => []) },
  clientIdentityVerification: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      createdData = data;
      return { id: "ver-1", ...data };
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("../audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/dossiers/preparation-loader", () => ({
  loadDossierPreparationSnapshot: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/dossiers/preparation-status", () => ({
  getDossierPreparationStatus: vi.fn(() => ({ state: "incomplete" })),
}));
vi.mock("../ready-for-review-service", () => ({
  detectAndEmitIfReady: vi.fn().mockResolvedValue(undefined),
}));

const BASE = {
  clientId: "client-1",
  cabinetId: "cab1",
  userId: "user-1",
  date: new Date("2026-06-01T00:00:00Z"),
  methode: "Pièce d'identité",
};

beforeEach(() => {
  province = "QC";
  clientRow = { id: "client-1", typeClient: "personne_physique", identityVerified: false };
  createdData = null;
  prismaMock.cabinet.findUnique = vi.fn(async () => ({
    config: JSON.stringify({ province }),
    identityProofRequired: true,
  })) as never;
  prismaMock.clientIdentityVerification.create.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Règle 1 — la méthode doit exister dans la province
   ════════════════════════════════════════════════════════════════ */

describe("Méthode de vérification", () => {
  it("REFUSE « Vidéo », que l'ancien formulaire proposait et qui n'est nulle part au règlement", async () => {
    const { createIdentityVerification } = await import("../identity-verification");

    await expect(
      createIdentityVerification({ ...BASE, methodCode: "VIDEO", documentId: "doc-1" }),
    ).rejects.toMatchObject({ code: "METHOD_NOT_ACCEPTED" });
  });

  it("REFUSE au Québec une méthode qui n'existe qu'en Ontario", async () => {
    province = "QC";
    const { createIdentityVerification } = await import("../identity-verification");

    await expect(
      createIdentityVerification({ ...BASE, methodCode: "DUAL_PROCESS", documentId: "doc-1" }),
    ).rejects.toMatchObject({ code: "METHOD_NOT_ACCEPTED" });
  });

  it("REFUSE en Ontario le répondant québécois (liste limitative, s. 23(7))", async () => {
    province = "ON";
    const { createIdentityVerification } = await import("../identity-verification");

    await expect(
      createIdentityVerification({ ...BASE, methodCode: "ATTESTATION_REPONDANT", documentId: "doc-1" }),
    ).rejects.toMatchObject({ code: "METHOD_NOT_ACCEPTED" });
  });

  it("énumère les méthodes admises dans le message de refus (PR-2)", async () => {
    const { createIdentityVerification } = await import("../identity-verification");

    await expect(
      createIdentityVerification({ ...BASE, methodCode: "VIDEO", documentId: "doc-1" }),
    ).rejects.toThrow(/Méthodes admises/);
  });

  it("ACCEPTE le répondant au Québec (art. 24)", async () => {
    province = "QC";
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "ATTESTATION_REPONDANT",
      documentId: "doc-1",
    });
    expect(createdData?.methodCode).toBe("ATTESTATION_REPONDANT");
  });

  it("ACCEPTE la double source en Ontario (s. 23(7)1iii)", async () => {
    province = "ON";
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({ ...BASE, methodCode: "DUAL_PROCESS", documentId: "doc-1" });
    expect(createdData?.methodCode).toBe("DUAL_PROCESS");
  });

  it("REFUSE pour une organisation une méthode réservée aux personnes physiques", async () => {
    province = "ON";
    clientRow = { id: "client-1", typeClient: "personne_morale", identityVerified: false };
    const { createIdentityVerification } = await import("../identity-verification");

    await expect(
      createIdentityVerification({ ...BASE, methodCode: "GOVERNMENT_PHOTO_ID", documentId: "doc-1" }),
    ).rejects.toMatchObject({ code: "METHOD_NOT_ACCEPTED" });
  });
});

/* ════════════════════════════════════════════════════════════════
   Règle 2 — pas de pièce, pas de vérification
   ════════════════════════════════════════════════════════════════ */

describe("Pièce justificative", () => {
  it("REFUSE de marquer « vérifié » sans pièce jointe", async () => {
    // C'est la règle qui fait tenir tout le reste : sans elle, le garde-fou des
    // mouvements de fonds se débloque sur une case cochée.
    const { createIdentityVerification } = await import("../identity-verification");

    await expect(
      createIdentityVerification({ ...BASE, methodCode: "PIECE_IDENTITE", statut: "verifie" }),
    ).rejects.toMatchObject({ code: "SUPPORTING_DOCUMENT_REQUIRED" });

    expect(prismaMock.clientIdentityVerification.create).not.toHaveBeenCalled();
  });

  it("cite l'article applicable selon la province", async () => {
    const { createIdentityVerification } = await import("../identity-verification");

    await expect(
      createIdentityVerification({ ...BASE, methodCode: "PIECE_IDENTITE", statut: "verifie" }),
    ).rejects.toThrow(/B-1 r\.5, art\. 22/);

    province = "ON";
    await expect(
      createIdentityVerification({ ...BASE, methodCode: "GOVERNMENT_PHOTO_ID", statut: "verifie" }),
    ).rejects.toThrow(/By-Law 7\.1, s\. 23\(13\)/);
  });

  it("LAISSE enregistrer une démarche en cours au statut « en attente », sans pièce", async () => {
    // PR-2 — un mur sans porte pousse au contournement. « En attente » est la porte :
    // on consigne la démarche, mais elle ne débloque pas les mouvements de fonds.
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "PIECE_IDENTITE",
      statut: "en_attente",
    });
    expect(createdData?.statut).toBe("en_attente");
  });

  it("ACCEPTE « vérifié » dès qu'une pièce est jointe", async () => {
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "PIECE_IDENTITE",
      statut: "verifie",
      documentId: "doc-1",
    });
    expect(createdData?.documentId).toBe("doc-1");
  });
});

/* ════════════════════════════════════════════════════════════════
   Traçabilité du régime appliqué
   ════════════════════════════════════════════════════════════════ */

describe("Ce qui est consigné", () => {
  it("enregistre la province du régime appliqué", async () => {
    // Une vérification faite sous le régime ontarien ne prouve pas la conformité
    // québécoise : sans cette colonne, un déménagement de cabinet rendrait
    // l'historique inexploitable.
    province = "ON";
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({ ...BASE, methodCode: "DUAL_PROCESS", documentId: "doc-1" });
    expect(createdData?.province).toBe("ON");
    expect(createdData?.subjectKind).toBe("INDIVIDUAL");
  });

  it("consigne la source des fonds en Ontario (s. 23(2))", async () => {
    province = "ON";
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "DUAL_PROCESS",
      documentId: "doc-1",
      sourceOfFunds: "Vente immobilière",
    });
    expect(createdData?.sourceOfFunds).toBe("Vente immobilière");
  });

  it("N'enregistre PAS de source des fonds au Québec, où elle n'est pas exigée", async () => {
    province = "QC";
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "PIECE_IDENTITE",
      documentId: "doc-1",
      sourceOfFunds: "Vente immobilière",
    });
    expect(createdData?.sourceOfFunds).toBeUndefined();
  });

  it("consigne la date d'obtention distincte de la date de vérification (s. 23(12.1))", async () => {
    province = "ON";
    const recordedAt = new Date("2026-05-20T00:00:00Z");
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "DUAL_PROCESS",
      documentId: "doc-1",
      recordedAt,
    });
    expect(createdData?.recordedAt).toEqual(recordedAt);
    expect(createdData?.date).toEqual(BASE.date);
  });
});

/* ════════════════════════════════════════════════════════════════
   CH-06.7 — Confirmation manuelle et dispense de cabinet
   ════════════════════════════════════════════════════════════════ */

describe("Confirmation manuelle", () => {
  it("ACCEPTE « vérifié » sans pièce jointe quand l'avocat atteste et dit où elle est", async () => {
    // Ce n'est pas un contournement : l'art. 22 exige que la copie soit conservée
    // AU DOSSIER, sur tout support, pourvu qu'elle puisse être produite en tout
    // temps. Il n'exige pas qu'elle soit dans SAFE.
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "PIECE_IDENTITE",
      statut: "verifie",
      proofMode: "ATTESTATION_MANUELLE",
      proofLocation: "Dossier papier 2026-014, classeur B",
    });

    expect(createdData?.proofMode).toBe("ATTESTATION_MANUELLE");
    expect(createdData?.proofLocation).toBe("Dossier papier 2026-014, classeur B");
  });

  it("REFUSE une confirmation manuelle qui n'indique pas où la pièce est conservée", async () => {
    // Une attestation qui ne dit pas où chercher ne vaut rien à l'inspection.
    const { createIdentityVerification } = await import("../identity-verification");

    await expect(
      createIdentityVerification({
        ...BASE,
        methodCode: "PIECE_IDENTITE",
        statut: "verifie",
        proofMode: "ATTESTATION_MANUELLE",
        proofLocation: "   ",
      }),
    ).rejects.toMatchObject({ code: "PROOF_LOCATION_REQUIRED" });
  });

  it("fige le texte de l'attestation, nominatif et daté", async () => {
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "PIECE_IDENTITE",
      statut: "verifie",
      proofMode: "ATTESTATION_MANUELLE",
      proofLocation: "Coffre du bureau",
    });

    expect(String(createdData?.attestationStatement)).toContain("Coffre du bureau");
    expect(String(createdData?.attestationStatement)).toContain("B-1 r.5, art. 22");
    expect(createdData?.attestedById).toBe("user-1");
    expect(createdData?.attestedAt).toBeInstanceOf(Date);
  });

  it("rédige l'attestation dans la langue du régime ontarien", async () => {
    province = "ON";
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({
      ...BASE,
      methodCode: "GOVERNMENT_PHOTO_ID",
      statut: "verifie",
      proofMode: "ATTESTATION_MANUELLE",
      proofLocation: "Physical file 2026-014",
    });

    expect(String(createdData?.attestationStatement)).toContain("By-Law 7.1");
  });
});

describe("Dispense de cabinet", () => {
  it("permet d'enregistrer « vérifié » sans aucune preuve quand l'exigence est levée", async () => {
    prismaMock.cabinet.findUnique = vi.fn(async () => ({
      config: JSON.stringify({ province }),
      identityProofRequired: false,
    })) as never;
    const { createIdentityVerification } = await import("../identity-verification");

    await createIdentityVerification({ ...BASE, methodCode: "PIECE_IDENTITE", statut: "verifie" });
    // Le mode consigné dit la vérité : ce n'est pas une attestation assumée,
    // c'est un enregistrement fait sous dispense. Deux situations différentes.
    expect(createdData?.proofMode).toBe("DISPENSE_CABINET");
  });
});
