import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { InvoicePreview } from "@/lib/invoice-template/InvoicePreview";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { loadPresentedInvoiceForCabinet } from "@/lib/services/billing/load-presented-invoice";
import { presentClientDisplayName } from "@/lib/services/billing/invoice-presenter";
import { FacturePreviewActions } from "./FacturePreviewActions";

function statusLabel(invoiceStatus: string | null, statut: string) {
  switch (invoiceStatus) {
    case "DRAFT":
      return "Brouillon";
    case "READY_TO_ISSUE":
      return "Approuvée";
    case "ISSUED":
      return "Envoyée";
    case "PAID":
      return "Payée";
    case "PARTIALLY_PAID":
      return "Partiellement payée";
    case "OVERDUE":
      return "En retard";
    case "CANCELLED":
      return "Annulée";
    default:
      return statut;
  }
}

export default async function FacturePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { cabinetId } = await requireCabinetAndUser();
  const { id } = await params;
  const invoice = await loadPresentedInvoiceForCabinet(id, cabinetId);

  if (!invoice) {
    notFound();
  }

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
            Retour aux factures
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-forest-50 text-forest-700">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Aperçu de la facture {invoice.numero}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {clientName} · {statusLabel(invoice.invoiceStatus, invoice.statut)}
              </p>
            </div>
          </div>
        </div>
        <FacturePreviewActions
          invoiceId={invoice.id}
          invoiceStatus={invoice.invoiceStatus}
        />
      </header>

      {/*
        Aperçu rendu via le composant CANONIQUE `InvoicePreview` (qui rend
        `InvoiceDocument` via `<PDFViewer>`). Garantie : ce que voit ici
        l'utilisateur est strictement le même PDF que celui généré côté
        serveur par `generateInvoicePdf` et envoyé au client par email.
      */}
      <section className="rounded-safe border border-neutral-200 bg-neutral-50 p-4 shadow-sm md:p-8">
        <div className="mx-auto max-w-[860px] h-[1100px] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <InvoicePreview invoice={invoice} language="fr" />
        </div>
      </section>
    </div>
  );
}
