import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canCreateClients } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { extractPastInvoice } from "@/lib/ai/extract-past-invoice";
import { capaciteIAAutorisee } from "@/lib/ai/politique-donnees-client";
import { hashProofFile } from "@/lib/services/finance/proof-dedup";
import { matchFacturePassee } from "@/lib/services/reprise-historique/matcher";
import { cleCroisement } from "@/lib/clients/croisement-conflits";
import { loadClientsCandidatsReprise } from "@/lib/services/reprise-historique/candidats";
import type { UserRole } from "@prisma/client";

const MAX_BYTES = 15 * 1024 * 1024; // 15 Mo
const ACCEPTED = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"]);

/** Même documentType que le Document conservé à la confirmation : anti-doublon cohérent. */
export const FACTURE_PASSEE_DOCUMENT_TYPE = "facture_passee_source";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

/**
 * Les clients du cabinet, pour que l'écran puisse rattacher une facture à la
 * main quand la lecture n'a pas su nommer le client. Sans cette liste, l'écran
 * dirait « corrigez le nom » sans offrir le moyen de le faire.
 */
export async function GET() {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canCreateClients(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const clients = await loadClientsCandidatsReprise(data.cabinetId);
  return NextResponse.json({
    clients: clients
      .filter((c) => c.nom)
      .map((c) => ({ id: c.id, nom: c.nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
  });
}

/**
 * Analyse une facture passée (image/PDF) : hash anti-doublon → extraction vision →
 * rapprochement client/dossier. NE PERSISTE RIEN — c'est `verser/route.ts`, après
 * confirmation humaine du statut de paiement, qui écrit.
 *
 * Priorité 2 du chantier « un cabinet arrive avec sa clientèle ». Patron calqué sur
 * `app/api/facturation/paiements/import-preuve/route.ts`.
 */
export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canCreateClients(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }
  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non supporté (image ou PDF attendu)" },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 15 Mo)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = hashProofFile(buffer);

  // Anti-doublon AVANT l'appel IA (patron analyzeStatementPdf).
  const dejaImporte = await prisma.document.findFirst({
    where: { cabinetId: data.cabinetId, documentType: FACTURE_PASSEE_DOCUMENT_TYPE, hash },
    select: { createdAt: true, id: true },
  });
  if (dejaImporte) {
    return NextResponse.json(
      {
        alreadyImported: true,
        duplicate: { importeLe: dejaImporte.createdAt.toISOString().slice(0, 10) },
      },
      { status: 200 },
    );
  }

  // ── Quand la lecture ne donne rien ──────────────────────────────────────
  // La pièce RESTE dans le lot, avec son empreinte, et sa carte s'affiche vide
  // à remplir (décision CEO 2026-09-21). Avant, elle devenait un bandeau rouge
  // et sortait du dépôt : mur complet pour le cabinet, qui n'avait plus aucun
  // moyen de reprendre cette facture-là.
  const carteVide = (raison: string) =>
    NextResponse.json({
      fichierNom: file.name,
      hash,
      mimeType: file.type,
      lectureEchouee: true,
      raisonLecture: raison,
      extraction: null,
      match: null,
    });

  // Un cabinet peut refuser que ses pièces soient lues par un service externe.
  // Le dire franchement : ce n'est pas une pièce illisible, c'est un refus.
  if (!capaciteIAAutorisee("lecture_facture_reprise", data.cabinetId)) {
    return carteVide(
      "La lecture automatique est désactivée pour ce cabinet. Saisissez cette facture à la main.",
    );
  }

  const extraction = await extractPastInvoice({ buffer, mimeType: file.type });
  if (!extraction) {
    return carteVide(
      "SAFE n'a rien pu lire sur cette pièce. Saisissez-la à la main, ou redéposez-en un scan plus net.",
    );
  }

  // ── L'en-tête du cabinet lu à la place du client ─────────────────────────
  // C'est l'erreur classique sur une facture à papier à lettre : le nom le plus
  // gros de la page est celui du cabinet, pas celui du client. On refuse de le
  // prendre pour un client plutôt que d'ouvrir une fiche au nom du cabinet.
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: data.cabinetId },
    select: { nom: true },
  });
  const extractionRetenue =
    cabinet?.nom && cleCroisement(extraction.clientNom) === cleCroisement(cabinet.nom)
      ? {
          ...extraction,
          clientNom: null,
          champsIllisibles: [
            ...extraction.champsIllisibles,
            "le nom du client (c'est l'en-tête du cabinet qui a été lu)",
          ],
        }
      : extraction;

  const clients = await loadClientsCandidatsReprise(data.cabinetId);
  const match = matchFacturePassee(extractionRetenue, clients);

  return NextResponse.json({
    fichierNom: file.name,
    hash,
    mimeType: file.type,
    extraction: extractionRetenue,
    match,
  });
}
