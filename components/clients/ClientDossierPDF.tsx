import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  title: { fontSize: 18, marginBottom: 20 },
  section: { marginBottom: 15 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 140 },
  table: { marginTop: 20 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 6 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    paddingVertical: 6,
    fontWeight: "bold",
  },
  colRef: { width: 100 },
  colTitle: { flex: 2 },
  colStatus: { width: 80 },
});

type ClientShape = {
  raisonSociale: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  typeClient: string;
  createdAt: Date;
};

type DossierShape = {
  reference: string | null;
  numeroDossier: string | null;
  intitule: string;
  statut: string;
  dateOuverture: Date;
};

export type ClientDossierPDFLabels = {
  dossierClient: string;
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  clientSince: string;
  mattersLabel: string;
  matterNumber: string;
  matterTitle: string;
  tableStatus: string;
  exportedOn: string;
};

export function ClientDossierPDF({
  client,
  dossiers,
  labels,
}: {
  client: ClientShape;
  dossiers: DossierShape[];
  labels: ClientDossierPDFLabels;
}) {
  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  const name =
    client.typeClient === "personne_physique" && (client.prenom || client.nom)
      ? [client.nom, client.prenom].filter(Boolean).join(", ")
      : client.raisonSociale;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{labels.dossierClient} — {name}</Text>
        <View style={styles.section}>
          <Text style={styles.row}>
            <Text style={styles.label}>{labels.nameLabel} :</Text>
            <Text>{name}</Text>
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>{labels.emailLabel} :</Text>
            <Text>{client.email ?? "—"}</Text>
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>{labels.phoneLabel} :</Text>
            <Text>{client.telephone ?? "—"}</Text>
          </Text>
          <Text style={styles.row}>
            <Text style={styles.label}>{labels.clientSince} :</Text>
            <Text>{formatDate(client.createdAt)}</Text>
          </Text>
        </View>
        <Text style={{ marginTop: 15, marginBottom: 8, fontWeight: "bold" }}>
          {labels.mattersLabel} ({dossiers.length})
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colRef}>{labels.matterNumber}</Text>
            <Text style={styles.colTitle}>{labels.matterTitle}</Text>
            <Text style={styles.colStatus}>{labels.tableStatus}</Text>
          </View>
          {dossiers.map((d) => (
            <View key={d.numeroDossier ?? d.reference ?? d.intitule} style={styles.tableRow}>
              <Text style={styles.colRef}>{d.numeroDossier ?? d.reference ?? "—"}</Text>
              <Text style={styles.colTitle}>{d.intitule}</Text>
              <Text style={styles.colStatus}>{d.statut}</Text>
            </View>
          ))}
        </View>
        <Text style={{ marginTop: 20, fontSize: 8, color: "#6b8f7b" }}>
          {labels.exportedOn} {formatDate(new Date())} — SAFE
        </Text>
      </Page>
    </Document>
  );
}
