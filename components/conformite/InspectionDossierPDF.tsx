/**
 * Dossier d'inspection (react-pdf) — étape 4 du plan de différenciation.
 *
 * Document PDF daté « prêt pour l'inspection » assemblant : identité cabinet,
 * état de conformité (readiness 14 domaines), historique des rapprochements de
 * fidéicommis de l'exercice, et extrait de la piste d'audit.
 *
 * Doctrine : AUCUNE logique métier ni i18n ici. La route résout toutes les
 * données et tous les libellés (province-aware) et les passe en props.
 */

import * as React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Letterhead, type LetterheadCabinet } from "@/lib/templates/letterhead";
import { colors, fontSize, font, spacing } from "@/lib/invoice-template/tokens";

export interface InspectionDomainRow {
  title: string;
  stateLabel: string;
  evidence: string | null;
}
export interface InspectionReconRow {
  periode: string;
  statusLabel: string;
  certifiedAtText: string;
  ecartText: string;
}
export interface InspectionAuditRow {
  dateText: string;
  user: string;
  action: string;
  entity: string;
}

export interface InspectionDossierPDFProps {
  cabinet: LetterheadCabinet;
  labels: {
    docTitle: string;
    generatedAt: string;
    provinceLabel: string;
    provinceValue: string;
    regulator: string;
    barreauLabel: string;
    barreauValue: string;
    sectionReadiness: string;
    scoreLabel: string;
    scoreValue: number;
    colDomain: string;
    colState: string;
    sectionRecon: string;
    reconSummary: string;
    colPeriode: string;
    colStatus: string;
    colCertified: string;
    colEcart: string;
    reconEmpty: string;
    sectionAudit: string;
    colDate: string;
    colUser: string;
    colAction: string;
    auditEmpty: string;
    footer: string;
  };
  domains: InspectionDomainRow[];
  recon: InspectionReconRow[];
  audit: InspectionAuditRow[];
}

