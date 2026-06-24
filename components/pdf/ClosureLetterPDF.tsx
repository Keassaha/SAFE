import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.5 },
  firmHeader: { marginBottom: 30 },
  firmName: { fontSize: 16, fontWeight: "bold", color: "#0F2A47" },
  firmInfo: { fontSize: 9, color: "#475569", marginTop: 4 },
  date: { textAlign: "right", marginBottom: 20, fontSize: 10 },
  recipientBlock: { marginBottom: 24 },
  recipientName: { fontWeight: "bold" },
  subjectLine: { fontWeight: "bold", marginBottom: 16, marginTop: 8 },
  paragraph: { marginBottom: 10, textAlign: "justify" },
  sectionTitle: { fontWeight: "bold", marginTop: 14, marginBottom: 6, fontSize: 11, color: "#0F2A47" },
  bulletPoint: { marginBottom: 4, marginLeft: 12 },
  highlight: {
    backgroundColor: "#fef3c7",
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  signatureBlock: { marginTop: 36 },
  signatureLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginTop: 24, marginBottom: 4, width: 240 },
  signatureLabel: { fontSize: 9, color: "#475569" },
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
});

export type ClosureLetterData = {
  cabinet: { nom: string; adresse: string | null; telephone: string | null; email: string | null; barreauNumero: string | null };
  avocat: { nom: string; barreauNumero: string | null; email: string | null };
  client: { nomComplet: string; civilite?: string | null; adresse: string | null; email: string | null };
  dossier: { numero: string | null; intitule: string; type: string | null; dateOuverture: string; dateFermeture: string };
  finances: {
    totalBilled: number;
    totalPaid: number;
    balance: number;
    currency: string;
    trustBalanceRefund: number;
  };
  retentionYears: number;
  servicesRendered: string[];
  language: "en" | "fr";
};

const TEXT = {
  en: {
    subject: "File Closure",
    intro: (clientName: string) =>
      `${clientName},\n\nWe wish to inform you that the above-referenced file is now closed.`,
    summaryTitle: "Summary of Services Rendered",
    summaryFallback: "All services described in the engagement letter have been completed.",
    finalAccountTitle: "Final Account Status",
    paid: "Your account is paid in full. We thank you for your prompt payment.",
    owing: (amount: string) =>
      `An outstanding balance of ${amount} remains. A final invoice is enclosed; please remit payment promptly.`,
    refund: (amount: string) =>
      `A trust balance of ${amount} will be refunded to you within 30 days.`,
    retentionTitle: "Retention of Your File",
    retentionBody: (years: number) =>
      `Pursuant to the Rules of Professional Conduct of the Law Society of Ontario, your file will be retained for ${years} years from this date. You may request a copy of any documents in your file during this period.`,
    closingTitle: "Closing",
    closingBody:
      "It has been our pleasure to represent you. Should you require legal services in the future, please do not hesitate to contact us.",
    closing: "Sincerely,",
    footer: (cabinetName: string, lso: string | null) =>
      `${cabinetName}${lso ? ` · LSO #${lso}` : ""} · File Closure Letter`,
  },
  fr: {
    subject: "Clôture du dossier",
    intro: (clientName: string) =>
      `${clientName},\n\nNous vous informons que le dossier mentionné ci-dessus est maintenant fermé.`,
    summaryTitle: "Résumé des services rendus",
    summaryFallback: "Tous les services décrits dans la lettre d'engagement ont été complétés.",
    finalAccountTitle: "État du compte final",
    paid: "Votre compte est réglé en entier. Nous vous remercions de votre paiement prompt.",
    owing: (amount: string) =>
      `Un solde impayé de ${amount} demeure. Une facture finale est jointe; veuillez procéder au règlement dans les meilleurs délais.`,
    refund: (amount: string) =>
      `Un solde fidéicommis de ${amount} vous sera remboursé dans les 30 jours.`,
    retentionTitle: "Conservation de votre dossier",
    retentionBody: (years: number) =>
      `Conformément au Code de déontologie des avocats, votre dossier sera conservé pendant ${years} ans à compter de cette date. Vous pouvez en demander copie pendant cette période.`,
    closingTitle: "Conclusion",
    closingBody:
      "Il nous a fait plaisir de vous représenter. N'hésitez pas à nous contacter pour tout besoin futur.",
    closing: "Cordialement,",
    footer: (cabinetName: string, barreau: string | null) =>
      `${cabinetName}${barreau ? ` · Barreau #${barreau}` : ""} · Lettre de clôture`,
  },
} as const;

export function ClosureLetterPDF({ data }: { data: ClosureLetterData }) {
  const t = TEXT[data.language];
  const today = new Date().toLocaleDateString(data.language === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fmt = (amount: number) =>
    amount.toLocaleString(data.language === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: data.finances.currency,
    });

  const greetingName = `${data.client.civilite ?? ""} ${data.client.nomComplet}`.trim();
  const balanceDue = data.finances.balance > 0;

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

        <Text style={styles.date}>{today}</Text>

        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>{greetingName}</Text>
          {data.client.adresse && <Text>{data.client.adresse}</Text>}
        </View>

        <Text style={styles.subjectLine}>
          {[t.subject, data.dossier.numero, data.dossier.intitule].filter(Boolean).join(" · ")}
        </Text>

        <Text style={styles.paragraph}>{t.intro(greetingName)}</Text>

        <Text style={styles.sectionTitle}>{t.summaryTitle}</Text>
        {data.servicesRendered.length > 0 ? (
          data.servicesRendered.map((service, i) => (
            <Text key={i} style={styles.bulletPoint}>• {service}</Text>
          ))
        ) : (
          <Text style={styles.paragraph}>{t.summaryFallback}</Text>
        )}

        <Text style={styles.sectionTitle}>{t.finalAccountTitle}</Text>
        {balanceDue ? (
          <View style={styles.highlight}>
            <Text>{t.owing(fmt(data.finances.balance))}</Text>
          </View>
        ) : (
          <Text style={styles.paragraph}>{t.paid}</Text>
        )}
        {data.finances.trustBalanceRefund > 0 && (
          <Text style={styles.paragraph}>{t.refund(fmt(data.finances.trustBalanceRefund))}</Text>
        )}

        <Text style={styles.sectionTitle}>{t.retentionTitle}</Text>
        <Text style={styles.paragraph}>{t.retentionBody(data.retentionYears)}</Text>

        <Text style={styles.sectionTitle}>{t.closingTitle}</Text>
        <Text style={styles.paragraph}>{t.closingBody}</Text>

        <Text style={[styles.paragraph, { marginTop: 16 }]}>{t.closing}</Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>
            {data.avocat.nom}
            {data.avocat.barreauNumero ? ` · LSO/Barreau #${data.avocat.barreauNumero}` : ""}
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          {t.footer(data.cabinet.nom, data.cabinet.barreauNumero)} · {today}
        </Text>
      </Page>
    </Document>
  );
}
