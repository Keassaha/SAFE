import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { classifyDocument, extractTextFromPDF } from "@/lib/ai/classify-document";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
];

// POST /api/edition/upload
// Upload un fichier + classification IA optionnelle
export async function POST(req: NextRequest) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const classifyFlag = formData.get("classify") !== "false"; // true par défaut

  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 25 MB)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Type de fichier non supporté" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex");

  // Sauvegarder le fichier sur disque
  const year = new Date().getFullYear();
  const fileId = randomUUID();
  const ext = path.extname(file.name) || ".bin";
  const storageDir = path.join(UPLOAD_BASE, session.cabinetId, String(year));
  await fs.mkdir(storageDir, { recursive: true });
  const storagePath = path.join(storageDir, `${fileId}${ext}`);
  await fs.writeFile(storagePath, buffer);
  const storageKey = `${session.cabinetId}/${year}/${fileId}${ext}`;

  // Extraire le texte si PDF
  let textContent = "";
  if (file.type === "application/pdf") {
    textContent = await extractTextFromPDF(buffer);
  } else if (file.type === "text/plain") {
    textContent = buffer.toString("utf-8").slice(0, 5000);
  }

  // Créer l'enregistrement Document (modèle existant pour fichiers uploadés)
  const document = await prisma.document.create({
    data: {
      cabinetId: session.cabinetId,
      nom: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey,
      hash,
      uploadedById: session.userId,
    },
  });

  // Classification IA si demandée
  let classification = null;
  if (classifyFlag) {
    // Charger tous les dossiers du cabinet pour les passer à Claude
    const dossiers = await prisma.dossier.findMany({
      where: { cabinetId: session.cabinetId, statut: { not: "cloture" } },
      include: { client: { select: { raisonSociale: true } } },
      take: 50, // Limiter pour le prompt
    });

    classification = await classifyDocument({
      filename: file.name,
      mimeType: file.type,
      textContent: textContent || undefined,
      dossiers: dossiers.map((d) => ({
        id: d.id,
        intitule: d.intitule,
        clientNom: d.client.raisonSociale ?? "Sans nom",
        type: d.type,
        numeroDossier: d.numeroDossier,
      })),
    });
  }

  return NextResponse.json({
    document: {
      id: document.id,
      nom: document.nom,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
    },
    classification, // null si pas de clé API ou si classification désactivée
  });
}
