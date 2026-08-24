import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * C-02 — une catégorie de dépense ne traverse pas la frontière du cabinet.
 *
 * Trois chemins lisaient `ExpenseCategory` par `findUnique({ where: { id } })`
 * depuis un identifiant fourni par la requête. Une dépense du cabinet A pouvait
 * donc référencer une catégorie du cabinet B, et surtout hériter de SON code,
 * qui décide du traitement fiscal.
 */

const categories: Array<{ id: string; cabinetId: string; code: string }> = [];

const prismaMock = {
  expenseCategory: {
    findFirst: vi.fn(async (args: { where: { id: string; cabinetId: string } }) => {
      const c = categories.find(
        (x) => x.id === args.where.id && x.cabinetId === args.where.cabinetId,
      );
      return c ? { code: c.code } : null;
    }),
  },
};
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

beforeEach(() => {
  categories.length = 0;
  categories.push({ id: "cat-A", cabinetId: "cab-A", code: "REPAS" });
  categories.push({ id: "cat-B", cabinetId: "cab-B", code: "SALAIRE" });
  prismaMock.expenseCategory.findFirst.mockClear();
});

describe("lireCodeCategorieDuCabinet", () => {
  it("rend le code d'une catégorie du cabinet", async () => {
    const { lireCodeCategorieDuCabinet } = await import("../categorie-cabinet");
    await expect(
      lireCodeCategorieDuCabinet({ cabinetId: "cab-A", categoryId: "cat-A" }),
    ).resolves.toBe("REPAS");
  });

  it("REFUSE la catégorie d'un autre cabinet", async () => {
    /* Le cas qui motive tout : `cat-B` existe, mais pas ici. Avant, son code
       « SALAIRE » revenait et faisait refuser la taxe sur une dépense de
       restaurant du cabinet A. */
    const { lireCodeCategorieDuCabinet, CategorieHorsCabinetError } = await import(
      "../categorie-cabinet"
    );
    await expect(
      lireCodeCategorieDuCabinet({ cabinetId: "cab-A", categoryId: "cat-B" }),
    ).rejects.toBeInstanceOf(CategorieHorsCabinetError);
  });

  it("refuse un identifiant inexistant EXACTEMENT comme un identifiant étranger", async () => {
    // Distinguer les deux renseignerait un appelant hostile sur ce qui existe
    // dans les autres cabinets.
    const { lireCodeCategorieDuCabinet } = await import("../categorie-cabinet");
    const etranger = await lireCodeCategorieDuCabinet({
      cabinetId: "cab-A",
      categoryId: "cat-B",
    }).catch((e) => e.message);
    const inexistant = await lireCodeCategorieDuCabinet({
      cabinetId: "cab-A",
      categoryId: "cat-inexistante",
    }).catch((e) => e.message);
    expect(etranger).toBe(inexistant);
  });

  it("rend null sans interroger la base quand aucune catégorie n'est demandée", async () => {
    const { lireCodeCategorieDuCabinet } = await import("../categorie-cabinet");
    await expect(
      lireCodeCategorieDuCabinet({ cabinetId: "cab-A", categoryId: null }),
    ).resolves.toBeNull();
    await expect(
      lireCodeCategorieDuCabinet({ cabinetId: "cab-A", categoryId: undefined }),
    ).resolves.toBeNull();
    expect(prismaMock.expenseCategory.findFirst).not.toHaveBeenCalled();
  });

  it("borne TOUJOURS la requête par cabinetId", async () => {
    // Sans cette assertion, un futur `findUnique` repasserait sans être vu.
    const { lireCodeCategorieDuCabinet } = await import("../categorie-cabinet");
    await lireCodeCategorieDuCabinet({ cabinetId: "cab-A", categoryId: "cat-A" });
    const where = prismaMock.expenseCategory.findFirst.mock.calls[0]![0].where;
    expect(where.cabinetId).toBe("cab-A");
  });
});
