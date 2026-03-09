import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { buildDossierListWhere } from "@/lib/dossiers/query";

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const STATUT_LABELS: Record<string, string> = {
  ouvert: "Ouvert",
  actif: "Actif",
  en_attente: "En attente",
  cloture: "Clôturé",
  archive: "Archivé",
};

const TYPE_LABELS: Record<string, string> = {
  droit_famille: "Droit de la famille",
  litige_civil: "Litige civil",
  criminel: "Criminel",
  immigration: "Immigration",
  corporate: "Corporate",
  autre: "Autre",
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) {
    return new NextResponse("Cabinet non trouvé", { status: 403 });
  }
  if (!canViewDossiers(role)) {
    return new NextResponse("Droits insuffisants", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const lawyer = searchParams.get("lawyer");

  const where = buildDossierListWhere(cabinetId, {
    q,
    clientId,
    status,
    type,
    lawyer,
  });

  const dossiers = await prisma.dossier.findMany({
    where,
    orderBy: { dateOuverture: "desc" },
    include: {
      client: true,
      avocatResponsable: { select: { nom: true } },
    },
  });

  const headers = [
    "N° dossier",
    "Intitulé",
    "Client",
    "Avocat responsable",
    "Type",
    "Statut",
    "Date ouverture",
  ];
  const rows = dossiers.map((d) => {
    const clientName =
      d.client.typeClient === "personne_physique" && (d.client.prenom || d.client.nom)
        ? [d.client.nom, d.client.prenom].filter(Boolean).join(", ")
        : d.client.raisonSociale;
    return [
      escapeCsvCell(d.numeroDossier ?? d.reference ?? ""),
      escapeCsvCell(d.intitule),
      escapeCsvCell(clientName),
      escapeCsvCell(d.avocatResponsable?.nom ?? ""),
      d.type ? (TYPE_LABELS[d.type] ?? d.type) : "",
      STATUT_LABELS[d.statut] ?? d.statut,
      d.dateOuverture ? new Date(d.dateOuverture).toISOString().slice(0, 10) : "",
    ];
  });

  const csv = headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dossiers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
