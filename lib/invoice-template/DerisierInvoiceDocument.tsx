/**
 * SAFE — Variante de facture « Derisier Law » (react-pdf).
 *
 * STYLE : « Minimaliste moderne » (choix cabinet 2026-05).
 *   Beaucoup de blanc, filets fins, UN seul accent sobre (marron Derisier),
 *   typographie soignée, totaux dans un encadré net. Le contenu reste fidèle
 *   à l'échantillon du cabinet :
 *     - identité cabinet (adresse, T./F., courriel, n° GST/HST)
 *     - bloc « ADRESSÉE À » + dates (émise / échéance)
 *     - OBJET (dossier ou services rendus)
 *     - tableau « Honoraires & débours » (liste + montants)
 *       → Sous-total · TVH 13 % · TOTAL
 *     - Montant requis du client
 *     - bloc N.B. (mentions + instructions fiducie) configurable par cabinet
 *     - mention « E. & O. » en pied
 *
 * Doctrine (identique au gabarit standard) :
 *   - Aucune logique métier : reçoit un `PresentedInvoice` déjà calculé.
 *   - Sélectionnée par `cabinet.invoiceTemplate === "derisier"` dans
 *     `InvoiceDocument.tsx` → aperçu et PDF restent rendus par le même composant.
 *   - JAMAIS de n° de Barreau / LSO (règle dure CEO 2026-05-12).
 *   - Max 2 couleurs : 1 accent (marron) + neutres (noir/gris/blanc).
 */

import * as React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";
import { presentClientDisplayName } from "@/lib/services/billing/invoice-presenter";
import { font, provinceToTaxRegime } from "./tokens";
import type { InvoiceLanguage } from "./InvoiceDocument";

/**
 * Palette « minimaliste moderne ».
 * UNE couleur d'accent (marron Derisier) ; tout le reste est neutre.
 */
const ink = {
  text: "#18181B", // presque noir
  muted: "#71717A", // gris labels / secondaire
  faint: "#A1A1AA", // gris très discret
  hair: "#E4E4E7", // filet fin
  hairStrong: "#D4D4D8", // filet un peu plus marqué
  accent: "#7A3B2E", // accent marron (unique)
  accentSoft: "#F5EFED", // teinte douce de l'accent (fonds très légers)
  white: "#FFFFFF",
} as const;

