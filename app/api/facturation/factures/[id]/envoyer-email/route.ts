import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { sendEmail, invoiceEmailHtml } from "@/lib/email";
import type { UserRole } from "@prisma/client";

export async function POST(
  _request: Request,
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

  const { id } = await context.params;
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, cabinetId: cabinetId || undefined },
      include: { client: true, cabinet: { select: { nom: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    const clientEmail = invoice.client?.email;
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Le client n'a pas d'adresse email" },
        { status: 400 }
      );
    }

    const html = invoiceEmailHtml(
      invoice.client?.prenom
        ? `${invoice.client.prenom} ${invoice.client.nom}`
        : invoice.client?.nom || "Client",
      invoice.numero,
      invoice.montantTotal?.toFixed(2) || "0.00",
      invoice.dateEcheance
        ? new Date(invoice.dateEcheance).toLocaleDateString("fr-CA")
        : "N/A"
    );

    await sendEmail({
      to: clientEmail,
      subject: `Facture ${invoice.numero} — ${invoice.client?.nom || ""}`,
      html,
      cabinetNom: invoice.cabinet.nom,
    });

    return NextResponse.json({ success: true, message: "Facture envoyée par email" });
  } catch (error) {
    console.error("Erreur envoi facture:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
