import { NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseCabinetConfig } from "@/lib/cabinet-config";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { createMandatRichDocument } from "@/lib/edition/create-mandat";
import {
  buildMandatContent,
  mandatTitreParDefaut,
  type MandatTemplateInput,
} from "@/lib/edition/mandat-template";

/**
 * GET  /api/dossiers/[id]/mandat  → liste les mandats (RichDocument type="mandat") du dossier.
 * POST /api/dossiers/[id]/mandat  → crée un mandat pré-rempli et retourne son id
 *                                   (l'éditeur s'ouvre ensuite dessus).
 */

async function loadDossier(dossierId: string, cabinetId: string) {
  return prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: { select: { id: true, raisonSociale: true, prenom: true, nom: true, email: true } },
      avocatResponsable: { select: { nom: true } },
      cabinet: { select: { nom: true, adresse: true, telephone: true, email: true, config: true } },
      mandate: { select: { provisionInitiale: true } },
      sections: { where: { archive: false }, select: { sectionKey: true } },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const mandats = await prisma.richDocument.findMany({
    where: { cabinetId: session.cabinetId, dossierId: id, type: "mandat", isArchived: false },
    select: {
      id: true,
      titre: true,
      statut: true,
      updatedAt: true,
      lastEditedBy: { select: { nom: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(mandats);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const dossier = await loadDossier(id, session.cabinetId);
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const clientNom = clientDisplayName(dossier.client);
  const devise = parseCabinetConfig(dossier.cabinet.config ?? null).devise ?? "CAD";
  const dateFormatee = new Date().toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const templateInput: MandatTemplateInput = {
    cabinetNom: dossier.cabinet.nom,
    cabinetAdresse: dossier.cabinet.adresse ?? null,
    cabinetTelephone: dossier.cabinet.telephone ?? null,
    cabinetEmail: dossier.cabinet.email ?? null,
    avocatNom: dossier.avocatResponsable?.nom ?? null,
    clientNom,
    clientEmail: dossier.client.email ?? null,
    dossierIntitule: dossier.intitule,
    dossierNumero: dossier.numeroDossier ?? null,
    modeFacturation: dossier.modeFacturation ?? null,
    tauxHoraire: dossier.tauxHoraire != null ? Number(dossier.tauxHoraire) : null,
    provisionInitiale: dossier.mandate?.provisionInitiale
      ? Number(dossier.mandate.provisionInitiale)
      : null,
    dateFormatee,
    devise,
  };

  const content = buildMandatContent(templateInput);
  const titre = mandatTitreParDefaut({ dossierNumero: dossier.numeroDossier ?? null, clientNom });

  const created = await createMandatRichDocument({
    cabinetId: session.cabinetId,
    userId: session.userId,
    dossier,
    titre,
    content,
    versionLabel: "Version initiale (gabarit mandat)",
  });

  return NextResponse.json(created, { status: 201 });
}
