import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { refusSiRoleInsuffisant } from "@/lib/auth/api-guard";
import { canViewDossiers, canManageDossiers, canManageInvoices } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { filtrerEnvoyables } from "@/lib/services/correspondance/envoyables";
import type { UserRole } from "@prisma/client";

/** Un dossier ancien peut porter des dizaines de pièces. On coupe haut. */
const PLAFOND = 50;

/**
 * Ce que ce dossier peut transmettre, pour cet utilisateur (lot 0.5).
 *
 * Lecture seule. Aucun envoi ne part d'ici : la route dit seulement ce qu'on
 * peut proposer, les deux envois existants restent sur leurs propres routes
 * (`/api/edition/documents/[id]/send` et
 * `/api/facturation/factures/[id]/envoyer-email`).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCabinetAndUser();
  const refus = refusSiRoleInsuffisant(session.role, canViewDossiers);
  if (refus) return refus;

  const { id } = await params;
  const dossier = await prisma.dossier.findFirst({
    where: { id, cabinetId: session.cabinetId },
    select: { id: true, statut: true, client: { select: { email: true } } },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const role = session.role as UserRole;
  const droits = {
    peutEnvoyerDocuments: canManageDossiers(role),
    peutEnvoyerFactures: canManageInvoices(role),
  };

  const [documents, factures] = await Promise.all([
    droits.peutEnvoyerDocuments
      ? prisma.richDocument.findMany({
          where: { cabinetId: session.cabinetId, dossierId: id, isArchived: false },
          orderBy: { updatedAt: "desc" },
          take: PLAFOND,
          select: { id: true, titre: true, type: true, statut: true },
        })
      : Promise.resolve([]),
    droits.peutEnvoyerFactures
      ? prisma.invoice.findMany({
          where: { cabinetId: session.cabinetId, dossierId: id },
          orderBy: { dateEmission: "desc" },
          take: PLAFOND,
          select: { id: true, numero: true, invoiceStatus: true, montantTotal: true },
        })
      : Promise.resolve([]),
  ]);

  const retenues = filtrerEnvoyables({ documents, factures }, droits);

  return NextResponse.json({
    ...retenues,
    // L'écran a besoin de ces deux-là pour avertir AVANT d'ouvrir une fenêtre
    // d'envoi qui échouerait ensuite faute de destinataire.
    clientAUnCourriel: Boolean(dossier.client?.email?.trim()),
    dossierFerme: dossier.statut === "cloture" || dossier.statut === "archive",
  });
}