const labels = {
  fr: {
    invoice: "FACTURE",
    invoiceNo: "N°",
    billedTo: "ADRESSÉE À",
    issued: "ÉMISE LE",
    due: "ÉCHÉANCE",
    object: "OBJET",
    servicesRendered: "Services rendus",
    description: "DESCRIPTION",
    amount: "MONTANT",
    subtotal: "Sous-total",
    total: "TOTAL",
    amountRequired: "Montant requis du client",
    nb: "N.B.",
    eo: "E. & O.",
    gstHst: "GST/HST",
    signature: "Signature autorisée",
    detail: "HONORAIRES & DÉBOURS",
    colDesc: "DESCRIPTION",
    colDate: "DATE",
    colHours: "HEURES",
    colRate: "TAUX",
  },
  en: {
    invoice: "INVOICE",
    invoiceNo: "No.",
    billedTo: "BILLED TO",
    issued: "ISSUED",
    due: "DUE",
    object: "RE",
    servicesRendered: "Services Rendered",
    description: "DESCRIPTION",
    amount: "AMOUNT",
    subtotal: "Subtotal",
    total: "TOTAL",
    amountRequired: "Amount required from client",
    nb: "N.B.",
    eo: "E. & O.",
    gstHst: "GST/HST",
    signature: "Authorized signature",
    detail: "FEES & DISBURSEMENTS",
    colDesc: "DESCRIPTION",
    colDate: "DATE",
    colHours: "HOURS",
    colRate: "RATE",
  },
} as const;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 50,
    paddingTop: 34,
    paddingBottom: 38,
    fontSize: 10,
    fontFamily: font.family,
    color: ink.text,
    backgroundColor: ink.white,
    lineHeight: 1.5,
  },

  // ── Barre de marque ───────────────────────────────────────────────
  topBar: { height: 4, backgroundColor: ink.accent, marginBottom: 12 },

  // ── En-tête ───────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  // Identité en colonne : logo (qui porte déjà le nom du cabinet) au-dessus
  // des coordonnées — évite le doublon logo + texte « DERISIER LAW ».
  identity: { flexShrink: 1, paddingRight: 18 },
  logo: { width: 56, height: 56, objectFit: "contain", marginBottom: 5 },
  firmName: {
    fontSize: 16,
    fontFamily: font.bold,
    color: ink.text,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  firmMeta: { fontSize: 8.5, color: ink.muted, lineHeight: 1.4 },
  firmTax: { fontSize: 8.5, color: ink.muted, marginTop: 3 },

  headerRight: { alignItems: "flex-end" },
  kicker: {
    fontSize: 9,
    fontFamily: font.bold,
    color: ink.accent,
    letterSpacing: 3,
    marginBottom: 5,
  },
  invoiceNo: { fontSize: 16, fontFamily: font.bold, color: ink.text, letterSpacing: 0.3 },
  invoiceNoChip: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: ink.accentSoft,
    borderRadius: 3,
  },
  invoiceNoChipText: { fontSize: 8, fontFamily: font.bold, color: ink.accent, letterSpacing: 1 },

  ruleThin: { height: 1, backgroundColor: ink.hair, marginVertical: 12 },

  // ── Panneau méta (client + dates + objet) ─────────────────────────
  panel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: ink.hair,
    borderRadius: 5,
    backgroundColor: ink.accentSoft,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  panelDivider: { height: 1, backgroundColor: ink.hairStrong, marginVertical: 9 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaCol: { flexShrink: 1 },
  metaColClient: { flexBasis: "52%", flexShrink: 1, paddingRight: 16 },
  metaColDate: { flexBasis: "24%", alignItems: "flex-start" },
  metaLabel: {
    fontSize: 7.5,
    fontFamily: font.bold,
    color: ink.accent,
    letterSpacing: 1.6,
    marginBottom: 5,
  },
  clientName: { fontSize: 11, fontFamily: font.bold, color: ink.text, marginBottom: 2 },
  clientLine: { fontSize: 9.5, color: ink.muted, lineHeight: 1.5 },
  dateValue: { fontSize: 10, color: ink.text },

  // ── Objet ─────────────────────────────────────────────────────────
  objectValue: { fontSize: 11, fontFamily: font.bold, color: ink.text, marginTop: 3 },

  // ── Tableau ───────────────────────────────────────────────────────
  tableTitle: {
    fontSize: 7.5,
    fontFamily: font.bold,
    color: ink.faint,
    letterSpacing: 1.6,
    marginTop: 13,
    marginBottom: 6,
  },
  // En-tête de tableau sombre (cohérent avec l'accent neutre).
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ink.text,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  th: { fontSize: 7, fontFamily: font.bold, color: ink.white, letterSpacing: 1.2 },
  thRight: {
    fontSize: 7,
    fontFamily: font.bold,
    color: ink.white,
    letterSpacing: 1.2,
    textAlign: "right",
  },

  // Colonnes (somme = 100 %). DESCRIPTION large, chiffres alignés à droite.
  colDesc: { flexBasis: "42%", flexGrow: 1, paddingRight: 8, flexDirection: "row" },
  colDate: { flexBasis: "16%", paddingRight: 8 },
  colHours: { flexBasis: "12%", paddingRight: 8, textAlign: "right" },
  colRate: { flexBasis: "15%", paddingRight: 8, textAlign: "right" },
  colAmount: { flexBasis: "15%", textAlign: "right" },

  // Lignes : filets fins + alternance zébrée (neutre très léger).
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderBottomWidth: 1,
    borderBottomColor: ink.hair,
  },
  itemRowAlt: { backgroundColor: "#FAFAFA" },
  itemIndex: { fontSize: 9.5, color: ink.faint, marginRight: 6 },
  itemDesc: { fontSize: 9.5, color: ink.text, lineHeight: 1.4, flexShrink: 1 },
  itemCell: { fontSize: 9.5, color: ink.muted },
  itemCellNum: { fontSize: 9.5, color: ink.text },
  itemAmount: { fontSize: 9.5, color: ink.text, fontFamily: font.bold },
  tableBottom: {
    height: 2,
    backgroundColor: ink.text,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  // ── Totaux ────────────────────────────────────────────────────────
  totals: { alignSelf: "flex-end", width: "52%", marginTop: 10 },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 10, color: ink.muted },
  totalValue: { fontSize: 10, color: ink.text },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: ink.accent,
    backgroundColor: ink.accentSoft,
  },
  totalBoxLabel: { fontSize: 10, fontFamily: font.bold, color: ink.accent, letterSpacing: 1.2 },
  totalBoxValue: { fontSize: 13, fontFamily: font.bold, color: ink.text },
  amountRequired: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  amountRequiredLabel: { fontSize: 8.5, color: ink.muted, letterSpacing: 0.4 },
  amountRequiredValue: { fontSize: 8.5, fontFamily: font.bold, color: ink.text },

  // ── N.B. ──────────────────────────────────────────────────────────
  nbWrap: {
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: ink.accent,
    backgroundColor: "#FAFAFA",
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  nbLabel: {
    fontSize: 7.5,
    fontFamily: font.bold,
    color: ink.accent,
    letterSpacing: 1.6,
    marginBottom: 5,
  },
  nbFirst: { fontSize: 9, fontFamily: font.bold, color: ink.text, marginBottom: 4, lineHeight: 1.4 },
  nbPara: { fontSize: 8.5, color: ink.muted, marginBottom: 3.5, lineHeight: 1.4 },

  // ── Signature (option par facture) — sobre : nom + titre sur une ligne ──
  signatureWrap: { marginTop: 10, alignSelf: "flex-end", width: "48%" },
  signatureLine: { height: 1, backgroundColor: ink.hairStrong, marginBottom: 6 },
  signatureName: { fontSize: 10.5, fontFamily: font.bold, color: ink.text },
  signatureMeta: { fontSize: 8.5, color: ink.muted, marginTop: 2 },

  // ── Pied ──────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ink.hair,
  },
  footerFirm: { fontSize: 8, color: ink.faint, letterSpacing: 0.4 },
  footerEo: { fontSize: 8, color: ink.faint, letterSpacing: 0.6 },
});

