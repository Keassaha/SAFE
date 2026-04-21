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
  signatureBlock: { marginTop: 36, borderTopWidth: 0.5, borderTopColor: "#94a3b8", paddingTop: 16 },
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
  highlight: { backgroundColor: "#fef3c7", padding: 2 },
});

export type EngagementLetterData = {
  cabinet: {
    nom: string;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    barreauNumero: string | null;
  };
  avocat: {
    nom: string;
    barreauNumero?: string | null;
    email: string | null;
  };
  client: {
    nomComplet: string;
    civilite?: string | null;
    adresse?: string | null;
    email?: string | null;
  };
  dossier: {
    numero: string | null;
    intitule: string;
    type: string | null;
    sousType: string | null;
    description: string | null;
  };
  honoraires: {
    mode: string | null; // forfait | horaire | mixte
    forfait: number | null;
    tauxHoraire: number | null;
    devise: string;
    taxes: { mode: string; taux: number };
  };
  language: "en" | "fr";
};

const TEXT = {
  en: {
    subject: "Engagement Letter — File",
    intro: (clientName: string) =>
      `${clientName},\n\nWe are pleased to confirm our retainer to act on your behalf in the matter described below. This letter sets out the terms under which our firm will provide legal services to you.`,
    natureTitle: "1. Nature of the Mandate",
    natureBody: (intitule: string, type: string | null, sousType: string | null) => {
      const typeLabel = sousType ? `${type ?? ""} (${sousType})`.trim() : (type ?? "general legal services");
      return `Our firm has been retained to represent you in the matter of "${intitule}". The nature of this mandate is: ${typeLabel}.`;
    },
    feesTitle: "2. Fees and Disbursements",
    feesFlat: (amount: number, currency: string, taxName: string, taxRate: number) =>
      `Our fees for this matter are charged on a flat-fee basis in the amount of ${amount.toLocaleString("en-CA", { style: "currency", currency })}. ${taxName} (${taxRate}%) will be added. Disbursements (e.g. government fees, search fees, courier charges) will be charged separately at cost.`,
    feesHourly: (rate: number, currency: string, taxName: string, taxRate: number) =>
      `Our fees for this matter are charged on an hourly basis at ${rate.toLocaleString("en-CA", { style: "currency", currency })} per hour. ${taxName} (${taxRate}%) will be added. Time is recorded in tenths of an hour. Disbursements will be charged separately at cost.`,
    billingTitle: "3. Billing and Payment",
    billingBody: "Invoices are issued bi-monthly and payable upon receipt. Accepted methods of payment include cheque, electronic transfer, bank draft, credit card, Interac e-Transfer, and cash. Outstanding balances may be subject to interest after 60 days.",
    confTitle: "4. Confidentiality and Privilege",
    confBody: "All communications between you and our firm are protected by solicitor-client privilege. Your file is held in strict confidence in accordance with the Rules of Professional Conduct of the Law Society of Ontario and applicable privacy legislation (PIPEDA).",
    termTitle: "5. Termination",
    termBody: "You may terminate this engagement at any time by written notice. We reserve the same right, subject to our professional obligations. Upon termination, you will be invoiced for all services rendered and disbursements incurred up to the date of termination.",
    closingTitle: "6. Confirmation",
    closingBody: "Please sign and return one copy of this letter to confirm your acceptance of these terms. We thank you for your confidence and look forward to representing you.",
    closing: "Sincerely,",
    signLawyer: "Lawyer",
    signClient: "Client signature",
    date: "Date",
    footer: (cabinetName: string, lso: string | null) =>
      `${cabinetName}${lso ? ` — LSO #${lso}` : ""} — Engagement Letter`,
  },
  fr: {
    subject: "Lettre d'engagement — Dossier",
    intro: (clientName: string) =>
      `${clientName},\n\nNous avons le plaisir de confirmer notre mandat de vous représenter dans le dossier décrit ci-dessous. La présente lettre énonce les conditions selon lesquelles notre cabinet vous fournira des services juridiques.`,
    natureTitle: "1. Nature du mandat",
    natureBody: (intitule: string, type: string | null, sousType: string | null) => {
      const typeLabel = sousType ? `${type ?? ""} (${sousType})`.trim() : (type ?? "services juridiques généraux");
      return `Notre cabinet a été mandaté pour vous représenter dans le dossier « ${intitule} ». La nature du mandat est : ${typeLabel}.`;
    },
    feesTitle: "2. Honoraires et débours",
    feesFlat: (amount: number, currency: string, taxName: string, taxRate: number) =>
      `Nos honoraires pour ce mandat sont fixés au forfait au montant de ${amount.toLocaleString("fr-CA", { style: "currency", currency })}. La ${taxName} (${taxRate}%) s'ajoute. Les débours (frais gouvernementaux, recherches, courrier, etc.) seront facturés séparément au coûtant.`,
    feesHourly: (rate: number, currency: string, taxName: string, taxRate: number) =>
      `Nos honoraires pour ce mandat sont calculés sur une base horaire au taux de ${rate.toLocaleString("fr-CA", { style: "currency", currency })} de l'heure. La ${taxName} (${taxRate}%) s'ajoute. Le temps est enregistré au dixième d'heure. Les débours seront facturés séparément au coûtant.`,
    billingTitle: "3. Facturation et paiement",
    billingBody: "Les factures sont émises aux deux semaines et payables sur réception. Les modes de paiement acceptés sont : chèque, virement, traite bancaire, carte de crédit, virement Interac et comptant. Les soldes impayés peuvent porter intérêt après 60 jours.",
    confTitle: "4. Confidentialité et secret professionnel",
    confBody: "Toutes les communications entre vous et notre cabinet sont protégées par le secret professionnel. Votre dossier est conservé dans la plus stricte confidentialité conformément au Code de déontologie des avocats et à la législation applicable en matière de vie privée (Loi 25 / PIPEDA).",
    termTitle: "5. Résiliation",
    termBody: "Vous pouvez mettre fin au mandat en tout temps par avis écrit. Nous nous réservons le même droit, sous réserve de nos obligations professionnelles. À la résiliation, vous serez facturé pour tous les services rendus et débours engagés jusqu'à cette date.",
    closingTitle: "6. Confirmation",
    closingBody: "Veuillez signer et retourner un exemplaire de cette lettre pour confirmer votre acceptation. Nous vous remercions de votre confiance.",
    closing: "Cordialement,",
    signLawyer: "Avocat(e)",
    signClient: "Signature du client",
    date: "Date",
    footer: (cabinetName: string, barreau: string | null) =>
      `${cabinetName}${barreau ? ` — Barreau #${barreau}` : ""} — Lettre d'engagement`,
  },
} as const;

