/** Régressions de sécurité : base et session simulées, aucun réseau. */
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  db: {
    richDocument: { findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    richDocumentVersion: { findFirst: vi.fn(), create: vi.fn() },
    document: { findFirst: vi.fn(), updateMany: vi.fn() },
    dossier: { findFirst: vi.fn() },
    workSession: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    timeEntry: { create: vi.fn() },
    user: { findUnique: vi.fn() }, cabinet: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() }, $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/auth/session", () => ({ requireCabinetAndUser: mocks.session }));
vi.mock("@/lib/db", () => ({ prisma: mocks.db }));
vi.mock("@/lib/navette/navette-service", () => ({ createNavetteMessage: vi.fn() }));
vi.mock("@/lib/dossiers/docket-service", () => ({ createDocketEntryForImportedDocument: vi.fn().mockResolvedValue({ created: false }) }));
import { PUT, GET, DELETE } from "@/app/api/edition/documents/[id]/route";
import { POST as startSession } from "@/app/api/edition/sessions/route";
import { POST as confirmUpload } from "@/app/api/edition/upload/confirm/route";
import { POST as terminer } from "@/app/api/edition/documents/[id]/terminer/route";
import { dossierDocumentScope, richDocumentScope, uploadedDocumentScope } from "@/lib/edition/access";
import { classifyDocument } from "@/lib/ai/classify-document";
import { documentClassificationEnabled } from "@/lib/ai/document-classification-policy";
import { createDocketEntryForImportedDocument } from "@/lib/dossiers/docket-service";
const actor = { cabinetId: "cabinet-A", userId: "avocat-A", role: "avocat" };
const params = { params: Promise.resolve({ id: "doc-A" }) };
function req(body: object = {}, method = "POST") {
  return new NextRequest("http://localhost/api/test", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue(actor);
  mocks.db.$transaction.mockImplementation(async (fn) => fn(mocks.db));
  vi.mocked(createDocketEntryForImportedDocument).mockResolvedValue({ created: false, reason: "not_significant" } as Awaited<ReturnType<typeof createDocketEntryForImportedDocument>>);
});
afterEach(() => vi.unstubAllEnvs());

it.each(["avocat", "assistante", "admin_cabinet", "comptabilite", "inconnu"])("politique de documents, rôle %s", (role) => {
  const scope = dossierDocumentScope({ ...actor, role });
  expect(scope.cabinetId).toBe("cabinet-A");
  expect(scope.client).toEqual({ cabinetId: "cabinet-A" });
  if (role === "avocat") expect(scope.avocatResponsableId).toBe("avocat-A");
  if (["comptabilite", "inconnu"].includes(role)) expect(scope.id).toEqual({ in: [] });
  if (["assistante", "admin_cabinet"].includes(role)) expect(scope.avocatResponsableId).toBeUndefined();
});
it.each(["lecture", "écriture", "archivage"])("S1 : %s refusée pour le dossier d'un collègue ou d'un autre cabinet", async (operation) => {
  mocks.db.richDocument.findFirst.mockResolvedValue(null);
  const response = operation === "lecture" ? await GET(req(), params) : operation === "écriture" ? await PUT(req({ content: "attaque" }, "PUT"), params) : await DELETE(req(), params);
  expect(response.status).toBe(404);
  expect(mocks.db.richDocument.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining(richDocumentScope(actor)) }));
  expect(mocks.db.richDocument.update).not.toHaveBeenCalled();
  expect(mocks.db.$transaction).not.toHaveBeenCalled();
});
it("S2 : confirmation réservée à un fichier orphelin téléversé par l'utilisateur", async () => {
  mocks.db.document.findFirst.mockResolvedValue(null);
  const response = await confirmUpload(req({ documentId: "piece-B", dossierId: "dossier-A" }));
  expect(response.status).toBe(404);
  expect(mocks.db.document.findFirst).toHaveBeenCalledWith({ where: { id: "piece-B", cabinetId: "cabinet-A", uploadedById: "avocat-A", dossierId: null, clientId: null } });
  expect(mocks.db.document.updateMany).not.toHaveBeenCalled();
});
it("S2 : refuse une destination sans permission", async () => {
  mocks.db.document.findFirst.mockResolvedValue({ id: "piece-A" });
  mocks.db.dossier.findFirst.mockResolvedValue(null);
  const response = await confirmUpload(req({ documentId: "piece-A", dossierId: "dossier-B" }));
  expect(response.status).toBe(404);
  expect(mocks.db.dossier.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "dossier-B", ...dossierDocumentScope(actor) } }));
  expect(mocks.db.document.updateMany).not.toHaveBeenCalled();
});
it("S2 : un classement autorisé est atomique et journalisé même sans IA", async () => {
  mocks.db.document.findFirst.mockResolvedValue({ id: "piece-A", nom: "piece.pdf" });
  mocks.db.dossier.findFirst.mockResolvedValue({ id: "dossier-A", cabinetId: "cabinet-A", client: { id: "client-A" }, sections: [], type: "autre" });
  mocks.db.document.updateMany.mockResolvedValue({ count: 1 });
  const response = await confirmUpload(req({ documentId: "piece-A", dossierId: "dossier-A", iaValidated: false }));
  expect(response.status).toBe(200);
  expect(mocks.db.$transaction).toHaveBeenCalled();
  expect(mocks.db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "document_classified" }) });
});
it("S2 : un classement concurrent ne réaffecte pas une pièce déjà prise", async () => {
  mocks.db.document.findFirst.mockResolvedValue({ id: "piece-A", nom: "piece.pdf" });
  mocks.db.dossier.findFirst.mockResolvedValue({ id: "dossier-A", client: { id: "client-A" }, sections: [], type: "autre" });
  mocks.db.document.updateMany.mockResolvedValue({ count: 0 });
  expect((await confirmUpload(req({ documentId: "piece-A", dossierId: "dossier-A" }))).status).toBe(409);
  expect(mocks.db.auditLog.create).not.toHaveBeenCalled();
});
it("S3 : aucune écriture avant validation du document dans le cabinet", async () => {
  mocks.db.richDocument.findFirst.mockResolvedValue(null);
  const response = await startSession(req({ richDocumentId: "doc-B", dossierId: "dossier-B", clientId: "client-B" }));
  expect(response.status).toBe(404);
  expect(mocks.db.richDocument.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "doc-B", ...richDocumentScope(actor), isArchived: false } }));
  expect(mocks.db.workSession.create).not.toHaveBeenCalled();
  expect(mocks.db.workSession.updateMany).not.toHaveBeenCalled();
});
it("S3 : refuse un mélange de références même avec un document autorisé", async () => {
  mocks.db.richDocument.findFirst.mockResolvedValue({ id: "doc-A", dossierId: "dossier-A", clientId: "client-A" });
  const response = await startSession(req({ richDocumentId: "doc-A", dossierId: "dossier-B", clientId: "client-A" }));
  expect(response.status).toBe(400);
  expect(mocks.db.workSession.create).not.toHaveBeenCalled();
});
it("un avocat peut démarrer une session sur son document", async () => {
  mocks.db.richDocument.findFirst.mockResolvedValue({ id: "doc-A", dossierId: "dossier-A", clientId: "client-A" });
  mocks.db.workSession.create.mockResolvedValue({ id: "session-A" });
  const response = await startSession(req({ richDocumentId: "doc-A", dossierId: "dossier-A", clientId: "client-A" }));
  expect(response.status).toBe(201);
  expect(mocks.db.workSession.create).toHaveBeenCalledWith({ data: expect.objectContaining({ cabinetId: "cabinet-A", userId: "avocat-A", dossierId: "dossier-A", clientId: "client-A" }) });
});
it("conserve l'ancien contenu avant un enregistrement autorisé", async () => {
  mocks.db.richDocument.findFirst.mockResolvedValue({ id: "doc-A", content: "original", updatedAt: new Date(0), statut: "brouillon" });
  mocks.db.richDocument.updateMany.mockResolvedValue({ count: 1 });
  mocks.db.richDocumentVersion.findFirst.mockResolvedValue({ versionNumber: 3 });
  const response = await PUT(req({ content: "nouveau" }, "PUT"), params);
  expect(response.status).toBe(200);
  expect(mocks.db.richDocumentVersion.create).toHaveBeenCalledWith({ data: expect.objectContaining({ content: "original", versionNumber: 4 }) });
});
it("un conflit d'enregistrement retourne 409 sans nouvelle version", async () => {
  mocks.db.richDocument.findFirst.mockResolvedValue({ id: "doc-A", content: "original", updatedAt: new Date(0) });
  mocks.db.richDocument.updateMany.mockResolvedValue({ count: 0 });
  const response = await PUT(req({ content: "nouveau" }, "PUT"), params);
  expect(response.status).toBe(409);
  expect(mocks.db.richDocumentVersion.create).not.toHaveBeenCalled();
});
it("une session déjà terminée ne crée aucune nouvelle fiche", async () => {
  mocks.db.richDocument.findFirst.mockResolvedValue({ id: "doc-A", dossierId: "dossier-A", clientId: "client-A" });
  mocks.db.workSession.findFirst.mockResolvedValue({ statut: "termine", timeEntryId: "temps-A" });
  const response = await terminer(req({ sessionId: "session-A", typeActivite: "redaction", dureeMinutes: 10 }), params);
  expect(response.status).toBe(409);
  expect(mocks.db.timeEntry.create).not.toHaveBeenCalled();
  expect(mocks.db.workSession.findFirst).toHaveBeenCalledWith({ where: expect.objectContaining({ richDocumentId: "doc-A", dossierId: "dossier-A", clientId: "client-A" }) });
});
it("une clôture concurrente perdante ne crée pas une deuxième fiche de temps", async () => {
  mocks.db.richDocument.findFirst.mockResolvedValue({ id: "doc-A", dossierId: "dossier-A", clientId: "client-A", dossier: { tauxHoraire: 200 } });
  mocks.db.workSession.findFirst.mockResolvedValue({ statut: "en_cours", timeEntryId: null });
  mocks.db.user.findUnique.mockResolvedValue(null);
  mocks.db.cabinet.findUnique.mockResolvedValue(null);
  mocks.db.workSession.updateMany.mockResolvedValue({ count: 0 });
  const response = await terminer(req({ sessionId: "session-A", typeActivite: "redaction", dureeMinutes: 10, tauxHoraire: 200 }), params);
  expect(response.status).toBe(409);
  expect(mocks.db.timeEntry.create).not.toHaveBeenCalled();
});
it("une clé Anthropic seule n'autorise aucune transmission", async () => {
  vi.stubEnv("SAFE_AI_DOCUMENT_CLASSIFICATION_CABINETS", "");
  vi.stubEnv("ANTHROPIC_API_KEY", "cle-fictive-ne-doit-pas-servir");
  expect(await classifyDocument({ cabinetId: "cabinet-A", filename: "confidentiel.txt", mimeType: "text/plain", textContent: "secret", dossiers: [] })).toBeNull();
  expect(documentClassificationEnabled("cabinet-A")).toBe(false);
});
it("activation IA exacte par cabinet, sans joker", () => {
  vi.stubEnv("SAFE_AI_DOCUMENT_CLASSIFICATION_CABINETS", "cabinet-A, cabinet-B");
  expect(documentClassificationEnabled("cabinet-A")).toBe(true);
  expect(documentClassificationEnabled("cabinet-C")).toBe(false);
});
it("les téléversements non classés restent réservés à leur auteur", () => {
  expect(uploadedDocumentScope(actor).OR).toContainEqual({ dossierId: null, clientId: null, uploadedById: "avocat-A" });
});
