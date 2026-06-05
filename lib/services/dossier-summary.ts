import { prisma } from "@/lib/db";
import { readDocumentObject } from "@/lib/services/document";
import { extractTextFromPDF } from "@/lib/ai/classify-document";
import { summarizeDossier, type DossierSummary, type DossierSummaryInput } from "@/lib/ai/summarize-dossier";

const MAX_DOCS_TO_READ = 6;

function isoDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function clientNom(client: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
  typeClient: string;
}): string {
  if (client.typeClient === "personne_physique" && (client.prenom || client.nom)) {
    return [client.nom, client.prenom].filter(Boolean).join(", ");
  }
  return client.raisonSociale ?? "Client";
}

/** Extrait le texte d'un document si possible (PDF ou texte). Vide sinon. */
async function extractDocumentText(storageKey: string, mimeType: string): Promise<string> {
  try {
    const buffer = await readDocumentObject(storageKey);
    if (mimeType === "application/pdf") return await extractTextFromPDF(buffer);
    if (mimeType.startsWith("text/")) return buffer.toString("utf8").slice(0, 5000);
    return "";
  } catch {
    return "";
  }
}

/**
 * Charge un dossier et ses pièces, puis génère un résumé structuré via l'IA.
 * Lecture seule (n'écrit rien). Retourne `null` si dossier introuvable ou IA indisponible.
 */
export async function generateDossierSummary(params: {
  dossierId: string;
  cabinetId: string;
}): Promise<DossierSummary | null> {
  const { dossierId, cabinetId } = params;

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: { select: { raisonSociale: true, prenom: true, nom: true, typeClient: true } },
      taches: { select: { titre: true, statut: true, dateEcheance: true }, orderBy: { dateEcheance: "asc" } },
      pieces: { select: { titre: true, statut: true }, take: 40 },
      procedures: { select: { typeProcedure: true, dateDepot: true, statut: true }, orderBy: { dateDepot: "asc" } },
      judgments: { select: { typeJugement: true, dateJugement: true } },
      notes: { where: { confidentiel: false }, select: { content: true }, take: 10 },
      documents: {
        select: { nom: true, documentType: true, mimeType: true, storageKey: true },
        orderBy: { createdAt: "desc" },
        take: MAX_DOCS_TO_READ,
      },
    },
  });
  if (!dossier) return null;

  // Champs spécifiques au domaine.
  const champsDomaine: { label: string; valeur: string }[] = [];
  if (dossier.type === "immigration") {
    if (dossier.irccStatut) champsDomaine.push({ label: "Statut IRCC", valeur: dossier.irccStatut });
    if (dossier.irccNumDossier) champsDomaine.push({ label: "N° dossier IRCC", valeur: dossier.irccNumDossier });
    if (dossier.submissionDeadline)
      champsDomaine.push({ label: "Échéance de soumission", valeur: isoDate(dossier.submissionDeadline)! });
  }
  if (dossier.type === "immobilier") {
    if (dossier.sousType) champsDomaine.push({ label: "Sous-type", valeur: dossier.sousType });
    if (dossier.propertyAddress) champsDomaine.push({ label: "Adresse", valeur: dossier.propertyAddress });
    if (dossier.closingDate) champsDomaine.push({ label: "Date de clôture", valeur: isoDate(dossier.closingDate)! });
    champsDomaine.push({ label: "FINTRAC vérifié", valeur: dossier.fintracVerified ? "oui" : "non" });
  }

  // Extraction des textes de documents (en parallèle).
  const documents = (
    await Promise.all(
      dossier.documents.map(async (d) => ({
        nom: d.nom,
        type: d.documentType,
        extrait: await extractDocumentText(d.storageKey, d.mimeType),
      })),
    )
  ).filter((d) => d.extrait.trim().length > 0);

  const input: DossierSummaryInput = {
    intitule: dossier.intitule,
    type: dossier.type,
    sousType: dossier.sousType,
    statut: dossier.statut,
    clientNom: clientNom(dossier.client),
    dateOuverture: isoDate(dossier.dateOuverture),
    tribunal: dossier.tribunalNom,
    numeroDossierTribunal: dossier.numeroDossierTribunal,
    modeFacturation: dossier.modeFacturation,
    champsDomaine,
    taches: dossier.taches.map((t) => ({
      titre: t.titre,
      statut: t.statut,
      echeance: isoDate(t.dateEcheance),
    })),
    pieces: dossier.pieces.map((p) => ({ titre: p.titre, statut: p.statut })),
    procedures: dossier.procedures.map((p) => ({
      type: p.typeProcedure,
      date: isoDate(p.dateDepot),
      statut: p.statut,
    })),
    jugements: dossier.judgments.map((j) => ({ type: j.typeJugement, date: isoDate(j.dateJugement) })),
    notes: dossier.notes.map((n) => n.content),
    documents,
  };

  return summarizeDossier(input);
}

/** Persiste le texte du résumé dans le dossier (marqueur IA via la note de résumé). */
export async function saveDossierSummary(params: {
  dossierId: string;
  cabinetId: string;
  resumeTexte: string;
}): Promise<void> {
  const { dossierId, cabinetId, resumeTexte } = params;
  await prisma.dossier.updateMany({
    where: { id: dossierId, cabinetId },
    data: { resumeDossier: resumeTexte },
  });
}