export function EngagementLetterPDF({ data }: { data: EngagementLetterData }) {
  const t = TEXT[data.language];
  const today = new Date().toLocaleDateString(data.language === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const taxName = data.honoraires.taxes.mode.toUpperCase();
  const isFlat = data.honoraires.mode === "forfait" && data.honoraires.forfait;
  const isHourly = data.honoraires.mode === "horaire" && data.honoraires.tauxHoraire;

  const greetingName = `${data.client.civilite ?? ""} ${data.client.nomComplet}`.trim();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Firm header */}
        <View style={styles.firmHeader}>
          <Text style={styles.firmName}>{data.cabinet.nom}</Text>
          <Text style={styles.firmInfo}>
            {[data.cabinet.adresse, data.cabinet.telephone, data.cabinet.email].filter(Boolean).join(" · ")}
            {data.cabinet.barreauNumero ? ` · LSO/Barreau #${data.cabinet.barreauNumero}` : ""}
          </Text>
        </View>

        {/* Date */}
        <Text style={styles.date}>{today}</Text>

        {/* Recipient */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>{greetingName}</Text>
          {data.client.adresse && <Text>{data.client.adresse}</Text>}
          {data.client.email && <Text>{data.client.email}</Text>}
        </View>

        {/* Subject */}
        <Text style={styles.subjectLine}>
          {t.subject} {data.dossier.numero ?? "—"}
        </Text>

        {/* Intro */}
        <Text style={styles.paragraph}>{t.intro(greetingName)}</Text>

        {/* 1. Nature */}
        <Text style={styles.sectionTitle}>{t.natureTitle}</Text>
        <Text style={styles.paragraph}>
          {t.natureBody(data.dossier.intitule, data.dossier.type, data.dossier.sousType)}
        </Text>
        {data.dossier.description && (
          <Text style={styles.paragraph}>{data.dossier.description}</Text>
        )}

        {/* 2. Fees */}
        <Text style={styles.sectionTitle}>{t.feesTitle}</Text>
        {isFlat ? (
          <Text style={styles.paragraph}>
            {t.feesFlat(
              data.honoraires.forfait!,
              data.honoraires.devise,
              taxName,
              data.honoraires.taxes.taux
            )}
          </Text>
        ) : isHourly ? (
          <Text style={styles.paragraph}>
            {t.feesHourly(
              data.honoraires.tauxHoraire!,
              data.honoraires.devise,
              taxName,
              data.honoraires.taxes.taux
            )}
          </Text>
        ) : (
          <Text style={[styles.paragraph, styles.highlight]}>
            [Fees to be specified — billing mode not yet configured for this file]
          </Text>
        )}

        {/* 3. Billing */}
        <Text style={styles.sectionTitle}>{t.billingTitle}</Text>
        <Text style={styles.paragraph}>{t.billingBody}</Text>

        {/* 4. Confidentiality */}
        <Text style={styles.sectionTitle}>{t.confTitle}</Text>
        <Text style={styles.paragraph}>{t.confBody}</Text>

        {/* 5. Termination */}
        <Text style={styles.sectionTitle}>{t.termTitle}</Text>
        <Text style={styles.paragraph}>{t.termBody}</Text>

        {/* 6. Confirmation */}
        <Text style={styles.sectionTitle}>{t.closingTitle}</Text>
        <Text style={styles.paragraph}>{t.closingBody}</Text>

        <Text style={[styles.paragraph, { marginTop: 16 }]}>{t.closing}</Text>

        {/* Signatures */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>
            {data.avocat.nom}
            {data.avocat.barreauNumero ? ` — LSO/Barreau #${data.avocat.barreauNumero}` : ""}
          </Text>
          <Text style={styles.signatureLabel}>{t.signLawyer}</Text>

          <View style={[styles.signatureLine, { marginTop: 32 }]} />
          <Text style={styles.signatureLabel}>{greetingName}</Text>
          <Text style={styles.signatureLabel}>
            {t.signClient} — {t.date}: __________________
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          {t.footer(data.cabinet.nom, data.cabinet.barreauNumero)} · {today}
        </Text>
      </Page>
    </Document>
  );
}
