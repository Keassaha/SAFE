import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import { tiptapToPdfElements } from "@/lib/atelier/tiptap-to-pdf";

// Enregistrer les polices standard (pas besoin de fichier externe)
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 56,
    fontSize: 10,
    color: "#1F2937",
  },
  // En-tête cabinet
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#1E3A5F",
    paddingHorizontal: 56,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerCabinetNom: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 8,
    color: "#93C5FD",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerDate: {
    fontSize: 8,
    color: "#CBD5E1",
  },
  headerBarreau: {
    fontSize: 7.5,
    color: "#93C5FD",
    marginTop: 1,
  },
  // Titre du document
  docTitleBlock: {
    borderBottom: "1.5pt solid #2563EB",
    paddingBottom: 10,
    marginBottom: 16,
  },
  docTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: "#1E3A5F",
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 8,
    color: "#6B7280",
    flexDirection: "row",
    gap: 16,
  },
  docMetaItem: {
    fontSize: 8,
    color: "#6B7280",
    marginRight: 12,
  },
  // Contenu
  content: {
    flex: 1,
  },
  // Pied de page
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    borderTop: "0.5pt solid #E5E7EB",
    paddingHorizontal: 56,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#9CA3AF",
  },
  footerPage: {
    fontSize: 7.5,
    color: "#9CA3AF",
  },
  // Mention confidentialité
  confidentialBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  confidentialText: {
    fontSize: 7.5,
    color: "#92400E",
    fontFamily: "Helvetica-Bold",
  },
});

interface CabinetInfo {
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  barreauNumero?: string | null;
}

export function buildPdfDocument(
  titre: string,
  content: string,
  type: string,
  cabinet: CabinetInfo,
  clientNom: string,
  dossierIntitule: string,
  createdAt: Date
) {
  const contentElements = tiptapToPdfElements(content);
  const dateStr = new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(createdAt);

  const typeLabels: Record<string, string> = {
    note: "Note interne",
    lettre: "Lettre",
    contrat: "Contrat",
    procedure: "Procédure",
    requete: "Requête",
    autre: "Document",
  };

  return React.createElement(
    Document,
    {
      title: titre,
      author: cabinet.nom,
      subject: `${typeLabels[type] ?? "Document"} — ${dossierIntitule}`,
      creator: "SAFE Cabinet",
      keywords: `${clientNom}, ${dossierIntitule}`,
    },
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },

      // ── En-tête cabinet
      React.createElement(
        View,
        { style: styles.header, fixed: true },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.headerCabinetNom }, cabinet.nom),
          cabinet.adresse
            ? React.createElement(Text, { style: styles.headerSub }, cabinet.adresse)
            : null
        ),
        React.createElement(
          View,
          { style: styles.headerRight },
          React.createElement(Text, { style: styles.headerDate }, dateStr),
          cabinet.barreauNumero
            ? React.createElement(Text, { style: styles.headerBarreau }, `Barreau : ${cabinet.barreauNumero}`)
            : null,
          cabinet.telephone
            ? React.createElement(Text, { style: styles.headerBarreau }, cabinet.telephone)
            : null
        )
      ),

      // ── Corps
      React.createElement(
        View,
        { style: styles.content },

        // Mention confidentialité
        React.createElement(
          View,
          { style: styles.confidentialBadge },
          React.createElement(Text, { style: styles.confidentialText }, "DOCUMENT CONFIDENTIEL — SECRET PROFESSIONNEL")
        ),

        // Titre + méta
        React.createElement(
          View,
          { style: styles.docTitleBlock },
          React.createElement(Text, { style: styles.docTitle }, titre),
          React.createElement(
            View,
            { style: styles.docMeta },
            React.createElement(Text, { style: styles.docMetaItem }, `Client : ${clientNom}`),
            React.createElement(Text, { style: styles.docMetaItem }, `Dossier : ${dossierIntitule}`),
            React.createElement(Text, { style: styles.docMetaItem }, `Type : ${typeLabels[type] ?? "Document"}`)
          )
        ),

        // Contenu Tiptap converti
        ...contentElements
      ),

      // ── Pied de page
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerText }, cabinet.nom),
        React.createElement(
          Text,
          {
            style: styles.footerPage,
            render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Page ${pageNumber} / ${totalPages}`,
          }
        )
      )
    )
  );
}

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
