/**
 * SAFE — Document facture canonique (react-pdf).
 *
 * SOURCE UNIQUE du rendu facture pour :
 *   - aperçu UI (rendu via `<PDFViewer>` ou `<BlobProvider>`)
 *   - PDF téléchargeable / envoyé par email (rendu via `pdf().toBuffer()`)
 *
 * Doctrine :
 *   - Rendu pixel-perfect entre preview et PDF garanti (même composant).
 *   - Aucune logique métier ici : reçoit un `PresentedInvoice` du presenter,
 *     et le partage en groupes via `grouperLignes` (module pur, testé).
 *   - Conforme aux exigences d'une facture professionnelle au Canada :
 *     identité de l'émetteur, numéros d'inscription aux taxes, numéro
 *     séquentiel, dates d'émission et d'échéance, destinataire et adresse,
 *     dossier de référence, détail des prestations, débours séparés,
 *     taxes ventilées, total, sommes reçues, solde dû, modalités de paiement.
 *
 * REFONTE DU 2026-09-10 (demande CEO)
 *
 *   1. Le solde dû monte en haut. C'est la seule chose que le client cherche
 *      en ouvrant le document ; il ne devait plus la chercher en bas de page.
 *   2. Deux groupes au lieu d'un tableau indistinct : « Honoraires
 *      professionnels » et « Débours et frais », chacun avec son sous-total
 *      posé sur son titre, et ses propres en-têtes de colonnes.
 *   3. Trois tailles de caractère, pas une de plus (`echelle` dans tokens.ts).
 *      La hiérarchie se fait au gras et à la couleur.
 */

import * as React from "react";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  PresentedInvoice,
  PresentedLine,
} from "@/lib/services/billing/invoice-presenter";
import { presentClientDisplayName } from "@/lib/services/billing/invoice-presenter";
import { Letterhead } from "@/lib/templates/letterhead";
import { DerisierInvoiceDocument } from "./DerisierInvoiceDocument";
import { grouperLignes, deboursEstTaxable } from "./groupes";
import {
  colors,
  echelle,
  spacing,
  font,
  colonnesHonoraires,
  colonnesDebours,
  legalNotices,
} from "./tokens";

export type InvoiceLanguage = "fr" | "en";

const labels = {
  fr: {
    invoice: "FACTURE",
    issueDate: "Émise le",
    dueDate: "Échéance",
    issuedBy: "ÉMETTEUR",
    billedTo: "ADRESSÉE À",
    matter: "DOSSIER",
    hst: "TVH",
    gst: "TPS",
    qst: "TVQ",
    bn: "Entreprise",
    taxNumbers: "NUMÉROS D'INSCRIPTION",
    groupFees: "HONORAIRES PROFESSIONNELS",
    groupExpenses: "DÉBOURS ET FRAIS",
    groupOther: "AJUSTEMENTS",
    colDate: "DATE",
    colService: "PRESTATION",
    colWho: "INTERVENANT",
    colHours: "HEURES",
    colRate: "TAUX",
    colAmount: "MONTANT",
    colNature: "NATURE",
    colTaxable: "TAXABLE",
    yes: "Oui",
    no: "Non",
    summary: "RÉCAPITULATIF",
    subtotalFees: "Honoraires",
    subtotalExpensesTaxable: "Débours taxables",
    subtotalExpensesNonTaxable: "Débours non taxables",
    discountApplied: "Rabais accordé",
    subtotalTaxable: "Sous-total taxable",
    taxHst: "TVH (13 %)",
    taxGst: "TPS (5 %)",
    taxQst: "TVQ (9,975 %)",
    total: "Total de la facture",
    paid: "Sommes reçues",
    balanceDue: "SOLDE DÛ",
    payBefore: "à payer avant le",
    paymentTitle: "MODALITÉS DE PAIEMENT",
    paymentTo: "À l'ordre de",
    note: "NOTE AU CLIENT",
    page: "Page",
    of: "sur",
  },
  en: {
    invoice: "INVOICE",
    issueDate: "Issued",
    dueDate: "Due",
    issuedBy: "FROM",
    billedTo: "BILLED TO",
    matter: "MATTER",
    hst: "HST",
    gst: "GST",
    qst: "QST",
    bn: "Business",
    taxNumbers: "REGISTRATION NUMBERS",
    groupFees: "PROFESSIONAL FEES",
    groupExpenses: "DISBURSEMENTS AND CHARGES",
    groupOther: "ADJUSTMENTS",
    colDate: "DATE",
    colService: "SERVICE",
    colWho: "FEE EARNER",
    colHours: "HOURS",
    colRate: "RATE",
    colAmount: "AMOUNT",
    colNature: "NATURE",
    colTaxable: "TAXABLE",
    yes: "Yes",
    no: "No",
    summary: "SUMMARY",
    subtotalFees: "Fees",
    subtotalExpensesTaxable: "Taxable disbursements",
    subtotalExpensesNonTaxable: "Non-taxable disbursements",
    discountApplied: "Discount applied",
    subtotalTaxable: "Taxable subtotal",
    taxHst: "HST (13%)",
    taxGst: "GST (5%)",
    taxQst: "QST (9.975%)",
    total: "Invoice total",
    paid: "Amounts received",
    balanceDue: "BALANCE DUE",
    payBefore: "payable by",
    paymentTitle: "PAYMENT TERMS",
    paymentTo: "Payable to",
    note: "NOTE TO CLIENT",
    page: "Page",
    of: "of",
  },
} as const;

