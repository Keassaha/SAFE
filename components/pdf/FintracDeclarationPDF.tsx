import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4 },
  firmHeader: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#0F2A47", paddingBottom: 12 },
  firmName: { fontSize: 14, fontWeight: "bold", color: "#0F2A47" },
  firmInfo: { fontSize: 8, color: "#475569", marginTop: 2 },
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginVertical: 16, color: "#0F2A47" },
  subtitle: { fontSize: 10, textAlign: "center", marginBottom: 24, color: "#475569", fontStyle: "italic" },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginTop: 14, marginBottom: 8, color: "#0F2A47", backgroundColor: "#f1f5f9", padding: 6 },
  formRow: { flexDirection: "row", marginBottom: 8, alignItems: "flex-end" },
  label: { width: 160, fontSize: 9, color: "#475569", fontWeight: "bold" },
  fieldValue: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#94a3b8", paddingBottom: 2, fontSize: 10, minHeight: 14 },
  paragraph: { marginBottom: 8, fontSize: 9.5, textAlign: "justify" },
  warningBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 4,
    padding: 10,
    marginVertical: 12,
  },
  warningTitle: { fontSize: 10, fontWeight: "bold", color: "#991b1b", marginBottom: 4 },
  warningBody: { fontSize: 9, color: "#7f1d1d", lineHeight: 1.4 },
  signatureBlock: { marginTop: 24 },
  signatureLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginTop: 24, marginBottom: 4, width: 280 },
  signatureLabel: { fontSize: 9, color: "#475569" },
  twoColumn: { flexDirection: "row", gap: 20 },
  column: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
});

export type FintracData = {
  cabinet: { nom: string; adresse: string | null; telephone: string | null; email: string | null; barreauNumero: string | null };
  client: {
    nomComplet: string;
    dateNaissance: string | null;
    occupation: string | null;
    adresse: string | null;
    citizenship?: string | null;
  };
  identifications: {
    pieceType: string | null;
    pieceNumero: string | null;
    pieceExpiry: string | null;
  }[];
  dossier: { numero: string | null; intitule: string; type: string | null };
  property: {
    adresse: string | null;
    pin: string | null;
    purchasePrice: number | null;
    currency: string;
  };
  sourceOfFunds: string | null;
  language: "en" | "fr";
};

const TEXT = {
  en: {
    title: "FINTRAC Client Identification Declaration",
    subtitle: "Real Estate Transaction — Pursuant to FINTRAC Reg. SOR/2002-184",
    section1: "1. Reporting Entity (Law Firm)",
    section2: "2. Client Identification",
    section3: "3. Identification Documents",
    section4: "4. Transaction Details",
    section5: "5. Source of Funds",
    section6: "6. Declaration & Signature",
    fullName: "Full legal name",
    dateOfBirth: "Date of birth",
    occupation: "Occupation",
    address: "Residential address",
    citizenship: "Citizenship",
    fileNumber: "File number",
    matterTitle: "Matter",
    matterType: "Transaction type",
    propertyAddress: "Property address",
    propertyPIN: "PIN / Lot ID",
    purchasePrice: "Purchase price",
    idType: "ID type",
    idNumber: "ID number",
    idExpiry: "Expiry",
    sourceFunds: "Source of funds (describe origin: salary, savings, sale of property, gift, loan, etc.)",
    declaration:
      "I, the undersigned client, hereby certify that the information provided above is true and complete. I understand that the law firm is required to verify my identity and the source of funds for this transaction pursuant to the Proceeds of Crime (Money Laundering) and Terrorist Financing Act (PCMLTFA) and FINTRAC regulations. I authorize the firm to retain a copy of my identification documents for a minimum of 7 years.",
    warningTitle: "FINTRAC retention requirement (7 years)",
    warningBody:
      "This declaration and all supporting identification documents must be retained for at least 7 years from the date of the transaction, in accordance with the PCMLTFA and FINTRAC reg. 64.",
    clientSig: "Client signature",
    date: "Date",
    lawyerVerif: "Verified by (lawyer)",
    footer: (cabinetName: string, lso: string | null) =>
      `${cabinetName}${lso ? ` — LSO #${lso}` : ""} — FINTRAC Declaration`,
  },
  fr: {
    title: "Déclaration d'identification CANAFE",
    subtitle: "Transaction immobilière — Conformément au Règlement CANAFE DORS/2002-184",
    section1: "1. Entité déclarante (cabinet)",
    section2: "2. Identification du client",
    section3: "3. Pièces d'identité",
    section4: "4. Détails de la transaction",
    section5: "5. Source des fonds",
    section6: "6. Déclaration et signature",
    fullName: "Nom complet",
    dateOfBirth: "Date de naissance",
    occupation: "Profession",
    address: "Adresse résidentielle",
    citizenship: "Citoyenneté",
    fileNumber: "Numéro de dossier",
    matterTitle: "Dossier",
    matterType: "Type de transaction",
    propertyAddress: "Adresse de l'immeuble",
    propertyPIN: "PIN / Lot",
    purchasePrice: "Prix d'achat",
    idType: "Type de pièce",
    idNumber: "Numéro",
    idExpiry: "Expiration",
    sourceFunds: "Source des fonds (décrire l'origine : salaire, épargne, vente d'immeuble, don, prêt, etc.)",
    declaration:
      "Je, soussigné(e), client, certifie que les renseignements ci-dessus sont véridiques et complets. Je comprends que le cabinet est tenu de vérifier mon identité et la source des fonds pour cette transaction conformément à la Loi sur le recyclage des produits de la criminalité et le financement des activités terroristes (LRPCFAT) et au Règlement CANAFE. J'autorise le cabinet à conserver copie de mes pièces d'identité pendant au moins 7 ans.",
    warningTitle: "Conservation CANAFE obligatoire (7 ans)",
    warningBody:
      "Cette déclaration et toutes les pièces d'identité doivent être conservées pendant au moins 7 ans à compter de la date de la transaction, conformément à la LRPCFAT et au règlement CANAFE 64.",
    clientSig: "Signature du client",
    date: "Date",
    lawyerVerif: "Vérifié par (avocat)",
    footer: (cabinetName: string, barreau: string | null) =>
      `${cabinetName}${barreau ? ` — Barreau #${barreau}` : ""} — Déclaration CANAFE`,
  },
} as const;

