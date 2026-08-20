import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { sendInvoiceByEmail } from "@/lib/services/billing/invoice-send-service";
import { reponseHttpPourEnvoi } from "@/lib/services/billing/invoice-send-http";
import {
  parseCabinetConfig,
  getEmailFactureConfig,
  applyInvoiceEmailVariables,
} from "@/lib/cabinet-config";
import type { UserRole } from "@prisma/client";

/**
 * Envoi officiel d'une facture par courriel — garde d'accès HTTP.
 *
 * Le pipeline d'envoi ne vit PLUS ici. Il a été extrait dans
 * `lib/services/billing/invoice-send-service.ts` pour qu'une tâche planifiée
 * puisse l'appeler : cette route commençait par `getServerSession`, et un cron
 * n'a pas de session.
 *
 * Ce fichier ne fait donc plus que trois choses :
 *   - GET  : gabarit d'accompagnement et pièces joignables, pour la modale ;
 *   - POST : vérifier les droits, lire le corps, appeler le service ;
 *   - traduire le résultat en code HTTP (`invoice-send-http.ts`, testé).
 *
 * Les garanties, elles, ont suivi le pipeline dans le service : un échec
 * d'envoi ne transmet rien, et la trace est écrite dans les deux cas.
 */
/** Nom d'affichage du client à partir des champs bruts. */
function clientDisplayName(client: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
} | null): string {
  if (!client) return "Madame, Monsieur";
  if (client.raisonSociale?.trim()) return client.raisonSociale.trim();
  const full = [client.prenom, client.nom].filter(Boolean).join(" ").trim();
  return full || "Madame, Monsieur";
}

/** Message d'accompagnement par défaut (texte brut, éditable par l'utilisateur). */
function defaultMessage(opts: {
  clientName: string;
  invoiceNumber: string;
  dueDate?: string;
  cabinetName: string;
}): string {
  const lines = [
    `Bonjour ${opts.clientName},`,
    "",
    `Veuillez trouver en pièce jointe notre facture n° ${opts.invoiceNumber}.`,
  ];
  if (opts.dueDate) lines.push(`Échéance : ${opts.dueDate}.`);
  lines.push(
    "",
    "N'hésitez pas à communiquer avec nous pour toute question.",
    "",
    "Cordialement,",
    opts.cabinetName,
  );
  return lines.join("\n");
}

/** Instructions de paiement par défaut (préqualifiées, à ajuster). */
function defaultPaymentInstructions(opts: {
  invoiceNumber: string;
  cabinetName: string;
  cabinetEmail?: string | null;
}): string {
  const interac = opts.cabinetEmail?.trim()
    ? `• Virement Interac à : ${opts.cabinetEmail.trim()}`
    : "• Virement Interac à : [votre courriel]";
  return [
    "Modes de paiement acceptés :",
    interac,
    `• Chèque à l'ordre de ${opts.cabinetName}`,
    "",
    `Merci d'indiquer le numéro de facture ${opts.invoiceNumber} en référence pour un traitement rapide et sans erreur.`,
  ].join("\n");
}

/** GET — RichDocuments joignables + valeurs par défaut du message d'envoi. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const role = (session.user as { role?: string }).role as UserRole;
  if (!role || !canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const { id } = await context.params;
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) return NextResponse.json({ error: "Cabinet manquant" }, { status: 401 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    select: {
      dossierId: true,
      numero: true,
      dateEcheance: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      cabinet: { select: { nom: true, email: true, config: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });

  const documents = invoice.dossierId
    ? await prisma.richDocument.findMany({
        where: { cabinetId, dossierId: invoice.dossierId, isArchived: false },
        select: { id: true, titre: true, type: true, statut: true },
        orderBy: { updatedAt: "desc" },
        take: 50,
      })
    : [];

  const clientName = clientDisplayName(invoice.client);
  const cabinetName = invoice.cabinet?.nom ?? "Cabinet";
  const invoiceNumber = invoice.numero ?? "";
  const dueDate = invoice.dateEcheance
    ? new Date(invoice.dateEcheance).toLocaleDateString("fr-CA")
    : undefined;

  // Gabarit sauvegardé au niveau du cabinet (paramètres → envoi de facture).
  // S'il existe, il pré-remplit la modale APRÈS substitution des variables ;
  // sinon on retombe sur les valeurs générées par défaut.
  const savedEmail = getEmailFactureConfig(parseCabinetConfig(invoice.cabinet?.config ?? null));
  const emailVars = { client: clientName, numeroFacture: invoiceNumber, cabinet: cabinetName, echeance: dueDate ?? "" };

  const defaults = {
    subject: savedEmail.objet?.trim()
      ? applyInvoiceEmailVariables(savedEmail.objet, emailVars)
      : `Facture ${invoiceNumber} — ${cabinetName}`,
    message: savedEmail.message?.trim()
      ? applyInvoiceEmailVariables(savedEmail.message, emailVars)
      : defaultMessage({ clientName, invoiceNumber, dueDate, cabinetName }),
    paymentInstructions: savedEmail.instructionsPaiement?.trim()
      ? applyInvoiceEmailVariables(savedEmail.instructionsPaiement, emailVars)
      : defaultPaymentInstructions({
          invoiceNumber,
          cabinetName,
          cabinetEmail: invoice.cabinet?.email,
        }),
  };

  return NextResponse.json({ documents, defaults });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role as UserRole;
  if (!role || !canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet manquant" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? null;
  const { id } = await context.params;

  // Corps optionnel : pièces additionnelles et gabarit d'accompagnement.
  // Best-effort, comme avant : un body absent ou invalide n'empêche pas l'envoi.
  let attachRichDocumentIds: string[] = [];
  let customSubject: string | undefined;
  let customMessage: string | undefined;
  let paymentInstructions: string | undefined;
  try {
    const body = (await request.json()) as {
      attachRichDocumentIds?: unknown;
      subject?: unknown;
      message?: unknown;
      paymentInstructions?: unknown;
    };
    if (Array.isArray(body?.attachRichDocumentIds)) {
      attachRichDocumentIds = body.attachRichDocumentIds.filter(
        (x): x is string => typeof x === "string",
      );
    }
    if (typeof body?.subject === "string" && body.subject.trim()) customSubject = body.subject.trim();
    if (typeof body?.message === "string" && body.message.trim()) customMessage = body.message;
    if (typeof body?.paymentInstructions === "string" && body.paymentInstructions.trim()) {
      paymentInstructions = body.paymentInstructions;
    }
  } catch {
    attachRichDocumentIds = [];
  }

  // Le pipeline vit dans le service, pour qu'une tâche planifiée puisse
  // l'appeler sans session. Cette route n'est plus qu'une garde d'accès.
  const resultat = await sendInvoiceByEmail({
    invoiceId: id,
    cabinetId,
    sentById: userId,
    attachRichDocumentIds,
    subject: customSubject,
    message: customMessage,
    paymentInstructions,
  });

  const { status, body } = reponseHttpPourEnvoi(resultat);
  return NextResponse.json(body, { status });
}
