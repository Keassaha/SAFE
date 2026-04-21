import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

/**
 * Mandat de représentation — Droit de l'immigration
 *
 * Conforme à :
 *  - Art. 4.1 Code de déontologie des avocats (Barreau QC, B-1, r.3.1) — obligation de mandat écrit
 *  - Guide des meilleures pratiques en droit de l'immigration — Barreau du Québec
 *  - LIPR (Loi sur l'immigration et la protection des réfugiés)
 *
 * Spécificités immigration vs Engagement Letter standard :
 *  - Clause limitation : l'avocat ne garantit pas le résultat IRCC
 *  - Clause refus/appel : portée de représentation post-décision
 *  - Provision fidéicommis pour frais gouvernementaux (frais IRCC)
 *  - Délais ITA Express Entry (60 jours) si applicable
 *  - Confidentialité renforcée (statut migratoire, données biométriques)
 */

const DARK = "#0F2A47";
const MUTED = "#475569";

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.5 },

  firmHeader: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: DARK,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  firmName: { fontSize: 14, fontWeight: "bold", color: DARK },
  firmInfo: { fontSize: 8.5, color: MUTED, marginTop: 3, lineHeight: 1.5 },
  dateRight: { textAlign: "right", fontSize: 9.5, color: MUTED },

  recipientBlock: { marginBottom: 20 },
  recipientName: { fontWeight: "bold", fontSize: 10 },
  recipientInfo: { fontSize: 9.5, color: MUTED },

  subject: { fontWeight: "bold", fontSize: 10.5, marginBottom: 18, color: DARK },

  paragraph: { marginBottom: 10, fontSize: 9.5, textAlign: "justify", lineHeight: 1.55 },
  bold: { fontWeight: "bold" },

  sectionTitle: {
    fontWeight: "bold",
    fontSize: 10.5,
    color: DARK,
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#94a3b8",
    paddingBottom: 3,
  },

  bulletRow: { flexDirection: "row", marginBottom: 5, paddingLeft: 12 },
  bullet: { width: 12, fontSize: 9.5 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },

  feeTable: {
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#94a3b8",
  },
  feeRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  feeLabel: { flex: 2, fontSize: 9, color: "#374151" },
  feeValue: { flex: 1, fontSize: 9, textAlign: "right", color: DARK, fontWeight: "bold" },

  warningBox: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 4,
    padding: 9,
    marginVertical: 10,
  },
  warningTitle: { fontSize: 9.5, fontWeight: "bold", color: "#92400e", marginBottom: 3 },
  warningText: { fontSize: 8.5, color: "#78350f", lineHeight: 1.5 },

  irccDeadlineBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 4,
    padding: 9,
    marginVertical: 10,
  },
  irccDeadlineTitle: { fontSize: 9.5, fontWeight: "bold", color: "#991b1b", marginBottom: 3 },
  irccDeadlineText: { fontSize: 8.5, color: "#7f1d1d", lineHeight: 1.5 },

  confidentialBox: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#7dd3fc",
    borderRadius: 4,
    padding: 9,
    marginVertical: 10,
  },
  confidentialTitle: { fontSize: 9.5, fontWeight: "bold", color: "#0c4a6e", marginBottom: 3 },
  confidentialText: { fontSize: 8.5, color: "#075985", lineHeight: 1.5 },

  signatureBlock: { marginTop: 28 },
  signatureGrid: { flexDirection: "row", gap: 40, marginTop: 10 },
  signatureCol: { flex: 1 },
  signatureLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginTop: 24, marginBottom: 4 },
  signatureLabel: { fontSize: 8.5, color: MUTED },

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

export type ImmigrationMandateData = {
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
  };
  client: {
    nomComplet: string;
    civilite: string | null;
    adresse: string | null;
    email: string | null;
  };
  dossier: {
    numero: string | null;
    intitule: string;
    typeDemande: string | null;
    irccNumDossier: string | null;
    itaDate: string | null;
    submissionDeadline: string | null;
    irccStatut: string | null;
  };
  honoraires: {
    tauxHoraire: number | null;
    provisionFideicommis: number | null;
    fraisIRCC: number | null;
    currency: string;
  };
  dateMandat: string;
  language: "en" | "fr";
};

