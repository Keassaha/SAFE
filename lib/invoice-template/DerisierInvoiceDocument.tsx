/**
 * SAFE — Variante de facture « Derisier Law » (react-pdf).
 *
 * STYLE : « Bandeau de marque » (choix cabinet 2026-05-30).
 *   En-tête PLEINE LARGEUR sur fond marron Derisier : logo (dans une pastille
 *   blanche pour rester lisible) + coordonnées du cabinet en blanc à gauche,
 *   gros « FACTURE N° » à droite. Le corps (client, tableau structuré, totaux,
 *   N.B.) reste sur fond blanc, le marron servant d'accent unique (en-tête de
 *   tableau + encadré TOTAL).
 *
 * Contenu fidèle à l'échantillon du cabinet :
 *   - identité cabinet (adresse, T./F., courriel, n° de taxe selon le régime)
 *   - bloc « ADRESSÉE À » + dates (émise / échéance) + OBJET
 *   - tableau « Honoraires & débours » : DESCRIPTION · DATE · HEURES · TAUX · MONTANT
 *     → Sous-total · TVH 13 % · TOTAL · Montant requis du client
 *   - bloc N.B. configurable (mentions + instructions fiducie)
 *   - signature reproduite optionnelle (par facture)
 *   - mention « E. & O. » en pied
 *
 * Doctrine :
 *   - Aucune logique métier : reçoit un `PresentedInvoice` déjà calculé.
 *   - Sélectionnée par `cabinet.invoiceTemplate === "derisier"`.
 *   - JAMAIS de n° de Barreau / LSO (règle dure CEO 2026-05-12).
 *   - Max 2 couleurs : 1 accent (marron) + neutres (noir/gris/blanc).
 */

import * as React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";
import { presentClientDisplayName } from "@/lib/services/billing/invoice-presenter";
import { font, provinceToTaxRegime } from "./tokens";
import { derivePalette } from "./color";
import type { InvoiceLanguage } from "./InvoiceDocument";

/** Neutres (fixes). L'accent et ses dérivées sont calculés par facture. */
const NEUTRALS = {
  text: "#18181B",
  muted: "#71717A",
  faint: "#A1A1AA",
  hair: "#E4E4E7",
  hairStrong: "#D4D4D8",
  white: "#FFFFFF",
} as const;

/** Palette complète passée à `createStyles` : neutres + accent dynamique. */
type Ink = typeof NEUTRALS & { accent: string; accentSoft: string; onBand: string };

const PAGE_PAD = 42; // marge horizontale du corps (et du bandeau)

const labels = {
  fr: {
    invoice: "FACTURE",
    invoiceNo: "N°",
    billedTo: "ADRESSÉE À",
    issued: "ÉMISE LE",
    due: "ÉCHÉANCE",
    object: "OBJET",
    servicesRendered: "Services rendus",
    amount: "MONTANT",
    subtotal: "Sous-total",
    total: "TOTAL",
    amountRequired: "Montant requis du client",
    nb: "N.B.",
    eo: "E. & O.",
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
    amount: "AMOUNT",
    subtotal: "Subtotal",
    total: "TOTAL",
    amountRequired: "Amount required from client",
    nb: "N.B.",
    eo: "E. & O.",
    detail: "FEES & DISBURSEMENTS",
    colDesc: "DESCRIPTION",
    colDate: "DATE",
    colHours: "HOURS",
    colRate: "RATE",
  },
} as const;

