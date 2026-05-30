/**
 * SAFE — Brouillon « Mandat de représentation » (react-pdf), variante Derisier Law.
 *
 * Reproduit fidèlement la STRUCTURE du mandat de représentation fourni par le
 * cabinet (lettre d'accompagnement + 6 sections numérotées + bloc signatures),
 * habillé avec la MÊME image de marque que la facture Derisier :
 *   - logo (data-URI) en haut à gauche, coordonnées du cabinet ;
 *   - barre d'accent marron, filets fins, typographie sobre ;
 *   - max 2 couleurs (1 accent marron + neutres) — règle dure CEO.
 *
 * DOCTRINE :
 *   - Aucune logique métier : reçoit des données déjà préparées + des
 *     emplacements (« ____ ») pour les champs variables non renseignés.
 *   - C'est un BROUILLON : le texte juridique reproduit le gabarit du cabinet ;
 *     il doit être relu et validé par une personne autorisée avant signature.
 *   - JAMAIS de n° de Barreau / LSO (règle dure CEO 2026-05-12).
 *
 * Bilingue prévu, mais seul le corps FR est rédigé (le gabarit source du
 * cabinet est en français). `language="en"` n'adapte que le chrome ; le corps
 * juridique EN devra être fourni/validé séparément.
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

export interface MandatCabinet {
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  /** Signataire du cabinet (nom + titre). Repris de `cabinet.invoiceSignature`. */
  signature?: { name: string; title: { fr: string; en: string } } | null;
}

export interface MandatRepresentationData {
  cabinet: MandatCabinet;
  /** Nom du client (mandant). */
  clientName?: string | null;
  /** Lieu de signature (ex. « Ottawa »). */
  lieu?: string | null;
  /** Date de la lettre (chaîne libre déjà formatée, ex. « le 30 mai 2026 »). */
  date?: string | null;
  /** Objet / type de demande (ex. « Demande de résidence permanente »). */
  objet?: string | null;
  /** Description des fins du mandat (section 1). */
  finsDuMandat?: string | null;
  /** Honoraires, TVH et total (chaînes déjà formatées, ex. « 2 500,00 $ »). */
  honoraires?: string | null;
  tvh?: string | null;
  total?: string | null;
}

interface MandatRepresentationDocumentProps {
  data: MandatRepresentationData;
  language?: "fr" | "en";
}

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

  // En-tête cabinet (répété sur chaque page).
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  identity: { flexShrink: 1, paddingRight: 18 },
  logo: { width: 52, height: 52, objectFit: "contain", marginBottom: 5 },
  firmName: { fontSize: 15, fontFamily: font.bold, color: ink.text, letterSpacing: 0.4, marginBottom: 5 },
  firmMeta: { fontSize: 8, color: ink.muted, lineHeight: 1.4 },
  headerRight: { alignItems: "flex-end" },
  kicker: { fontSize: 8, fontFamily: font.bold, color: ink.accent, letterSpacing: 2.5 },

  headerRule: { height: 1, backgroundColor: ink.hair, marginTop: 12, marginBottom: 14 },

  // Lettre d'accompagnement.
  metaLine: { fontSize: 9.5, color: ink.text, marginBottom: 2 },
  objetLine: { fontSize: 9.5, fontFamily: font.bold, color: ink.text, marginTop: 8, marginBottom: 8 },
  salut: { fontSize: 9.5, color: ink.text, marginBottom: 8 },
  para: { fontSize: 9.5, color: ink.text, marginBottom: 8, lineHeight: 1.55, textAlign: "justify" },

  // Encadré honoraires.
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

  // Titre du mandat.
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

  // Sections.
  sectionTitle: { fontSize: 10, fontFamily: font.bold, color: ink.accent, marginTop: 12, marginBottom: 5 },
  subTitle: { fontSize: 9.5, fontFamily: font.bold, color: ink.text, marginTop: 6, marginBottom: 2 },
  listItem: { flexDirection: "row", marginBottom: 4, paddingRight: 4 },
  bullet: { fontSize: 9.5, color: ink.accent, marginRight: 6 },
  listText: { fontSize: 9.5, color: ink.text, lineHeight: 1.5, flexShrink: 1, textAlign: "justify" },

  highlight: { fontFamily: font.bold, color: ink.text },

  // Bloc signatures.
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