const TEXT = {
  fr: {
    dateLabel: "Montréal, le",
    re: "RE :",
    salutation: (civilite: string | null, nom: string) =>
      civilite ? `${civilite} ${nom},` : `${nom},`,
    intro: (avocatNom: string, cabinet: string) =>
      `La présente confirme les termes du mandat que vous nous avez confié, par lequel vous autorisez ${avocatNom}, avocat(e) inscrit(e) au Barreau du Québec, membre du cabinet ${cabinet}, à vous représenter dans le cadre de votre dossier d'immigration décrit ci-dessous.`,

    s1: "1. Mandat et portée de la représentation",
    scope: (type: string | null, ircc: string | null) =>
      `Notre cabinet est mandaté pour vous représenter auprès d'Immigration, Réfugiés et Citoyenneté Canada (IRCC)${type ? ` dans le cadre de votre demande de ${type}` : ""}${ircc ? ` (numéro de dossier IRCC : ${ircc})` : ""}. Notre représentation comprend notamment :`,
    scopeItems: [
      "L'analyse de votre dossier et de votre admissibilité",
      "La préparation et la soumission des formulaires et documents requis",
      "Les communications avec IRCC en votre nom (formulaire IMM 5476 signé)",
      "Le suivi de l'état de votre demande",
      "Les conseils juridiques relatifs à votre dossier d'immigration",
    ],
    exclusions: "La portée du mandat est limitée à ce qui est expressément décrit ci-dessus. Toute démarche supplémentaire (refus en appel, demande connexe, parrainage d'un tiers) fera l'objet d'un avenant ou d'un nouveau mandat.",

    s2: "2. Honoraires et débours",
    feesIntro: "Les honoraires sont établis comme suit :",
    hourlyRate: "Taux horaire",
    provision: "Provision initiale (fidéicommis)",
    irccFees: "Frais gouvernementaux IRCC (estimés)",
    currency: "Devise",
    feesNote: "Les frais gouvernementaux sont payables directement à IRCC et ne constituent pas des honoraires du cabinet. La provision de fidéicommis est détenue dans le compte en fidéicommis du cabinet et imputée selon les honoraires réels engagés.",

    s3: "3. Clause de non-garantie de résultat",
    noGuarantee: "Le cabinet s'engage à mettre tout son savoir-faire et sa diligence au service de votre dossier. Toutefois, conformément aux règles déontologiques du Barreau du Québec et à la nature du droit de l'immigration, le cabinet ne peut garantir l'issue de votre demande. La décision finale appartient aux agents d'IRCC en vertu de la LIPR et de ses règlements. Aucune représentation verbale ou écrite antérieure ne peut être interprétée comme une garantie de résultat.",

    s4: "4. Refus et recours",
    refusalNote: "En cas de refus de votre demande par IRCC, le cabinet vous informera dans les meilleurs délais et vous exposera les options disponibles : demande de reconsidération, appel devant la Section d'appel de l'immigration (SAI), contrôle judiciaire devant la Cour fédérale. Ces recours font l'objet d'un mandat distinct et d'honoraires additionnels.",

    s5: "5. Confidentialité renforcée",
    confidentialNote: "Votre statut migratoire, vos données biométriques, vos antécédents et tout renseignement relatif à votre dossier d'immigration sont soumis au secret professionnel absolu de l'avocat. Ces renseignements ne seront divulgués à aucun tiers sans votre consentement écrit, sauf obligation légale. Conformément à la Loi 25 du Québec, vous avez le droit d'accéder à vos données et de demander leur correction.",

    s6: "6. Obligations du client",
    clientObligations: [
      "Fournir tous les renseignements et documents requis dans les délais impartis",
      "Informer immédiatement le cabinet de tout changement de situation (adresse, emploi, statut familial, voyage)",
      "Répondre aux demandes du cabinet dans un délai de 5 jours ouvrables",
      "Ne pas communiquer directement avec IRCC sans aviser préalablement le cabinet",
    ],

    itaTitle: "⏱ Délai ITA — Express Entry (60 jours)",
    itaText: (deadline: string) =>
      `Votre invitation à présenter une demande (ITA) a été reçue. La demande complète doit être soumise à IRCC au plus tard le ${deadline}. Ce délai est impératif et non extensible. Le défaut de soumettre dans ce délai entraîne l'annulation automatique de l'invitation.`,

    acceptance: "En signant ce mandat, vous confirmez avoir lu, compris et accepté les termes et conditions qui précèdent.",

    clientSig: "Signature du client",
    lawyerSig: "Signature de l'avocat(e)",
    date: "Date :",

    footer: (cabinet: string, barreau: string | null) =>
      `${cabinet}${barreau ? ` — Barreau #${barreau}` : ""} — Mandat de représentation — Droit de l'immigration`,
  },
  en: {
    dateLabel: "Montréal,",
    re: "RE:",
    salutation: (civilite: string | null, nom: string) =>
      civilite ? `Dear ${civilite} ${nom},` : `Dear ${nom},`,
    intro: (avocatNom: string, cabinet: string) =>
      `This letter confirms the terms of the mandate you have entrusted to us, by which you authorize ${avocatNom}, a lawyer admitted to the Barreau du Québec and a member of ${cabinet}, to represent you in connection with your immigration matter described below.`,

    s1: "1. Mandate and Scope of Representation",
    scope: (type: string | null, ircc: string | null) =>
      `Our firm is retained to represent you before Immigration, Refugees and Citizenship Canada (IRCC)${type ? ` in connection with your ${type} application` : ""}${ircc ? ` (IRCC file number: ${ircc})` : ""}. Our representation includes:`,
    scopeItems: [
      "Analysis of your file and admissibility",
      "Preparation and submission of required forms and documents",
      "Communications with IRCC on your behalf (signed IMM 5476 on file)",
      "Monitoring the status of your application",
      "Legal advice regarding your immigration matter",
    ],
    exclusions: "The scope of this mandate is limited to what is expressly described above. Any additional steps (appeals after refusal, related applications, third-party sponsorship) will require a separate addendum or new mandate.",

    s2: "2. Fees and Disbursements",
    feesIntro: "Professional fees are established as follows:",
    hourlyRate: "Hourly rate",
    provision: "Initial retainer (trust account)",
    irccFees: "Government fees — IRCC (estimated)",
    currency: "Currency",
    feesNote: "Government fees are payable directly to IRCC and do not constitute firm fees. The trust retainer is held in the firm's trust account and applied against actual fees incurred.",

    s3: "3. No Guarantee of Outcome",
    noGuarantee: "The firm commits to applying its full expertise and diligence to your matter. However, in accordance with the ethical rules of the Barreau du Québec and the nature of immigration law, the firm cannot guarantee the outcome of your application. The final decision rests with IRCC officers under IRPA and its regulations. No prior verbal or written representation shall be construed as a guarantee of outcome.",

    s4: "4. Refusal and Appeals",
    refusalNote: "In the event your application is refused by IRCC, the firm will notify you promptly and explain available options: reconsideration request, appeal before the Immigration Appeal Division (IAD), judicial review before the Federal Court. Such proceedings require a separate mandate and additional fees.",

    s5: "5. Enhanced Confidentiality",
    confidentialNote: "Your immigration status, biometric data, background information, and all information related to your immigration file are subject to absolute solicitor-client privilege. This information will not be disclosed to any third party without your written consent, except as required by law. Under Quebec Law 25, you have the right to access and correct your personal data.",

    s6: "6. Client Obligations",
    clientObligations: [
      "Provide all required information and documents within specified deadlines",
      "Immediately notify the firm of any change in circumstances (address, employment, marital status, travel)",
      "Respond to firm requests within 5 business days",
      "Do not communicate directly with IRCC without first notifying the firm",
    ],

    itaTitle: "⏱ ITA Deadline — Express Entry (60 days)",
    itaText: (deadline: string) =>
      `Your Invitation to Apply (ITA) has been received. The complete application must be submitted to IRCC no later than ${deadline}. This deadline is mandatory and cannot be extended. Failure to submit within this deadline results in automatic cancellation of the invitation.`,

    acceptance: "By signing this mandate, you confirm that you have read, understood, and accepted the terms and conditions set out above.",

    clientSig: "Client signature",
    lawyerSig: "Lawyer signature",
    date: "Date:",

    footer: (cabinet: string, barreau: string | null) =>
      `${cabinet}${barreau ? ` — Barreau #${barreau}` : ""} — Retainer Letter — Immigration Law`,
  },
} as const;

