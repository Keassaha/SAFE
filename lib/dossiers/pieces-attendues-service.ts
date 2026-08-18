/**
 * SAFE — Les pièces attendues d'un dossier.
 *
 * Spec      : docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
 * Recherche : docs/research/RECHERCHE_divulgation_famille_QC_2026-08-18.md
 *
 * DEUX NATURES DE PIÈCES, JAMAIS CONFONDUES
 *
 * Les documents NOMMÉS par le règlement portent un délai légal, et leur absence a une
 * conséquence procédurale. Les pièces d'APPUI ne figurent dans aucun règlement : elles
 * servent à remplir les premiers, et leur liste relève de la pratique du cabinet.
 *
 * Afficher un délai légal sur une pièce d'appui donnerait une fausse assurance à
 * l'avocat. C'est pourquoi `referenceLegale` est nul sur les secondes.
 */

import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";
import { calculerDelaisFamille, type DatesDossierFamille } from "./delais-famille";

/* ── Le modèle de liste, dérivé du droit ──────────────────────────────────── */

export interface ModelePieceAttendue {
  libelle: string;
  raison: string;
  fournisseur: "CLIENT" | "PARTIE_ADVERSE";
  obligation: "OBLIGATOIRE" | "CONDITIONNELLE";
  /** Nul pour une pièce d'appui : elle ne figure dans aucun règlement. */
  referenceLegale: string | null;
  /** Sur quelle date du dossier son échéance se calcule. */
  echeanceDepuis?: keyof DatesDossierFamille;
  /** Décalage en jours. Négatif = avant la date source. */
  decalageJours?: number;
}

/**
 * Divorce et séparation, Québec.
 *
 * Les cinq premières sont nommées par le Code ou le règlement, avec leur article. Les
 * suivantes sont des pièces d'appui : elles servent à remplir les premières, et
 * `A_CONFIRMER` leur liste relève de la pratique, aucune recherche ne peut la trancher.
 */
export const MODELE_DIVORCE_QC: readonly ModelePieceAttendue[] = [
  {
    libelle: "État des revenus et dépenses et bilan (formulaire III), assermenté",
    raison:
      "Sans ce dépôt au greffe, une demande de pension alimentaire pour vous-même ne peut pas être décidée.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: "C.p.c. art. 413 al. 2",
    echeanceDepuis: "presentation",
    decalageJours: -10,
  },
  {
    libelle: "État de vos biens, pour le protocole de l'instance",
    raison:
      "À joindre au protocole, en indiquant les biens inclus ou non dans le patrimoine.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: "C.p.c. art. 413 al. 1",
    echeanceDepuis: "protocole",
    decalageJours: 0,
  },
  {
    libelle: "Formulaire de fixation des pensions alimentaires pour enfants",
    raison: "Requis dès qu'il y a des enfants à charge.",
    fournisseur: "CLIENT",
    obligation: "CONDITIONNELLE",
    referenceLegale: "Règl. Cour sup. fam. art. 26",
    echeanceDepuis: "instruction",
    decalageJours: -10,
  },
  {
    libelle: "Relevé des calculs fiscaux liés aux revenus ou aux frais des enfants",
    raison: "S'ajoute au formulaire de fixation, dès qu'il y a des enfants.",
    fournisseur: "CLIENT",
    obligation: "CONDITIONNELLE",
    referenceLegale: "Règl. Cour sup. fam. art. 26.1",
    echeanceDepuis: "instruction",
    decalageJours: -10,
  },
  {
    libelle:
      "Formulaire de calcul de l'état du patrimoine familial, assermenté, ou déclaration équivalente",
    raison:
      "Peut être remplacé par une déclaration de non-assujettissement, une renonciation, ou une déclaration que le partage n'est pas contesté.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: "Règl. Cour sup. fam. art. 27",
    echeanceDepuis: "signification",
    decalageJours: 180,
  },
  {
    libelle: "État de situation financière de la partie adverse (formulaire III)",
    raison: "Chaque partie doit notifier le sien à l'autre.",
    fournisseur: "PARTIE_ADVERSE",
    obligation: "OBLIGATOIRE",
    referenceLegale: "Règl. Cour sup. fam. art. 26",
    echeanceDepuis: "instruction",
    decalageJours: -10,
  },

  // ── Pièces d'appui : aucun délai légal, liste configurable ────────────────
  {
    libelle: "Avis de cotisation des trois dernières années",
    raison: "Sert à remplir votre état des revenus et dépenses.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: null,
  },
  {
    libelle: "Talons de paie récents",
    raison: "Sert à établir vos revenus courants.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: null,
  },
  {
    libelle: "Relevés bancaires de tous vos comptes",
    raison: "Sert à établir l'état du patrimoine.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: null,
  },
  {
    libelle: "Relevés de REER et de régime de retraite, avec la valeur à la date du mariage",
    raison:
      "La valeur à la date du mariage commande le partage. Sans elle, le calcul ne peut pas être fait.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: null,
  },
  {
    libelle: "Actes de propriété et évaluation municipale",
    raison: "Sert à établir l'état du patrimoine, s'il y a un immeuble.",
    fournisseur: "CLIENT",
    obligation: "CONDITIONNELLE",
    referenceLegale: null,
  },
  {
    libelle: "Relevés de dettes, marges et cartes de crédit",
    raison: "Sert à établir l'état du patrimoine.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: null,
  },
  {
    libelle: "Certificat de mariage",
    raison: "Établit la date du mariage, qui commande le partage.",
    fournisseur: "CLIENT",
    obligation: "OBLIGATOIRE",
    referenceLegale: null,
  },
] as const;

