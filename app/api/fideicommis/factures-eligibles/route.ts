import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import { isInvoiceIssued } from "@/lib/billing/invoice-status";
import { evaluateDelivery } from "@/lib/compliance/invoice-delivery";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/fideicommis/factures-eligibles?clientId=…&dossierId=…
 *
 * Factures qu'un retrait d'honoraires PEUT légalement rembourser.
 *
 * Pourquoi cette route existe : le formulaire de retrait demandait de TAPER un
 * identifiant de facture. Une personne y écrit naturellement le numéro qu'elle
 * lit partout ailleurs (« 2026-003 »), et reçoit « Facture introuvable ». Le
 * champ exigeait un identifiant de base de données que rien n'affiche.
 *
 * L'éligibilité n'est pas un détail d'ergonomie, c'est la règle : art. 56(2)
 * B-1 r.5 et s. 9(1)3 By-Law 9 n'autorisent le retrait que pour une facture
 * ÉMISE et TRANSMISE, et jamais au-delà de ce qu'elle réclame encore. En
 * n'offrant que ces factures-là, l'écran rend le retrait illicite impossible à
 * composer, au lieu de le refuser après coup.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  if (!canViewBillingTrust(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const dossierId = searchParams.get("dossierId");
  if (!clientId) return NextResponse.json({ factures: [] });

  const province = resolveProvince(await getCabinetProvince(cabinetId));

  const brutes = await prisma.invoice.findMany({
    where: {
      cabinetId,
      clientId,
      // Le dossier borne la liste quand il est connu : les fonds détenus pour
      // un dossier ne remboursent pas la facture d'un autre (art. 48).
      ...(dossierId ? { dossierId } : {}),
      invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
    },
    select: {
      id: true,
      numero: true,
      dateEmission: true,
      balanceDue: true,
      invoiceStatus: true,
      paymentStatus: true,
      dateEcheance: true,
      deliveredAt: true,
      deliveryChannel: true,
    },
    orderBy: { dateEmission: "desc" },
    take: 100,
  });

  const factures = brutes
    .filter((i) => isInvoiceIssued(i))
    // Il ne reste rien à rembourser : la proposer inviterait à sortir des fonds
    // du fidéicommis sans contrepartie.
    .filter((i) => (i.balanceDue ?? 0) > 0.005)
    .filter(
      (i) =>
        evaluateDelivery({
          province,
          deliveredAt: i.deliveredAt,
          deliveryChannel: i.deliveryChannel,
        }).allowed,
    )
    .map((i) => ({
      id: i.id,
      numero: i.numero,
      dateEmission: i.dateEmission,
      soldeDu: Math.round((i.balanceDue ?? 0) * 100) / 100,
    }));

  return NextResponse.json({ factures });
}
