import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.5 },
  firmHeader: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 16 },
  firmName: { fontSize: 16, fontWeight: "bold", color: "#0F2A47" },
  firmInfo: { fontSize: 9, color: "#475569", marginTop: 4 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#0F2A47" },
  receiptNumber: { fontSize: 10, color: "#475569", marginBottom: 24 },
  section: { marginBottom: 20 },
  label: { fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontSize: 11, marginTop: 2 },
  amountBlock: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 8,
    padding: 20,
    marginVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: { fontSize: 11, color: "#166534" },
  amountValue: { fontSize: 24, fontWeight: "bold", color: "#166534" },
  table: { marginTop: 16 },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  tableLabel: { flex: 2, fontSize: 10, color: "#475569" },
  tableValue: { flex: 1, fontSize: 10, textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  thankYou: { marginTop: 32, textAlign: "center", fontSize: 11, color: "#475569", fontStyle: "italic" },
});

export type PaymentReceiptData = {
  cabinet: { nom: string; adresse: string | null; telephone: string | null; email: string | null; barreauNumero: string | null };
  client: { nomComplet: string; adresse: string | null };
  payment: {
    numero: string;
    date: string;
    amount: number;
    currency: string;
    method: string;
    reference?: string | null;
  };
  invoice: { numero: string | null; dossierIntitule: string | null } | null;
  language: "en" | "fr";
};

const TEXT = {
  en: {
    title: "Payment Receipt",
    receiptNumber: (n: string) => `Receipt No. ${n}`,
    receivedFrom: "Received from",
    paymentDate: "Payment date",
    paymentMethod: "Payment method",
    reference: "Reference",
    amountReceived: "Amount received",
    applyTo: "Applied to",
    invoice: "Invoice",
    matter: "Matter",
    thankYou: "Thank you for your payment.",
    footer: (cabinetName: string, lso: string | null) =>
      `${cabinetName}${lso ? ` — LSO #${lso}` : ""} — Payment Receipt`,
  },
  fr: {
    title: "Reçu de paiement",
    receiptNumber: (n: string) => `Reçu n° ${n}`,
    receivedFrom: "Reçu de",
    paymentDate: "Date du paiement",
    paymentMethod: "Mode de paiement",
    reference: "Référence",
    amountReceived: "Montant reçu",
    applyTo: "Imputation",
    invoice: "Facture",
    matter: "Dossier",
    thankYou: "Merci pour votre paiement.",
    footer: (cabinetName: string, barreau: string | null) =>
      `${cabinetName}${barreau ? ` — Barreau #${barreau}` : ""} — Reçu de paiement`,
  },
} as const;

const METHOD_LABELS: Record<string, { en: string; fr: string }> = {
  card: { en: "Credit card", fr: "Carte de crédit" },
  cheque: { en: "Cheque", fr: "Chèque" },
  transfer: { en: "Electronic transfer", fr: "Virement" },
  wire: { en: "Wire transfer", fr: "Virement bancaire" },
  bank_draft: { en: "Bank draft", fr: "Traite bancaire" },
  interac: { en: "Interac e-Transfer", fr: "Virement Interac" },
  cash: { en: "Cash", fr: "Comptant" },
  trust: { en: "From trust account", fr: "Depuis fidéicommis" },
};

export function PaymentReceiptPDF({ data }: { data: PaymentReceiptData }) {
  const t = TEXT[data.language];
  const methodLabel = METHOD_LABELS[data.payment.method]?.[data.language] ?? data.payment.method;
  const formattedAmount = data.payment.amount.toLocaleString(data.language === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: data.payment.currency,
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.firmHeader}>
          <Text style={styles.firmName}>{data.cabinet.nom}</Text>
          <Text style={styles.firmInfo}>
            {[data.cabinet.adresse, data.cabinet.telephone, data.cabinet.email].filter(Boolean).join(" · ")}
            {data.cabinet.barreauNumero ? ` · LSO/Barreau #${data.cabinet.barreauNumero}` : ""}
          </Text>
        </View>

        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.receiptNumber}>{t.receiptNumber(data.payment.numero)}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>{t.receivedFrom}</Text>
          <Text style={styles.value}>{data.client.nomComplet}</Text>
          {data.client.adresse && <Text style={{ fontSize: 10, color: "#475569" }}>{data.client.adresse}</Text>}
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>{t.amountReceived}</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t.paymentDate}</Text>
            <Text style={styles.tableValue}>{data.payment.date}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t.paymentMethod}</Text>
            <Text style={styles.tableValue}>{methodLabel}</Text>
          </View>
          {data.payment.reference && (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>{t.reference}</Text>
              <Text style={styles.tableValue}>{data.payment.reference}</Text>
            </View>
          )}
          {data.invoice?.numero && (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>{t.invoice}</Text>
              <Text style={styles.tableValue}>{data.invoice.numero}</Text>
            </View>
          )}
          {data.invoice?.dossierIntitule && (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>{t.matter}</Text>
              <Text style={styles.tableValue}>{data.invoice.dossierIntitule}</Text>
            </View>
          )}
        </View>

        <Text style={styles.thankYou}>{t.thankYou}</Text>

        <Text style={styles.footer} fixed>
          {t.footer(data.cabinet.nom, data.cabinet.barreauNumero)}
        </Text>
      </Page>
    </Document>
  );
}
