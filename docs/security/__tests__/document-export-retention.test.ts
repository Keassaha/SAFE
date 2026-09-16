import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({
  write: vi.fn(), prepare: vi.fn(),
  db: {
    richDocument: { findFirst: vi.fn() },
    cabinet: { findUnique: vi.fn() },
    document: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/auth/session", () => ({ requireCabinetAndUser: async () => ({ cabinetId: "cab-A", userId: "user-A", role: "avocat" }) }));
vi.mock("@/lib/db", () => ({ prisma: m.db }));
vi.mock("@react-pdf/renderer", () => ({ renderToBuffer: async () => Buffer.from("PDF fictif") }));
vi.mock("@/lib/edition/pdf-builder", () => ({ buildPdfDocument: vi.fn() }));
vi.mock("@/lib/services/document", () => ({ writeDocumentObject: m.write, prepareStorageForUpload: m.prepare }));
import { POST } from "@/app/api/edition/documents/[id]/sync-to-folder/route";
beforeEach(() => {
  vi.resetAllMocks();
  m.db.richDocument.findFirst.mockResolvedValue({ id: "rich-A", dossierId: "dossier-A", clientId: "client-A", titre: "Titre", content: "texte", type: "note", dossier: { intitule: "Dossier" }, client: { raisonSociale: "Fictif" }, createdAt: new Date() });
  m.db.cabinet.findUnique.mockResolvedValue({ nom: "Fictif" });
  m.prepare.mockResolvedValue({ storageKey: "cab-A/2026/nouvel-objet" });
  m.db.document.create.mockResolvedValue({ id: "nouvelle-piece" });
});
const call = () => POST(new NextRequest("http://localhost/api/test", { method: "POST" }), { params: Promise.resolve({ id: "rich-A" }) });
it("un nouvel export crée une nouvelle pièce sans écraser l'ancienne", async () => {
  m.db.document.findFirst.mockResolvedValue(null);
  expect((await call()).status).toBe(200);
  expect(m.write).toHaveBeenCalledWith("cab-A/2026/nouvel-objet.pdf", expect.any(Buffer), "application/pdf");
  expect(m.db.document.create).toHaveBeenCalled();
  expect(m.db.document.update).not.toHaveBeenCalled();
  expect(m.db.document.findFirst).toHaveBeenCalledWith({ where: expect.objectContaining({ hash: expect.any(String), templateCode: "rich-doc:rich-A" }) });
});
it("un export identique réutilise la pièce sans réécrire son fichier", async () => {
  m.db.document.findFirst.mockResolvedValue({ id: "piece-existante" });
  expect(await (await call()).json()).toEqual({ ok: true, documentId: "piece-existante", action: "unchanged" });
  expect(m.write).not.toHaveBeenCalled();
  expect(m.db.document.create).not.toHaveBeenCalled();
});
it("aucun export n'est généré pour un document inaccessible", async () => {
  m.db.richDocument.findFirst.mockResolvedValue(null);
  expect((await call()).status).toBe(404);
  expect(m.write).not.toHaveBeenCalled();
});
