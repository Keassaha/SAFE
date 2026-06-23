import { notFound, redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getTranslations } from "next-intl/server";
import { parseCabinetConfig, getCabinetTaxNumbers } from "@/lib/cabinet-config";
import { updateCabinetIdentity } from "./actions";

export default async function CabinetSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    notFound();
  }
  const params = await searchParams;
  const t = await getTranslations("parametres");
  const tc = await getTranslations("common");

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: {
      nom: true,
      adresse: true,
      email: true,
      telephone: true,
      barreauNumero: true,
      logoUrl: true,
      config: true,
    },
  });
  if (!cabinet) {
    redirect(routes.parametres);
  }
  const taxes = getCabinetTaxNumbers(parseCabinetConfig(cabinet.config));

  const errorBanner =
    params.error === "invalid" ? t("cabinetEditInvalid") : params.error === "forbidden" ? t("cabinetEditForbidden") : null;
  const successBanner = params.success === "updated" ? t("cabinetEditSuccess") : null;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <PageHeader
        title={t("cabinetEditTitle")}
        description={t("cabinetEditDescription")}
        backHref={routes.parametres}
        backLabel={t("backToSettings")}
      />

      {errorBanner && (
        <div className="rounded-lg border border-[#B84A3E]/40 bg-[#B84A3E]/5 px-4 py-3 text-sm text-[#B84A3E]">
          {errorBanner}
        </div>
      )}
      {successBanner && (
        <div className="rounded-lg border border-si-verified/40 bg-si-verified/5 px-4 py-3 text-sm text-si-verified">
          {successBanner}
        </div>
      )}

      <Card>
        <CardHeader title={t("cabinetIdentitySection")} />
        <CardContent>
          <form action={updateCabinetIdentity} className="space-y-5">
            <Input
              label={t("cabinetLegalName")}
              name="nom"
              defaultValue={cabinet.nom ?? ""}
              required
              placeholder={t("cabinetLegalNamePlaceholder")}
            />
            <Input
              label={t("cabinetAddress")}
              name="adresse"
              defaultValue={cabinet.adresse ?? ""}
              placeholder={t("cabinetAddressPlaceholder")}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label={t("cabinetEmail")}
                name="email"
                type="email"
                defaultValue={cabinet.email ?? ""}
                placeholder="contact@cabinet.ca"
              />
              <Input
                label={t("cabinetPhone")}
                name="telephone"
                defaultValue={cabinet.telephone ?? ""}
                placeholder="(514) 555-0123"
              />
            </div>
            <Input
              label={t("cabinetBarreauNumber")}
              name="barreauNumero"
              defaultValue={cabinet.barreauNumero ?? ""}
              placeholder={t("cabinetBarreauPlaceholder")}
            />
            <div>
              <Input
                label={t("cabinetLogoUrl")}
                name="logoUrl"
                type="url"
                defaultValue={cabinet.logoUrl ?? ""}
                placeholder="https://…"
              />
              <p className="mt-1.5 text-xs text-si-muted">{t("cabinetLogoHint")}</p>
            </div>

            <div className="pt-4 border-t border-si-line/60">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-si-ink">{t("cabinetTaxNumbersSection")}</h4>
                <p className="text-xs text-si-muted mt-1">{t("cabinetTaxNumbersHint")}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label={t("cabinetHstNumber")}
                  name="hstNumber"
                  defaultValue={taxes.hstNumber ?? ""}
                  placeholder="123456789RT0001"
                />
                <Input
                  label={t("cabinetGstNumber")}
                  name="gstNumber"
                  defaultValue={taxes.gstNumber ?? ""}
                  placeholder="123456789RT0001"
                />
                <Input
                  label={t("cabinetQstNumber")}
                  name="qstNumber"
                  defaultValue={taxes.qstNumber ?? ""}
                  placeholder="1234567890TQ0001"
                />
                <Input
                  label={t("cabinetBusinessNumber")}
                  name="businessNumber"
                  defaultValue={taxes.businessNumber ?? ""}
                  placeholder="123456789"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-si-line/60">
              <Button type="submit">{tc("save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
