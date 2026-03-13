import { NextResponse } from "next/server";
import { getSessionOrRespond } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canViewClients } from "@/lib/auth/permissions";
import { buildClientListWhere } from "@/lib/clients/query";
import type { UserRole } from "@prisma/client";

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const auth = await getSessionOrRespond();
  if (auth instanceof NextResponse) return auth;
  const { session, cabinetId } = auth;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!canViewClients(role)) {
    return new NextResponse("Droits insuffisants", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const where = buildClientListWhere(cabinetId, { q, status, type });

  const clients = await prisma.client.findMany({
    where,
    orderBy: { raisonSociale: "asc" },
    include: {
      assignedLawyer: { select: { nom: true } },
      _count: { select: { dossiers: true } },
    },
  });

  const headers = [
    "Nom / Raison sociale",
    "Type",
    "Email",
    "Téléphone",
    "Avocat assigné",
    "Statut",
    "Dossiers",
    "Non facturé (solde fiducie)",
    "Dernière mise à jour",
  ];
  const rows = clients.map((c) => {
    const name =
      c.typeClient === "personne_physique" && (c.prenom || c.nom)
        ? [c.nom, c.prenom].filter(Boolean).join(", ")
        : c.raisonSociale;
    return [
      escapeCsvCell(name),
      c.typeClient === "personne_physique" ? "Particulier" : "Entreprise",
      escapeCsvCell(c.email ?? ""),
      escapeCsvCell(c.telephone ?? ""),
      escapeCsvCell(c.assignedLawyer?.nom ?? ""),
      c.status,
      String(c._count.dossiers),
      String(c.trustAccountBalance),
      c.updatedAt ? new Date(c.updatedAt).toISOString().slice(0, 10) : "",
    ];
  });

  const csv =
    headers.join(",") +
    "\n" +
    rows.map((r) => r.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
