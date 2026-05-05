import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    dossierTache: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    dossier: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    clientIdentityVerification: {
      create: vi.fn(),
    },
    deboursDossier: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    dossierMandate: {
      update: vi.fn(),
    },
    journalGeneralEntry: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  requireCabinetAndUser: vi.fn(),
  canManageDossiers: vi.fn(),
  createAuditLog: vi.fn(),
  loadDossierPreparationSnapshot: vi.fn(),
  getDossierPreparationStatus: vi.fn(),
  detectAndEmitIfReady: vi.fn(),
  writeJournalForDeboursPaiement: vi.fn(),
  applyDeboursDossierCorrection: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/auth/session", () => ({ requireCabinetAndUser: mocks.requireCabinetAndUser }));
vi.mock("@/lib/auth/permissions", () => ({ canManageDossiers: mocks.canManageDossiers }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: mocks.createAuditLog }));
vi.mock("@/lib/dossiers/preparation-loader", () => ({
  loadDossierPreparationSnapshot: mocks.loadDossierPreparationSnapshot,
}));
vi.mock("@/lib/dossiers/preparation-status", () => ({
  getDossierPreparationStatus: mocks.getDossierPreparationStatus,
}));
vi.mock("@/lib/services/ready-for-review-service", () => ({
  detectAndEmitIfReady: mocks.detectAndEmitIfReady,
}));
vi.mock("@/lib/services/journal/debours-dossier-journal", () => ({
  writeJournalForDeboursPaiement: mocks.writeJournalForDeboursPaiement,
}));
vi.mock("@/lib/services/journal/append-only-corrections", () => ({
  applyDeboursDossierCorrection: mocks.applyDeboursDossierCorrection,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { updateDossierTache } from "@/app/(app)/dossiers/actions";
import { setMandateChecklistItem } from "@/app/(app)/dossiers/mandate-actions";
import { createDeboursDossier, updateDeboursDossier } from "@/lib/actions/debours";
import { createIdentityVerification } from "@/lib/services/identity-verification";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCabinetAndUser.mockResolvedValue({
    cabinetId: "cab_1",
    userId: "user_assistante",
    role: "admin_cabinet",
  });
  mocks.canManageDossiers.mockReturnValue(true);
  mocks.loadDossierPreparationSnapshot.mockResolvedValue({ dossierId: "dos_1" });
  mocks.getDossierPreparationStatus.mockReturnValue({ state: "en_preparation" });
  mocks.detectAndEmitIfReady.mockResolvedValue({ emitted: false, reason: "no_transition" });
  mocks.createAuditLog.mockResolvedValue(undefined);
  mocks.revalidatePath.mockReturnValue(undefined);
  mocks.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });
  mocks.prisma.$transaction.mockImplementation(async (fn: (tx: typeof mocks.prisma) => unknown) => fn(mocks.prisma));
  mocks.writeJournalForDeboursPaiement.mockResolvedValue(undefined);
  mocks.applyDeboursDossierCorrection.mockResolvedValue(undefined);
});