export function ImmigrationMandatePDF({ data }: { data: ImmigrationMandateData }) {
  const t = TEXT[data.language];
  const h = data.honoraires;
  const d = data.dossier;

  const fmt = (amount: number) =>
    amount.toLocaleString(data.language === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: h.currency,
    });

  const Bullet = ({ text }: { text: string }) => (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Firm header */}
        <View style={styles.firmHeader}>
          <View>
            <Text style={styles.firmName}>{data.cabinet.nom}</Text>
            <Text style={styles.firmInfo}>
              {data.cabinet.adresse ? `${data.cabinet.adresse}\n` : ""}
              {[data.cabinet.telephone, data.cabinet.email].filter(Boolean).join(" · ")}
              {data.cabinet.barreauNumero ? `\nBarreau du Québec #${data.cabinet.barreauNumero}` : ""}
            </Text>
          </View>
          <View>
            <Text style={styles.dateRight}>{t.dateLabel} {data.dateMandat}</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>{data.client.nomComplet}</Text>
          {data.client.adresse && <Text style={styles.recipientInfo}>{data.client.adresse}</Text>}
          {data.client.email && <Text style={styles.recipientInfo}>{data.client.email}</Text>}
        </View>

        {/* Subject */}
        <Text style={styles.subject}>
          {t.re} {data.dossier.intitule}{d.typeDemande ? ` — ${d.typeDemande}` : ""}{d.numero ? ` (${d.numero})` : ""}
        </Text>

        {/* Salutation + intro */}
        <Text style={styles.paragraph}>
          {t.salutation(data.client.civilite, data.client.nomComplet)}
        </Text>
        <Text style={styles.paragraph}>
          {t.intro(data.avocat.nom, data.cabinet.nom)}
        </Text>

        {/* ── ITA DEADLINE BOX (Express Entry only) ── */}
        {d.submissionDeadline && (
          <View style={styles.irccDeadlineBox}>
            <Text style={styles.irccDeadlineTitle}>{t.itaTitle}</Text>
            <Text style={styles.irccDeadlineText}>{t.itaText(d.submissionDeadline)}</Text>
          </View>
        )}

        {/* ── SECTION 1 — SCOPE ── */}
        <Text style={styles.sectionTitle}>{t.s1}</Text>
        <Text style={styles.paragraph}>{t.scope(d.typeDemande, d.irccNumDossier)}</Text>
        {t.scopeItems.map((item, i) => <Bullet key={i} text={item} />)}
        <Text style={[styles.paragraph, { marginTop: 8, color: MUTED, fontSize: 9 }]}>
          {t.exclusions}
        </Text>

        {/* ── SECTION 2 — FEES ── */}
        <Text style={styles.sectionTitle}>{t.s2}</Text>
        <Text style={styles.paragraph}>{t.feesIntro}</Text>
        <View style={styles.feeTable}>
          {h.tauxHoraire !== null && (
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>{t.hourlyRate}</Text>
              <Text style={styles.feeValue}>{fmt(h.tauxHoraire)}/hr</Text>
            </View>
          )}
          {h.provisionFideicommis !== null && (
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>{t.provision}</Text>
              <Text style={styles.feeValue}>{fmt(h.provisionFideicommis)}</Text>
            </View>
          )}
          {h.fraisIRCC !== null && (
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>{t.irccFees}</Text>
              <Text style={styles.feeValue}>{fmt(h.fraisIRCC)}</Text>
            </View>
          )}
          <View style={[styles.feeRow, { backgroundColor: "#f8fafc", borderBottomWidth: 0 }]}>
            <Text style={styles.feeLabel}>{t.currency}</Text>
            <Text style={styles.feeValue}>{h.currency}</Text>
          </View>
        </View>
        <Text style={[styles.paragraph, { color: MUTED, fontSize: 9 }]}>{t.feesNote}</Text>

        {/* ── SECTION 3 — NO GUARANTEE ── */}
        <Text style={styles.sectionTitle}>{t.s3}</Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠ {t.s3}</Text>
          <Text style={styles.warningText}>{t.noGuarantee}</Text>
        </View>

        {/* ── SECTION 4 — REFUSAL ── */}
        <Text style={styles.sectionTitle}>{t.s4}</Text>
        <Text style={styles.paragraph}>{t.refusalNote}</Text>

        {/* ── SECTION 5 — CONFIDENTIALITY ── */}
        <Text style={styles.sectionTitle}>{t.s5}</Text>
        <View style={styles.confidentialBox}>
          <Text style={styles.confidentialTitle}>🔒 {t.s5}</Text>
          <Text style={styles.confidentialText}>{t.confidentialNote}</Text>
        </View>

        {/* ── SECTION 6 — CLIENT OBLIGATIONS ── */}
        <Text style={styles.sectionTitle}>{t.s6}</Text>
        {t.clientObligations.map((item, i) => <Bullet key={i} text={item} />)}

        {/* Acceptance clause */}
        <Text style={[styles.paragraph, { marginTop: 16, fontStyle: "italic" }]}>
          {t.acceptance}
        </Text>

        {/* Signatures */}
        <View style={styles.signatureGrid}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.clientSig}</Text>
            <Text style={styles.signatureLabel}>{data.client.nomComplet}</Text>
          </View>
          <View style={{ width: 110 }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.date}</Text>
          </View>
        </View>

        <View style={[styles.signatureGrid, { marginTop: 20 }]}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t.lawyerSig}</Text>
            <Text style={styles.signatureLabel}>
              {data.avocat.nom}{data.avocat.barreauNumero ? ` — Barreau #${data.avocat.barreauNumero}` : ""}
            </Text>
          </View>
          <View style={{ width: 110 }}>
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
