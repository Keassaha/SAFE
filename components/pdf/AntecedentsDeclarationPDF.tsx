import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

/**
 * Déclaration d'antécédents — Immigration
 *
 * Obligation déontologique du Barreau du Québec (Code de déontologie B-1, r.3.1)
 * avant d'accepter un mandat en droit de l'immigration.
 *
 * Couvre :
 *  1. Antécédents criminels
 *  2. Antécédents d'immigration (refus, dépassement de séjour, déportation, fausse déclaration)
 *  3. Vérification d'identité (Loi sur le Barreau + IRCC)
 *  4. Consentement au traitement des données (Loi 25 Québec / LPRPDE)
 *
 * Les données proviennent du modèle ImmigrationBackground (Prisma).
 */

const DARK = "#0F2A47";
const MUTED = "#475569";
const DANGER_BG = "#fef2f2";
const DANGER_BORDER = "#fecaca";
const DANGER_TEXT = "#991b1b";
const GREEN_BG = "#f0fdf4";
const GREEN_BORDER = "#86efac";
const GREEN_TEXT = "#166534";

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.45 },

  firmHeader: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: DARK,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  firmName: { fontSize: 13, fontWeight: "bold", color: DARK },
  firmInfo: { fontSize: 8, color: MUTED, marginTop: 3 },
  docRef: { fontSize: 8, color: MUTED, textAlign: "right" },

  title: { fontSize: 15, fontWeight: "bold", textAlign: "center", color: DARK, marginBottom: 4 },
  subtitle: { fontSize: 9, textAlign: "center", color: MUTED, marginBottom: 6, fontStyle: "italic" },
  deontologyRef: {
    fontSize: 8,
    textAlign: "center",
    color: MUTED,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#FFFFFF",
    backgroundColor: DARK,
    padding: "5 8",
    marginTop: 14,
    marginBottom: 10,
  },

  formRow: { flexDirection: "row", marginBottom: 9, alignItems: "flex-end" },
  label: { width: 200, fontSize: 8.5, color: "#374151", fontWeight: "bold" },
  fieldValue: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
    paddingBottom: 2,
    fontSize: 10,
    minHeight: 14,
  },

  yesNoRow: { flexDirection: "row", marginBottom: 8, alignItems: "flex-start" },
  yesNoLabel: { flex: 1, fontSize: 9, color: "#374151", lineHeight: 1.4 },
  yesNoBoxes: { flexDirection: "row", gap: 12, marginLeft: 8 },
  box: {
    width: 28,
    height: 16,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: DARK },
  boxLabel: { fontSize: 8, color: "#374151" },
  boxLabelChecked: { fontSize: 8, color: "#FFFFFF", fontWeight: "bold" },
  detailsLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 8,
    minHeight: 14,
  },
  detailsLabel: { fontSize: 8, color: MUTED, marginLeft: 8, marginBottom: 2 },

  resultBox: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    marginVertical: 8,
  },
  resultTitle: { fontSize: 9.5, fontWeight: "bold", marginBottom: 3 },
  resultText: { fontSize: 8.5, lineHeight: 1.5 },

  paragraph: { fontSize: 9, color: "#374151", lineHeight: 1.55, marginBottom: 8, textAlign: "justify" },
  swornText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.55,
    marginBottom: 10,
    textAlign: "justify",
    fontStyle: "italic",
  },

  signatureGrid: { flexDirection: "row", gap: 24, marginTop: 12 },
  signatureCol: { flex: 1 },
  signatureLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginTop: 22, marginBottom: 3 },
  signatureLabel: { fontSize: 8, color: MUTED },

  loi25Box: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 4,
    padding: 8,
    marginTop: 10,
  },
  loi25Title: { fontSize: 9, fontWeight: "bold", color: "#0c4a6e", marginBottom: 3 },
  loi25Text: { fontSize: 8, color: "#075985", lineHeight: 1.5 },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
});

export type AntecedentsDeclarationData = {
  cabinet: {
    nom: string;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    barreauNumero: string | null;
  };
  avocat: { nom: string; barreauNumero: string | null };
  client: {
    nomComplet: string;
    dateNaissance: string | null;
    email: string | null;
    adresse: string | null;
    idType: string | null;
    idNumber: string | null;
    idExpiration: string | null;
  };
  dossier: {
    numero: string | null;
    intitule: string;
    typeDemande: string | null;
  };
  antecedents: {
    criminalRecord: boolean;
    criminalDetails: string | null;
    priorRefusal: boolean;
    priorRefusalDetails: string | null;
    overstay: boolean;
    overstayDetails: string | null;
    deportation: boolean;
    deportationDetails: string | null;
    misrepresentation: boolean;
    misrepresentationDetails: string | null;
  };
  language: "en" | "fr";
};