const styles = StyleSheet.create({
  page: {
    padding: spacing.pagePadding,
    // Le pied de page est en position absolue : sans cette réserve, la
    // dernière ligne du contenu passait DERRIÈRE les modalités de paiement.
    paddingBottom: spacing.pagePadding + 52,
    fontSize: echelle.corps,
    fontFamily: font.family,
    color: colors.text,
    backgroundColor: colors.white,
  },

  /* ── Bloc droit de l'en-tête ──────────────────────────────────── */
  kicker: {
    fontSize: echelle.petit,
    color: colors.brand,
    fontFamily: font.bold,
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  numero: {
    fontSize: echelle.corps,
    fontFamily: font.bold,
    color: colors.text,
    marginBottom: 5,
  },
  dateRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 1 },
  dateLabel: {
    fontSize: echelle.petit,
    color: colors.textMuted,
    marginRight: 5,
  },
  dateValue: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.text,
  },

  /* ── Encadré du solde dû, en haut ─────────────────────────────── */
  soldeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.brandSoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spacing.sectionGap,
  },
  soldeLabel: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.brand,
    letterSpacing: 1.2,
  },
  soldeEcheance: {
    fontSize: echelle.petit,
    color: colors.textMuted,
    marginTop: 3,
  },
  soldeMontant: {
    fontSize: echelle.montant,
    fontFamily: font.bold,
    color: colors.text,
  },

  /* ── Émetteur / destinataire ──────────────────────────────────── */
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sectionGap,
    gap: 14,
  },
  block: { flex: 1 },
  blockHeader: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  blockName: {
    fontSize: echelle.corps,
    fontFamily: font.bold,
    color: colors.text,
    marginBottom: 2,
  },
  blockLine: {
    fontSize: echelle.petit,
    color: colors.textMuted,
    lineHeight: 1.45,
  },

  /* ── Dossier ──────────────────────────────────────────────────── */
  matterRow: { flexDirection: "row", marginBottom: spacing.sectionGap },
  matterLabel: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginRight: 8,
  },
  matterValue: { fontSize: echelle.petit, color: colors.text, flex: 1 },

  /* ── Groupes de lignes ────────────────────────────────────────── */
  group: { marginBottom: 10 },
  groupTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderBottomWidth: 1,
    borderBottomColor: colors.brand,
    paddingBottom: 4,
  },
  groupTitle: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.brand,
    letterSpacing: 1.2,
  },
  groupSubtotal: {
    fontSize: echelle.corps,
    fontFamily: font.bold,
    color: colors.text,
  },
  headRow: {
    flexDirection: "row",
    paddingTop: 5,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headCell: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    alignItems: "flex-start",
  },
  cell: { fontSize: echelle.corps, color: colors.text },
  cellMuted: { fontSize: echelle.corps, color: colors.textMuted },
  cellAmount: {
    fontSize: echelle.corps,
    fontFamily: font.bold,
    color: colors.text,
    textAlign: "right",
  },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  pr: { paddingRight: 6 },

  /* ── Récapitulatif ────────────────────────────────────────────── */
  bandeBas: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    gap: 16,
    marginTop: 2,
  },
  summary: { width: "58%" },
  summaryTitle: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.textMuted,
    letterSpacing: 1.2,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand,
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: echelle.corps, color: colors.textMuted },
  summaryValue: { fontSize: echelle.corps, color: colors.text },
  summaryStrong: { fontFamily: font.bold, color: colors.text },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  summaryDue: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.brand,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  summaryDueLabel: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.white,
    letterSpacing: 1.2,
  },
  summaryDueValue: {
    fontSize: echelle.corps,
    fontFamily: font.bold,
    color: colors.white,
  },

  /* ── Note client ──────────────────────────────────────────────── */
  note: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  noteLabel: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  noteText: {
    fontSize: echelle.petit,
    color: colors.textMuted,
    lineHeight: 1.5,
  },

  /* ── Pied de page ─────────────────────────────────────────────── */
  footer: {
    position: "absolute",
    bottom: spacing.pagePadding - 12,
    left: spacing.pagePadding,
    right: spacing.pagePadding,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderStrong,
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  footerCol: { flex: 1 },
  footerLabel: {
    fontSize: echelle.petit,
    fontFamily: font.bold,
    color: colors.textMuted,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  footerText: {
    fontSize: echelle.petit,
    color: colors.textMuted,
    lineHeight: 1.45,
  },
  footerLegal: {
    fontSize: echelle.petit,
    color: colors.textFaint,
    fontFamily: font.oblique,
    marginTop: 4,
  },
  pageNum: {
    position: "absolute",
    bottom: 14,
    right: spacing.pagePadding,
    fontSize: echelle.petit,
    color: colors.textFaint,
  },
});

