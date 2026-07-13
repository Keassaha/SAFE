import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createDocketEntryForRichDocument } from "@/lib/dossiers/docket-service";

const CreateDocSchema = z.object({
  dossierId: z.string().min(1),
  clientId: z.string().min(1),
  titre: z.string().min(1).max(255),
  type: z.enum(["note", "lettre", "contrat", "procedure", "requete", "mandat", "autre"]).default("note"),
  content: z.string().default("{}"),
});

// GET /api/edition/documents?dossierId=xxx
export async function GET(req: NextRequest) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const dossierId = req.nextUrl.searchParams.get("dossierId");
  if (!dossierId) return NextResponse.json({ error: "dossierId requis" }, { status: 400 });

  const docs = await prisma.richDocument.findMany({
    where: { cabinetId: session.cabinetId, dossierId, isArchived: false },
    include: {
      createdBy: { select: { nom: true } },
      lastEditedBy: { select: { nom: true } },
      _count: { select: { versions: true, workSessions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(docs);
}

// POST /api/edition/documents
export async function POST(req: NextRequest) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dossierId, titre, type, content } = parsed.data;

  // Vérifier que le dossier appartient bien au cabinet
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId: session.cabinetId },
    include: { sections: { where: { archive: false }, select: { sectionKey: true } } },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const doc = await prisma.richDocument.create({
    data: {
      cabinetId: session.cabinetId,
      dossierId,
      clientId: dossier.clientId,
      createdById: session.userId,
      lastEditedById: session.userId,
      lastEditedAt: new Date(),
      titre,
      type,
      content,
    },
  });

  // Créer la version initiale
  await prisma.richDocumentVersion.create({
    data: {
      richDocumentId: doc.id,
      cabinetId: session.cabinetId,
      createdById: session.userId,
      content,
      versionNumber: 1,
      label: "Version initiale",
    },
  });

  await createDocketEntryForRichDocument({
    dossier,
    richDocument: doc,
    availableSectionKeys: dossier.sections.map((section) => section.sectionKey),
    createdById: session.userId,
  });

  return NextResponse.json(doc, { status: 201 });
}
