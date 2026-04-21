import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

/**
 * IMM 5476 — Use of a Representative (November 2025 edition)
 * Mandatory as of March 13, 2026 — IRCC (Immigration, Refugees & Citizenship Canada)
 *
 * Sections covered: A (Applicant) + B (Paid Representative / Lawyer) + E (Declaration)
 * This is the most common scenario for law firms acting as paid representatives.
 *
 * Conformité Barreau QC: Guide des meilleures pratiques en droit de l'immigration
 */

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4 },

  // IRCC blue top bar
  irccHeader: {
    backgroundColor: "#003087",
    padding: 12,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  irccHeaderText: { color: "#FFFFFF", fontSize: 11, fontWeight: "bold" },
  irccHeaderSub: { color: "#b3c6e8", fontSize: 8 },

  firmSubHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#003087",
    paddingBottom: 8,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  firmName: { fontSize: 11, fontWeight: "bold", color: "#003087" },
  firmInfo: { fontSize: 8, color: "#475569", marginTop: 2 },
  irccRef: { fontSize: 8, color: "#475569", textAlign: "right" },

  title: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 4, color: "#003087" },
  subtitle: { fontSize: 9, textAlign: "center", marginBottom: 20, color: "#475569", fontStyle: "italic" },

  sectionBadge: {
    backgroundColor: "#003087",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    padding: 6,
    marginTop: 16,
    marginBottom: 10,
  },

  formRow: { flexDirection: "row", marginBottom: 9, alignItems: "flex-end" },
  label: { width: 180, fontSize: 8.5, color: "#374151", fontWeight: "bold" },
  fieldValue: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#6b7280",
    paddingBottom: 2,
    fontSize: 10,
    minHeight: 14,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#374151",
    marginRight: 6,
    flexShrink: 0,
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  checkboxLabel: { fontSize: 9, color: "#374151" },
  checkboxChecked: { backgroundColor: "#003087" },

  infoBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#93c5fd",
    borderRadius: 4,
    padding: 8,
    marginVertical: 10,
  },
  infoBoxText: { fontSize: 8.5, color: "#1e3a8a", lineHeight: 1.5 },

  declarationText: { fontSize: 8.5, color: "#374151", lineHeight: 1.5, marginBottom: 10, textAlign: "justify" },

  signatureBlock: { marginTop: 20 },
  signatureGrid: { flexDirection: "row", gap: 30, marginTop: 8 },
  signatureCol: { flex: 1 },
  signatureLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginTop: 20, marginBottom: 3 },
  signatureLabel: { fontSize: 8, color: "#475569" },

  twoColumn: { flexDirection: "row", gap: 16 },
  column: { flex: 1 },

  notice: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 4,
    padding: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  noticeTitle: { fontSize: 9, fontWeight: "bold", color: "#92400e", marginBottom: 3 },
  noticeText: { fontSize: 8, color: "#78350f", lineHeight: 1.5 },

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

export type Imm5476Data = {
  cabinet: {
    nom: string;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    barreauNumero: string | null;
  };
  avocat: {
    nom: string;
    barreauNumero: string | null;
    email: string | null;
    telephone: string | null;
  };
  client: {
    nomFamille: string;
    prenoms: string | null;
    dateNaissance: string | null;
    email: string | null;
    uci: string | null; // Unique Client Identifier (IRCC)
  };
  dossier: {
    numero: string | null;
    intitule: string;
    typeDemande: string | null;
    irccNumDossier: string | null;
  };
  language: "en" | "fr";
};