function fmtMoney(
  n: number,
  locale: InvoiceLanguage,
  currency: string,
): string {
  const intl = locale === "en" ? "en-CA" : "fr-CA";
  return new Intl.NumberFormat(intl, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtHeures(n: number, locale: InvoiceLanguage): string {
  const intl = locale === "en" ? "en-CA" : "fr-CA";
  return new Intl.NumberFormat(intl, {
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

function clientAddressLines(
  client: NonNullable<PresentedInvoice["client"]>,
): string[] {
  const lines: string[] = [];
  if (client.billingAddress) lines.push(client.billingAddress);
  const cityLine = [
    client.billingCity,
    client.billingProvince,
    client.billingPostalCode,
  ]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine);
  if (client.billingCountry) lines.push(client.billingCountry);
  return lines;
}

interface InvoiceDocumentProps {
  invoice: PresentedInvoice;
  language?: InvoiceLanguage;
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

  // Régime de taxe = celui du CABINET (exposé par le presenter), et non la
  // province du client. Une facture d'un cabinet QC affiche TPS/TVQ même pour
  // un client hors-QC.
  const taxRegime = totals.taxRegime;

  const groupes = grouperLignes(invoice.lines);

  // Les colonnes « Heures » et « Taux » n'ont de sens qu'en mode horaire. Au
  // forfait, elles affichaient deux tirets par ligne sur toute la facture ;
  // on les retire et la prestation récupère la place.
  const montrerHeures =
    !invoice.isForfait &&
    groupes.honoraires.some(
      (l) => l.hours != null && l.hours > 0 && l.rate != null,
    );
  const cH = montrerHeures
    ? colonnesHonoraires
    : {
        ...colonnesHonoraires,
        prestation:
          colonnesHonoraires.prestation +
          colonnesHonoraires.heures +
          colonnesHonoraires.taux,
        heures: 0,
        taux: 0,
      };

  const numerosTaxe = [
    cabinet?.taxNumbers.hstNumber
      ? `${t.hst} ${cabinet.taxNumbers.hstNumber}`
      : null,
    cabinet?.taxNumbers.gstNumber && !cabinet?.taxNumbers.hstNumber
      ? `${t.gst} ${cabinet.taxNumbers.gstNumber}`
      : null,
    cabinet?.taxNumbers.qstNumber
      ? `${t.qst} ${cabinet.taxNumbers.qstNumber}`
      : null,
    cabinet?.taxNumbers.businessNumber &&
    !cabinet.taxNumbers.hstNumber &&
    !cabinet.taxNumbers.gstNumber
      ? `${t.bn} ${cabinet.taxNumbers.businessNumber}`
      : null,
  ].filter(Boolean) as string[];

  const clientName = client ? presentClientDisplayName(client) : "—";
  const clientLines = client ? clientAddressLines(client) : [];

  // Le solde dû est le chiffre qu'on cherche. S'il n'y a eu aucun paiement,
  // il vaut le total : on l'affiche quand même, c'est bien ce qui est dû.
  const solde = totals.balanceDue;

  /* Un nom de cabinet finit souvent par un point (« Roy Avocats inc. ») : la
     phrase du pied de page en ajoutait un second. */
  const nomPourSignature = (cabinet?.nom ?? "—").trim();

  return (
    <Document
      author={cabinet?.nom ?? "SAFE"}
      title={`${t.invoice} ${displayInvoiceNumero(invoice.numero)}`}
      creator="SAFE — Cabinet juridique"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* En-tête : identité du cabinet (Letterhead partagé) + n° + dates.
            N.B. le n° de Barreau / LSO n'apparaît JAMAIS sur une facture
            (règle dure CEO 2026-05-12 — donnée confidentielle). */}
        <Letterhead
          cabinet={cabinet}
          fixed
          right={
            <>
              <Text style={styles.kicker}>{t.invoice}</Text>
              <Text style={styles.numero}>
                {displayInvoiceNumero(invoice.numero)}
              </Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{t.issueDate}</Text>
                <Text style={styles.dateValue}>
                  {fmtDate(invoice.dateEmission, language)}
                </Text>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{t.dueDate}</Text>
                <Text style={styles.dateValue}>
                  {fmtDate(invoice.dateEcheance, language)}
                </Text>
              </View>
            </>
          }
        />

        {/* Le solde dû, en haut. Le client ne doit pas le chercher. */}
        <View style={styles.soldeBox}>
          <View>
            <Text style={styles.soldeLabel}>{t.balanceDue}</Text>
            <Text style={styles.soldeEcheance}>
              {t.payBefore} {fmtDate(invoice.dateEcheance, language)}
            </Text>
          </View>
          <Text style={styles.soldeMontant}>
            {fmtMoney(solde, language, currency)}
          </Text>
        </View>

        {/* Émetteur / destinataire */}
        <View style={styles.twoCol}>
          <View style={styles.block}>
            <Text style={styles.blockHeader}>{t.issuedBy}</Text>
            <Text style={styles.blockName}>{cabinet?.nom ?? "—"}</Text>
            {cabinet?.adresse ? (
              <Text style={styles.blockLine}>{cabinet.adresse}</Text>
            ) : null}
            {cabinet?.telephone ? (
              <Text style={styles.blockLine}>{cabinet.telephone}</Text>
            ) : null}
            {cabinet?.email ? (
              <Text style={styles.blockLine}>{cabinet.email}</Text>
            ) : null}
          </View>
          <View style={styles.block}>
            <Text style={styles.blockHeader}>{t.billedTo}</Text>
            <Text style={styles.blockName}>{clientName}</Text>
            {clientLines.map((line, i) => (
              <Text key={i} style={styles.blockLine}>
                {line}
              </Text>
            ))}
            {client?.email ? (
              <Text style={styles.blockLine}>{client.email}</Text>
            ) : null}
          </View>
        </View>

        {/* Dossier de référence */}
        {dossier ? (
          <View style={styles.matterRow}>
            <Text style={styles.matterLabel}>{t.matter}</Text>
            <Text style={styles.matterValue}>
              {dossier.numeroDossier ? `${dossier.numeroDossier} — ` : ""}
              {dossier.intitule}
            </Text>
          </View>
        ) : null}

        {/* ── Groupe 1 : le travail ──────────────────────────────── */}
        {groupes.honoraires.length > 0 ? (
          <View style={styles.group}>
            <View style={styles.groupTitleRow} minPresenceAhead={40}>
              <Text style={styles.groupTitle}>{t.groupFees}</Text>
              <Text style={styles.groupSubtotal}>
                {fmtMoney(groupes.sousTotaux.honoraires, language, currency)}
              </Text>
            </View>
            <View style={styles.headRow}>
              <Text
                style={[styles.headCell, styles.pr, { width: `${cH.date}%` }]}
              >
                {t.colDate}
              </Text>
              <Text
                style={[
                  styles.headCell,
                  styles.pr,
                  { width: `${cH.prestation}%` },
                ]}
              >
                {t.colService}
              </Text>
              <Text
                style={[
                  styles.headCell,
                  styles.pr,
                  { width: `${cH.intervenant}%` },
                ]}
              >
                {t.colWho}
              </Text>
              {montrerHeures ? (
                <>
                  <Text
                    style={[
                      styles.headCell,
                      styles.right,
                      styles.pr,
                      { width: `${cH.heures}%` },
                    ]}
                  >
                    {t.colHours}
                  </Text>
                  <Text
                    style={[
                      styles.headCell,
                      styles.right,
                      styles.pr,
                      { width: `${cH.taux}%` },
                    ]}
                  >
                    {t.colRate}
                  </Text>
                </>
              ) : null}
              <Text
                style={[
                  styles.headCell,
                  styles.right,
                  { width: `${cH.montant}%` },
                ]}
              >
                {t.colAmount}
              </Text>
            </View>
            {groupes.honoraires.map((l) => (
              <View key={l.id} style={styles.row} wrap={false}>
                <Text
                  style={[
                    styles.cellMuted,
                    styles.pr,
                    { width: `${cH.date}%` },
                  ]}
                >
                  {l.date ? fmtDateShort(l.date, language) : "—"}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.pr,
                    { width: `${cH.prestation}%` },
                  ]}
                >
                  {l.description || "—"}
                </Text>
                <Text
                  style={[
                    styles.cellMuted,
                    styles.pr,
                    { width: `${cH.intervenant}%` },
                  ]}
                >
                  {l.userNom || "—"}
                </Text>
                {montrerHeures ? (
                  <>
                    <Text
                      style={[
                        styles.cellMuted,
                        styles.right,
                        styles.pr,
                        { width: `${cH.heures}%` },
                      ]}
                    >
                      {l.hours != null && l.hours > 0
                        ? fmtHeures(l.hours, language)
                        : "—"}
                    </Text>
                    <Text
                      style={[
                        styles.cellMuted,
                        styles.right,
                        styles.pr,
                        { width: `${cH.taux}%` },
                      ]}
                    >
                      {l.rate != null && l.rate > 0
                        ? fmtMoney(l.rate, language, currency)
                        : "—"}
                    </Text>
                  </>
                ) : null}
                <Text style={[styles.cellAmount, { width: `${cH.montant}%` }]}>
                  {fmtMoney(l.amount, language, currency)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Groupe 2 : les sommes avancées pour le client ──────── */}
        {groupes.debours.length > 0 ? (
          <View style={styles.group}>
            <View style={styles.groupTitleRow} minPresenceAhead={40}>
              <Text style={styles.groupTitle}>{t.groupExpenses}</Text>
              <Text style={styles.groupSubtotal}>
                {fmtMoney(groupes.sousTotaux.debours, language, currency)}
              </Text>
            </View>
            <View style={styles.headRow}>
              <Text
                style={[
                  styles.headCell,
                  styles.pr,
                  { width: `${colonnesDebours.date}%` },
                ]}
              >
                {t.colDate}
              </Text>
              <Text
                style={[
                  styles.headCell,
                  styles.pr,
                  { width: `${colonnesDebours.nature}%` },
                ]}
              >
                {t.colNature}
              </Text>
              <Text
                style={[
                  styles.headCell,
                  styles.center,
                  styles.pr,
                  { width: `${colonnesDebours.taxable}%` },
                ]}
              >
                {t.colTaxable}
              </Text>
              <Text
                style={[
                  styles.headCell,
                  styles.right,
                  { width: `${colonnesDebours.montant}%` },
                ]}
              >
                {t.colAmount}
              </Text>
            </View>
            {groupes.debours.map((l) => (
              <View key={l.id} style={styles.row} wrap={false}>
                <Text
                  style={[
                    styles.cellMuted,
                    styles.pr,
                    { width: `${colonnesDebours.date}%` },
                  ]}
                >
                  {l.date ? fmtDateShort(l.date, language) : "—"}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.pr,
                    { width: `${colonnesDebours.nature}%` },
                  ]}
                >
                  {l.description || "—"}
                </Text>
                <Text
                  style={[
                    styles.cellMuted,
                    styles.center,
                    styles.pr,
                    { width: `${colonnesDebours.taxable}%` },
                  ]}
                >
                  {deboursEstTaxable(l) ? t.yes : t.no}
                </Text>
                <Text
                  style={[
                    styles.cellAmount,
                    { width: `${colonnesDebours.montant}%` },
                  ]}
                >
                  {fmtMoney(l.amount, language, currency)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Rabais et autres ajustements ───────────────────────── */}
        {groupes.rabais.length + groupes.autres.length > 0 ? (
          <View style={styles.group}>
            <View style={styles.groupTitleRow} minPresenceAhead={40}>
              <Text style={styles.groupTitle}>{t.groupOther}</Text>
              <Text style={styles.groupSubtotal} />
            </View>
            {[...groupes.rabais, ...groupes.autres].map((l) => (
              <View key={l.id} style={styles.row} wrap={false}>
                <Text
                  style={[
                    styles.cellMuted,
                    styles.pr,
                    { width: `${colonnesDebours.date}%` },
                  ]}
                >
                  {l.date ? fmtDateShort(l.date, language) : "—"}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.pr,
                    {
                      width: `${colonnesDebours.nature + colonnesDebours.taxable}%`,
                    },
                  ]}
                >
                  {l.description || "—"}
                </Text>
                <Text
                  style={[
                    styles.cellAmount,
                    { width: `${colonnesDebours.montant}%` },
                  ]}
                >
                  {fmtMoney(l.amount, language, currency)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Note au client et récapitulatif, côte à côte ───────── */}
        {/* La note occupe la colonne gauche, restée vide sous le détail :
            placée en dessous, une seule phrase ouvrait une page de plus. */}
        <View style={styles.bandeBas}>
          {invoice.clientNote ? (
            <View style={styles.note} wrap={false}>
              <Text style={styles.noteLabel}>{t.note}</Text>
              <Text style={styles.noteText}>{invoice.clientNote}</Text>
            </View>
          ) : null}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{t.summary}</Text>

            {groupes.sousTotaux.honoraires > 0 ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>{t.subtotalFees}</Text>
                <Text style={styles.summaryValue}>
                  {fmtMoney(groupes.sousTotaux.honoraires, language, currency)}
                </Text>
              </View>
            ) : null}
            {groupes.sousTotaux.deboursTaxables > 0 ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>
                  {t.subtotalExpensesTaxable}
                </Text>
                <Text style={styles.summaryValue}>
                  {fmtMoney(
                    groupes.sousTotaux.deboursTaxables,
                    language,
                    currency,
                  )}
                </Text>
              </View>
            ) : null}
            {totals.totalRabais > 0 ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>{t.discountApplied}</Text>
                <Text style={styles.summaryValue}>
                  -{fmtMoney(totals.totalRabais, language, currency)}
                </Text>
              </View>
            ) : null}

            {/* L'assiette de la taxe. C'est ce nombre qui rend la TPS vérifiable. */}
            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLabel, styles.summaryStrong]}>
                {t.subtotalTaxable}
              </Text>
              <Text style={[styles.summaryValue, styles.summaryStrong]}>
                {fmtMoney(totals.subtotalTaxable, language, currency)}
              </Text>
            </View>

            {taxRegime === "HST" && totals.hst > 0 ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>{t.taxHst}</Text>
                <Text style={styles.summaryValue}>
                  {fmtMoney(totals.hst, language, currency)}
                </Text>
              </View>
            ) : null}
            {taxRegime !== "HST" && totals.tps > 0 ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>{t.taxGst}</Text>
                <Text style={styles.summaryValue}>
                  {fmtMoney(totals.tps, language, currency)}
                </Text>
              </View>
            ) : null}
            {taxRegime === "GST_QST" && totals.tvq > 0 ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>{t.taxQst}</Text>
                <Text style={styles.summaryValue}>
                  {fmtMoney(totals.tvq, language, currency)}
                </Text>
              </View>
            ) : null}

            {/* Les débours non taxables entrent APRÈS la taxe, jamais avant :
              les porter au sous-total taxable gonflerait la TPS. */}
            {totals.deboursNonTaxableTotal > 0 ||
            groupes.sousTotaux.deboursNonTaxables > 0 ? (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>
                  {t.subtotalExpensesNonTaxable}
                </Text>
                <Text style={styles.summaryValue}>
                  {fmtMoney(
                    totals.deboursNonTaxableTotal ||
                      groupes.sousTotaux.deboursNonTaxables,
                    language,
                    currency,
                  )}
                </Text>
              </View>
            ) : null}

            {/* La queue du récapitulatif ne se coupe JAMAIS : un total en bas
              d'une page et son solde dû en haut de la suivante est le genre de
              découpe qui fait rappeler le cabinet. Le haut, lui, peut couler :
              c'est ce qui évite de laisser un grand trou blanc. */}
            <View wrap={false}>
              <View style={styles.summaryTotal}>
                <Text style={[styles.summaryLabel, styles.summaryStrong]}>
                  {t.total}
                </Text>
                <Text style={[styles.summaryValue, styles.summaryStrong]}>
                  {fmtMoney(totals.montantTotal, language, currency)}
                </Text>
              </View>

              {totals.montantPaye > 0 ? (
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>{t.paid}</Text>
                  <Text style={styles.summaryValue}>
                    -{fmtMoney(totals.montantPaye, language, currency)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.summaryDue}>
                <Text style={styles.summaryDueLabel}>{t.balanceDue}</Text>
                <Text style={styles.summaryDueValue}>
                  {fmtMoney(solde, language, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pied de page fixe : modalités à gauche, numéros d'inscription aux
            taxes à droite (exigence ARC dès que le cabinet perçoit la taxe). */}
        <View style={styles.footer} fixed>
          <View style={styles.footerRow}>
            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>{t.paymentTitle}</Text>
              <Text style={styles.footerText}>
                {legalNotices[language].paymentTerms} {t.paymentTo}{" "}
                <Text style={{ fontFamily: font.bold }}>
                  {nomPourSignature}
                </Text>
                {nomPourSignature.endsWith(".") ? "" : "."}
              </Text>
            </View>
            {numerosTaxe.length > 0 ? (
              <View style={styles.footerCol}>
                <Text style={styles.footerLabel}>{t.taxNumbers}</Text>
                {numerosTaxe.map((n) => (
                  <Text key={n} style={styles.footerText}>
                    {n}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
          <Text style={styles.footerLegal}>
            {legalNotices[language].keepForRecords}
          </Text>
        </View>

        <Text
          style={styles.pageNum}
          render={({ pageNumber, totalPages }) =>
            `${t.page} ${pageNumber} ${t.of} ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