describe("ready-for-review detection hooks", () => {
  it("déclenche la détection quand une tâche dossier passe à terminee", async () => {
    mocks.prisma.dossierTache.findFirst.mockResolvedValue({
      id: "task_1",
      dossierId: "dos_1",
      statut: "en_cours",
      dossier: { cabinetId: "cab_1" },
    });
    mocks.prisma.dossierTache.update.mockResolvedValue({ id: "task_1" });

    await expect(
      updateDossierTache(
        "task_1",
        formData({
          titre: "Réviser les pièces",
          statut: "terminee",
          priorite: "medium",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/dossiers/dos_1");

    expect(mocks.loadDossierPreparationSnapshot).toHaveBeenCalledWith("cab_1", "dos_1", {
      callerUserId: "user_assistante",
    });
    expect(mocks.detectAndEmitIfReady).toHaveBeenCalledWith("cab_1", "dos_1", {
      beforeState: "en_preparation",
      callerUserId: "user_assistante",
    });
  });

  it("ne déclenche pas quand la tâche ne passe pas à terminee", async () => {
    mocks.prisma.dossierTache.findFirst.mockResolvedValue({
      id: "task_1",
      dossierId: "dos_1",
      statut: "a_faire",
      dossier: { cabinetId: "cab_1" },
    });
    mocks.prisma.dossierTache.update.mockResolvedValue({ id: "task_1" });

    await expect(
      updateDossierTache(
        "task_1",
        formData({
          titre: "Réviser les pièces",
          statut: "en_cours",
          priorite: "medium",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/dossiers/dos_1");

    expect(mocks.loadDossierPreparationSnapshot).not.toHaveBeenCalled();
    expect(mocks.detectAndEmitIfReady).not.toHaveBeenCalled();
  });

  it("déclenche la détection pour chaque dossier actif du client vérifié", async () => {
    mocks.prisma.client.findFirst.mockResolvedValue({
      id: "cli_1",
      cabinetId: "cab_1",
      identityVerified: false,
    });
    mocks.prisma.dossier.findMany.mockResolvedValue([{ id: "dos_1" }, { id: "dos_2" }]);
    mocks.prisma.clientIdentityVerification.create.mockResolvedValue({ id: "verif_1" });
    mocks.prisma.client.updateMany.mockResolvedValue({ count: 1 });

    await createIdentityVerification({
      clientId: "cli_1",
      cabinetId: "cab_1",
      userId: "user_assistante",
      date: new Date("2026-04-29T10:00:00Z"),
      methode: "piece_identite",
      statut: "verifie",
    });

    expect(mocks.prisma.client.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ identityVerified: true }),
      }),
    );
    expect(mocks.detectAndEmitIfReady).toHaveBeenCalledTimes(2);
    expect(mocks.detectAndEmitIfReady).toHaveBeenNthCalledWith(1, "cab_1", "dos_1", {
      beforeState: "en_preparation",
      callerUserId: "user_assistante",
    });
    expect(mocks.detectAndEmitIfReady).toHaveBeenNthCalledWith(2, "cab_1", "dos_2", {
      beforeState: "en_preparation",
      callerUserId: "user_assistante",
    });
  });

  it("déclenche la détection quand un item obligatoire de checklist mandat est coché", async () => {
    mocks.prisma.dossier.findFirst.mockResolvedValue({
      id: "dos_1",
      mandate: {
        checklist: [
          { label: "Mandat signé", obligatoire: true, checked: false },
          { label: "Document optionnel", obligatoire: false, checked: false },
        ],
      },
    });
    mocks.prisma.dossierMandate.update.mockResolvedValue({ dossierId: "dos_1" });

    const result = await setMandateChecklistItem("dos_1", "Mandat signé", true);

    expect(result).toEqual({ ok: true, checked: true });
    expect(mocks.prisma.dossierMandate.update).toHaveBeenCalledWith({
      where: { dossierId: "dos_1" },
      data: {
        checklist: [
          { label: "Mandat signé", obligatoire: true, checked: true },
          { label: "Document optionnel", obligatoire: false, checked: false },
        ],
      },
    });
    expect(mocks.detectAndEmitIfReady).toHaveBeenCalledWith("cab_1", "dos_1", {
      beforeState: "en_preparation",
      callerUserId: "user_assistante",
    });
  });

  it("déclenche la détection après saisie d'un débours requis", async () => {
    mocks.prisma.dossier.findFirst
      .mockResolvedValueOnce({ cabinetId: "cab_1" })
      .mockResolvedValueOnce({ clientId: "cli_1" });
    mocks.prisma.deboursDossier.create.mockResolvedValue({
      id: "deb_1",
      cabinetId: "cab_1",
      dossierId: "dos_1",
      clientId: "cli_1",
      montant: 125,
      description: "Frais IRCC",
      payeParCabinet: true,
      deboursType: null,
    });

    await createDeboursDossier(
      formData({
        dossierId: "dos_1",
        clientId: "cli_1",
        description: "Frais IRCC",
        montant: "125",
        date: "2026-04-29",
      }),
    );

    expect(mocks.detectAndEmitIfReady).toHaveBeenCalledWith("cab_1", "dos_1", {
      beforeState: "en_preparation",
      callerUserId: "user_assistante",
    });
  });

  it("déclenche aussi la détection après update d'un débours existant", async () => {
    mocks.prisma.deboursDossier.findFirst.mockResolvedValue({
      id: "deb_1",
      cabinetId: "cab_1",
      dossierId: "dos_1",
      clientId: "cli_1",
      factureId: null,
      montant: 50,
      description: "Ancien",
      payeParCabinet: false,
      deboursType: null,
    });
    mocks.prisma.deboursDossier.update.mockResolvedValue({
      id: "deb_1",
      cabinetId: "cab_1",
      dossierId: "dos_1",
      clientId: "cli_1",
      montant: 125,
      description: "Frais IRCC",
      payeParCabinet: true,
      deboursType: null,
    });
    mocks.prisma.journalGeneralEntry.findFirst.mockResolvedValue(null);

    await updateDeboursDossier(
      "deb_1",
      formData({
        clientId: "cli_1",
        description: "Frais IRCC",
        montant: "125",
        date: "2026-04-29",
        payeParCabinet: "true",
      }),
    );

    expect(mocks.detectAndEmitIfReady).toHaveBeenCalledWith("cab_1", "dos_1", {
      beforeState: "en_preparation",
      callerUserId: "user_assistante",
    });
  });
});