function fmtMoney(n: number, locale: InvoiceLanguage, currency: string): string {
  const intl = locale === "en" ? "en-CA" : "fr-CA";
  return new Intl.NumberFormat(intl, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d: Date | string, locale: InvoiceLanguage): string {
  const intl = locale === "en" ? "en-CA" : "fr-CA";
  // `timeZone: "UTC"` : les dates de facture sont stockées à minuit UTC ;
  // les formater en fuseau local décalerait l'affichage d'un jour (ex. 1 mai → 30 avr.).
  return new Intl.DateTimeFormat(intl, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(typeof d === "string" ? new Date(d) : d);
}

/** Lignes d'adresse du client (multi-ligne tolérant). */
function clientAddressLines(client: NonNullable<PresentedInvoice["client"]>): string[] {
  const lines: string[] = [];
  if (client.billingAddress) lines.push(client.billingAddress);
  const cityLine = [client.billingCity, client.billingProvince, client.billingPostalCode]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine);
  if (client.billingCountry) lines.push(client.billingCountry);
  return lines;
}

/** Découpe l'adresse cabinet en lignes (saut de ligne explicite ou virgules). */
function cabinetAddressLines(adresse: string | null): string[] {
  if (!adresse) return [];
  const byNewline = adresse.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  return adresse.split(",").map((s) => s.trim()).filter(Boolean);
}

interface DerisierInvoiceDocumentProps {
  invoice: PresentedInvoice;
  language?: InvoiceLanguage;
  /**
   * Affiche le bloc signature (option activée à la facture). Rien n'est
   * affiché par défaut. Nécessite aussi une signature configurée pour le
   * cabinet (`cabinet.invoiceSignature`).
   */
  showSignature?: boolean;
}

/**
 * Document facture « Derisier Law » — style minimaliste moderne.
 */
export function DerisierInvoiceDocument({
  invoice,
  language = "fr",
  showSignature = false,
}: DerisierInvoiceDocumentProps) {
  const t = labels[language];
  const cabinet = invoice.cabinet;
  const client = invoice.client;
  const dossier = invoice.dossier;
  const totals = invoice.totals;
  const currency = invoice.currency || "CAD";

  const clientName = client ? presentClientDisplayName(client) : "—";
  const clientLines = client ? clientAddressLines(client) : [];
  const cabAddr = cabinetAddressLines(cabinet?.adresse ?? null);

  // Taxe : régime selon la province du client (Derisier ON → TVH 13 %).
  const taxRegime = provinceToTaxRegime(client?.billingProvince ?? null);
  const taxTotal = totals.tps + totals.tvq;
  const subtotalPreTax = totals.montantTotal - taxTotal;
  const taxLabel =
    taxRegime === "GST_QST"
      ? language === "en" ? "GST 5% / QST 9.975%" : "TPS 5 % / TVQ 9,975 %"
      : taxRegime === "GST_ONLY"
        ? language === "en" ? "GST 5%" : "TPS 5 %"
        : language === "en" ? "HST 13%" : "TVH 13 %";

  // N° fiscal du cabinet (ARC uniquement, jamais le n° de Barreau).
  // L'étiquette suit le régime fiscal applicable (TVH / TPS / TPS+TVQ),
  // pour que la facture porte le bon intitulé réglementaire.
  const cabinetTaxNo =
    cabinet?.taxNumbers.hstNumber ??
    cabinet?.taxNumbers.gstNumber ??
    cabinet?.taxNumbers.businessNumber ??
    null;
  const taxNoLabel =
    taxRegime === "GST_QST"
      ? language === "en" ? "GST/QST No." : "N° TPS/TVQ"
      : taxRegime === "GST_ONLY"
        ? language === "en" ? "GST No." : "N° TPS"
        : language === "en" ? "HST No." : "N° TVH";

  // Bloc N.B. configurable (FR/EN). La première ligne est mise en évidence.
  const noticeLines = (invoice.cabinet?.invoiceNotice?.[language] ?? []).filter((l) => l.trim());

  // Soldes : à défaut de paiement, le montant requis = solde dû = total.
  const balanceDue = totals.balanceDue > 0 ? totals.balanceDue : totals.montantTotal;

  // Signature reproduite (option par facture). N'apparaît que si l'option est
  // cochée ET qu'une signature est configurée pour le cabinet.
  const signature = invoice.cabinet?.invoiceSignature ?? null;
  const signatureTitle = signature
    ? (language === "en" ? signature.title.en : signature.title.fr).trim()
    : "";
  const showSig = showSignature && Boolean(signature);

  return (
    <Document
      author={cabinet?.nom ?? "SAFE"}
      title={`${t.invoice} ${invoice.numero}`}
      creator="SAFE — Cabinet juridique"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Barre de marque */}
        <View style={styles.topBar} />

        {/* En-tête : identité cabinet (gauche) + FACTURE / n° (droite).
            Le logo porte déjà le nom du cabinet → on n'affiche le texte
            « DERISIER LAW » qu'en l'absence de logo (anti-doublon). */}
        <View style={styles.header}>
          <View style={styles.identity}>
            {cabinet?.logoUrl ? (
              <Image style={styles.logo} src={cabinet.logoUrl} />
            ) : (
              <Text style={styles.firmName}>{(cabinet?.nom ?? "—").toUpperCase()}</Text>
            )}
            {cabAddr.map((line, i) => (
              <Text key={i} style={styles.firmMeta}>
                {line}
              </Text>
            ))}
            {cabinet?.telephone ? <Text style={styles.firmMeta}>{cabinet.telephone}</Text> : null}
            {cabinet?.email ? <Text style={styles.firmMeta}>{cabinet.email}</Text> : null}
            {cabinetTaxNo ? (
              <Text style={styles.firmTax}>
                {taxNoLabel} {cabinetTaxNo}
              </Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.kicker}>{t.invoice}</Text>
            <Text style={styles.invoiceNo}>
              {t.invoiceNo} {invoice.numero}
            </Text>
          </View>
        </View>

        {/* Panneau méta : client + dates + objet */}
        <View style={styles.panel}>
          <View style={styles.metaRow}>
            <View style={styles.metaColClient}>
              <Text style={styles.metaLabel}>{t.billedTo}</Text>
              <Text style={styles.clientName}>{clientName}</Text>
              {clientLines.map((line, i) => (
                <Text key={i} style={styles.clientLine}>
                  {line}
                </Text>
              ))}
              {client?.email ? <Text style={styles.clientLine}>{client.email}</Text> : null}
            </View>
            <View style={styles.metaColDate}>
              <Text style={styles.metaLabel}>{t.issued}</Text>
              <Text style={styles.dateValue}>{fmtDate(invoice.dateEmission, language)}</Text>
            </View>
            <View style={styles.metaColDate}>
              <Text style={styles.metaLabel}>{t.due}</Text>
              <Text style={styles.dateValue}>{fmtDate(invoice.dateEcheance, language)}</Text>
            </View>
          </View>

          <View style={styles.panelDivider} />

          <View>
            <Text style={styles.metaLabel}>{t.object}</Text>
            <Text style={styles.objectValue}>{dossier?.intitule ?? t.servicesRendered}</Text>
          </View>
        </View>

        {/* Tableau Honoraires & débours — colonnes structurées */}
        <Text style={styles.tableTitle}>{t.detail}</Text>
        <View style={styles.tableHead}>
          <View style={styles.colDesc}>
            <Text style={styles.th}>{t.colDesc}</Text>
          </View>
          <Text style={[styles.th, styles.colDate]}>{t.colDate}</Text>
          <Text style={[styles.thRight, styles.colHours]}>{t.colHours}</Text>
          <Text style={[styles.thRight, styles.colRate]}>{t.colRate}</Text>
          <Text style={[styles.thRight, styles.colAmount]}>{t.amount}</Text>
        </View>

        {invoice.lines.map((line, i) => (
          <View
            key={line.id}
            style={i % 2 === 1 ? [styles.itemRow, styles.itemRowAlt] : styles.itemRow}
            wrap={false}
          >
            <View style={styles.colDesc}>
              <Text style={styles.itemIndex}>{i + 1}.</Text>
              <Text style={styles.itemDesc}>{line.description || "—"}</Text>
            </View>
            <Text style={[styles.itemCell, styles.colDate]}>
              {line.date ? fmtDate(line.date, language) : "—"}
            </Text>
            <Text style={[styles.itemCellNum, styles.colHours]}>
              {line.hours != null ? line.hours.toLocaleString(language === "en" ? "en-CA" : "fr-CA") : "—"}
            </Text>
            <Text style={[styles.itemCellNum, styles.colRate]}>
              {line.rate != null ? fmtMoney(line.rate, language, currency) : "—"}
            </Text>
            <Text style={[styles.itemAmount, styles.colAmount]}>
              {fmtMoney(line.amount, language, currency)}
            </Text>
          </View>
        ))}
        <View style={styles.tableBottom} />

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>{t.subtotal}</Text>
            <Text style={styles.totalValue}>{fmtMoney(subtotalPreTax, language, currency)}</Text>
          </View>
          {taxTotal > 0 ? (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{taxLabel}</Text>
              <Text style={styles.totalValue}>{fmtMoney(taxTotal, language, currency)}</Text>
            </View>
          ) : null}
          <View style={styles.totalBox}>
            <Text style={styles.totalBoxLabel}>{t.total}</Text>
            <Text style={styles.totalBoxValue}>{fmtMoney(totals.montantTotal, language, currency)}</Text>
          </View>
          <View style={styles.amountRequired}>
            <Text style={styles.amountRequiredLabel}>{t.amountRequired}</Text>
            <Text style={styles.amountRequiredValue}>{fmtMoney(balanceDue, language, currency)}</Text>
          </View>
        </View>

        {/* N.B. configurable */}
        {noticeLines.length > 0 ? (
          <View style={styles.nbWrap}>
            <Text style={styles.nbLabel}>{t.nb}</Text>
            {noticeLines.map((line, i) => (
              <Text key={i} style={i === 0 ? styles.nbFirst : styles.nbPara}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Signature reproduite (option par facture) — sobre : ligne + nom + titre */}
        {showSig && signature ? (
          <View style={styles.signatureWrap} wrap={false}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{signature.name}</Text>
            <Text style={styles.signatureMeta}>
              {signatureTitle ? `${signatureTitle} · ` : ""}
              {cabinet?.nom ?? ""}
            </Text>
          </View>
        ) : null}

        {/* Pied fixe : cabinet + E. & O. */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerFirm}>{cabinet?.nom ?? ""}</Text>
          <Text style={styles.footerEo}>{t.eo}</Text>
        </View>
      </Page>
    </Document>
  );
}
