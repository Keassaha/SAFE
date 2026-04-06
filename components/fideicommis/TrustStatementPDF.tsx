import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  title: { fontSize: 18, marginBottom: 8 },
  subtitle: { fontSize: 12, marginBottom: 20, color: "#4a6a5c" },
  header: { marginBottom: 24 },
  section: { marginBottom: 16 },
  table: { marginTop: 12 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 4 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    paddingVertical: 6,
    fontWeight: "bold",
  },
  colDate: { width: 70 },
  colDesc: { flex: 2 },
  colDepot: { width: 70, textAlign: "right" },
  colRetrait: { width: 70, textAlign: "right" },
  colSolde: { width: 80, textAlign: "right" },
  totals: { marginTop: 16, paddingTop: 8, borderTopWidth: 1 },
  signature: { marginTop: 40, fontSize: 9, color: "#6b8f7b" },
});

interface TransactionRow {
  date: string;
  amount: number;
  type: string;
  description: string | null;
  reference: string | null;
  balanceAfter: number | null;
}

export function TrustStatementPDF({
  cabinetNom,
  cabinetAdresse,
  mois,
  annee,
  clientNom,
  dossierIntitule,
  transactions,
  totalDeposits,
  totalWithdrawals,
  soldeDebut,
  soldeFinal,
}: {
  cabinetNom: string;
  cabinetAdresse: string | null;
  mois: number;
  annee: number;
  clientNom: string | null;
  dossierIntitule: string | null;
  transactions: TransactionRow[];
  totalDeposits: number;
  totalWithdrawals: number;
  soldeDebut: number;
  soldeFinal: number;
}) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    }).format(n);
  const moisLabel = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ][mois - 1];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{cabinetNom}</Text>
          {cabinetAdresse ? (
            <Text style={{ fontSize: 9, color: "#666" }}>{cabinetAdresse}</Text>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          Relevé du compte en fidéicommis — {moisLabel} {annee}
        </Text>
        {(clientNom || dossierIntitule) && (
          <View style={styles.section}>
            {clientNom ? <Text>Client : {clientNom}</Text> : null}
            {dossierIntitule ? <Text>Dossier : {dossierIntitule}</Text> : null}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colDepot}>Dépôt</Text>
            <Text style={styles.colRetrait}>Retrait</Text>
            <Text style={styles.colSolde}>Solde</Text>
          </View>
          {transactions.map((t, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDate}>{formatDate(t.date)}</Text>
              <Text style={styles.colDesc}>
                {t.description || t.reference || "—"}
              </Text>
              <Text style={styles.colDepot}>
                {t.amount > 0 ? formatMoney(t.amount) : "—"}
              </Text>
              <Text style={styles.colRetrait}>
                {t.amount < 0 ? formatMoney(Math.abs(t.amount)) : "—"}
              </Text>
              <Text style={styles.colSolde}>
                {t.balanceAfter != null ? formatMoney(t.balanceAfter) : "—"}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text>Total dépôts : {formatMoney(totalDeposits)}</Text>
          <Text>Total retraits : {formatMoney(totalWithdrawals)}</Text>
          <Text>Solde début de période : {formatMoney(soldeDebut)}</Text>
          <Text style={{ fontWeight: "bold", marginTop: 4 }}>
            Solde final : {formatMoney(soldeFinal)}
          </Text>
        </View>

        <View style={styles.signature}>
          <Text>Document généré le {formatDate(new Date().toISOString())} — SAFE</Text>
          <Text style={{ marginTop: 24 }}>Signature ou validation avocat principal : _________________________</Text>
        </View>
      </Page>
    </Document>
  );
}
