/**
 * SAFE — Brouillon « Mandat de représentation » (react-pdf), variante Derisier Law.
 *
 * BILINGUE (FR/EN) — le corps juridique est piloté par les données
 * (`CONTENT[language]`) et reproduit fidèlement les gabarits FOURNIS par le
 * cabinet (PDF FR + PDF EN). Les deux versions n'ont volontairement PAS la
 * même structure d'obligations : la version FR comporte une section « Aide
 * juridique » (A→J) absente de la version EN (A→I). On ne normalise pas : on
 * suit chaque source.
 *
 * Habillage identique à la facture Derisier : barre d'accent, logo, filets fins,
 * max 2 couleurs (1 accent marron + neutres). JAMAIS de n° de Barreau / LSO.
 *
 * DOCTRINE :
 *   - Aucune logique métier : reçoit des données déjà préparées + des
 *     emplacements (« ____ ») pour les champs variables non renseignés.
 *   - C'est un BROUILLON : à relire et valider par une personne autorisée
 *     avant signature.
 */

import * as React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { font } from "../invoice-template/tokens";

const PLACEHOLDER = "____________";

const ink = {
  text: "#18181B",
  muted: "#52525B",
  faint: "#A1A1AA",
  hair: "#E4E4E7",
  hairStrong: "#D4D4D8",
  accent: "#7A3B2E",
  accentSoft: "#F5EFED",
  white: "#FFFFFF",
} as const;

type Lang = "fr" | "en";

export interface MandatCabinet {
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  signature?: { name: string; title: { fr: string; en: string } } | null;
}

export interface MandatRepresentationData {
  cabinet: MandatCabinet;
  clientName?: string | null;
  lieu?: string | null;
  date?: string | null;
  objet?: string | null;
  finsDuMandat?: string | null;
  honoraires?: string | null;
  tvh?: string | null;
  total?: string | null;
}

interface MandatRepresentationDocumentProps {
  data: MandatRepresentationData;
  language?: Lang;
}

/** Une clause d'obligation : corps et/ou liste à puces, encadré honoraires optionnel. */
interface Clause {
  letter: string;
  title: string;
  body?: string;
  items?: string[];
  feeBox?: boolean;
  afterBox?: string;
}

interface MandateContent {
  kicker: string;
  objetLabel: string;
  salut: (client: string) => string;
  intro: string;
  feeLabel: string;
  tvhLabel: string;
  totalLabel: string;
  feeNote: string;
  title: string;
  s1Title: string;
  s1Lead: string; // « Je, soussigné(e), » / « I, the undersigned, »
  s1Mid: string; // « , autorise DERISIER LAW… » / « , authorize… »
  s1FeePrefix: string; // phrase honoraires section 1
  s1FeeSuffix: string;
  s2Title: string;
  s2Body: string;
  s3Title: string;
  clauses: Clause[];
  s4Title: string;
  s4Lead: string;
  s4Items: string[];
  s5Title: string;
  s5Body: string;
  s6Title: string;
  s6Body: string;
  signedLine: (lieu: string, date: string) => string;
  repRole: string;
  clientRole: string;
}

