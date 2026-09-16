import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { dossierDocumentScope, richDocumentScope } from "@/lib/edition/access";

const url = process.env.SAFE_SECURITY_TEST_DATABASE_URL;
// Jamais de repli sur DATABASE_URL : ces fixtures ne doivent pas atteindre un client.
if (url) {
  const parsed = new URL(url);
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55439" || parsed.pathname !== "/safe_security_test") {
    throw new Error("Seule la base locale safe_security_test:55439 est autorisée");
  }
}
describe.skipIf(!url)("PostgreSQL réel : cloisonnement et conservation", () => {
  const db = new PrismaClient({ datasourceUrl: url ?? "postgresql://localhost/unused" });
  const prefix = randomUUID();
  const id = (name: string) => `${prefix}-${name}`;
  const actor = { cabinetId: id("cab-A"), userId: id("user-A"), role: "avocat" };
  beforeAll(async () => {
    for (const suffix of ["A", "B"]) {
      await db.cabinet.create({ data: { id: id(`cab-${suffix}`), nom: `TEST FICTIF ${suffix}` } });
      await db.user.create({ data: { id: id(`user-${suffix}`), cabinetId: id(`cab-${suffix}`), nom: "Fictif", email: `${id(suffix)}@example.invalid`, passwordHash: "fictif", role: "avocat" } });
      await db.client.create({ data: { id: id(`client-${suffix}`), cabinetId: id(`cab-${suffix}`), raisonSociale: "Client fictif" } });
      await db.dossier.create({ data: { id: id(`dossier-${suffix}`), cabinetId: id(`cab-${suffix}`), clientId: id(`client-${suffix}`), avocatResponsableId: id(`user-${suffix}`), intitule: "Dossier fictif" } });
      await db.richDocument.create({ data: { id: id(`doc-${suffix}`), cabinetId: id(`cab-${suffix}`), clientId: id(`client-${suffix}`), dossierId: id(`dossier-${suffix}`), createdById: id(`user-${suffix}`), titre: "Pièce fictive", content: "ORIGINAL A CONSERVER" } });
    }
    await db.dossier.create({ data: { id: id("collegue"), cabinetId: actor.cabinetId, clientId: id("client-A"), intitule: "Non attribué" } });
    await db.richDocument.create({ data: { id: id("doc-collegue"), cabinetId: actor.cabinetId, clientId: id("client-A"), dossierId: id("collegue"), createdById: actor.userId, titre: "Autre dossier" } });
    await db.richDocumentVersion.create({ data: { cabinetId: actor.cabinetId, richDocumentId: id("doc-A"), createdById: actor.userId, content: "HISTORIQUE A CONSERVER", versionNumber: 1 } });
  });
  afterAll(async () => { await db.$disconnect(); });
  it("la requête réelle ne retourne que le document de l'avocat", async () => {
    const rows = await db.richDocument.findMany({ where: richDocumentScope(actor) });
    expect(rows.map((r) => r.id)).toEqual([id("doc-A")]);
  });
  it("un administrateur voit ses dossiers, jamais ceux du cabinet B", async () => {
    const rows = await db.dossier.findMany({ where: dossierDocumentScope({ ...actor, role: "admin_cabinet" }) });
    expect(rows.map((r) => r.id).sort()).toEqual([id("dossier-A"), id("collegue")].sort());
  });
  it("un rôle non autorisé n'obtient aucun contenu", async () => {
    expect(await db.richDocument.count({ where: richDocumentScope({ ...actor, role: "comptabilite" }) })).toBe(0);
  });
  it.each(["dossier", "cabinet", "auteur", "document"])("la suppression physique de %s échoue et préserve les données", async (parent) => {
    const operation = parent === "dossier" ? db.dossier.delete({ where: { id: id("dossier-A") } })
      : parent === "cabinet" ? db.cabinet.delete({ where: { id: actor.cabinetId } })
      : parent === "auteur" ? db.user.delete({ where: { id: actor.userId } })
      : db.richDocument.delete({ where: { id: id("doc-A") } });
    await expect(operation).rejects.toMatchObject({ code: "P2003" });
    expect((await db.richDocument.findUniqueOrThrow({ where: { id: id("doc-A") } })).content).toBe("ORIGINAL A CONSERVER");
    expect(await db.richDocumentVersion.count({ where: { richDocumentId: id("doc-A") } })).toBe(1);
  });
  it("une transaction échouée ne perd pas le contenu original", async () => {
    await expect(db.$transaction(async (tx) => {
      await tx.richDocument.update({ where: { id: id("doc-A") }, data: { content: "nouveau" } });
      await tx.richDocumentVersion.create({ data: { richDocumentId: id("doc-A"), cabinetId: actor.cabinetId, createdById: "absent", content: "original", versionNumber: 2 } });
    })).rejects.toMatchObject({ code: "P2003" });
    expect((await db.richDocument.findUniqueOrThrow({ where: { id: id("doc-A") } })).content).toBe("ORIGINAL A CONSERVER");
  });
});
