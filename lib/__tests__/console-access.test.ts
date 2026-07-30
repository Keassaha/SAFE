import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * P0 sécurité — garde d'accès de la Console SAFE Inc.
 *
 * Ce que ces tests protègent : les server actions de la Console sont des
 * endpoints POST autonomes. Masquer un bouton dans l'écran ne les protège pas.
 * Avant ce lot, elles vérifiaient seulement `isSafeIncCabinet`, c'est-à-dire
 * « le cabinet s'appelle SAFE », ce qui laissait un rôle non-admin du cabinet
 * SAFE créer des leads, changer des étapes et répondre aux billets de support.
 *
 * La règle est double et cumulative : compte interne ET rôle administrateur.
 */

const findUniqueUser = vi.fn();
const requireCabinetAndUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUniqueUser(...args) },
    cabinet: { findUnique: vi.fn() },
    workspace: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  requireCabinetAndUser: () => requireCabinetAndUser(),
}));

import { hasConsoleAccess, requireConsoleAccess, CONSOLE_ACCESS_DENIED } from "@/lib/safe-inc";

/** Façonne la réponse de `prisma.user.findUnique` utilisée par isSafeInternalUser. */
function mockUser(opts: { isInternal: boolean; cabinetNom?: string | null } | null) {
  findUniqueUser.mockResolvedValue(
    opts === null
      ? null
      : { isInternal: opts.isInternal, cabinet: opts.cabinetNom ? { nom: opts.cabinetNom } : null },
  );
}

beforeEach(() => {
  findUniqueUser.mockReset();
  requireCabinetAndUser.mockReset();
});

describe("hasConsoleAccess — les deux conditions sont cumulatives", () => {
  it("interne + admin : accès accordé", async () => {
    mockUser({ isInternal: true });
    await expect(hasConsoleAccess("u1", "admin_cabinet")).resolves.toBe(true);
  });

  it("interne mais NON admin : refusé (un interne non-admin ne voit pas tous les clients)", async () => {
    mockUser({ isInternal: true });
    for (const role of ["avocat", "assistante", "comptabilite"]) {
      await expect(hasConsoleAccess("u1", role)).resolves.toBe(false);
    }
  });

  it("admin mais NON interne : refusé (un admin de cabinet client n'entre pas dans la Console)", async () => {
    mockUser({ isInternal: false, cabinetNom: "Derisier Avocats" });
    await expect(hasConsoleAccess("u1", "admin_cabinet")).resolves.toBe(false);
  });

  it("ni l'un ni l'autre : refusé", async () => {
    mockUser({ isInternal: false, cabinetNom: "Derisier Avocats" });
    await expect(hasConsoleAccess("u1", "avocat")).resolves.toBe(false);
  });

  it("utilisateur introuvable : refusé", async () => {
    mockUser(null);
    await expect(hasConsoleAccess("inconnu", "admin_cabinet")).resolves.toBe(false);
  });

  it("rôle inconnu : refusé, jamais de blanc-seing", async () => {
    mockUser({ isInternal: true });
    await expect(hasConsoleAccess("u1", "stagiaire")).resolves.toBe(false);
    await expect(hasConsoleAccess("u1", "")).resolves.toBe(false);
  });

  it("repli transitoire sur le nom de cabinet SAFE, mais le rôle admin reste exigé", async () => {
    mockUser({ isInternal: false, cabinetNom: "SAFE" });
    await expect(hasConsoleAccess("u1", "admin_cabinet")).resolves.toBe(true);

    // Le cœur du trou refermé par ce lot : appartenir au cabinet SAFE n'est pas un rôle.
    mockUser({ isInternal: false, cabinetNom: "SAFE" });
    await expect(hasConsoleAccess("u1", "avocat")).resolves.toBe(false);
  });

  it("le rôle est évalué avant la requête : un non-admin ne déclenche aucune lecture en base", async () => {
    mockUser({ isInternal: true });
    await hasConsoleAccess("u1", "avocat");
    expect(findUniqueUser).not.toHaveBeenCalled();
  });
});

describe("requireConsoleAccess — la garde des server actions", () => {
  it("laisse passer un interne admin et retourne son identité", async () => {
    requireCabinetAndUser.mockResolvedValue({
      userId: "u1",
      cabinetId: "c1",
      role: "admin_cabinet",
    });
    mockUser({ isInternal: true });
    await expect(requireConsoleAccess()).resolves.toEqual({ userId: "u1", cabinetId: "c1" });
  });

  it("rejette un membre non-admin du cabinet SAFE appelant l'action directement", async () => {
    requireCabinetAndUser.mockResolvedValue({
      userId: "u2",
      cabinetId: "safe",
      role: "assistante",
    });
    mockUser({ isInternal: true, cabinetNom: "SAFE" });
    await expect(requireConsoleAccess()).rejects.toThrow(CONSOLE_ACCESS_DENIED);
  });

  it("rejette un admin d'un cabinet client", async () => {
    requireCabinetAndUser.mockResolvedValue({
      userId: "u3",
      cabinetId: "client",
      role: "admin_cabinet",
    });
    mockUser({ isInternal: false, cabinetNom: "Derisier Avocats" });
    await expect(requireConsoleAccess()).rejects.toThrow(CONSOLE_ACCESS_DENIED);
  });

  it("propage l'échec de session sans le transformer en accès accordé", async () => {
    requireCabinetAndUser.mockRejectedValue(new Error("Session incomplète"));
    await expect(requireConsoleAccess()).rejects.toThrow("Session incomplète");
  });

  it("le message d'erreur ne révèle pas laquelle des deux conditions a échoué", async () => {
    requireCabinetAndUser.mockResolvedValue({ userId: "u4", cabinetId: "c", role: "avocat" });
    mockUser({ isInternal: true });
    await expect(requireConsoleAccess()).rejects.toThrow(CONSOLE_ACCESS_DENIED);

    requireCabinetAndUser.mockResolvedValue({ userId: "u5", cabinetId: "c", role: "admin_cabinet" });
    mockUser({ isInternal: false, cabinetNom: "Autre" });
    await expect(requireConsoleAccess()).rejects.toThrow(CONSOLE_ACCESS_DENIED);
  });
});
