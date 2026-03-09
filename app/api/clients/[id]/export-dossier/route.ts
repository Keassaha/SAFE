import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewClients } from "@/lib/auth/permissions";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { ClientDossierPDF } from "@/components/clients/ClientDossierPDF";
import type { UserRole } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) {
    return new NextResponse("Cabinet non trouvé", { status: 403 });
  }
  if (!canViewClients(role)) {
    return new NextResponse("Droits insuffisants", { status: 403 });
  }

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, cabinetId },
  });
  if (!client) {
    return new NextResponse("Client introuvable", { status: 404 });
  }

  const dossiers = await prisma.dossier.findMany({
    where: { clientId: id, cabinetId },
    orderBy: { dateOuverture: "desc" },
  });

  const doc = React.createElement(ClientDossierPDF, {
    client: {
      raisonSociale: client.raisonSociale,
      prenom: client.prenom,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      typeClient: client.typeClient,
      createdAt: client.createdAt,
    },
    dossiers: dossiers.map((d) => ({
      reference: d.reference,
      numeroDossier: d.numeroDossier,
      intitule: d.intitule,
      statut: d.statut,
      dateOuverture: d.dateOuverture,
    })),
    labels: {
      dossierClient: "Dossier client",
      nameLabel: "Nom",
      emailLabel: "Courriel",
      phoneLabel: "Téléphone",
      clientSince: "Client depuis",
      mattersLabel: "Dossiers",
      matterNumber: "N° dossier",
      matterTitle: "Intitulé",
      tableStatus: "Statut",
      exportedOn: "Exporté le",
    },
  });

  const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);
  const name = [client.nom, client.prenom].filter(Boolean).join("-") || client.raisonSociale.replace(/\s+/g, "-");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dossier-client-${name}.pdf"`,
    },
  });
}
