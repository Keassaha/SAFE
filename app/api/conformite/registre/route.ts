import { NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { createAuditLog } from "@/lib/services/audit";
import type { RegisterId } from "@/lib/compliance/registers";
import { loadRegister } from "@/lib/services/fideicommis/register-service";
import { toCsv, toPrintableHtml } from "@/lib/services/fideicommis/register-render";

/**
 * Sortie d'un registre réglementaire.
 *
 * Art. 30 B-1 r.5 : l'avocat doit pouvoir produire IMMÉDIATEMENT une copie papier de
 * tout livre ou registre. Par. 21(2) By-Law 9 : même exigence.
 *
 * Deux formats, deux usages :
 *   `html` — rendu paginé, destiné à l'impression. C'est lui qui satisfait le texte.
 *   `csv`  — pour recouper dans un tableur. Aucun article ne l'exige.
 *
 * La production est journalisée. Un inspecteur qui reçoit une copie doit pouvoir
 * vérifier quand elle a été produite, et le cabinet doit pouvoir montrer qu'il a bien
 * produit ce qui lui a été demandé.
 */

export async function GET(request: Request) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const url = new URL(request.url);
  const registerId = url.searchParams.get("id") as RegisterId | null;
  const periode = url.searchParams.get("periode");
  const format = url.searchParams.get("format") === "csv" ? "csv" : "html";
  const compte = url.searchParams.get("compte");

  if (!registerId) {
    return NextResponse.json({ error: "Registre non précisé." }, { status: 400 });
  }
  if (periode && !/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ error: "Période attendue au format AAAA-MM." }, { status: 400 });
  }

  let rendered;
  try {
    rendered = await loadRegister({
      cabinetId,
      registerId,
      periode: periode ?? null,
      trustBankAccountId: compte ?? null,
      generatedBy: userId,
    });
  } catch (e) {
    // Un registre qui ne s'applique pas au régime du cabinet n'est pas une erreur
    // technique : c'est une réponse. Le service refuse de le produire plutôt que
    // d'inventer une obligation.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Registre indisponible." },
      { status: 400 },
    );
  }

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "TrustAccount",
    entityId: registerId,
    action: "download",
    newValues: {
      type: "register_export",
      registerId,
      periode: periode ?? "tout l'historique",
      format,
      rowCount: rendered.rowCount,
      fingerprint: rendered.fingerprint,
      reference: rendered.definition.reference,
    },
    performedBy: userId,
  });

  const base = `${registerId}${periode ? `_${periode}` : ""}`;

  if (format === "csv") {
    return new NextResponse(toCsv(rendered, "fr"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(toPrintableHtml(rendered, "fr"), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Register-Fingerprint": rendered.fingerprint,
      "Cache-Control": "no-store",
    },
  });
}
