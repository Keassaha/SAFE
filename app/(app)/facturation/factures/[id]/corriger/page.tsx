import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canCreateClients } from "@/lib/auth/permissions";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";
import { routes } from "@/lib/routes";
import { CorrigerFacture } from "@/components/clients/reprise-un-client/CorrigerFacture";

/**
 * Corriger une facture reprise, depuis sa page en Facturation.
 *
 * Seules les factures `estReprise` y arrivent : ce que SAFE a produit en
 * fonctionnement garde son chemin habituel (note de crédit, annulation).
 */
export default async function CorrigerFacturePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("repriseUnClient.correction");
  const { cabinetId, role } = await requireCabinetAndUser();
  const { id } = await params;

  if (!canCreateClients(role as UserRole)) notFound();
  const facture = await prisma.invoice.findFirst({
    where: { id, cabinetId, estReprise: true, cancelledAt: null },
    select: { id: true, numero: true },
  });
  if (!facture) notFound();

  const retourHref = routes.facturationFactureApercu(facture.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
      <header className="border-b border-si-line pb-5">
        <Link
          href={retourHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-si-muted transition-colors hover:text-si-verified"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("retourFacture")}
        </Link>
        <h1 className="mt-3 text-2xl font-medium tracking-tight text-si-ink">
          {t("pageTitre", { numero: displayInvoiceNumero(facture.numero) })}
        </h1>
      </header>

      {/* Même espace que la reprise : une fenêtre, et son pied collant. */}
      <div className="overflow-clip rounded-xl border border-si-line bg-si-surface text-[14px] shadow-[0_1px_2px_rgba(22,24,23,0.04)]">
        <CorrigerFacture
          invoiceId={facture.id}
          retour={
            <Link
              href={retourHref}
              className="text-si-muted underline decoration-si-ink/30 underline-offset-[3px] hover:text-si-ink"
            >
              {t("retour")}
            </Link>
          }
        />
      </div>
    </div>
  );
}
