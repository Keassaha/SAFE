import { notFound, redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import {
  parseCabinetConfig,
  getCabinetInvoiceConfig,
  getCabinetTaxNumbers,
} from "@/lib/cabinet-config";
import { InvoiceAppearanceForm } from "./InvoiceAppearanceForm";

/**
 * Réglages — Apparence de la facture.
 * Couleur d'accent, logo, mentions N.B., signature, avec aperçu en direct.
 * Réservé aux administrateurs du cabinet.
 */
export default async function InvoiceAppearancePage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    notFound();
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true, adresse: true, telephone: true, email: true, logoUrl: true, config: true },
  });
  if (!cabinet) {
    redirect(routes.parametres);
  }

  const config = parseCabinetConfig(cabinet.config);
  const inv = getCabinetInvoiceConfig(config);
  const taxes = getCabinetTaxNumbers(config);

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title="Apparence de la facture"
        description="Personnalisez la couleur, le logo, les mentions et la signature de vos factures."
        backHref={routes.parametres}
        backLabel="Retour aux paramètres"
      />

      <InvoiceAppearanceForm
        initial={{
          accentColor: inv.accentColor,
          logoUrl: cabinet.logoUrl ?? null,
          noticeFr: inv.notice.fr.join("\n"),
          noticeEn: inv.notice.en.join("\n"),
          signatureName: inv.signature?.name ?? "",
          signatureTitleFr: inv.signature?.title.fr ?? "",
          signatureTitleEn: inv.signature?.title.en ?? "",
        }}
        cabinet={{
          nom: cabinet.nom,
          adresse: cabinet.adresse,
          telephone: cabinet.telephone,
          email: cabinet.email,
          hstNumber: taxes.hstNumber ?? null,
          gstNumber: taxes.gstNumber ?? null,
          qstNumber: taxes.qstNumber ?? null,
          businessNumber: taxes.businessNumber ?? null,
        }}
      />
    </div>
  );
}
