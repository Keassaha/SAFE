import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createInvoiceFromClientBillables,
  createInvoiceFromDossier,
  createFreeformInvoice,
} from "@/lib/services/forfait-billing-service";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  if (!cabinetId || !userId) return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  try {
    // Unified client invoice: preselected billables + optional manual scratch lines
    if (body.mode === "client-billables" && typeof body.clientId === "string") {
      const result = await createInvoiceFromClientBillables({
        cabinetId,
        clientId: body.clientId,
        userId,
        dateEmission: typeof body.dateEmission === "string" ? new Date(body.dateEmission) : undefined,
        dateEcheance: typeof body.dateEcheance === "string" ? new Date(body.dateEcheance) : undefined,
        currency: typeof body.currency === "string" ? body.currency : undefined,
        clientNote: typeof body.clientNote === "string" ? body.clientNote : null,
        timeEntryIds: Array.isArray(body.timeEntryIds) ? body.timeEntryIds.filter((id): id is string => typeof id === "string") : [],
        expenseIds: Array.isArray(body.expenseIds) ? body.expenseIds.filter((id): id is string => typeof id === "string") : [],
        registreTacheIds: Array.isArray(body.registreTacheIds)
          ? body.registreTacheIds.filter((id): id is string => typeof id === "string")
          : [],
        lignesManuelles: (body.lignesManuelles as { description: string; montant: number; taxable: boolean }[]) ?? [],
      });
      return NextResponse.json({
        success: true,
        invoiceId: result.invoice.id,
        ...result,
      });
    }

    // Free-form invoice (no dossier)
    if (body.mode === "libre" && typeof body.clientId === "string") {
      const result = await createFreeformInvoice({
        cabinetId, clientId: body.clientId, userId,
        lignes: body.lignes as { description: string; montant: number; taxable: boolean }[],
      });
      return NextResponse.json({
        success: true,
        invoiceId: result.invoice.id,
        ...result,
      });
    }

    // Invoice from dossier (auto + optional manual lines)
    if (typeof body.dossierId !== "string") {
      return NextResponse.json({ error: "dossierId or mode='libre'+clientId required" }, { status: 400 });
    }

    const result = await createInvoiceFromDossier({
      dossierId: body.dossierId, cabinetId, userId,
      lignesManuelles: (body.lignesManuelles as { description: string; montant: number; taxable: boolean }[]) ?? [],
    });
    return NextResponse.json({
      success: true,
      invoiceId: result.invoice.id,
      ...result,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