const TEXT = {
  en: {
    formTitle: "Use of a Representative",
    formSubtitle: "IMM 5476 (11-2025) E — Immigration, Refugees and Citizenship Canada",
    edition: "Edition: November 2025 (mandatory from March 13, 2026)",
    sectionA: "Section A — Applicant Information",
    sectionB: "Section B — Appointment of a Paid Representative",
    sectionE: "Section E — Declaration",
    familyName: "Family name (last name)",
    givenNames: "Given name(s)",
    dob: "Date of birth (YYYY-MM-DD)",
    email: "Email address",
    uci: "UCI / Client ID (if known)",
    appType: "Type of application / matter",
    appNumber: "Application number (if applicable)",
    repName: "Representative's full name",
    repOrg: "Organization / Law Firm",
    repPhone: "Telephone",
    repEmail: "Email",
    repMemberId: "Barreau du Québec membership number",
    repProvince: "Province / Territory of admission",
    repPaid: "This representative is:",
    repPaidYes: "✓  Paid representative (lawyer — Barreau du Québec)",
    sectionBNote: "By completing this section, the applicant authorizes the representative named above to act on their behalf for all communications with IRCC in relation to this matter.",
    declarationTitle: "Applicant's Declaration",
    declarationText:
      "I declare that the information provided in this form is true and complete. I authorize the representative named in Section B to act on my behalf with Immigration, Refugees and Citizenship Canada (IRCC) for the matter described above. I understand that I remain responsible for the accuracy of all information submitted to IRCC.",
    clientSig: "Applicant signature",
    date: "Date (YYYY-MM-DD)",
    repSig: "Representative signature",
    fileRef: "File reference",
    importantTitle: "IMPORTANT — Valid version notice",
    importantText:
      "This form uses the November 2025 edition of IMM 5476, mandatory as of March 13, 2026. Previous editions are no longer accepted by IRCC officers. Always download the current version from canada.ca.",
    footer: (cabinet: string, barreau: string | null) =>
      `${cabinet}${barreau ? ` — Barreau #${barreau}` : ""} — IMM 5476 (Nov. 2025) — Use of a Representative`,
  },
  fr: {
    formTitle: "Recours aux services d'un représentant",
    formSubtitle: "IMM 5476 (11-2025) F — Immigration, Réfugiés et Citoyenneté Canada",
    edition: "Édition : Novembre 2025 (obligatoire depuis le 13 mars 2026)",
    sectionA: "Section A — Identification du demandeur",
    sectionB: "Section B — Désignation d'un représentant rémunéré",
    sectionE: "Section E — Déclaration",
    familyName: "Nom de famille",
    givenNames: "Prénom(s)",
    dob: "Date de naissance (AAAA-MM-JJ)",
    email: "Adresse courriel",
    uci: "UCI / Identifiant client IRCC (si connu)",
    appType: "Type de demande / dossier",
    appNumber: "Numéro de demande (le cas échéant)",
    repName: "Nom complet du représentant",
    repOrg: "Organisation / Cabinet d'avocats",
    repPhone: "Téléphone",
    repEmail: "Courriel",
    repMemberId: "Numéro de membre — Barreau du Québec",
    repProvince: "Province / Territoire d'admission au Barreau",
    repPaid: "Ce représentant est :",
    repPaidYes: "✓  Représentant rémunéré (avocat — Barreau du Québec)",
    sectionBNote: "En complétant cette section, le demandeur autorise le représentant désigné ci-dessus à agir en son nom pour toutes les communications avec IRCC relativement au présent dossier.",
    declarationTitle: "Déclaration du demandeur",
    declarationText:
      "Je déclare que les renseignements fournis dans ce formulaire sont véridiques et complets. J'autorise le représentant désigné à la Section B à agir en mon nom auprès d'Immigration, Réfugiés et Citoyenneté Canada (IRCC) pour le dossier décrit ci-dessus. Je comprends que je demeure responsable de l'exactitude de tous les renseignements soumis à IRCC.",
    clientSig: "Signature du demandeur",
    date: "Date (AAAA-MM-JJ)",
    repSig: "Signature du représentant",
    fileRef: "Référence du dossier",
    importantTitle: "IMPORTANT — Avis sur la version valide",
    importantText:
      "Ce formulaire utilise l'édition de novembre 2025 de l'IMM 5476, obligatoire depuis le 13 mars 2026. Les éditions précédentes ne sont plus acceptées par les agents d'IRCC. Toujours télécharger la version actuelle sur canada.ca.",
    footer: (cabinet: string, barreau: string | null) =>
      `${cabinet}${barreau ? ` — Barreau #${barreau}` : ""} — IMM 5476 (Nov. 2025) — Recours aux services d'un représentant`,
  },
} as const;

