import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildPdfDocument } from "@/lib/edition/pdf-builder";

// GET /api/edition/documents/[id]/pdf
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const doc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId, isArchived: false },
    include: {
      dossier: { select: { intitule: true } },
      client: { select: { raisonSociale: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: session.cabinetId },
    select: { nom: true, adresse: true, telephone: true, email: true, barreauNumero: true },
  });
  if (!cabinet) return NextResponse.json({ error: "Cabinet introuvable" }, { status: 404 });

  const pdfDoc = buildPdfDocument(
    doc.titre,
    doc.content,
    doc.type,
    cabinet,
    doc.client.raisonSociale ?? "Client",
    doc.dossier.intitule,
    doc.createdAt
  );

  const buffer = await renderToBuffer(pdfDoc);
  const uint8 = new Uint8Array(buffer);

  const filename = `${doc.titre.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": uint8.byteLength.toString(),
    },
  });
}