const TEXT = {
  fr: {
    title: "Déclaration d'antécédents — Droit de l'immigration",
    subtitle: "Document confidentiel — Dossier client / Cabinet d'avocats",
    deontologyRef: "Obligation déontologique — Code de déontologie des avocats, B-1, r.3.1 — Barreau du Québec",
    s1: "1. Identification du client",
    s2: "2. Antécédents criminels",
    s3: "3. Antécédents d'immigration",
    s4: "4. Vérification d'identité",
    s5: "5. Consentement au traitement des données (Loi 25 QC)",
    s6: "6. Déclaration sous serment",
    clientName: "Nom complet",
    dob: "Date de naissance",
    email: "Courriel",
    address: "Adresse résidentielle",
    dossierNo: "Référence dossier",
    appType: "Type de demande",
    idType: "Type de pièce d'identité",
    idNumber: "Numéro de pièce",
    idExpiry: "Date d'expiration",
    yes: "OUI",
    no: "NON",
    detailsLabel: "Précisez :",
    crimQ: "Avez-vous déjà été accusé(e), arrêté(e) ou condamné(e) pour une infraction criminelle ou pénale, au Canada ou à l'étranger?",
    refusalQ: "Avez-vous déjà fait l'objet d'un refus de visa, de permis ou de résidence permanente au Canada ou dans un autre pays?",
    overstayQ: "Avez-vous déjà séjourné illégalement dans un pays (dépassement de statut, visa expiré)?",
    deportQ: "Avez-vous déjà fait l'objet d'une mesure de renvoi, d'expulsion ou d'interdiction de territoire?",
    misrepQ: "Avez-vous déjà fait de fausses déclarations dans une demande d'immigration ou de citoyenneté?",
    noIssues: "Aucun antécédent déclaré",
    noIssuesText: "Le client déclare ne pas avoir d'antécédents criminels ni d'immigration.",
    hasIssues: "Antécédents à déclarer",
    hasIssuesText: "Des antécédents ont été déclarés ci-dessus. Ces renseignements peuvent affecter l'admissibilité du client. L'avocat doit en tenir compte dans son analyse de la cause.",
    loi25Title: "Notice de confidentialité — Loi 25 (Loi modernisant des dispositions législatives en matière de protection des données)",
    loi25Text: "Les renseignements personnels recueillis dans ce formulaire sont utilisés exclusivement aux fins de la représentation juridique en droit de l'immigration. Ils sont conservés de manière confidentielle et sécurisée. Conformément à la Loi 25 (QC), vous avez le droit d'accéder à vos renseignements, de les corriger et de vous opposer à leur utilisation. Pour exercer ces droits, contactez le cabinet. Les données sont conservées pour la durée du mandat et jusqu'à 7 ans après sa clôture.",
    consentLabel: "J'ai lu et compris la notice de confidentialité ci-dessus :",
    swornTitle: "Déclaration sous serment",
    swornText: "Je, soussigné(e), déclare sous serment que toutes les réponses fournies dans ce document sont véridiques, complètes et exactes à ma connaissance. Je comprends que toute fausse déclaration peut constituer une infraction à la Loi sur l'immigration et la protection des réfugiés (LIPR) et peut entraîner le rejet de ma demande, une mesure d'interdiction de territoire ou des poursuites criminelles. J'autorise mon avocat(e) à utiliser ces renseignements aux fins de ma représentation.",
    clientSig: "Signature du client (sous serment)",
    lawyerVerif: "Vérifié par / Reçu par l'avocat(e)",
    date: "Date :",
    fileRef: "Référence dossier",
    footer: (cabinet: string, barreau: string | null) =>
      `${cabinet}${barreau ? ` — Barreau #${barreau}` : ""} — Déclaration d'antécédents — CONFIDENTIEL`,
  },
  en: {
    title: "Background Declaration — Immigration Law",
    subtitle: "Confidential Document — Client File / Law Firm",
    deontologyRef: "Professional obligation — Code of ethics for lawyers, B-1, r.3.1 — Barreau du Québec",
    s1: "1. Client Identification",
    s2: "2. Criminal Background",
    s3: "3. Immigration History",
    s4: "4. Identity Verification",
    s5: "5. Data Processing Consent (Quebec Law 25 / PIPEDA)",
    s6: "6. Sworn Declaration",
    clientName: "Full legal name",
    dob: "Date of birth",
    email: "Email address",
    address: "Residential address",
    dossierNo: "File reference",
    appType: "Type of application",
    idType: "Type of ID document",
    idNumber: "ID number",
    idExpiry: "Expiry date",
    yes: "YES",
    no: "NO",
    detailsLabel: "Please specify:",
    crimQ: "Have you ever been charged, arrested, or convicted of a criminal or penal offence, in Canada or abroad?",
    refusalQ: "Have you ever been refused a visa, permit, or permanent residence in Canada or any other country?",
    overstayQ: "Have you ever overstayed a visa or remained in a country without lawful status?",
    deportQ: "Have you ever been subject to a removal order, deportation, or declaration of inadmissibility?",
    misrepQ: "Have you ever made a misrepresentation on an immigration or citizenship application?",
    noIssues: "No background issues declared",
    noIssuesText: "The client declares no criminal record or immigration history issues.",
    hasIssues: "Background issues disclosed",
    hasIssuesText: "Background issues have been declared above. This information may affect client admissibility. The lawyer must consider this in their legal analysis.",
    loi25Title: "Privacy Notice — Quebec Law 25 / PIPEDA",
    loi25Text: "Personal information collected in this form is used solely for legal representation in immigration matters. It is stored confidentially and securely. Under Quebec Law 25, you have the right to access, correct, and object to the use of your personal information. To exercise these rights, contact the firm. Data is retained for the duration of the mandate and up to 7 years after closure.",
    consentLabel: "I have read and understood the privacy notice above:",
    swornTitle: "Sworn Declaration",
    swornText: "I, the undersigned, hereby declare under oath that all answers provided in this document are true, complete, and accurate to the best of my knowledge. I understand that any misrepresentation may constitute an offence under the Immigration and Refugee Protection Act (IRPA) and may result in refusal of my application, inadmissibility, or criminal prosecution. I authorize my lawyer to use this information for the purpose of my legal representation.",
    clientSig: "Client signature (sworn)",
    lawyerVerif: "Verified / Received by lawyer",
    date: "Date:",
    fileRef: "File reference",
    footer: (cabinet: string, barreau: string | null) =>
      `${cabinet}${barreau ? ` — Barreau #${barreau}` : ""} — Background Declaration — CONFIDENTIAL`,
  },
} as const;