export function Imm5476PDF({ data }: { data: Imm5476Data }) {
  const t = TEXT[data.language];

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <View style={styles.formRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.fieldValue}>{value ?? ""}</Text>
    </View>
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* IRCC Header bar */}
        <View style={styles.irccHeader}>
          <View>
            <Text style={styles.irccHeaderText}>{t.formTitle}</Text>
            <Text style={styles.irccHeaderSub}>{t.formSubtitle}</Text>
          </View>
          <View>
            <Text style={styles.irccRef}>{t.edition}</Text>
          </View>
        </View>

        {/* Firm sub-header */}
        <View style={styles.firmSubHeader}>
          <View>
            <Text style={styles.firmName}>{data.cabinet.nom}</Text>
            <Text style={styles.firmInfo}>
              {[data.cabinet.adresse, data.cabinet.telephone, data.cabinet.email].filter(Boolean).join(" · ")}
              {data.cabinet.barreauNumero ? ` · Barreau #${data.cabinet.barreauNumero}` : ""}
            </Text>
          </View>
          <View>
            {data.dossier.numero && (
              <Text style={styles.irccRef}>{t.fileRef}: {data.dossier.numero}</Text>
            )}
          </View>
        </View>

        {/* Version notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>⚠ {t.importantTitle}</Text>
          <Text style={styles.noticeText}>{t.importantText}</Text>
        </View>

        {/* ── SECTION A — APPLICANT ── */}
        <Text style={styles.sectionBadge}>{t.sectionA}</Text>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Field label={t.familyName} value={data.client.nomFamille} />
          </View>
          <View style={styles.column}>
            <Field label={t.givenNames} value={data.client.prenoms} />
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Field label={t.dob} value={data.client.dateNaissance} />
          </View>
          <View style={styles.column}>
            <Field label={t.uci} value={data.client.uci} />
          </View>
        </View>

        <Field label={t.email} value={data.client.email} />

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Field label={t.appType} value={data.dossier.typeDemande} />
          </View>
          <View style={styles.column}>
            <Field label={t.appNumber} value={data.dossier.irccNumDossier} />
          </View>
        </View>

        {/* ── SECTION B — PAID REPRESENTATIVE ── */}
        <Text style={styles.sectionBadge}>{t.sectionB}</Text>

        <View style={styles.checkboxRow}>
          <View style={[styles.checkbox, styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>{t.repPaidYes}</Text>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Field label={t.repName} value={data.avocat.nom} />
          </View>
          <View style={styles.column}>
            <Field label={t.repOrg} value={data.cabinet.nom} />
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Field label={t.repMemberId} value={data.avocat.barreauNumero ?? data.cabinet.barreauNumero} />
            <Field label={t.repProvince} value="Québec" />
          </View>
          <View style={styles.column}>
            <Field label={t.repPhone} value={data.avocat.telephone ?? data.cabinet.telephone} />
            <Field label={t.repEmail} value={data.avocat.email ?? data.cabinet.email} />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>{t.sectionBNote}</Text>
        </View>

        {/* ── SECTION E — DECLARATION ── */}
        <Text style={styles.sectionBadge}>{t.sectionE}</Text>
        <Text style={styles.declarationText}>{t.declarationText}</Text>

        <View style={styles.signatureGrid}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.clientSig}</Text>
            <Text style={styles.signatureLabel}>{data.client.prenoms} {data.client.nomFamille}</Text>
          </View>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.date}</Text>
          </View>
        </View>

        <View style={[styles.signatureGrid, { marginTop: 20 }]}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.repSig}</Text>
            <Text style={styles.signatureLabel}>{data.avocat.nom}</Text>
          </View>
          <View style={styles.signatureCol}>
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
