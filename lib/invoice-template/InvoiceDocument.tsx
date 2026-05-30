/**
 * SAFE — Document facture canonique (react-pdf).
 *
 * SOURCE UNIQUE du rendu facture pour :
 *   - aperçu UI (rendu via `<PDFViewer>` ou `<BlobProvider>`)
 *   - PDF téléchargeable / envoyé par email (rendu via `pdf().toBuffer()`)
 *
 * Doctrine :
 *   - Rendu pixel-perfect entre preview et PDF garanti (même composant).
 *   - Aucune logique métier ici : reçoit un `PresentedInvoice` du presenter
 *     (tous les totaux et conversions de lignes sont déjà calculés).
 *   - Conforme aux exigences de facture professionnelle au Canada :
 *     en-tête identité (cabinet + n° HST/GST/QST), n° facture
 *     séquentiel, dates émission/échéance, client + adresse, dossier de
 *     référence, lignes claires (date · description · responsable · montant),
 *     débours séparés, rabais explicite, taxes détaillées, total + solde dû,
 *     modalités de paiement, mention de conservation des documents.
 */

import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PresentedInvoice, PresentedLine } from "@/lib/services/billing/invoice-presenter";
import { presentClientDisplayName } from "@/lib/services/billing/invoice-presenter";
import { Letterhead } from "@/lib/templates/letterhead";
import { DerisierInvoiceDocument } from "./DerisierInvoiceDocument";
import {
  colors,
  fontSize,
  spacing,
  font,
  tableColumns,
  legalNotices,
  provinceToTaxRegime,
} from "./tokens";

export type InvoiceLanguage = "fr" | "en";

const labels = {
  fr: {
    invoice: "FACTURE",
    invoiceNo: "N°",
    issueDate: "Date d'émission",
    dueDate: "Date d'échéance",
    issuedBy: "ÉMETTEUR",
    billedTo: "ADRESSÉE À",
    matter: "DOSSIER",
    matterRef: "Référence",
    matterTitle: "Intitulé",
    hst: "N° HST",
    gst: "N° TPS",
    qst: "N° TVQ",
    bn: "N° d'entreprise",
    colDate: "DATE",
    colDescription: "DESCRIPTION",
    colAmount: "MONTANT",
    by: "Par",
    subtotalFees: "Sous-total honoraires",
    subtotalExpenses: "Débours (taxables)",
    subtotalNonTaxable: "Débours (non taxables)",
    discount: "Rabais",
    discountApplied: "Rabais accordé",
    subtotal: "Sous-total taxable",
    taxHst: "TVH (13 %)",
    taxGst: "TPS (5 %)",
    taxQst: "TVQ (9,975 %)",
    total: "TOTAL",
    paid: "Déjà payé",
    balanceDue: "SOLDE DÛ",
    paymentTitle: "MODALITÉS DE PAIEMENT",
    paymentTo: "À l'ordre de",
    note: "Note au client",
    fees: "Frais",
    page: "Page",
    of: "sur",
    rabaisLabel: "Rabais",
    feesLabel: "Frais",
  },
  en: {
    invoice: "INVOICE",
    invoiceNo: "No.",
    issueDate: "Issue date",
    dueDate: "Due date",
    issuedBy: "FROM",
    billedTo: "BILLED TO",
    matter: "MATTER",
    matterRef: "Reference",
    matterTitle: "Title",
    hst: "HST No.",
    gst: "GST No.",
    qst: "QST No.",
    bn: "Business No.",
    colDate: "DATE",
    colDescription: "DESCRIPTION",
    colAmount: "AMOUNT",
    by: "By",
    subtotalFees: "Fees subtotal",
    subtotalExpenses: "Disbursements (taxable)",
    subtotalNonTaxable: "Disbursements (non-taxable)",
    discount: "Discount",
    discountApplied: "Discount applied",
    subtotal: "Taxable subtotal",
    taxHst: "HST (13%)",
    taxGst: "GST (5%)",
    taxQst: "QST (9.975%)",
    total: "TOTAL",
    paid: "Already paid",
    balanceDue: "BALANCE DUE",
    paymentTitle: "PAYMENT TERMS",
    paymentTo: "Payable to",
    note: "Note to client",
    fees: "Fees",
    page: "Page",
    of: "of",
    rabaisLabel: "Discount",
    feesLabel: "Fee",
  },
} as const;

