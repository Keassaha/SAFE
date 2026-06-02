"use client";

import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { RapportFacturationRow } from "@/lib/rapports/types";
import { useTranslations } from "next-intl";

export function RapportFacturationTable({ data }: { data: RapportFacturationRow[] }) {
  const t = useTranslations("reportsUi");

  const columns = [
    { key: "numero", header: t("invoiceNumber"), render: (r: RapportFacturationRow) => r.numero },
    { key: "client", header: t("client"), render: (r: RapportFacturationRow) => r.client },
    { key: "dossier", header: t("matter"), render: (r: RapportFacturationRow) => r.dossier ?? "—" },
    { key: "avocat", header: t("lawyer"), render: (r: RapportFacturationRow) => r.avocat ?? "—" },
    { key: "date", header: t("date"), render: (r: RapportFacturationRow) => formatDate(r.date) },
    { key: "montantHT", header: t("amountBeforeTax"), render: (r: RapportFacturationRow) => formatCurrency(r.montantHT) },
    { key: "rabais", header: t("discount"), render: (r: RapportFacturationRow) => formatCurrency(r.rabais) },
    { key: "taxes", header: t("taxes"), render: (r: RapportFacturationRow) => formatCurrency(r.taxes) },
    { key: "total", header: t("total"), render: (r: RapportFacturationRow) => formatCurrency(r.total) },
    { key: "paiementRecu", header: t("paymentReceived"), render: (r: RapportFacturationRow) => formatCurrency(r.paiementRecu) },
    { key: "solde", header: t("balance"), render: (r: RapportFacturationRow) => formatCurrency(r.solde) },
    { key: "statut", header: t("status"), render: (r: RapportFacturationRow) => r.statut },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(r) => r.id}
      emptyMessage={t("noInvoiceForFilters")}
    />
  );
}
