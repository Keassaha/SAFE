import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { getNextInvoiceNumero } from "@/lib/facturation/numero-facture";
import { invoiceItemUpdateSchema } from "@/lib/validations/facturation";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const duplicateBodySchema = z.object({
  items: z.array(invoiceItemUpdateSchema),
});

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

/** Duplique la facture en créant un nouveau brouillon avec les lignes fournies (écrase pas l'originale). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id: sourceId } = await params;
  const source = await prisma.invoice.findFirst({
    where: { id: sourceId, cabinetId },
    select: { id: true, clientId: true, dossierId: true, cabinetId: true },
  });
  if (!source) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const parsed = duplicateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { items } = parsed.data;
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Au moins une ligne est requise pour dupliquer" },
      { status: 400 }
    );
  }

  const numero = await getNextInvoiceNumero(cabinetId);
  const now = new Date();

  const newInvoice = await prisma.invoice.create({
    data: {
      cabinetId: source.cabinetId,
      clientId: source.clientId,
      dossierId: source.dossierId,
      numero,
      dateEmission: now,
      dateEcheance: now,
      statut: "brouillon",
      invoiceStatus: "DRAFT",
      paymentStatus: "UNPAID",
      issueMethod: "manual",
    },
  });

  const oldIdToNewId = new Map<string, string>();

  for (const item of items) {
    const date =
      typeof item.date === "string"
        ? new Date(item.date)
        : item.date instanceof Date
          ? item.date
          : now;
    const parentKey = item.parentItemId ?? item.parentLineId ?? undefined;
    const newParentItemId = parentKey ? oldIdToNewId.get(parentKey) ?? null : null;

    const created = await prisma.invoiceItem.create({
      data: {
        invoiceId: newInvoice.id,
        type: (item.type || "honoraires") as "honoraires" | "debours_taxable" | "debours_non_taxable" | "frais_rappel" | "interets" | "rabais",
        description: item.description.trim() || "Honoraires",
        date,
        hours: item.hours ?? null,
        rate: item.rate ?? null,
        amount: item.amount,
        professionalDisplayName: item.professionalDisplayName ?? undefined,
        parentItemId: newParentItemId ?? undefined,
        parentLineId: undefined,
      },
    });
    if (item.id) oldIdToNewId.set(item.id, created.id);
  }

  const { recalculateInvoiceTotals } = await import("@/lib/services/billing/invoice-service");
  await recalculateInvoiceTotals(newInvoice.id);

  return NextResponse.json({ id: newInvoice.id });
}
