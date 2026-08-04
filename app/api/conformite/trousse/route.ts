import { NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { createAuditLog } from "@/lib/services/audit";
import { buildInspectionKit } from "@/lib/services/compliance/inspection-kit-service";
import {
  archiveFilename,
  buildInspectionArchive,
} from "@/lib/services/compliance/inspection-kit-archive";

/**
 * Téléchargement de la trousse d'inspection.
 *
 * Art. 29, 30, 33 B-1 r.5 · By-Law 9, par. 21(2).
 *
 * L'art. 33 impose de reconstituer ses livres à ses frais en cas de perte. Un cabinet
 * qui peut réexporter une période complète, horodatée et empreintée, n'a rien à
 * reconstituer : il produit.
 *
 * ⚠️ LA PRODUCTION EST JOURNALISÉE. Qui, quand, pour quelle période, et combien de
 * pièces manquaient. Un cabinet doit pouvoir dire plus tard ce qu'il a remis et dans
 * quel état, sans quoi la trousse elle-même devient contestable.
 */

function parseDate(raw: string | null): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const url = new URL(request.url);
  const periodFrom = parseDate(url.searchParams.get("from"));
  const periodTo = parseDate(url.searchParams.get("to"));

  if (!periodFrom || !periodTo) {
    return NextResponse.json(
      { error: "Précisez la période : les paramètres from et to au format AAAA-MM-JJ." },
      { status: 400 },
    );
  }
  if (periodFrom.getTime() > periodTo.getTime()) {
    return NextResponse.json(
      { error: "La date de début est postérieure à la date de fin." },
      { status: 400 },
    );
  }

  // Fin de journée incluse : une période « au 30 juin » comprend le 30 juin.
  const periodEnd = new Date(periodTo.getTime() + 86_400_000 - 1);

  const kit = await buildInspectionKit({
    cabinetId,
    periodFrom,
    periodTo: periodEnd,
    generatedBy: userId,
  });

  const archive = buildInspectionArchive(kit);

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Cabinet",
    entityId: cabinetId,
    action: "download",
    newValues: {
      type: "inspection_kit_generated",
      periodFrom: periodFrom.toISOString(),
      periodTo: periodEnd.toISOString(),
      itemCount: kit.items.length,
      missingCount: kit.missingCount,
      manifestFingerprint: kit.manifestFingerprint,
      reference: "B-1 r.5, art. 29, 30, 33",
    },
    performedBy: userId,
  });

  return new NextResponse(Buffer.from(archive), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${archiveFilename(kit)}"`,
      "Content-Length": String(archive.byteLength),
      // L'empreinte du manifeste voyage avec l'archive : elle permet de vérifier
      // plus tard qu'un fichier reçu est bien celui qui a été produit.
      "X-Manifest-Fingerprint": kit.manifestFingerprint,
      "Cache-Control": "no-store",
    },
  });
}