const createStyles = (ink: Ink) => StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 44,
    fontSize: 10,
    fontFamily: font.family,
    color: ink.text,
    backgroundColor: ink.white,
    lineHeight: 1.5,
  },

  // ── Bandeau de marque pleine largeur ──────────────────────────────
  band: {
    backgroundColor: ink.accent,
    paddingVertical: 18,
    paddingHorizontal: PAGE_PAD,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bandLeft: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  logoChip: { backgroundColor: ink.white, borderRadius: 8, padding: 6, marginRight: 14 },
  logo: { width: 46, height: 46, objectFit: "contain" },
  bandFirmName: { fontSize: 14, fontFamily: font.bold, color: ink.white, letterSpacing: 1, marginBottom: 4 },
  bandMeta: { fontSize: 8, color: ink.onBand, lineHeight: 1.5 },
  bandRight: { alignItems: "flex-end", paddingLeft: 12 },
  bandKicker: { fontSize: 9, fontFamily: font.bold, color: ink.onBand, letterSpacing: 4, marginBottom: 6 },
  bandInvoiceNo: { fontSize: 21, fontFamily: font.bold, color: ink.white, letterSpacing: 0.4 },

  // ── Corps ─────────────────────────────────────────────────────────
  // `flexGrow: 1` : le corps occupe toute la hauteur disponible, ce qui
  // permet de pousser le bloc signature tout en bas (marginTop: "auto").
  body: { flexGrow: 1, paddingHorizontal: PAGE_PAD, paddingTop: 22 },

  // Méta : client + dates + objet (épuré, filets fins, sans fond) ──
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  metaColClient: { flexBasis: "52%", flexShrink: 1, paddingRight: 16 },
  metaColDate: { flexBasis: "24%", alignItems: "flex-start" },
  metaLabel: { fontSize: 7.5, fontFamily: font.bold, color: ink.accent, letterSpacing: 1.6, marginBottom: 5 },
  clientName: { fontSize: 11.5, fontFamily: font.bold, color: ink.text, marginBottom: 2 },
  clientLine: { fontSize: 9.5, color: ink.muted, lineHeight: 1.5 },
  dateValue: { fontSize: 10, color: ink.text },

  metaDivider: { height: 1, backgroundColor: ink.hair, marginVertical: 14 },
  objectValue: { fontSize: 12, fontFamily: font.bold, color: ink.text, marginTop: 3 },

  // ── Tableau (en-tête marron, cohérent avec le bandeau) ────────────
  tableTitle: { fontSize: 7.5, fontFamily: font.bold, color: ink.faint, letterSpacing: 1.6, marginTop: 18, marginBottom: 6 },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ink.accent,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  th: { fontSize: 7, fontFamily: font.bold, color: ink.white, letterSpacing: 1.2 },
  thRight: { fontSize: 7, fontFamily: font.bold, color: ink.white, letterSpacing: 1.2, textAlign: "right" },

  colDesc: { flexBasis: "42%", flexGrow: 1, paddingRight: 8, flexDirection: "row" },
  colDate: { flexBasis: "16%", paddingRight: 8 },
  colHours: { flexBasis: "12%", paddingRight: 8, textAlign: "right" },
  colRate: { flexBasis: "15%", paddingRight: 8, textAlign: "right" },
  colAmount: { flexBasis: "15%", textAlign: "right" },

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
  tableBottom: { height: 2, backgroundColor: ink.accent, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },

  // ── Totaux ────────────────────────────────────────────────────────
  totals: { alignSelf: "flex-end", width: "52%", marginTop: 12 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 4 },
  totalLabel: { fontSize: 10, color: ink.muted },
  totalValue: { fontSize: 10, color: ink.text },
  taxLabelWrap: { flexShrink: 1 },
  taxNo: { fontSize: 7.5, color: ink.faint, marginTop: 1, letterSpacing: 0.2 },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: ink.accent,
    borderRadius: 4,
  },
  totalBoxLabel: { fontSize: 10, fontFamily: font.bold, color: ink.white, letterSpacing: 1.4 },
  totalBoxValue: { fontSize: 14, fontFamily: font.bold, color: ink.white },
  amountRequired: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  amountRequiredLabel: { fontSize: 8.5, color: ink.muted, letterSpacing: 0.4 },
  amountRequiredValue: { fontSize: 8.5, fontFamily: font.bold, color: ink.text },

  // ── N.B. ──────────────────────────────────────────────────────────
  nbWrap: {
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: ink.accent,
    backgroundColor: "#FAFAFA",
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  nbLabel: { fontSize: 7.5, fontFamily: font.bold, color: ink.accent, letterSpacing: 1.6, marginBottom: 5 },
  nbFirst: { fontSize: 9, fontFamily: font.bold, color: ink.text, marginBottom: 4, lineHeight: 1.4 },
  nbPara: { fontSize: 8.5, color: ink.muted, marginBottom: 3.5, lineHeight: 1.4 },

  // ── Signature (option par facture) — placée tout en bas ───────────
  // `marginTop: "auto"` la pousse au pied du corps ; l'espace au-dessus de
  // la ligne laisse la place pour une signature manuscrite.
  signatureWrap: { marginTop: "auto", alignSelf: "flex-end", width: "50%", paddingTop: 16 },
  signatureSpace: { height: 30 },
  signatureLine: { height: 1, backgroundColor: ink.hairStrong, marginBottom: 6 },
  signatureName: { fontSize: 10.5, fontFamily: font.bold, color: ink.text },
  signatureMeta: { fontSize: 8.5, color: ink.muted, marginTop: 2 },

  // ── Pied ──────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: PAGE_PAD,
    right: PAGE_PAD,
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
  // `timeZone: "UTC"` : dates stockées à minuit UTC ; éviter le décalage local.
  return new Intl.DateTimeFormat(intl, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(typeof d === "string" ? new Date(d) : d);
}

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

function cabinetAddressLines(adresse: string | null): string[] {
  if (!adresse) return [];
  const byNewline = adresse.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  return adresse.split(",").map((s) => s.trim()).filter(Boolean);
}

interface DerisierInvoiceDocumentProps {
  invoice: PresentedInvoice;
  language?: InvoiceLanguage;
  /** Affiche le bloc signature (option activée à la facture). */
  showSignature?: boolean;
}

/**
 * Document facture « Derisier Law » — style bandeau de marque.
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
  const numberLocale = language === "en" ? "en-CA" : "fr-CA";

  // Couleur d'accent du cabinet → palette dynamique (avec garde-fou de
  // lisibilité : une couleur trop claire retombe sur l'accent par défaut).
  const ink: Ink = { ...NEUTRALS, ...derivePalette(cabinet?.invoiceAccentColor) };
  const styles = createStyles(ink);

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

  const noticeLines = (invoice.cabinet?.invoiceNotice?.[language] ?? []).filter((l) => l.trim());
  const balanceDue = totals.balanceDue > 0 ? totals.balanceDue : totals.montantTotal;

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
        {/* ── Bandeau de marque pleine largeur ── */}
        <View style={styles.band}>
          <View style={styles.bandLeft}>
            {cabinet?.logoUrl ? (
              <View style={styles.logoChip}>
                <Image style={styles.logo} src={cabinet.logoUrl} />
              </View>
            ) : null}
            <View style={{ flexShrink: 1 }}>
              {!cabinet?.logoUrl ? (
                <Text style={styles.bandFirmName}>{(cabinet?.nom ?? "—").toUpperCase()}</Text>
              ) : null}
              {cabAddr.map((line, i) => (
                <Text key={i} style={styles.bandMeta}>
                  {line}
                </Text>
              ))}
              {cabinet?.telephone ? <Text style={styles.bandMeta}>{cabinet.telephone}</Text> : null}
              {cabinet?.email ? <Text style={styles.bandMeta}>{cabinet.email}</Text> : null}
            </View>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.bandKicker}>{t.invoice}</Text>
            <Text style={styles.bandInvoiceNo}>
              {t.invoiceNo} {invoice.numero}
            </Text>
          </View>
        </View>

        {/* ── Corps ── */}
        <View style={styles.body}>
          {/* Méta : client + dates */}
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

          <View style={styles.metaDivider} />

          {/* Objet */}
          <View>
            <Text style={styles.metaLabel}>{t.object}</Text>
            <Text style={styles.objectValue}>{dossier?.intitule ?? t.servicesRendered}</Text>
          </View>

          {/* Tableau Honoraires & débours */}
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
                {line.hours != null ? line.hours.toLocaleString(numberLocale) : "—"}
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
                <View style={styles.taxLabelWrap}>
                  <Text style={styles.totalLabel}>{taxLabel}</Text>
                  {cabinetTaxNo ? (
                    <Text style={styles.taxNo}>
                      {taxNoLabel} {cabinetTaxNo}
                    </Text>
                  ) : null}
                </View>
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

          {/* Signature (option par facture) — auto-placée tout en bas,
              espace au-dessus de la ligne pour signer à la main */}
          {showSig && signature ? (
            <View style={styles.signatureWrap} wrap={false}>
              <View style={styles.signatureSpace} />
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{signature.name}</Text>
              <Text style={styles.signatureMeta}>
                {signatureTitle ? `${signatureTitle} · ` : ""}
                {cabinet?.nom ?? ""}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Pied fixe : cabinet + E. & O. */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerFirm}>{cabinet?.nom ?? ""}</Text>
          <Text style={styles.footerEo}>{t.eo}</Text>
        </View>
      </Page>
    </Document>
  );
}