const styles = StyleSheet.create({
  page: {
    paddingTop: spacing.pagePadding,
    paddingBottom: spacing.pagePadding + 14,
    paddingHorizontal: spacing.pagePadding,
    fontFamily: font.family,
    color: colors.text,
    fontSize: fontSize.body,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.sectionGap },
  metaItem: { width: "50%", marginBottom: 3 },
  metaLabel: { fontSize: fontSize.footer, color: colors.textMuted, textTransform: "uppercase" },
  metaValue: { fontSize: fontSize.bodySmall, color: colors.text },
  docTitle: {
    fontSize: fontSize.hero,
    fontFamily: font.bold,
    color: colors.brand,
    marginBottom: 2,
  },
  section: { marginBottom: spacing.sectionGap },
  sectionHeader: {
    fontSize: fontSize.sectionHeader,
    fontFamily: font.bold,
    color: colors.brand,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreLine: { flexDirection: "row", alignItems: "baseline", marginBottom: 8, gap: 6 },
  scoreValue: { fontSize: fontSize.totalLarge, fontFamily: font.bold, color: colors.brand },
  scoreLabel: { fontSize: fontSize.bodySmall, color: colors.textMuted },
  // Table générique
  tHead: {
    flexDirection: "row",
    backgroundColor: colors.brandSoft,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tHeadCell: { fontSize: fontSize.footer, fontFamily: font.bold, color: colors.brand, textTransform: "uppercase" },
  tRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tRowAlt: { backgroundColor: colors.rowAlt },
  tCell: { fontSize: fontSize.bodySmall, color: colors.text },
  cellMuted: { fontSize: fontSize.footer, color: colors.textMuted },
  summaryNote: { fontSize: fontSize.bodySmall, color: colors.textMuted, marginBottom: 6 },
  empty: { fontSize: fontSize.bodySmall, color: colors.textMuted, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: spacing.pagePadding,
    right: spacing.pagePadding,
    fontSize: fontSize.footer,
    color: colors.textFaint,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
});

export function InspectionDossierPDF({ cabinet, labels, domains, recon, audit }: InspectionDossierPDFProps) {
  const L = labels;
  return (
    <Document title={L.docTitle}>
      <Page size="A4" style={styles.page}>
        <Letterhead
          cabinet={cabinet}
          right={
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.docTitle}>{L.docTitle}</Text>
              <Text style={styles.metaLabel}>{L.generatedAt}</Text>
            </View>
          }
        />

        {/* Méta identité */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{L.provinceLabel}</Text>
            <Text style={styles.metaValue}>{L.provinceValue} · {L.regulator}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{L.barreauLabel}</Text>
            <Text style={styles.metaValue}>{L.barreauValue}</Text>
          </View>
        </View>

        {/* Section 1 — Conformité (readiness) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{L.sectionReadiness}</Text>
          <View style={styles.scoreLine}>
            <Text style={styles.scoreValue}>{L.scoreValue}%</Text>
            <Text style={styles.scoreLabel}>{L.scoreLabel}</Text>
          </View>
          <View style={styles.tHead}>
            <Text style={[styles.tHeadCell, { width: "34%" }]}>{L.colDomain}</Text>
            <Text style={[styles.tHeadCell, { width: "22%" }]}>{L.colState}</Text>
            <Text style={[styles.tHeadCell, { width: "44%" }]}>{" "}</Text>
          </View>
          {domains.map((d, i) => (
            <View key={d.title} style={[styles.tRow, ...(i % 2 ? [styles.tRowAlt] : [])]} wrap={false}>
              <Text style={[styles.tCell, { width: "34%" }]}>{d.title}</Text>
              <Text style={[styles.tCell, { width: "22%" }]}>{d.stateLabel}</Text>
              <Text style={[styles.cellMuted, { width: "44%" }]}>{d.evidence ?? ""}</Text>
            </View>
          ))}
        </View>

        {/* Section 2 — Rapprochements de fidéicommis */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{L.sectionRecon}</Text>
          <Text style={styles.summaryNote}>{L.reconSummary}</Text>
          {recon.length === 0 ? (
            <Text style={styles.empty}>{L.reconEmpty}</Text>
          ) : (
            <>
              <View style={styles.tHead}>
                <Text style={[styles.tHeadCell, { width: "28%" }]}>{L.colPeriode}</Text>
                <Text style={[styles.tHeadCell, { width: "28%" }]}>{L.colStatus}</Text>
                <Text style={[styles.tHeadCell, { width: "28%" }]}>{L.colCertified}</Text>
                <Text style={[styles.tHeadCell, { width: "16%", textAlign: "right" }]}>{L.colEcart}</Text>
              </View>
              {recon.map((r, i) => (
                <View key={r.periode} style={[styles.tRow, ...(i % 2 ? [styles.tRowAlt] : [])]} wrap={false}>
                  <Text style={[styles.tCell, { width: "28%" }]}>{r.periode}</Text>
                  <Text style={[styles.tCell, { width: "28%" }]}>{r.statusLabel}</Text>
                  <Text style={[styles.cellMuted, { width: "28%" }]}>{r.certifiedAtText}</Text>
                  <Text style={[styles.tCell, { width: "16%", textAlign: "right" }]}>{r.ecartText}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Section 3 — Piste d'audit */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{L.sectionAudit}</Text>
          {audit.length === 0 ? (
            <Text style={styles.empty}>{L.auditEmpty}</Text>
          ) : (
            <>
              <View style={styles.tHead}>
                <Text style={[styles.tHeadCell, { width: "24%" }]}>{L.colDate}</Text>
                <Text style={[styles.tHeadCell, { width: "26%" }]}>{L.colUser}</Text>
                <Text style={[styles.tHeadCell, { width: "50%" }]}>{L.colAction}</Text>
              </View>
              {audit.map((a, i) => (
                <View key={i} style={[styles.tRow, ...(i % 2 ? [styles.tRowAlt] : [])]} wrap={false}>
                  <Text style={[styles.cellMuted, { width: "24%" }]}>{a.dateText}</Text>
                  <Text style={[styles.tCell, { width: "26%" }]}>{a.user}</Text>
                  <Text style={[styles.tCell, { width: "50%" }]}>{a.action}{a.entity ? ` · ${a.entity}` : ""}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <Text style={styles.footer} fixed>{L.footer}</Text>
      </Page>
    </Document>
  );
}
