import { NextResponse } from "next/server";
import { refusSiRoleInsuffisant } from "@/lib/auth/api-guard";
import { canManageInvoices } from "@/lib/auth/permissions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createInvoiceFromClientBillables,
  createInvoiceFromDossier,
  createFreeformInvoice,
  type LigneManuelleInput,
} from "@/lib/services/forfait-billing-service";

/**
 * Lit les lignes saisies à la main, DATE DU TRAVAIL COMPRISE.
 *
 * Le formulaire envoyait `{ description, montant, taxable }` et rien d'autre :
 * la date que l'avocate saisissait par ligne, et que l'aperçu affichait,
 * n'arrivait jamais en base. Corrigé le 2026-09-10.
 *
 * L'intervenant reste absent : `InvoiceLine` n'a pas de champ pour lui, et
 * l'ajouter demande une migration. Voir la note du §6 de
 * docs/product/REGLE_DE_BUILD.md : on documente avant de migrer.
 */
function lignesManuelles(brut: unknown): LigneManuelleInput[] {
  if (!Array.isArray(brut)) return [];
  return brut.map((l) => {
    const o = l as Record<string, unknown>;
    const d = typeof o.serviceDate === "string" ? new Date(o.serviceDate) : null;
    return {
      description: String(o.description ?? ""),
      montant: Number(o.montant ?? 0),
      taxable: o.taxable !== false,
      serviceDate: d && !Number.isNaN(d.getTime()) ? d : null,
      // Un débours saisi à la main est un débours, pas un honoraire.
      lineType: o.lineType === "expense" ? ("expense" as const) : ("fee" as const),
    };
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  if (!cabinetId || !userId) return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  const refus = refusSiRoleInsuffisant((session.user as { role?: string }).role, canManageInvoices);
  if (refus) return refus;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  try {
    // Unified client invoice: preselected billables + optional manual scratch lines
    if (body.mode === "client-billables" && typeof body.clientId === "string") {
      const result = await createInvoiceFromClientBillables({
        cabinetId,
        clientId: body.clientId,
        userId,
        dossierId: typeof body.dossierId === "string" ? body.dossierId : null,
        dateEmission: typeof body.dateEmission === "string" ? new Date(body.dateEmission) : undefined,
        dateEcheance: typeof body.dateEcheance === "string" ? new Date(body.dateEcheance) : undefined,
        currency: typeof body.currency === "string" ? body.currency : undefined,
        clientNote: typeof body.clientNote === "string" ? body.clientNote : null,
        timeEntryIds: Array.isArray(body.timeEntryIds) ? body.timeEntryIds.filter((id): id is string => typeof id === "string") : [],
        expenseIds: Array.isArray(body.expenseIds) ? body.expenseIds.filter((id): id is string => typeof id === "string") : [],
        registreTacheIds: Array.isArray(body.registreTacheIds)
          ? body.registreTacheIds.filter((id): id is string => typeof id === "string")
          : [],
        deboursIds: Array.isArray(body.deboursIds)
          ? body.deboursIds.filter((id): id is string => typeof id === "string")
          : [],
        lignesManuelles: lignesManuelles(body.lignesManuelles),
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
        lignes: lignesManuelles(body.lignes),
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
      lignesManuelles: lignesManuelles(body.lignesManuelles),
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
