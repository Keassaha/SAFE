import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { InvoiceTemplateClean } from "@/components/facturation/InvoiceTemplateClean";
import type { InvoiceCleanItem } from "@/components/facturation/InvoiceTemplateClean";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { loadPresentedInvoiceForCabinet } from "@/lib/services/billing/load-presented-invoice";
import { presentClientDisplayName } from "@/lib/services/billing/invoice-presenter";
import { FacturePreviewActions } from "./FacturePreviewActions";

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
  const t = await getTranslations("billingUi");
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="flex flex-col gap-4 rounded-safe border border-neutral-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href={routes.facturation}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-forest-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToInvoices")}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-forest-50 text-forest-700">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                {t("invoicePreviewTitle", { numero: invoice.numero })}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {clientName} · {statusLabel(invoice.invoiceStatus, invoice.statut, t)}
              </p>
            </div>
          </div>
        </div>
        <FacturePreviewActions
          invoiceId={invoice.id}
          invoiceStatus={invoice.invoiceStatus}
        />
      </header>

      <section className="rounded-safe border border-neutral-200 bg-neutral-50 p-4 shadow-sm md:p-8">
        <div className="mx-auto max-w-[860px] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <InvoiceTemplateClean
            numero={invoice.numero}
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
