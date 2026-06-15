import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lot 6 — Persistance du profil comptable.
 *  - saveAccountingProfile fusionne dans modules.comptabilite SANS écraser les
 *    autres clés (ex. facturation.taxes).
 *  - getAccountingProfile relit le profil + sa config dérivée.
 */

let storedModules: string | null = JSON.stringify({ facturation: { taxes: { mode: "tps_tvq" } } });
let upsertArg: { create: { modules: string }; update: { modules: string } } | null = null;

const prismaMock = {
  cabinetInterface: {
    findUnique: vi.fn(async () => ({ modules: storedModules })),
    upsert: vi.fn(async (arg: { create: { modules: string }; update: { modules: string } }) => {
      upsertArg = arg;
      storedModules = arg.update.modules;
      return { id: "iface-1" };
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const sampleInput = {
  province: "QC",
  taille: "2_5" as const,
  fideicommisPresent: true,
  fideicommisActif: true,
  methodeFacturation: "mixte" as const,
  inscritTpsTvq: true,
  frequenceTaxes: "trimestrielle" as const,
  comptableExterne: true,
  logicielComptable: "quickbooks" as const,
  besoinExportMensuel: true,
  besoinRapprochement: true,
};

beforeEach(() => {
  storedModules = JSON.stringify({ facturation: { taxes: { mode: "tps_tvq" } } });
  upsertArg = null;
  prismaMock.cabinetInterface.findUnique.mockClear();
  prismaMock.cabinetInterface.upsert.mockClear();
});

describe("accounting-profile — persistance (Lot 6)", () => {
  it("saveAccountingProfile préserve les autres modules (facturation)", async () => {
    const { saveAccountingProfile } = await import("../accounting-profile");
    const config = await saveAccountingProfile("cab1", sampleInput);

    expect(config.profil).toBe("C");
    expect(upsertArg).not.toBeNull();
    const saved = JSON.parse(upsertArg!.update.modules);
    // La clé facturation existante doit être conservée.
    expect(saved.facturation?.taxes?.mode).toBe("tps_tvq");
    // Le profil comptable est ajouté.
    expect(saved.comptabilite.profil.taille).toBe("2_5");
  });

  it("getAccountingProfile relit le profil et dérive la config", async () => {
    const { saveAccountingProfile, getAccountingProfile } = await import("../accounting-profile");
    await saveAccountingProfile("cab1", sampleInput);

    const result = await getAccountingProfile("cab1");
    expect(result).not.toBeNull();
    expect(result!.input.logicielComptable).toBe("quickbooks");
    expect(result!.config.profil).toBe("C");
    expect(result!.config.features.exportFormat).toBe("quickbooks");
  });

  it("getAccountingProfile retourne null si aucun profil n'est stocké", async () => {
    storedModules = JSON.stringify({ facturation: {} });
    const { getAccountingProfile } = await import("../accounting-profile");
    expect(await getAccountingProfile("cab1")).toBeNull();
  });
});
