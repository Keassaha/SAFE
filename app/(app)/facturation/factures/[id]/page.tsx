import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { InvoiceTemplateClean } from "@/components/facturation/InvoiceTemplateClean";
import type { InvoiceCleanItem } from "@/components/facturation/InvoiceTemplateClean";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";
import { routes } from "@/lib/routes";
import { loadPresentedInvoiceForCabinet } from "@/lib/services/billing/load-presented-invoice";
import { presentClientDisplayName } from "@/lib/services/billing/invoice-presenter";
import { FacturePreviewActions } from "./FacturePreviewActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deriveLegacyStatut } from "@/lib/billing/invoice-status";
import { getFormatteurs } from "@/lib/i18n/formatteurs-serveur";

function toIsoDate(value: string | Date) {
  return new Date(value).toISOString();
}

function initialsOf(name?: string | null) {
  if (!name) return null;
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (parts.length === 0) return null;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function statusLabel(
  invoiceStatus: string | null,
  statut: string,
  t: (key: string) => string
) {
  if (statut === "en_retard") return t("statusOverdue");
  if (statut === "payee") return t("statusPaid");
  if (statut === "partiellement_payee") return t("statusPartiallyPaid");
  switch (invoiceStatus) {
    case "DRAFT":
      return t("statusDraft");
    case "READY_TO_ISSUE":
      return t("statusApproved");
    case "ISSUED":
      return t("statusSent");
    case "PAID":
      return t("statusPaid");
    case "PARTIALLY_PAID":
      return t("statusPartiallyPaid");
    case "OVERDUE":
      return t("statusOverdue");
    case "CANCELLED":
      return t("statusCancelled");
    default:
      return statut;
  }
}

export default async function FacturePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { formatCurrency, formatCalendarDate } = await getFormatteurs();
  const t = await getTranslations("billingUi");
  const locale = await getLocale();
  const { cabinetId } = await requireCabinetAndUser();
  const { id } = await params;
  const invoice = await loadPresentedInvoiceForCabinet(id, cabinetId);

  if (!invoice) {
    notFound();
  }

  const items: InvoiceCleanItem[] = invoice.lines.map((line) => ({
    id: line.id,
    type: line.type,
    description: line.description,
    date: toIsoDate(line.date),
    hours: line.hours,
    rate: line.rate,
    amount: line.amount,
    responsable: line.userNom,
    responsableInitiales: initialsOf(line.userNom),
  }));

  const clientName = presentClientDisplayName(invoice.client);
  const derivedStatut = deriveLegacyStatut({
    invoiceStatus: invoice.invoiceStatus,
    paymentStatus: invoice.paymentStatus,
    dateEcheance: invoice.dateEcheance,
  });
  const visibleStatus = statusLabel(invoice.invoiceStatus, derivedStatut, t);
  const statusVariant =
    derivedStatut === "en_retard"
      ? "error"
      : derivedStatut === "payee"
        ? "success"
        : invoice.invoiceStatus === "DRAFT" || invoice.invoiceStatus == null
          ? "warning"
          : "neutral";
  const money = (amount: number) => formatCurrency(amount, "CAD", locale);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
      <header className="flex flex-col gap-4 border-b border-si-line pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href={routes.facturation}
            className="inline-flex items-center gap-2 text-sm font-medium text-si-muted transition-colors hover:text-si-verified"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToInvoices")}
          </Link>
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-medium tracking-tight text-si-ink">
                {t("invoicePreviewTitle", { numero: displayInvoiceNumero(invoice.numero) })}
              </h1>
              <StatusBadge label={visibleStatus} variant={statusVariant} />
            </div>
            <p className="mt-1 text-sm text-si-muted">{clientName}</p>
          </div>
        </div>
        <FacturePreviewActions
          invoiceId={invoice.id}
          invoiceStatus={invoice.invoiceStatus}
        />
      </header>

      {/* `role="region"` + aria-label : c'est exactement ce qu'apportait la
          balise <section> nommée qui portait cette grille avant la carte. */}
      <Card className="grid grid-cols-2 md:grid-cols-4" role="region" aria-label={t("invoiceSummaryLabel")}>
        {[
          [t("total"), money(invoice.totals.montantTotal)],
          [t("alreadyPaid"), money(invoice.totals.montantPaye)],
          [t("balanceDue"), money(invoice.totals.balanceDue)],
          [t("dueDate"), formatCalendarDate(invoice.dateEcheance, locale)],
        ].map(([label, value]) => (
          <div
            key={label}
            /* Deux colonnes puis quatre. Toutes les variantes passent par un
               nth-child, donc au même poids : la cascade regarde la
               spécificité avant la requête média, et un `md:border-b-0` seul
               perdrait contre le filet de base. La rangée du bas et la colonne
               de droite n'ont pas de filet, le bord de la carte les remplace. */
            className="border-si-line px-4 py-3 [&:nth-child(-n+2)]:border-b [&:nth-child(2n+1)]:border-r md:[&:nth-child(-n+2)]:border-b-0 md:[&:nth-child(-n+3)]:border-r"
          >
            <p className="text-xs font-medium text-si-muted">{label}</p>
            <p className="mt-1 text-right font-mono text-lg font-medium tabular-nums text-si-ink">
              {value}
            </p>
          </div>
        ))}
      </Card>

      {/* La feuille de la facture reste carrée : c'est une page de papier, et
          une facture n'a pas les coins arrondis. */}
      <section className="border border-si-line bg-si-canvas p-3 sm:p-6 md:p-8" aria-label={t("invoiceDocumentLabel")}>
        <div className="mx-auto max-w-[860px] overflow-hidden border border-si-line bg-si-surface">
          <InvoiceTemplateClean
            numero={displayInvoiceNumero(invoice.numero)}
            dateEmission={invoice.dateEmission.toISOString()}
            dateEcheance={invoice.dateEcheance.toISOString()}
            cabinet={invoice.cabinet}
            client={
              invoice.client
                ? {
                    raisonSociale: clientName,
                    billingAddress: invoice.client.billingAddress,
                    billingCity: invoice.client.billingCity,
                    billingProvince: invoice.client.billingProvince,
                    billingPostalCode: invoice.client.billingPostalCode,
                    billingCountry: invoice.client.billingCountry,
                    email: invoice.client.email,
                  }
                : null
            }
            dossier={invoice.dossier}
            items={items}
            subtotalTaxable={invoice.totals.subtotalTaxable}
            totalRabais={invoice.totals.totalRabais}
            tps={invoice.totals.tps}
            tvq={invoice.totals.tvq}
            hst={invoice.totals.hst}
            montantTotal={invoice.totals.montantTotal}
            montantPaye={invoice.totals.montantPaye}
            balanceDue={invoice.totals.balanceDue}
            clientNote={invoice.clientNote}
          />
        </div>
      </section>
    </div>
  );
}