export function FintracDeclarationPDF({ data }: { data: FintracData }) {
  const t = TEXT[data.language];
  const fmt = (amount: number) =>
    amount.toLocaleString(data.language === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: data.property.currency,
    });

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <View style={styles.formRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.fieldValue}>{value ?? ""}</Text>
    </View>
  );

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
        <Text style={styles.subtitle}>{t.subtitle}</Text>

        {/* Section 1 — Reporting Entity (autofill cabinet) */}
        <Text style={styles.sectionTitle}>{t.section1}</Text>
        <Field label="Cabinet" value={data.cabinet.nom} />
        <Field label="LSO/Barreau #" value={data.cabinet.barreauNumero} />

        {/* Section 2 — Client */}
        <Text style={styles.sectionTitle}>{t.section2}</Text>
        <Field label={t.fullName} value={data.client.nomComplet} />
        <Field label={t.dateOfBirth} value={data.client.dateNaissance} />
        <Field label={t.occupation} value={data.client.occupation} />
        <Field label={t.address} value={data.client.adresse} />
        {data.client.citizenship && <Field label={t.citizenship} value={data.client.citizenship} />}

        {/* Section 3 — Identification documents (2 required) */}
        <Text style={styles.sectionTitle}>{t.section3}</Text>
        {[0, 1].map((i) => {
          const id = data.identifications[i] ?? { pieceType: null, pieceNumero: null, pieceExpiry: null };
          return (
            <View key={i} style={styles.twoColumn}>
              <View style={styles.column}>
                <Field label={`${t.idType} #${i + 1}`} value={id.pieceType} />
                <Field label={t.idNumber} value={id.pieceNumero} />
              </View>
              <View style={styles.column}>
                <Field label={t.idExpiry} value={id.pieceExpiry} />
              </View>
            </View>
          );
        })}

        {/* Section 4 — Transaction */}
        <Text style={styles.sectionTitle}>{t.section4}</Text>
        <Field label={t.fileNumber} value={data.dossier.numero} />
        <Field label={t.matterTitle} value={data.dossier.intitule} />
        <Field label={t.matterType} value={data.dossier.type} />
        <Field label={t.propertyAddress} value={data.property.adresse} />
        <Field label={t.propertyPIN} value={data.property.pin} />
        <Field label={t.purchasePrice} value={data.property.purchasePrice ? fmt(data.property.purchasePrice) : null} />

        {/* Section 5 — Source of funds */}
        <Text style={styles.sectionTitle}>{t.section5}</Text>
        <Text style={[styles.paragraph, { color: "#475569", fontSize: 9 }]}>{t.sourceFunds}</Text>
        <View style={[styles.fieldValue, { minHeight: 50, marginVertical: 8 }]}>
          <Text>{data.sourceOfFunds ?? ""}</Text>
        </View>

        {/* Warning box */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠ {t.warningTitle}</Text>
          <Text style={styles.warningBody}>{t.warningBody}</Text>
        </View>

        {/* Section 6 — Declaration */}
        <Text style={styles.sectionTitle}>{t.section6}</Text>
        <Text style={styles.paragraph}>{t.declaration}</Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{t.clientSig} — {data.client.nomComplet}</Text>
          <Text style={styles.signatureLabel}>{t.date}: __________________</Text>

          <View style={[styles.signatureLine, { marginTop: 24 }]} />
          <Text style={styles.signatureLabel}>{t.lawyerVerif}</Text>
        </View>

        <Text style={styles.footer} fixed>
          {t.footer(data.cabinet.nom, data.cabinet.barreauNumero)}
        </Text>
      </Page>
    </Document>
  );
}