const CONTENT: Record<Lang, MandateContent> = {
  fr: {
    kicker: "MANDAT",
    objetLabel: "Objet",
    salut: (c) => `Cher/Chère ${c},`,
    intro:
      "Nous vous remercions de la confiance que vous accordez à DERISIER LAW. La présente confirme que vous retenez les services de DERISIER LAW relativement à l'objet ci-dessus, aux conditions énoncées dans le mandat de représentation qui suit.",
    feeLabel: "Honoraires pour ce service",
    tvhLabel: "TVH (13 %)",
    totalLabel: "Total à payer à DERISIER LAW",
    feeNote:
      "Ces honoraires n'incluent pas les frais gouvernementaux d'Immigration, Réfugiés et Citoyenneté Canada (IRCC), qui demeurent à votre charge et vous sont facturés en sus le cas échéant.",
    title: "MANDAT DE REPRÉSENTATION",
    s1Title: "1. Nature du mandat",
    s1Lead: "Je, soussigné(e), ",
    s1Mid: ", autorise DERISIER LAW à me représenter uniquement aux fins suivantes : ",
    s1FeePrefix: ". Les honoraires applicables à ce mandat s'élèvent à ",
    s1FeeSuffix: " (plus la TVH).",
    s2Title: "2. Confidentialité et divulgation",
    s2Body:
      "DERISIER LAW s'engage à préserver la confidentialité de l'ensemble des renseignements que vous lui communiquez. En contrepartie, vous vous engagez à divulguer à DERISIER LAW tous les renseignements et faits pertinents à votre dossier, qu'ils vous soient favorables ou défavorables. L'omission de divulguer un fait pertinent peut compromettre votre dossier et dégager DERISIER LAW de toute responsabilité à cet égard.",
    s3Title: "3. Obligations du client",
    clauses: [
      {
        letter: "A",
        title: "Conduite professionnelle",
        body:
          "DERISIER LAW applique une politique de tolérance zéro à l'égard de tout comportement abusif, menaçant ou irrespectueux. Un tel comportement entraîne la résiliation immédiate du mandat, sans remboursement des honoraires déjà versés.",
      },
      {
        letter: "B",
        title: "Bureau virtuel et politique de communication",
        body: "DERISIER LAW fonctionne selon un modèle de bureau virtuel afin d'assurer des réponses rapides :",
        items: [
          "Le courriel constitue le mode de communication privilégié avec le cabinet.",
          "Les messages vocaux font l'objet d'un rappel dans un délai de 48 heures ouvrables.",
          "Les suivis de routine sont assurés par le personnel de soutien (commis), et non directement par l'avocate.",
          "Les appels directs à l'avocate sont réservés aux nouvelles preuves, aux avis juridiques et aux renseignements significatifs ; veuillez préciser le motif de votre appel.",
        ],
      },
      {
        letter: "C",
        title: "Responsabilité du client — communications d'IRCC",
        body:
          "Vous êtes seul(e) responsable de consulter les correspondances reçues d'IRCC et d'en informer promptement DERISIER LAW.",
      },
      {
        letter: "D",
        title: "Contact autorisé",
        body:
          "Seul(e) le client peut communiquer avec le cabinet relativement au dossier. Les membres de la famille ou des tiers ne peuvent demander de renseignements ni donner d'instructions en votre nom, sauf autorisation écrite expresse.",
      },
      {
        letter: "E",
        title: "Heures d'ouverture",
        body:
          "Le cabinet est ouvert du lundi au vendredi, de 9 h à 17 h, et fermé les jours fériés. Les appels reçus après 17 h sont dirigés vers la messagerie vocale ; laissez votre nom et le motif de votre appel pour être rappelé(e) durant les heures d'ouverture. Les urgences survenant en dehors des heures d'ouverture sont traitées le jour ouvrable suivant.",
      },
      {
        letter: "F",
        title: "Responsabilités financières",
        feeBox: true,
        afterBox:
          "Ces honoraires n'incluent pas les frais d'IRCC, que vous êtes seul(e) responsable d'acquitter directement. Vous êtes également responsable des débours engagés dans votre dossier (notamment messagerie, traduction et frais administratifs) et vous vous engagez à acquitter la TVH sur l'ensemble des honoraires et des débours.",
      },
      {
        letter: "G",
        title: "Coopération",
        body:
          "Vous vous engagez à faire preuve de courtoisie envers le personnel de DERISIER LAW, à suivre les instructions de l'équipe juridique, à aviser à l'avance en cas d'absence à un rendez-vous et à fournir les documents requis dans les délais demandés.",
      },
      {
        letter: "H",
        title: "Client de l'aide juridique",
        body:
          "Si vous bénéficiez de l'aide juridique de l'Ontario, les services sont assujettis aux limites d'heures et aux conditions fixées par Aide juridique Ontario.",
      },
      {
        letter: "I",
        title: "Délais des portails",
        items: [
          "Certains portails d'immigration expirent automatiquement si les documents requis ne sont pas soumis dans les délais fixés par IRCC.",
          "Vous êtes seul(e) responsable de la transmission, en temps utile, de tous les documents demandés à DERISIER LAW.",
          "Si une session de portail expire ou si le dossier doit être réinitialisé en raison d'un retard qui vous est imputable, des frais de réinitialisation de 375,00 $ s'appliquent.",
        ],
      },
      {
        letter: "J",
        title: "Frais de dossier urgent",
        items: [
          "Tout dossier requérant un traitement dans un délai inférieur à 15 jours ouvrables est assujetti à des frais d'urgence non remboursables de 450,00 $, payables d'avance.",
        ],
      },
    ],
    s4Title: "4. Résiliation du mandat",
    s4Lead: "Le présent mandat de représentation peut prendre fin dans l'un ou l'autre des cas suivants :",
    s4Items: [
      "l'achèvement des services décrits à la section 1 ;",
      "le défaut du client de fournir les mises à jour ou les instructions requises ;",
      "le manquement du client à l'une de ses obligations prévues au présent mandat ;",
      "la demande du client d'accomplir un acte contraire au Code de déontologie du Barreau de l'Ontario ;",
      "la perte fondamentale du lien de confiance entre le client et son représentant ;",
      "l'insuffisance de preuves justifiant l'affectation des ressources de DERISIER LAW au dossier ;",
      "le décès du client.",
    ],
    s5Title: "5. Abandon du dossier",
    s5Body:
      "En cas d'abandon du dossier par le client, ce dernier demeure tenu d'acquitter l'ensemble des services rendus jusqu'à la date d'abandon. L'abandon peut être exprès ou implicite.",
    s6Title: "6. Reconnaissance",
    s6Body:
      "Je reconnais avoir lu et compris l'intégralité du présent mandat de représentation, qu'un membre de DERISIER LAW m'en a expliqué le contenu, et j'en accepte toutes les conditions.",
    signedLine: (lieu, date) => `Signé à ${lieu}, ${date}.`,
    repRole: "SIGNATURE DU REPRÉSENTANT",
    clientRole: "SIGNATURE DU CLIENT",
  },
  en: {
    kicker: "MANDATE",
    objetLabel: "RE",
    salut: (c) => `Dear ${c},`,
    intro:
      "This is to confirm that you have retained DERISIER LAW to represent you regarding the matter referenced above, on the terms set out in the representation mandate below.",
    feeLabel: "Legal fee for this service",
    tvhLabel: "HST (13%)",
    totalLabel: "Total payable to DERISIER LAW",
    feeNote: "Please note that our legal fee does not include IRCC government fees.",
    title: "REPRESENTATION MANDATE",
    s1Title: "1. Nature of the Mandate",
    s1Lead: "I, the undersigned, ",
    s1Mid: ", authorize DERISIER LAW to represent me for the following purpose(s) only: ",
    s1FeePrefix: ". The applicable fee for this mandate is ",
    s1FeeSuffix: " (plus HST).",
    s2Title: "2. Confidentiality and Disclosure",
    s2Body:
      "All information obtained about me will be kept strictly confidential. I authorize DERISIER LAW to use this information in connection with my file unless I expressly indicate otherwise. I undertake to disclose to DERISIER LAW all relevant information, whether favorable or unfavorable to my case.",
    s3Title: "3. Client Obligations",
    clauses: [
      {
        letter: "A",
        title: "Professional Conduct",
        body:
          "Zero Tolerance Policy: I agree to always maintain respectful and professional communication. Abusive language, threatening behaviour, or disrespect toward any DERISIER LAW staff will not be tolerated and may result in termination of the mandate without refund.",
      },
      {
        letter: "B",
        title: "Virtual Office & Communication Policy",
        body: "To improve efficiency and ensure timely responses, DERISIER LAW operates under a virtual office model:",
        items: [
          "Email is the primary method of communication. All general inquiries, document submissions, and follow-ups must be sent by email whenever possible.",
          "Voicemails may be left if required, and we will return calls within 48 hours.",
          "Routine follow-ups — such as updates on processing times, payments, administrative matters, or general inquiries — will be handled by clerks or administrative staff, not by the lawyer.",
          "Direct calls with the lawyer are reserved exclusively for discussing new evidence relevant to my case, obtaining legal advice, or providing information that could significantly impact the outcome of my case.",
          "When contacting the office, I agree to state the reason for my call so that my request can be properly directed and resolved efficiently.",
        ],
      },
      {
        letter: "C",
        title: "Client's Responsibility for IRCC Communication",
        body:
          "I acknowledge that I am solely responsible for carefully reviewing all correspondence from IRCC related to my application. I agree to promptly inform DERISIER LAW of any notices, requests, or updates received from IRCC.",
      },
      {
        letter: "D",
        title: "Authorized Contact",
        body:
          "I understand that only I, as a client, am authorized to contact DERISIER LAW about my file. Family members or third parties may not request information or provide instructions on my behalf unless expressly authorized in writing.",
      },
      {
        letter: "E",
        title: "Office Hours & Voicemail Policy",
        body: "I understand that DERISIER LAW is open Monday to Friday, 9:00 AM to 5:00 PM, and closed on all statutory holidays.",
        items: [
          "After 5:00 PM, incoming calls are automatically redirected to voicemail.",
          "If I call outside business hours, I must leave a voicemail with my name and the reason for my call to receive a callback during office hours.",
          "Urgent matters outside business hours will not be addressed until the next working day.",
        ],
      },
      {
        letter: "F",
        title: "Financial Responsibilities",
        feeBox: true,
        afterBox:
          "I understand that DERISIER LAW's fees do not include IRCC fees. I am solely responsible for paying all IRCC government fees directly. I am also responsible for all disbursements related to my file, including but not limited to courier costs, translation fees, and other administrative expenses. I agree to pay HST on all legal fees and disbursements as required by law.",
      },
      {
        letter: "G",
        title: "Cooperation",
        body:
          "I agree to be courteous and respectful to all DERISIER LAW staff, follow all instructions provided by the legal team, notify DERISIER LAW in advance if I am unable to attend an appointment, and provide all requested information and documents in a timely manner.",
      },
      {
        letter: "H",
        title: "Portal Deadlines",
        items: [
          "I understand that certain immigration portals time out automatically if required documents are not submitted within IRCC's specified deadlines.",
          "I am solely responsible for providing all requested documents to DERISIER LAW in a timely manner.",
          "If a portal session expires or the file must be restarted because I failed to provide documents on time, an additional $375.00 restart fee will apply.",
        ],
      },
      {
        letter: "I",
        title: "Rush File Fee",
        items: [
          "Any file requiring a turnaround time of less than 15 business days is subject to a non-refundable $450.00 rush fee, which is payable in advance.",
        ],
      },
    ],
    s4Title: "4. Termination of Mandate",
    s4Lead: "I understand that this representation mandate may end:",
    s4Items: [
      "Upon completion of the services described in Item 1;",
      "If I fail to provide updates or direction regarding my case;",
      "If I fail to comply with the above obligations;",
      "If I request actions contrary to the Code of Ethics of the Law Society of Ontario;",
      "If there is a fundamental loss of trust between me and my legal representative;",
      "If the evidence supporting my case is insufficient to justify the use of DERISIER LAW's resources;",
      "Upon my death.",
    ],
    s5Title: "5. Abandonment of File",
    s5Body:
      "Should I choose to abandon my file, I agree to pay for all services rendered up to the date of abandonment. Abandonment may be explicit or implicit.",
    s6Title: "6. Acknowledgement",
    s6Body:
      "I confirm that I have read and understood this legal representation mandate. A member of DERISIER LAW has explained its content to me, and I accept all terms and conditions.",
    signedLine: (lieu, date) => `Signed in ${lieu} on ${date}.`,
    repRole: "SIGNATURE OF REPRESENTATIVE",
    clientRole: "SIGNATURE OF CLIENT",
  },
};

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 54,
    paddingTop: 30,
    paddingBottom: 58,
    fontSize: 9.5,
    fontFamily: font.family,
    color: ink.text,
    backgroundColor: ink.white,
    lineHeight: 1.5,
  },
  topBar: { height: 4, backgroundColor: ink.accent, marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  identity: { flexShrink: 1, paddingRight: 18 },
  logo: { width: 52, height: 52, objectFit: "contain", marginBottom: 5 },
  firmName: { fontSize: 15, fontFamily: font.bold, color: ink.text, letterSpacing: 0.4, marginBottom: 5 },
  firmMeta: { fontSize: 8, color: ink.muted, lineHeight: 1.4 },
  headerRight: { alignItems: "flex-end" },
  kicker: { fontSize: 8, fontFamily: font.bold, color: ink.accent, letterSpacing: 2.5 },
  headerRule: { height: 1, backgroundColor: ink.hair, marginTop: 12, marginBottom: 14 },

  metaLine: { fontSize: 9.5, color: ink.text, marginBottom: 2 },
  objetLine: { fontSize: 9.5, fontFamily: font.bold, color: ink.text, marginTop: 8, marginBottom: 8 },
  salut: { fontSize: 9.5, color: ink.text, marginBottom: 8 },
  para: { fontSize: 9.5, color: ink.text, marginBottom: 8, lineHeight: 1.55, textAlign: "justify" },

  feeBox: {
    borderWidth: 1,
    borderColor: ink.hair,
    borderRadius: 5,
    backgroundColor: ink.accentSoft,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 10,
  },
  feeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  feeLabel: { fontSize: 9, color: ink.muted },
  feeValue: { fontSize: 9, color: ink.text },
  feeTotalLabel: { fontSize: 9.5, fontFamily: font.bold, color: ink.accent },
  feeTotalValue: { fontSize: 10, fontFamily: font.bold, color: ink.text },
  feeDivider: { height: 1, backgroundColor: ink.hairStrong, marginVertical: 5 },

  mandatTitle: {
    fontSize: 13,
    fontFamily: font.bold,
    color: ink.text,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  titleRule: { height: 2, width: 56, backgroundColor: ink.accent, alignSelf: "center", marginBottom: 14 },

  sectionTitle: { fontSize: 10, fontFamily: font.bold, color: ink.accent, marginTop: 12, marginBottom: 5 },
  subTitle: { fontSize: 9.5, fontFamily: font.bold, color: ink.text, marginTop: 6, marginBottom: 2 },
  listItem: { flexDirection: "row", marginBottom: 4, paddingRight: 4 },
  bullet: { fontSize: 9.5, color: ink.accent, marginRight: 6 },
  listText: { fontSize: 9.5, color: ink.text, lineHeight: 1.5, flexShrink: 1, textAlign: "justify" },
  highlight: { fontFamily: font.bold, color: ink.text },

  signWrap: { marginTop: 18 },
  signIntro: { fontSize: 9.5, color: ink.text, marginBottom: 14 },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 22 },
  signCol: { flexBasis: "46%" },
  signLine: { height: 1, backgroundColor: ink.hairStrong, marginBottom: 5 },
  signRole: { fontSize: 8, color: ink.faint, letterSpacing: 0.6, marginBottom: 1 },
  signName: { fontSize: 9.5, fontFamily: font.bold, color: ink.text },
  signSub: { fontSize: 8, color: ink.muted, marginTop: 1 },

  footer: {
    position: "absolute",
    bottom: 26,
    left: 54,
    right: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: ink.hair,
  },
  footerFirm: { fontSize: 7.5, color: ink.faint, letterSpacing: 0.4 },
  footerPage: { fontSize: 7.5, color: ink.faint },
});