const JOUR_MS = 86_400_000;

/* ── Lecture ──────────────────────────────────────────────────────────────── */

export async function chargerPiecesAttendues(params: {
  cabinetId: string;
  dossierId: string;
  aujourdhui: Date;
  client?: PrismaClient;
}) {
  const prisma = params.client ?? defaultPrisma;

  const [dossier, pieces] = await Promise.all([
    prisma.dossier.findFirst({
      where: { id: params.dossierId, cabinetId: params.cabinetId },
      select: {
        dateSignification: true,
        datePresentation: true,
        dateInstruction: true,
        dateProtocole: true,
        dateCommunicationPatrimoine: true,
      },
    }),
    prisma.expectedDocument.findMany({
      where: { dossierId: params.dossierId, cabinetId: params.cabinetId },
      orderBy: [{ echeance: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        libelle: true,
        raison: true,
        fournisseur: true,
        obligation: true,
        etat: true,
        referenceLegale: true,
        echeance: true,
        motifRemplacement: true,
      },
    }),
  ]);
  if (!dossier) return null;

  const dates: DatesDossierFamille = {
    signification: dossier.dateSignification,
    presentation: dossier.datePresentation,
    instruction: dossier.dateInstruction,
    protocole: dossier.dateProtocole,
    communicationPatrimoine: dossier.dateCommunicationPatrimoine,
  };

  return { dates, delais: calculerDelaisFamille(dates, params.aujourdhui), pieces };
}

/* ── Écriture ─────────────────────────────────────────────────────────────── */

/**
 * Crée la liste de pièces d'un dossier depuis le modèle, sans saisie manuelle.
 *
 * IDEMPOTENTE : elle n'ajoute que ce qui manque, en comparant les libellés. Relancer
 * ne duplique donc jamais, et ne retouche jamais une pièce déjà reçue ou refusée.
 */
export async function creerListeDepuisModele(params: {
  cabinetId: string;
  dossierId: string;
  modele: readonly ModelePieceAttendue[];
  client?: PrismaClient;
}): Promise<{ creees: number; deja: number }> {
  const prisma = params.client ?? defaultPrisma;

  const dossier = await prisma.dossier.findFirst({
    where: { id: params.dossierId, cabinetId: params.cabinetId },
    select: {
      id: true,
      dateSignification: true,
      datePresentation: true,
      dateInstruction: true,
      dateProtocole: true,
      dateCommunicationPatrimoine: true,
    },
  });
  if (!dossier) throw new Error("Dossier introuvable");

  const existantes = new Set(
    (
      await prisma.expectedDocument.findMany({
        where: { dossierId: params.dossierId },
        select: { libelle: true },
      })
    ).map((p) => p.libelle),
  );

  const dates: Record<string, Date | null> = {
    signification: dossier.dateSignification,
    presentation: dossier.datePresentation,
    instruction: dossier.dateInstruction,
    protocole: dossier.dateProtocole,
    communicationPatrimoine: dossier.dateCommunicationPatrimoine,
  };

  const aCreer = params.modele.filter((m) => !existantes.has(m.libelle));

  for (const m of aCreer) {
    // L'échéance ne se calcule que si la date source est saisie. Sinon elle reste
    // nulle : une échéance inventée sur une pièce à délai légal serait pire que pas
    // d'échéance du tout.
    const source = m.echeanceDepuis ? dates[m.echeanceDepuis] : null;
    const echeance =
      source && m.decalageJours != null
        ? new Date(source.getTime() + m.decalageJours * JOUR_MS)
        : null;

    await prisma.expectedDocument.create({
      data: {
        cabinetId: params.cabinetId,
        dossierId: params.dossierId,
        libelle: m.libelle,
        raison: m.raison,
        fournisseur: m.fournisseur,
        obligation: m.obligation,
        referenceLegale: m.referenceLegale,
        echeance,
      },
    });
  }

  return { creees: aCreer.length, deja: existantes.size };
}