/** Item de liste à puce (— ) avec texte justifié. */
function Item({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.bullet}>—</Text>
      <Text style={styles.listText}>{children}</Text>
    </View>
  );
}

/**
 * Brouillon « Mandat de représentation » — Derisier Law.
 */
export function MandatRepresentationDocument({
  data,
  language = "fr",
}: MandatRepresentationDocumentProps) {
  const { cabinet } = data;
  const cabAddr = cabinetAddressLines(cabinet.adresse);
  const client = (data.clientName ?? "").trim() || PLACEHOLDER;
  const lieu = (data.lieu ?? "").trim() || "Ottawa";
  const dateStr = (data.date ?? "").trim() || `le ${PLACEHOLDER} 202${PLACEHOLDER}`;
  const objet = (data.objet ?? "").trim() || PLACEHOLDER;
  const fins = (data.finsDuMandat ?? "").trim() || `${PLACEHOLDER} (précisez les services et le type de demande)`;
  const honoraires = (data.honoraires ?? "").trim() || PLACEHOLDER;
  const tvh = (data.tvh ?? "").trim() || PLACEHOLDER;
  const total = (data.total ?? "").trim() || PLACEHOLDER;

  const rep = cabinet.signature ?? null;
  const repName = rep?.name ?? PLACEHOLDER;
  const repTitle = rep ? (language === "en" ? rep.title.en : rep.title.fr) : "";

  return (
    <Document
      author={cabinet.nom}
      title="Mandat de représentation"
      creator="SAFE — Cabinet juridique"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.topBar} fixed />

        {/* En-tête cabinet — répété sur chaque page */}
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
            <Text style={styles.kicker}>MANDAT</Text>
          </View>
        </View>
        <View style={styles.headerRule} fixed />

        {/* ── Lettre d'accompagnement ──────────────────────────────── */}
        <Text style={styles.metaLine}>{lieu}, {dateStr}</Text>
        <Text style={styles.objetLine}>Objet : {objet}</Text>
        <Text style={styles.salut}>Cher/Chère {client},</Text>

        <Text style={styles.para}>
          Nous vous remercions de la confiance que vous accordez à DERISIER LAW. La présente
          confirme que vous retenez les services de DERISIER LAW relativement à l'objet ci-dessus,
          aux conditions énoncées dans le mandat de représentation qui suit.
        </Text>

        <View style={styles.feeBox}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Honoraires pour ce service</Text>
            <Text style={styles.feeValue}>{honoraires}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>TVH (13 %)</Text>
            <Text style={styles.feeValue}>{tvh}</Text>
          </View>
          <View style={styles.feeDivider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeTotalLabel}>Total à payer à DERISIER LAW</Text>
            <Text style={styles.feeTotalValue}>{total}</Text>
          </View>
        </View>

        <Text style={styles.para}>
          Ces honoraires n'incluent pas les frais gouvernementaux d'Immigration, Réfugiés et
          Citoyenneté Canada (IRCC), qui demeurent à votre charge et vous sont facturés en sus le
          cas échéant.
        </Text>

        {/* ── Titre du mandat ──────────────────────────────────────── */}
        <Text style={styles.mandatTitle}>MANDAT DE REPRÉSENTATION</Text>
        <View style={styles.titleRule} />

        {/* 1. Nature du mandat */}
        <Text style={styles.sectionTitle}>1. Nature du mandat</Text>
        <Text style={styles.para}>
          Je, soussigné(e), <Text style={styles.highlight}>{client}</Text>, autorise DERISIER LAW à
          me représenter uniquement aux fins suivantes : {fins}. Les honoraires applicables à ce
          mandat s'élèvent à <Text style={styles.highlight}>{honoraires}</Text> (plus la TVH).
        </Text>

        {/* 2. Confidentialité et divulgation */}
        <Text style={styles.sectionTitle}>2. Confidentialité et divulgation</Text>
        <Text style={styles.para}>
          DERISIER LAW s'engage à préserver la confidentialité de l'ensemble des renseignements que
          vous lui communiquez. En contrepartie, vous vous engagez à divulguer à DERISIER LAW tous
          les renseignements et faits pertinents à votre dossier, qu'ils vous soient favorables ou
          défavorables. L'omission de divulguer un fait pertinent peut compromettre votre dossier et
          dégager DERISIER LAW de toute responsabilité à cet égard.
        </Text>

        {/* 3. Obligations du client */}
        <Text style={styles.sectionTitle}>3. Obligations du client</Text>

        <Text style={styles.subTitle}>A. Conduite professionnelle</Text>
        <Text style={styles.para}>
          DERISIER LAW applique une politique de tolérance zéro à l'égard de tout comportement
          abusif, menaçant ou irrespectueux. Un tel comportement entraîne la résiliation immédiate
          du mandat, sans remboursement des honoraires déjà versés.
        </Text>

        <Text style={styles.subTitle}>B. Bureau virtuel et politique de communication</Text>
        <Item>Le courriel constitue le mode de communication privilégié avec le cabinet.</Item>
        <Item>Les messages vocaux font l'objet d'un rappel dans un délai de 48 heures ouvrables.</Item>
        <Item>
          Les suivis de routine sont assurés par le personnel de soutien (commis), et non
          directement par l'avocate.
        </Item>
        <Item>
          Les appels directs à l'avocate sont réservés aux nouvelles preuves, aux avis juridiques et
          aux renseignements significatifs ; veuillez préciser le motif de votre appel.
        </Item>

        <Text style={styles.subTitle}>C. Responsabilité du client — communications d'IRCC</Text>
        <Text style={styles.para}>
          Vous êtes seul(e) responsable de consulter les correspondances reçues d'IRCC et d'en
          informer promptement DERISIER LAW.
        </Text>

        <Text style={styles.subTitle}>D. Contact autorisé</Text>
        <Text style={styles.para}>
          Seul(e) le client peut communiquer avec le cabinet relativement au dossier, sauf
          autorisation écrite expresse désignant un tiers.
        </Text>

        <Text style={styles.subTitle}>E. Heures d'ouverture</Text>
        <Text style={styles.para}>
          Le cabinet est ouvert du lundi au vendredi, de 9 h à 17 h, et fermé les jours fériés. Les
          appels reçus après 17 h sont dirigés vers la messagerie vocale. Les urgences survenant en
          dehors des heures d'ouverture sont traitées le jour ouvrable suivant.
        </Text>

        <Text style={styles.subTitle}>F. Responsabilités financières</Text>
        <View style={styles.feeBox}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Frais juridiques</Text>
            <Text style={styles.feeValue}>{honoraires}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>TVH (13 %)</Text>
            <Text style={styles.feeValue}>{tvh}</Text>
          </View>
          <View style={styles.feeDivider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeTotalLabel}>Total à payer</Text>
            <Text style={styles.feeTotalValue}>{total}</Text>
          </View>
        </View>
        <Text style={styles.para}>
          Ces honoraires n'incluent pas les frais d'IRCC. Vous êtes responsable des débours engagés
          dans votre dossier (notamment messagerie, traduction et frais administratifs) et vous vous
          engagez à acquitter la TVH sur l'ensemble des honoraires et des débours.
        </Text>

        <Text style={styles.subTitle}>G. Coopération</Text>
        <Text style={styles.para}>
          Vous vous engagez à faire preuve de courtoisie, à suivre les instructions du cabinet, à
          aviser à l'avance en cas d'absence à un rendez-vous et à fournir les documents requis dans
          les délais demandés.
        </Text>

        <Text style={styles.subTitle}>H. Client de l'aide juridique</Text>
        <Text style={styles.para}>
          Si vous bénéficiez de l'aide juridique de l'Ontario, les services sont assujettis aux
          limites d'heures et aux conditions fixées par Aide juridique Ontario.
        </Text>

        <Text style={styles.subTitle}>I. Délais des portails</Text>
        <Text style={styles.para}>
          Les portails (IRCC et autres) sont assortis de délais d'expiration. Vous êtes seul(e)
          responsable de la transmission des documents dans les délais impartis. Si un portail expire
          en raison d'un retard qui vous est imputable, des{" "}
          <Text style={styles.highlight}>frais de réinitialisation de 375,00 $</Text> s'appliquent.
        </Text>

        <Text style={styles.subTitle}>J. Frais de dossier urgent</Text>
        <Text style={styles.para}>
          Lorsqu'un dossier requiert un traitement dans un délai inférieur à 15 jours ouvrables, des{" "}
          <Text style={styles.highlight}>frais d'urgence non remboursables de 450,00 $</Text> sont
          exigibles d'avance.
        </Text>

        {/* 4. Résiliation du mandat */}
        <Text style={styles.sectionTitle}>4. Résiliation du mandat</Text>
        <Text style={styles.para}>Le présent mandat prend fin dans l'un ou l'autre des cas suivants :</Text>
        <Item>l'achèvement des services décrits à la section 1 ;</Item>
        <Item>le défaut du client de fournir les mises à jour ou les instructions requises ;</Item>
        <Item>le manquement du client à l'une de ses obligations prévues au présent mandat ;</Item>
        <Item>
          la demande du client d'accomplir un acte contraire au Code de déontologie du Barreau de
          l'Ontario ;
        </Item>
        <Item>la perte fondamentale du lien de confiance entre les parties ;</Item>
        <Item>
          l'insuffisance de preuves justifiant l'affectation des ressources du cabinet au dossier ;
        </Item>
        <Item>le décès du client.</Item>

        {/* 5. Abandon du dossier */}
        <Text style={styles.sectionTitle}>5. Abandon du dossier</Text>
        <Text style={styles.para}>
          En cas d'abandon du dossier par le client, ce dernier demeure tenu d'acquitter l'ensemble
          des services rendus jusqu'à la date d'abandon. L'abandon peut être exprès ou implicite.
        </Text>

        {/* 6. Reconnaissance */}
        <Text style={styles.sectionTitle}>6. Reconnaissance</Text>
        <Text style={styles.para}>
          Je reconnais avoir lu et compris l'intégralité du présent mandat de représentation, qu'un
          membre de DERISIER LAW m'en a expliqué le contenu, et j'en accepte toutes les conditions.
        </Text>

        {/* ── Signatures ───────────────────────────────────────────── */}
        <View style={styles.signWrap} wrap={false}>
          <Text style={styles.signIntro}>
            Signé à {lieu}, {dateStr}.
          </Text>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <View style={styles.signLine} />
              <Text style={styles.signRole}>SIGNATURE DU REPRÉSENTANT</Text>
              <Text style={styles.signName}>{repName}</Text>
              {repTitle ? <Text style={styles.signSub}>{repTitle} · {cabinet.nom}</Text> : null}
            </View>
            <View style={styles.signCol}>
              <View style={styles.signLine} />
              <Text style={styles.signRole}>SIGNATURE DU CLIENT</Text>
              <Text style={styles.signName}>{client}</Text>
            </View>
          </View>
        </View>

        {/* Pied fixe */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerFirm}>{cabinet.nom} — Mandat de représentation</Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