export function AntecedentsDeclarationPDF({ data }: { data: AntecedentsDeclarationData }) {
  const t = TEXT[data.language];
  const a = data.antecedents;

  const hasAnyIssue =
    a.criminalRecord || a.priorRefusal || a.overstay || a.deportation || a.misrepresentation;

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <View style={styles.formRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.fieldValue}>{value ?? ""}</Text>
    </View>
  );

  const YesNoQuestion = ({
    question,
    answer,
    details,
  }: {
    question: string;
    answer: boolean;
    details: string | null;
  }) => (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.yesNoRow}>
        <Text style={styles.yesNoLabel}>{question}</Text>
        <View style={styles.yesNoBoxes}>
          <View>
            <View style={[styles.box, answer ? styles.boxChecked : {}]}>
              <Text style={answer ? styles.boxLabelChecked : styles.boxLabel}>{t.yes}</Text>
            </View>
          </View>
          <View>
            <View style={[styles.box, !answer ? styles.boxChecked : {}]}>
              <Text style={!answer ? styles.boxLabelChecked : styles.boxLabel}>{t.no}</Text>
            </View>
          </View>
        </View>
      </View>
      {answer && (
        <>
          <Text style={styles.detailsLabel}>{t.detailsLabel}</Text>
          <View style={styles.detailsLine}>
            <Text>{details ?? ""}</Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.firmHeader}>
          <View>
            <Text style={styles.firmName}>{data.cabinet.nom}</Text>
            <Text style={styles.firmInfo}>
              {[data.cabinet.adresse, data.cabinet.telephone, data.cabinet.email].filter(Boolean).join(" · ")}
              {data.cabinet.barreauNumero ? ` · Barreau #${data.cabinet.barreauNumero}` : ""}
            </Text>
          </View>
          {data.dossier.numero && (
            <Text style={styles.docRef}>{t.fileRef}: {data.dossier.numero}</Text>
          )}
        </View>

        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
        <Text style={styles.deontologyRef}>{t.deontologyRef}</Text>

        {/* ── SECTION 1 — CLIENT IDENTIFICATION ── */}
        <Text style={styles.sectionTitle}>{t.s1}</Text>
        <Field label={t.clientName} value={data.client.nomComplet} />
        <View style={{ flexDirection: "row", gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Field label={t.dob} value={data.client.dateNaissance} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t.email} value={data.client.email} />
          </View>
        </View>
        <Field label={t.address} value={data.client.adresse} />
        <View style={{ flexDirection: "row", gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Field label={t.dossierNo} value={data.dossier.numero} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t.appType} value={data.dossier.typeDemande} />
          </View>
        </View>

        {/* ── SECTION 2 — CRIMINAL BACKGROUND ── */}
        <Text style={styles.sectionTitle}>{t.s2}</Text>
        <YesNoQuestion question={t.crimQ} answer={a.criminalRecord} details={a.criminalDetails} />

        {/* ── SECTION 3 — IMMIGRATION HISTORY ── */}
        <Text style={styles.sectionTitle}>{t.s3}</Text>
        <YesNoQuestion question={t.refusalQ} answer={a.priorRefusal} details={a.priorRefusalDetails} />
        <YesNoQuestion question={t.overstayQ} answer={a.overstay} details={a.overstayDetails} />
        <YesNoQuestion question={t.deportQ} answer={a.deportation} details={a.deportationDetails} />
        <YesNoQuestion question={t.misrepQ} answer={a.misrepresentation} details={a.misrepresentationDetails} />

        {/* Result box */}
        {hasAnyIssue ? (
          <View style={[styles.resultBox, { backgroundColor: DANGER_BG, borderColor: DANGER_BORDER }]}>
            <Text style={[styles.resultTitle, { color: DANGER_TEXT }]}>⚠ {t.hasIssues}</Text>
            <Text style={[styles.resultText, { color: DANGER_TEXT }]}>{t.hasIssuesText}</Text>
          </View>
        ) : (
          <View style={[styles.resultBox, { backgroundColor: GREEN_BG, borderColor: GREEN_BORDER }]}>
            <Text style={[styles.resultTitle, { color: GREEN_TEXT }]}>✓ {t.noIssues}</Text>
            <Text style={[styles.resultText, { color: GREEN_TEXT }]}>{t.noIssuesText}</Text>
          </View>
        )}

        {/* ── SECTION 4 — IDENTITY VERIFICATION ── */}
        <Text style={styles.sectionTitle}>{t.s4}</Text>
        <View style={{ flexDirection: "row", gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Field label={t.idType} value={data.client.idType} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t.idNumber} value={data.client.idNumber} />
          </View>
          <View style={{ flex: 0.7 }}>
            <Field label={t.idExpiry} value={data.client.idExpiration} />
          </View>
        </View>

        {/* ── SECTION 5 — LOI 25 CONSENT ── */}
        <Text style={styles.sectionTitle}>{t.s5}</Text>
        <View style={styles.loi25Box}>
          <Text style={styles.loi25Title}>{t.loi25Title}</Text>
          <Text style={styles.loi25Text}>{t.loi25Text}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <View style={{ width: 14, height: 14, borderWidth: 1, borderColor: "#374151", marginRight: 8 }} />
          <Text style={{ fontSize: 9, color: "#374151" }}>{t.consentLabel}</Text>
        </View>

        {/* ── SECTION 6 — SWORN DECLARATION ── */}
        <Text style={styles.sectionTitle}>{t.s6}</Text>
        <Text style={styles.swornText}>{t.swornText}</Text>

        <View style={styles.signatureGrid}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.clientSig}</Text>
            <Text style={styles.signatureLabel}>{data.client.nomComplet}</Text>
          </View>
          <View style={{ width: 100 }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.date}</Text>
          </View>
        </View>

        <View style={[styles.signatureGrid, { marginTop: 16 }]}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.lawyerVerif}</Text>
            <Text style={styles.signatureLabel}>{data.avocat.nom}{data.avocat.barreauNumero ? ` — #${data.avocat.barreauNumero}` : ""}</Text>
          </View>
          <View style={{ width: 100 }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.date}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          {t.footer(data.cabinet.nom, data.cabinet.barreauNumero)}
        </Text>
      </Page>
    </Document>
  );
}