function cabinetAddressLines(adresse?: string | null): string[] {
  if (!adresse) return [];
  const byNewline = adresse.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  return adresse.split(",").map((s) => s.trim()).filter(Boolean);
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.bullet}>—</Text>
      <Text style={styles.listText}>{children}</Text>
    </View>
  );
}

function FeeBox({
  c,
  honoraires,
  tvh,
  total,
}: {
  c: MandateContent;
  honoraires: string;
  tvh: string;
  total: string;
}) {
  return (
    <View style={styles.feeBox}>
      <View style={styles.feeRow}>
        <Text style={styles.feeLabel}>{c.feeLabel}</Text>
        <Text style={styles.feeValue}>{honoraires}</Text>
      </View>
      <View style={styles.feeRow}>
        <Text style={styles.feeLabel}>{c.tvhLabel}</Text>
        <Text style={styles.feeValue}>{tvh}</Text>
      </View>
      <View style={styles.feeDivider} />
      <View style={styles.feeRow}>
        <Text style={styles.feeTotalLabel}>{c.totalLabel}</Text>
        <Text style={styles.feeTotalValue}>{total}</Text>
      </View>
    </View>
  );
}

/**
 * Brouillon « Mandat de représentation » — Derisier Law, FR/EN.
 */
export function MandatRepresentationDocument({
  data,
  language = "fr",
}: MandatRepresentationDocumentProps) {
  const c = CONTENT[language];
  const { cabinet } = data;
  const cabAddr = cabinetAddressLines(cabinet.adresse);
  const client = (data.clientName ?? "").trim() || PLACEHOLDER;
  const lieu = (data.lieu ?? "").trim() || "Ottawa";
  const dateStr =
    (data.date ?? "").trim() ||
    (language === "en" ? `the ${PLACEHOLDER} day of ${PLACEHOLDER}, 202${PLACEHOLDER}` : `le ${PLACEHOLDER} 202${PLACEHOLDER}`);
  const objet = (data.objet ?? "").trim() || PLACEHOLDER;
  const fins =
    (data.finsDuMandat ?? "").trim() ||
    (language === "en" ? `${PLACEHOLDER} (specify the services and type of application)` : `${PLACEHOLDER} (précisez les services et le type de demande)`);
  const honoraires = (data.honoraires ?? "").trim() || PLACEHOLDER;
  const tvh = (data.tvh ?? "").trim() || PLACEHOLDER;
  const total = (data.total ?? "").trim() || PLACEHOLDER;

  const rep = cabinet.signature ?? null;
  const repName = rep?.name ?? PLACEHOLDER;
  const repTitle = rep ? (language === "en" ? rep.title.en : rep.title.fr) : "";

  return (
    <Document author={cabinet.nom} title={c.title} creator="SAFE — Cabinet juridique" producer="@react-pdf/renderer">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.topBar} fixed />

        <View style={styles.header} fixed>
          <View style={styles.identity}>
            {cabinet.logoUrl ? (
              <Image style={styles.logo} src={cabinet.logoUrl} />
            ) : (
              <Text style={styles.firmName}>{cabinet.nom.toUpperCase()}</Text>
            )}
            {cabAddr.map((line, i) => (
              <Text key={i} style={styles.firmMeta}>
                {line}
              </Text>
            ))}
            {cabinet.telephone ? <Text style={styles.firmMeta}>{cabinet.telephone}</Text> : null}
            {cabinet.email ? <Text style={styles.firmMeta}>{cabinet.email}</Text> : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.kicker}>{c.kicker}</Text>
          </View>
        </View>
        <View style={styles.headerRule} fixed />

        {/* Lettre d'accompagnement */}
        <Text style={styles.metaLine}>
          {lieu}, {dateStr}
        </Text>
        <Text style={styles.objetLine}>
          {c.objetLabel} : {objet}
        </Text>
        <Text style={styles.salut}>{c.salut(client)}</Text>
        <Text style={styles.para}>{c.intro}</Text>

        <FeeBox c={c} honoraires={honoraires} tvh={tvh} total={total} />
        <Text style={styles.para}>{c.feeNote}</Text>

        {/* Titre du mandat */}
        <Text style={styles.mandatTitle}>{c.title}</Text>
        <View style={styles.titleRule} />

        {/* 1. Nature */}
        <Text style={styles.sectionTitle}>{c.s1Title}</Text>
        <Text style={styles.para}>
          {c.s1Lead}
          <Text style={styles.highlight}>{client}</Text>
          {c.s1Mid}
          {fins}
          {c.s1FeePrefix}
          <Text style={styles.highlight}>{honoraires}</Text>
          {c.s1FeeSuffix}
        </Text>

        {/* 2. Confidentialité */}
        <Text style={styles.sectionTitle}>{c.s2Title}</Text>
        <Text style={styles.para}>{c.s2Body}</Text>

        {/* 3. Obligations */}
        <Text style={styles.sectionTitle}>{c.s3Title}</Text>
        {c.clauses.map((cl) => (
          <View key={cl.letter} wrap={false}>
            <Text style={styles.subTitle}>
              {cl.letter}. {cl.title}
            </Text>
            {cl.body ? <Text style={styles.para}>{cl.body}</Text> : null}
            {cl.feeBox ? <FeeBox c={c} honoraires={honoraires} tvh={tvh} total={total} /> : null}
            {cl.afterBox ? <Text style={styles.para}>{cl.afterBox}</Text> : null}
            {cl.items?.map((it, i) => (
              <Item key={i}>{it}</Item>
            ))}
          </View>
        ))}

        {/* 4. Résiliation */}
        <Text style={styles.sectionTitle}>{c.s4Title}</Text>
        <Text style={styles.para}>{c.s4Lead}</Text>
        {c.s4Items.map((it, i) => (
          <Item key={i}>{it}</Item>
        ))}

        {/* 5. Abandon */}
        <Text style={styles.sectionTitle}>{c.s5Title}</Text>
        <Text style={styles.para}>{c.s5Body}</Text>

        {/* 6. Reconnaissance */}
        <Text style={styles.sectionTitle}>{c.s6Title}</Text>
        <Text style={styles.para}>{c.s6Body}</Text>

        {/* Signatures */}
        <View style={styles.signWrap} wrap={false}>
          <Text style={styles.signIntro}>{c.signedLine(lieu, dateStr)}</Text>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <View style={styles.signLine} />
              <Text style={styles.signRole}>{c.repRole}</Text>
              <Text style={styles.signName}>{repName}</Text>
              {repTitle ? (
                <Text style={styles.signSub}>
                  {repTitle} · {cabinet.nom}
                </Text>
              ) : null}
            </View>
            <View style={styles.signCol}>
              <View style={styles.signLine} />
              <Text style={styles.signRole}>{c.clientRole}</Text>
              <Text style={styles.signName}>{client}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerFirm}>
            {cabinet.nom} — {c.title}
          </Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
