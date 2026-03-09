import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canEditTimeEntry,
  canDeleteTimeEntry,
} from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/services/audit";
import { timeEntryUpdateSchema } from "@/lib/validations/time-entry";
import { computeMontant } from "@/lib/temps/utils";
import type { UserRole } from "@prisma/client";

async function getSessionData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId || !userId) return null;
  return { cabinetId, userId, role };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId, role } = data;

  const existing = await prisma.timeEntry.findFirst({
    where: { id, cabinetId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Entrée non trouvée" }, { status: 404 });
  }
  if (!canEditTimeEntry(role, existing.userId, userId)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  const parsed = timeEntryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const dureeMinutes = input.dureeMinutes ?? existing.dureeMinutes;
  const tauxHoraire = input.tauxHoraire ?? existing.tauxHoraire;
  const montant = computeMontant(dureeMinutes, tauxHoraire);

  // Synchroniser clientId avec le dossier : si le dossier change, dériver le client du dossier
  let clientIdUpdate: string | null | undefined = input.clientId;
  if (input.dossierId !== undefined) {
    const newDossierId = input.dossierId || null;
    if (newDossierId) {
      const dossier = await prisma.dossier.findUnique({
        where: { id: newDossierId, cabinetId },
        select: { clientId: true },
      });
      if (dossier) clientIdUpdate = input.clientId ?? dossier.clientId;
    } else {
      clientIdUpdate = input.clientId ?? null;
    }
  }

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: {
      ...(input.dossierId !== undefined && { dossierId: input.dossierId || null }),
      ...(clientIdUpdate !== undefined && { clientId: clientIdUpdate ?? null }),
      ...(input.userId != null && { userId: input.userId }),
      ...(input.date != null && { date: input.date }),
      ...(input.dureeMinutes != null && { dureeMinutes: input.dureeMinutes }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.typeActivite !== undefined && { typeActivite: input.typeActivite ?? null }),
      ...(input.facturable !== undefined && { facturable: input.facturable }),
      ...(input.statut != null && { statut: input.statut as "brouillon" | "valide" | "facture" }),
      ...(input.tauxHoraire != null && { tauxHoraire: input.tauxHoraire }),
      montant,
    },
    include: {
      dossier: {
        select: {
          id: true,
          intitule: true,
          numeroDossier: true,
          reference: true,
          client: { select: { raisonSociale: true } },
        },
      },
      client: {
        select: { id: true, raisonSociale: true },
      },
      user: { select: { id: true, nom: true } },
      invoiceLines: { select: { id: true } },
    },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "TimeEntry",
    entityId: entry.id,
    action: "update",
    metadata: {
      dossierId: entry.dossierId,
      dureeMinutes: entry.dureeMinutes,
      statut: entry.statut,
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId, role } = data;

  const existing = await prisma.timeEntry.findFirst({
    where: { id, cabinetId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Entrée non trouvée" }, { status: 404 });
  }
  if (!canDeleteTimeEntry(role, existing.userId, userId)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  await prisma.timeEntry.deleteMany({ where: { id, cabinetId } });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "TimeEntry",
    entityId: id,
    action: "delete",
    metadata: {
      dossierId: existing.dossierId,
      date: existing.date.toISOString(),
      dureeMinutes: existing.dureeMinutes,
    },
  });

  return NextResponse.json({ success: true });
}
