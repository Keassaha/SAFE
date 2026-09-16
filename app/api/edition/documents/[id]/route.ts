import { richDocumentScope } from "@/lib/edition/access";
import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createNavetteMessage } from "@/lib/navette/navette-service";
import { z } from "zod";

const UpdateDocSchema = z.object({
  titre: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  statut: z.enum(["brouillon", "final", "archive"]).optional(),
});

// GET /api/edition/documents/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!canViewDocuments(session.role as UserRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const doc = await prisma.richDocument.findFirst({
    where: { id, ...richDocumentScope(session), isArchived: false },
    include: {
      createdBy: { select: { nom: true } },
      lastEditedBy: { select: { nom: true } },
      dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      client: { select: { id: true, raisonSociale: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 10,
        include: { createdBy: { select: { nom: true } } },
      },
      workSessions: {
        where: { statut: "termine" },
        orderBy: { endedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  return NextResponse.json(doc);
}

// PUT /api/edition/documents/[id]  (auto-save)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!canViewDocuments(session.role as UserRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const doc = await prisma.richDocument.findFirst({
    where: { id, ...richDocumentScope(session), isArchived: false },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Sauvegarder l'état précédent dans la même transaction que l'écriture.
  // Le verrou optimiste empêche deux requêtes concurrentes d'écraser un état
  // qui n'était pas celui lu par la requête.
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.richDocument.updateMany({
      where: { id, ...richDocumentScope(session), updatedAt: doc.updatedAt, isArchived: false },
      data: {
        ...parsed.data, lastEditedById: session.userId, lastEditedAt: new Date(),
        updatedAt: new Date(Math.max(Date.now(), doc.updatedAt.getTime() + 1)),
      },
    });
    if (changed.count !== 1) return null;
    if (parsed.data.content !== undefined && parsed.data.content !== doc.content) {
      const last = await tx.richDocumentVersion.findFirst({
        where: { richDocumentId: id, cabinetId: session.cabinetId },
        orderBy: { versionNumber: "desc" },
      });
      await tx.richDocumentVersion.create({ data: {
        richDocumentId: id, cabinetId: session.cabinetId, createdById: session.userId,
        content: doc.content, versionNumber: (last?.versionNumber ?? 0) + 1,
        label: "Avant enregistrement",
      } });
    }
    return tx.richDocument.findFirst({ where: { id, ...richDocumentScope(session) } });
  });
  if (!updated) return NextResponse.json({ error: "Le document a changé. Rechargez-le avant de réessayer." }, { status: 409 });

  // P5 — signal navette « document prêt » à la transition brouillon → final.
  // Destinataire auto : l'assistante prévient l'avocate (ou inversement, courtoisie).
  // Best-effort : un échec de signal ne bloque pas l'enregistrement.
  if (doc.statut === "brouillon" && parsed.data.statut === "final") {
    try {
      await createNavetteMessage({
        cabinetId: session.cabinetId,
        dossierId: doc.dossierId,
        authorId: session.userId,
        authorRole: session.role,
        type: "document_ready",
        body: updated.titre,
        sourceRef: `document:${id}`,
      });
    } catch (err) {
      // signal best-effort : un échec n'empêche pas l'enregistrement du document
      console.error("[navette] document_ready: erreur best-effort", { id, err });
    }
  }

  return NextResponse.json(updated);
}

// DELETE /api/edition/documents/[id]  — soft delete uniquement (conformité Barreau)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!canViewDocuments(session.role as UserRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const doc = await prisma.richDocument.findFirst({
    where: { id, ...richDocumentScope(session), isArchived: false },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // JAMAIS de suppression réelle — Barreau du Québec
  await prisma.richDocument.update({
    where: { ...richDocumentScope(session), id, isArchived: false },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archivedById: session.userId,
      statut: "archive",
    },
  });

  return NextResponse.json({ success: true, message: "Document archivé" });
}
