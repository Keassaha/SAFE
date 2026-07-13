import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { extractTextFromPDF } from "@/lib/ai/classify-document";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { createMandatRichDocument } from "@/lib/edition/create-mandat";
import { htmlToTiptapContent, textToTiptapContent } from "@/lib/edition/html-to-tiptap";
import { mandatTitreParDefaut } from "@/lib/edition/mandat-template";

/**
 * POST /api/dossiers/[id]/mandat/import
 *
 * Importe un mandat EXISTANT et le rend modifiable dans l'éditeur (crée un
 * RichDocument type="mandat"). Trois sources :
 *   - application/json  { text, titre? }            → copier-coller
 *   - multipart .docx                               → conversion fidèle (mammoth)
 *   - multipart .pdf / .txt                         → texte seul (mise en forme perdue pour le PDF)
 */

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const DOCX_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

/** Retire l'extension d'un nom de fichier pour en faire un titre lisible. */
function titreDepuisFichier(nom: string): string {
  return nom.replace(/\.[^.]+$/, "").trim() || nom;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const dossier = await prisma.dossier.findFirst({
    where: { id, cabinetId: session.cabinetId },
    select: {
      id: true,
      clientId: true,
      cabinetId: true,
      type: true,
      sousType: true,
      numeroDossier: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      sections: { where: { archive: false }, select: { sectionKey: true } },
    },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const clientNom = clientDisplayName(dossier.client);
  const defaultTitre = mandatTitreParDefaut({ dossierNumero: dossier.numeroDossier ?? null, clientNom });

  let content: string;
  let titre = defaultTitre;
  let warning: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      // Copier-coller de texte.
      const body = (await request.json()) as { text?: unknown; titre?: unknown };
      const text = typeof body.text === "string" ? body.text : "";
      if (!text.trim()) {
        return NextResponse.json({ error: "Aucun texte fourni" }, { status: 400 });
      }
      if (typeof body.titre === "string" && body.titre.trim()) titre = body.titre.trim();
      content = textToTiptapContent(text);
    } else {
      // Fichier téléversé.
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Fichier trop volumineux (max 25 MB)" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      titre = titreDepuisFichier(file.name);
      const fileName = file.name.toLowerCase();

      if (DOCX_TYPES.includes(file.type) || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        const { value: html } = await mammoth.convertToHtml({ buffer });
        content = htmlToTiptapContent(html);
      } else if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
        const text = await extractTextFromPDF(buffer);
        if (!text.trim()) {
          return NextResponse.json(
            { error: "Impossible d'extraire le texte de ce PDF (document scanné ou protégé)." },
            { status: 422 },
          );
        }
        content = textToTiptapContent(text);
        warning = "Import PDF : seul le texte a été récupéré, la mise en forme d'origine est à refaire.";
      } else if (file.type === "text/plain" || fileName.endsWith(".txt")) {
        content = textToTiptapContent(buffer.toString("utf-8"));
      } else {
        return NextResponse.json(
          { error: "Format non supporté. Utilisez Word (.docx), PDF ou du texte." },
          { status: 400 },
        );
      }
    }
  } catch (err) {
    console.error("[mandat-import] conversion failed:", err);
    return NextResponse.json({ error: "Échec de la conversion du document" }, { status: 500 });
  }

  const created = await createMandatRichDocument({
    cabinetId: session.cabinetId,
    userId: session.userId,
    dossier,
    titre,
    content,
    versionLabel: "Import initial (mandat existant)",
  });

  return NextResponse.json({ ...created, warning }, { status: 201 });
}