const styles = StyleSheet.create({
  page: {
    padding: spacing.pagePadding,
    fontSize: fontSize.body,
    fontFamily: font.family,
    color: colors.text,
    backgroundColor: colors.white,
  },

  // ── En-tête : identité cabinet via <Letterhead> ─────────────────
  // (le bloc identité + bordure vit dans lib/templates/letterhead.tsx)
  invoiceKicker: {
    fontSize: fontSize.sectionHeader,
    color: colors.brand,
    fontFamily: font.bold,
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: fontSize.hero,
    fontFamily: font.bold,
    color: colors.text,
    marginBottom: 6,
  },
  invoiceDates: { alignItems: "flex-end" },
  invoiceDateRow: { flexDirection: "row", marginTop: 2 },
  invoiceDateLabel: {
    fontSize: fontSize.bodySmall,
    color: colors.textMuted,
    marginRight: 6,
  },
  invoiceDateValue: {
    fontSize: fontSize.bodySmall,
    fontFamily: font.bold,
    color: colors.text,
  },

  // ── Tax registration banner ─────────────────────────────────────
  taxBanner: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 2,
    marginBottom: spacing.sectionGap,
  },
  taxBannerItem: {
    fontSize: fontSize.bodySmall,
    color: colors.text,
    marginRight: 12,
  },
  taxBannerLabel: {
    color: colors.textMuted,
    fontFamily: font.bold,
    marginRight: 3,
  },

  // ── Bloc émetteur / destinataire ────────────────────────────────
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sectionGap,
    gap: 12,
  },
  block: {
    flex: 1,
    padding: spacing.blockPadding,
    backgroundColor: colors.rowAlt,
    borderRadius: 3,
  },
  blockHeader: {
    fontSize: fontSize.sectionHeader,
    fontFamily: font.bold,
    color: colors.brand,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  blockName: {
    fontSize: fontSize.blockTitle,
    fontFamily: font.bold,
    color: colors.text,
    marginBottom: 3,
  },
  blockLine: {
    fontSize: fontSize.bodySmall,
    color: colors.textMuted,
    lineHeight: 1.4,
  },

  // ── Référence dossier ───────────────────────────────────────────
  matterRef: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: spacing.blockPadding,
    backgroundColor: colors.brandSoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
    marginBottom: spacing.sectionGap,
  },
  matterRefLabel: {
    fontSize: fontSize.sectionHeader,
    fontFamily: font.bold,
    color: colors.brand,
    letterSpacing: 1,
    marginRight: 8,
  },
  matterRefValue: {
    fontSize: fontSize.body,
    fontFamily: font.bold,
    color: colors.text,
    flex: 1,
  },

  // ── Tableau des lignes ──────────────────────────────────────────
  table: { marginBottom: spacing.sectionGap },
  tableHead: {
    flexDirection: "row",
    backgroundColor: colors.brand,
    paddingVertical: 6,
    paddingHorizontal: spacing.rowPadding,
  },
  tableHeadText: {
    color: colors.white,
    fontSize: fontSize.sectionHeader,
    fontFamily: font.bold,
    letterSpacing: 1,
  },
  colDate: { width: `${tableColumns.date}%` },
  colDescription: { width: `${tableColumns.description}%`, paddingRight: 8 },
  colAmount: { width: `${tableColumns.amount}%`, textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: spacing.rowPadding,
    paddingHorizontal: spacing.rowPadding,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    alignItems: "flex-start",
  },
  tableRowAlt: { backgroundColor: colors.rowAlt },
  tableRowDiscount: { backgroundColor: colors.discountSoft },
  tableRowFees: { backgroundColor: colors.feesSoft },
  cellText: { fontSize: fontSize.body, color: colors.text },
  cellMuted: { fontSize: fontSize.bodySmall, color: colors.textMuted, marginTop: 2 },
  cellAmount: { fontSize: fontSize.body, fontFamily: font.bold, color: colors.text, textAlign: "right" },
  cellAmountDiscount: { color: colors.discount },
  badgeKind: {
    fontSize: 7,
    fontFamily: font.bold,
    color: colors.brand,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
    borderRadius: 2,
    letterSpacing: 0.6,
  },
  badgeDiscount: { color: colors.discount, backgroundColor: colors.white },
  badgeFees: { color: colors.fees, backgroundColor: colors.white },

  // ── Totaux ──────────────────────────────────────────────────────
  totalsBlock: {
    alignSelf: "flex-end",
    width: "55%",
    marginTop: 4,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  totalLabel: { fontSize: fontSize.body, color: colors.textMuted },
  totalValue: { fontSize: fontSize.body, color: colors.text, fontFamily: font.bold },
  totalLineDiscount: { color: colors.discount },
  totalLineHero: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.brand,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    borderRadius: 3,
  },
  totalLabelHero: {
    fontSize: fontSize.body,
    color: colors.white,
    fontFamily: font.bold,
    letterSpacing: 1.2,
  },
  totalValueHero: {
    fontSize: fontSize.totalLarge,
    color: colors.white,
    fontFamily: font.bold,
  },

  // ── Note client ─────────────────────────────────────────────────
  clientNote: {
    marginTop: spacing.sectionGap,
    padding: spacing.blockPadding,
    backgroundColor: colors.rowAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
  },
  clientNoteLabel: {
    fontSize: fontSize.sectionHeader,
    fontFamily: font.bold,
    color: colors.brand,
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientNoteText: {
    fontSize: fontSize.bodySmall,
    color: colors.textMuted,
    lineHeight: 1.5,
  },

  // ── Footer : modalités + mentions ───────────────────────────────
  footer: {
    position: "absolute",
    bottom: spacing.pagePadding,
    left: spacing.pagePadding,
    right: spacing.pagePadding,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
  footerTitle: {
    fontSize: fontSize.sectionHeader,
    fontFamily: font.bold,
    color: colors.brand,
    letterSpacing: 1,
    marginBottom: 3,
  },
  footerText: {
    fontSize: fontSize.footer,
    color: colors.textMuted,
    lineHeight: 1.5,
  },
  footerLegal: {
    fontSize: fontSize.footer,
    color: colors.textFaint,
    fontFamily: font.oblique,
    marginTop: 4,
  },
  pageNum: {
    position: "absolute",
    bottom: 16,
    right: spacing.pagePadding,
    fontSize: fontSize.footer,
    color: colors.textFaint,
  },
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
  return new Intl.DateTimeFormat(intl, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(typeof d === "string" ? new Date(d) : d);
}

function fmtDateShort(d: Date | string, locale: InvoiceLanguage): string {
  const intl = locale === "en" ? "en-CA" : "fr-CA";
  return new Intl.DateTimeFormat(intl, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
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

interface InvoiceDocumentProps {
  invoice: PresentedInvoice;
  language?: InvoiceLanguage;
  /** Sommes des sous-totaux. Si non fourni, calculé à partir des lignes. */
  subtotals?: {
    fees: number;
    expensesTaxable: number;
    expensesNonTaxable: number;
    discounts: number;
  };
  /**
   * Affiche la signature reproduite (option par facture). Propagée aux
   * variantes propres au cabinet (ex. Derisier). Sans effet sur le gabarit
   * standard.
   */
  showSignature?: boolean;
}

/**
 * Composant racine du document — le rendu canonique de la facture.
 *
 * Usage PDF :  pdf(<InvoiceDocument invoice={…} />).toBuffer()
 * Usage UI  :  <PDFViewer><InvoiceDocument invoice={…} /></PDFViewer>
 */
export function InvoiceDocument({
  invoice,
  language = "fr",
  subtotals,
  showSignature = false,
}: InvoiceDocumentProps) {
  // Dispatch vers une variante propre au cabinet le cas échéant. L'aperçu et le
  // PDF passant tous deux par ce composant, le choix du modèle reste centralisé
  // ici → aucune divergence preview/PDF possible.
  if (invoice.cabinet?.invoiceTemplate === "derisier") {
    return (
      <DerisierInvoiceDocument
        invoice={invoice}
        language={language}
        showSignature={showSignature}
      />
    );
  }

  const t = labels[language];
  const cabinet = invoice.cabinet;
  const client = invoice.client;
  const dossier = invoice.dossier;
  const totals = invoice.totals;
  const currency = invoice.currency || "CAD";

  // Province du cabinet → régime de taxes affiché. Le presenter expose déjà
  // les montants `tps` et `tvq`. La province de référence est celle du client
  // pour respecter le lieu de fourniture du service.
  const taxRegime = provinceToTaxRegime(client?.billingProvince ?? null);

  // Sous-totaux dérivés des lignes si non fournis explicitement.
  const computed = computeLineSubtotals(invoice.lines);
  const sums = subtotals ?? computed;

  const clientName = client ? presentClientDisplayName(client) : "—";
  const clientLines = client ? clientAddressLines(client) : [];

  return (
    <Document
      author={cabinet?.nom ?? "SAFE"}
      title={`${t.invoice} ${invoice.numero}`}
      creator="SAFE — Cabinet juridique"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* En-tête : identité cabinet (Letterhead partagé) + n° facture + dates.
            N.B. le n° de Barreau / LSO n'apparaît JAMAIS sur une facture
            (règle dure CEO 2026-05-12 — donnée confidentielle). */}
        <Letterhead
          cabinet={cabinet}
          fixed
          right={
            <>
              <Text style={styles.invoiceKicker}>{t.invoice}</Text>
              <Text style={styles.invoiceNumber}>{invoice.numero}</Text>
              <View style={styles.invoiceDates}>
                <View style={styles.invoiceDateRow}>
                  <Text style={styles.invoiceDateLabel}>{t.issueDate} :</Text>
                  <Text style={styles.invoiceDateValue}>{fmtDate(invoice.dateEmission, language)}</Text>
                </View>
                <View style={styles.invoiceDateRow}>
                  <Text style={styles.invoiceDateLabel}>{t.dueDate} :</Text>
                  <Text style={styles.invoiceDateValue}>{fmtDate(invoice.dateEcheance, language)}</Text>
                </View>
              </View>
            </>
          }
        />

        {/* Bandeau de numéros d'identification fiscale — ARC uniquement
            (HST / GST / QST / n° d'entreprise). Aucun n° de Barreau ici. */}
        {(cabinet?.taxNumbers.hstNumber ||
          cabinet?.taxNumbers.gstNumber ||
          cabinet?.taxNumbers.qstNumber ||
          cabinet?.taxNumbers.businessNumber) && (
          <View style={styles.taxBanner}>
            {cabinet?.taxNumbers.hstNumber ? (
              <Text style={styles.taxBannerItem}>
                <Text style={styles.taxBannerLabel}>{t.hst} : </Text>
                {cabinet.taxNumbers.hstNumber}
              </Text>
            ) : null}
            {cabinet?.taxNumbers.gstNumber && !cabinet?.taxNumbers.hstNumber ? (
              <Text style={styles.taxBannerItem}>
                <Text style={styles.taxBannerLabel}>{t.gst} : </Text>
                {cabinet.taxNumbers.gstNumber}
              </Text>
            ) : null}
            {cabinet?.taxNumbers.qstNumber ? (
              <Text style={styles.taxBannerItem}>
                <Text style={styles.taxBannerLabel}>{t.qst} : </Text>
                {cabinet.taxNumbers.qstNumber}
              </Text>
            ) : null}
            {cabinet?.taxNumbers.businessNumber &&
            !cabinet.taxNumbers.hstNumber &&
            !cabinet.taxNumbers.gstNumber ? (
              <Text style={styles.taxBannerItem}>
                <Text style={styles.taxBannerLabel}>{t.bn} : </Text>
                {cabinet.taxNumbers.businessNumber}
              </Text>
            ) : null}
          </View>
        )}

        {/* Émetteur / Destinataire */}
        <View style={styles.twoCol}>
          <View style={styles.block}>
            <Text style={styles.blockHeader}>{t.issuedBy}</Text>
            <Text style={styles.blockName}>{cabinet?.nom ?? "—"}</Text>
            {cabinet?.adresse ? (
              <Text style={styles.blockLine}>{cabinet.adresse}</Text>
            ) : null}
            {cabinet?.telephone ? <Text style={styles.blockLine}>{cabinet.telephone}</Text> : null}
            {cabinet?.email ? <Text style={styles.blockLine}>{cabinet.email}</Text> : null}
          </View>
          <View style={styles.block}>
            <Text style={styles.blockHeader}>{t.billedTo}</Text>
            <Text style={styles.blockName}>{clientName}</Text>
            {clientLines.map((line, i) => (
              <Text key={i} style={styles.blockLine}>
                {line}
              </Text>
            ))}
            {client?.email ? <Text style={styles.blockLine}>{client.email}</Text> : null}
          </View>
        </View>

        {/* Référence dossier */}
        {dossier ? (
          <View style={styles.matterRef}>
            <Text style={styles.matterRefLabel}>{t.matter}</Text>
            <Text style={styles.matterRefValue}>
              {dossier.numeroDossier ? `${dossier.numeroDossier} — ` : ""}
              {dossier.intitule}
            </Text>
          </View>
        ) : null}

        {/* Tableau des lignes */}
        <View style={styles.table}>
          <View style={styles.tableHead} fixed>
            <Text style={[styles.tableHeadText, styles.colDate]}>{t.colDate}</Text>
            <Text style={[styles.tableHeadText, styles.colDescription]}>{t.colDescription}</Text>
            <Text style={[styles.tableHeadText, styles.colAmount]}>{t.colAmount}</Text>
          </View>

          {invoice.lines.map((line, i) => {
            const isDiscount = line.type === "rabais";
            const isExpense =
              line.type === "debours_taxable" || line.type === "debours_non_taxable";
            const rowStyle = {
              ...styles.tableRow,
              ...(isDiscount ? styles.tableRowDiscount : i % 2 === 1 ? styles.tableRowAlt : {}),
            };

            return (
              <View key={line.id} style={rowStyle} wrap={false}>
                <Text style={[styles.cellText, styles.colDate]}>
                  {line.date ? fmtDateShort(line.date, language) : "—"}
                </Text>
                <View style={styles.colDescription}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {isDiscount ? (
                      <Text style={[styles.badgeKind, styles.badgeDiscount]}>{t.rabaisLabel}</Text>
                    ) : isExpense ? (
                      <Text style={[styles.badgeKind, styles.badgeFees]}>{t.feesLabel}</Text>
                    ) : null}
                    <Text style={styles.cellText}>{line.description || "—"}</Text>
                  </View>
                  {(line.userNom || (line.hours != null && line.hours > 0)) && (
                    <Text style={styles.cellMuted}>
                      {line.hours != null && line.hours > 0 && line.rate != null
                        ? `${line.hours} h × ${fmtMoney(line.rate, language, currency)}/h`
                        : ""}
                      {line.hours != null && line.hours > 0 && line.userNom ? " · " : ""}
                      {line.userNom ? `${t.by} ${line.userNom}` : ""}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.cellAmount,
                    styles.colAmount,
                    isDiscount ? styles.cellAmountDiscount : {},
                  ]}
                >
                  {fmtMoney(line.amount, language, currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totaux */}
        <View style={styles.totalsBlock}>
          {sums.fees > 0 ? (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t.subtotalFees}</Text>
              <Text style={styles.totalValue}>{fmtMoney(sums.fees, language, currency)}</Text>
            </View>
          ) : null}
          {sums.expensesTaxable > 0 ? (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t.subtotalExpenses}</Text>
              <Text style={styles.totalValue}>{fmtMoney(sums.expensesTaxable, language, currency)}</Text>
            </View>
          ) : null}
          {sums.expensesNonTaxable > 0 || totals.deboursNonTaxableTotal > 0 ? (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t.subtotalNonTaxable}</Text>
              <Text style={styles.totalValue}>
                {fmtMoney(totals.deboursNonTaxableTotal || sums.expensesNonTaxable, language, currency)}
              </Text>
            </View>
          ) : null}
          {totals.totalRabais > 0 ? (
            <View style={styles.totalLine}>
              <Text style={[styles.totalLabel, styles.totalLineDiscount]}>{t.discountApplied}</Text>
              <Text style={[styles.totalValue, styles.totalLineDiscount]}>
                −{fmtMoney(totals.totalRabais, language, currency)}
              </Text>
            </View>
          ) : null}
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>{t.subtotal}</Text>
            <Text style={styles.totalValue}>{fmtMoney(totals.subtotalTaxable, language, currency)}</Text>
          </View>

          {/* Taxes — affichage selon régime du client */}
          {taxRegime === "HST" && totals.tps + totals.tvq > 0 ? (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t.taxHst}</Text>
              <Text style={styles.totalValue}>
                {fmtMoney(totals.tps + totals.tvq, language, currency)}
              </Text>
            </View>
          ) : null}
          {taxRegime !== "HST" && totals.tps > 0 ? (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t.taxGst}</Text>
              <Text style={styles.totalValue}>{fmtMoney(totals.tps, language, currency)}</Text>
            </View>
          ) : null}
          {taxRegime === "GST_QST" && totals.tvq > 0 ? (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{t.taxQst}</Text>
              <Text style={styles.totalValue}>{fmtMoney(totals.tvq, language, currency)}</Text>
            </View>
          ) : null}

          {/* Total hero */}
          <View style={styles.totalLineHero}>
            <Text style={styles.totalLabelHero}>{t.total}</Text>
            <Text style={styles.totalValueHero}>{fmtMoney(totals.montantTotal, language, currency)}</Text>
          </View>

          {totals.montantPaye > 0 ? (
            <>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>{t.paid}</Text>
                <Text style={styles.totalValue}>−{fmtMoney(totals.montantPaye, language, currency)}</Text>
              </View>
              <View style={styles.totalLineHero}>
                <Text style={styles.totalLabelHero}>{t.balanceDue}</Text>
                <Text style={styles.totalValueHero}>
                  {fmtMoney(totals.balanceDue, language, currency)}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Note client */}
        {invoice.clientNote ? (
          <View style={styles.clientNote}>
            <Text style={styles.clientNoteLabel}>{t.note}</Text>
            <Text style={styles.clientNoteText}>{invoice.clientNote}</Text>
          </View>
        ) : null}

        {/* Footer fixe : modalités + mention conservation */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTitle}>{t.paymentTitle}</Text>
          <Text style={styles.footerText}>
            {legalNotices[language].paymentTerms} {t.paymentTo}{" "}
            <Text style={{ fontFamily: font.bold }}>{cabinet?.nom ?? "—"}</Text>.
          </Text>
          <Text style={styles.footerLegal}>{legalNotices[language].keepForRecords}</Text>
        </View>

        <Text
          style={styles.pageNum}
          render={({ pageNumber, totalPages }) => `${t.page} ${pageNumber} ${t.of} ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

/** Calcule les sous-totaux par catégorie depuis les lignes présentées. */
function computeLineSubtotals(lines: PresentedLine[]): {
  fees: number;
  expensesTaxable: number;
  expensesNonTaxable: number;
  discounts: number;
} {
  let fees = 0;
  let expensesTaxable = 0;
  let expensesNonTaxable = 0;
  let discounts = 0;
  for (const l of lines) {
    if (l.type === "honoraires") fees += l.amount;
    else if (l.type === "debours_taxable") expensesTaxable += l.amount;
    else if (l.type === "debours_non_taxable") expensesNonTaxable += l.amount;
    else if (l.type === "rabais") discounts += Math.abs(l.amount);
  }
  return { fees, expensesTaxable, expensesNonTaxable, discounts };
}
