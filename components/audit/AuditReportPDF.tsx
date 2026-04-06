import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

/* ─────────────────────────────────────────────
   Types (mirrored from AuditChat)
   ───────────────────────────────────────────── */

interface SectionDiagnostic {
  title: string;
  score: number;
  status: "excellent" | "bon" | "attention" | "critique";
  findings: string[];
  recommendations: string[];
  safeHelp: string;
}

interface AuditComputed {
  pain_score: number;
  maturity_level: string;
  estimated_monthly_loss: number;
  estimated_annual_loss: number;
  potential_recovery: number;
  priority_recommendations: string[];
  sections: SectionDiagnostic[];
  strengths: string[];
  overall_summary: string;
}

interface AuditReportPDFProps {
  contactName: string;
  contactFirm: string;
  contactEmail: string;
  practiceType: string;
  date: string;
  computed: AuditComputed;
}

/* ─────────────────────────────────────────────
   Colors & Styles
   ───────────────────────────────────────────── */

const COLORS = {
  dark: "#12372A",
  medium: "#436850",
  light: "#ADBC9F",
  bg: "#F8FDF9",
  white: "#FFFFFF",
  red: "#DC2626",
  orange: "#EA580C",
  green: "#16A34A",
  gray: "#6B7280",
  grayLight: "#E5E7EB",
};

const STATUS_COLORS: Record<string, string> = {
  excellent: COLORS.green,
  bon: COLORS.medium,
  attention: COLORS.orange,
  critique: COLORS.red,
};

const STATUS_LABELS: Record<string, string> = {
  excellent: "EXCELLENT",
  bon: "BON",
  attention: "À AMÉLIORER",
  critique: "CRITIQUE",
};

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  // ── Cover page ──
  coverPage: {
    padding: 50,
    fontFamily: "Helvetica",
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  coverBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 30,
  },
  coverBadgeText: {
    color: COLORS.light,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: COLORS.light,
    textAlign: "center",
    marginBottom: 50,
  },
  coverInfoBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    marginBottom: 30,
  },
  coverInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  coverInfoLabel: {
    color: COLORS.light,
    fontSize: 9,
  },
  coverInfoValue: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  coverFooter: {
    position: "absolute",
    bottom: 40,
    left: 50,
    right: 50,
    textAlign: "center",
  },
  coverFooterText: {
    fontSize: 8,
    color: "rgba(255,255,255,0.4)",
  },

  // ── Common ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.dark,
    paddingBottom: 8,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  headerPage: {
    fontSize: 8,
    color: COLORS.gray,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray,
  },

  // ── Summary page ──
  summaryTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.dark,
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F0F7F2",
    borderRadius: 6,
  },

  // ── Score overview ──
  scoreRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  scoreCardLight: {
    flex: 1,
    backgroundColor: "#F0F7F2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    marginBottom: 2,
  },
  scoreValueDark: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 8,
    color: COLORS.light,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  scoreLabelDark: {
    fontSize: 8,
    color: COLORS.medium,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },

  // ── Section scores bar ──
  sectionScoresTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 12,
  },
  sectionScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionScoreLabel: {
    width: 140,
    fontSize: 9,
    color: COLORS.dark,
  },
  sectionScoreBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.grayLight,
    borderRadius: 7,
    overflow: "hidden",
  },
  sectionScoreBarFill: {
    height: 14,
    borderRadius: 7,
  },
  sectionScoreValue: {
    width: 50,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginLeft: 8,
  },

  // ── Strengths ──
  strengthsBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F0F7F2",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
  },
  strengthsTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.green,
    marginBottom: 6,
  },
  strengthItem: {
    fontSize: 9,
    color: COLORS.dark,
    marginBottom: 3,
    paddingLeft: 8,
  },

  // ── Section detail pages ──
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 4,
  },
  sectionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  sectionStatusText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    letterSpacing: 1,
  },
  sectionScoreBig: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  sectionScoreOf100: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 16,
  },

  subTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    paddingBottom: 4,
  },

  findingItem: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.dark,
    marginBottom: 6,
    paddingLeft: 10,
  },
  findingBullet: {
    position: "absolute",
    left: 0,
    top: 0,
    fontSize: 9,
    color: COLORS.medium,
  },
  findingRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bullet: {
    width: 14,
    fontSize: 9,
    color: COLORS.medium,
  },
  findingText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.dark,
  },

  recRow: {
    flexDirection: "row",
    marginBottom: 6,
    backgroundColor: "#F0F7F2",
    borderRadius: 4,
    padding: 8,
  },
  recNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  recNumberText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  recText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.dark,
  },

  safeBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 6,
  },
  safeBoxTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.light,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  safeBoxText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.white,
  },

  // ── Financial page ──
  finTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 16,
  },
  finRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  finCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  finCardDark: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    backgroundColor: COLORS.dark,
  },
  finValue: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  finLabel: {
    fontSize: 8,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  finNote: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.gray,
    marginTop: 8,
    fontStyle: "italic",
  },

  // ── Action plan ──
  actionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 16,
  },
  actionStep: {
    flexDirection: "row",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.medium,
  },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionNumberText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  actionContent: {
    flex: 1,
  },
  actionStepTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.dark,
    marginBottom: 2,
  },
  actionStepDesc: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.gray,
  },

  // ── CTA page ──
  ctaPage: {
    padding: 50,
    fontFamily: "Helvetica",
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: COLORS.light,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 1.6,
  },
  ctaBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    marginBottom: 30,
  },
  ctaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ctaCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.medium,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  ctaCheckText: {
    fontSize: 10,
    color: COLORS.white,
    fontFamily: "Helvetica-Bold",
  },
  ctaItemText: {
    fontSize: 10,
    color: COLORS.white,
  },
  ctaContact: {
    marginTop: 20,
    textAlign: "center",
  },
  ctaContactLabel: {
    fontSize: 9,
    color: COLORS.light,
    marginBottom: 4,
  },
  ctaContactValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
});

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

function formatMoney(n: number): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

/* ─────────────────────────────────────────────
   PDF Document
   ───────────────────────────────────────────── */

export function AuditReportPDF({ contactName, contactFirm, contactEmail, practiceType, date, computed }: AuditReportPDFProps) {
  const displayScore = Math.max(0, 100 - computed.pain_score);

  return (
    <Document>
      {/* ── PAGE 1: COVER ── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverBadge}>
          <Text style={s.coverBadgeText}>Confidentiel</Text>
        </View>

        <Text style={s.coverTitle}>Rapport d&apos;audit</Text>
        <Text style={s.coverTitle}>d&apos;efficacité</Text>
        <Text style={s.coverSubtitle}>Analyse complète de la gestion de votre cabinet</Text>

        <View style={s.coverInfoBox}>
          <View style={s.coverInfoRow}>
            <Text style={s.coverInfoLabel}>Préparé pour</Text>
            <Text style={s.coverInfoValue}>{contactName || "Cabinet"}</Text>
          </View>
          {contactFirm ? (
            <View style={s.coverInfoRow}>
              <Text style={s.coverInfoLabel}>Cabinet</Text>
              <Text style={s.coverInfoValue}>{contactFirm}</Text>
            </View>
          ) : null}
          <View style={s.coverInfoRow}>
            <Text style={s.coverInfoLabel}>Type de pratique</Text>
            <Text style={s.coverInfoValue}>{practiceType}</Text>
          </View>
          <View style={s.coverInfoRow}>
            <Text style={s.coverInfoLabel}>Date</Text>
            <Text style={s.coverInfoValue}>{date}</Text>
          </View>
          <View style={s.coverInfoRow}>
            <Text style={s.coverInfoLabel}>Score global</Text>
            <Text style={s.coverInfoValue}>{displayScore}/100 — {computed.maturity_level}</Text>
          </View>
        </View>

        <View style={s.coverFooter}>
          <Text style={s.coverFooterText}>SAFE — La plateforme de gestion pour avocats</Text>
          <Text style={s.coverFooterText}>www.safe-juridique.com</Text>
        </View>
      </Page>

      {/* ── PAGE 2: SOMMAIRE EXÉCUTIF ── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Sommaire exécutif</Text>
          <Text style={s.headerPage}>Page 2</Text>
        </View>

        <Text style={s.summaryTitle}>Vue d&apos;ensemble de votre cabinet</Text>
        <Text style={s.summarySubtitle}>Analyse basée sur vos réponses au questionnaire d&apos;audit</Text>

        <Text style={s.summaryText}>{computed.overall_summary}</Text>

        {/* Score cards */}
        <View style={s.scoreRow}>
          <View style={s.scoreCard}>
            <Text style={s.scoreValue}>{displayScore}</Text>
            <Text style={s.scoreLabel}>Score global /100</Text>
          </View>
          <View style={s.scoreCard}>
            <Text style={s.scoreValue}>{computed.maturity_level}</Text>
            <Text style={s.scoreLabel}>Niveau de maturité</Text>
          </View>
          <View style={s.scoreCardLight}>
            <Text style={s.scoreValueDark}>{formatMoney(computed.estimated_monthly_loss)}</Text>
            <Text style={s.scoreLabelDark}>Perte mensuelle estimée</Text>
          </View>
        </View>

        {/* Section scores */}
        <Text style={s.sectionScoresTitle}>Scores par section</Text>
        {computed.sections.map((sec) => (
          <View key={sec.title} style={s.sectionScoreRow}>
            <Text style={s.sectionScoreLabel}>{sec.title}</Text>
            <View style={s.sectionScoreBarBg}>
              <View
                style={[
                  s.sectionScoreBarFill,
                  {
                    width: `${sec.score}%`,
                    backgroundColor: STATUS_COLORS[sec.status],
                  },
                ]}
              />
            </View>
            <Text style={[s.sectionScoreValue, { color: STATUS_COLORS[sec.status] }]}>{sec.score}/100</Text>
          </View>
        ))}

        {/* Strengths */}
        <View style={s.strengthsBox}>
          <Text style={s.strengthsTitle}>Vos points forts</Text>
          {computed.strengths.map((str, i) => (
            <Text key={i} style={s.strengthItem}>
              {"\u2713"} {str}
            </Text>
          ))}
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Rapport d&apos;audit — {contactName || "Cabinet"}</Text>
          <Text style={s.footerText}>SAFE — Confidentiel</Text>
        </View>
      </Page>

      {/* ── PAGES 3-6: SECTION DETAILS ── */}
      {computed.sections.map((sec, idx) => (
        <Page key={sec.title} size="A4" style={s.page}>
          <View style={s.header}>
            <Text style={s.headerTitle}>{sec.title}</Text>
            <Text style={s.headerPage}>Page {idx + 3}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 4 }}>
            <Text style={[s.sectionScoreBig, { color: STATUS_COLORS[sec.status] }]}>{sec.score}</Text>
            <Text style={s.sectionScoreOf100}> /100</Text>
          </View>

          <View style={[s.sectionStatusBadge, { backgroundColor: STATUS_COLORS[sec.status] }]}>
            <Text style={s.sectionStatusText}>{STATUS_LABELS[sec.status]}</Text>
          </View>

          {/* Findings */}
          <Text style={s.subTitle}>Constats</Text>
          {sec.findings.map((f, i) => (
            <View key={i} style={s.findingRow}>
              <Text style={s.bullet}>{"\u2022"}</Text>
              <Text style={s.findingText}>{f}</Text>
            </View>
          ))}

          {/* Recommendations */}
          {sec.recommendations.length > 0 && (
            <>
              <Text style={s.subTitle}>Recommandations</Text>
              {sec.recommendations.map((r, i) => (
                <View key={i} style={s.recRow}>
                  <View style={s.recNumber}>
                    <Text style={s.recNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={s.recText}>{r}</Text>
                </View>
              ))}
            </>
          )}

          {/* How SAFE helps */}
          <View style={s.safeBox}>
            <Text style={s.safeBoxTitle}>COMMENT SAFE PEUT VOUS AIDER</Text>
            <Text style={s.safeBoxText}>{sec.safeHelp}</Text>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Rapport d&apos;audit — {contactName || "Cabinet"}</Text>
            <Text style={s.footerText}>SAFE — Confidentiel</Text>
          </View>
        </Page>
      ))}

      {/* ── PAGE 7: IMPACT FINANCIER ── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Impact financier</Text>
          <Text style={s.headerPage}>Page 7</Text>
        </View>

        <Text style={s.finTitle}>L&apos;impact financier de vos inefficacités</Text>

        <View style={s.finRow}>
          <View style={s.finCardDark}>
            <Text style={[s.finValue, { color: COLORS.white }]}>{formatMoney(computed.estimated_monthly_loss)}</Text>
            <Text style={[s.finLabel, { color: COLORS.light }]}>Perte mensuelle estimée</Text>
          </View>
          <View style={s.finCardDark}>
            <Text style={[s.finValue, { color: "#F87171" }]}>{formatMoney(computed.estimated_annual_loss)}</Text>
            <Text style={[s.finLabel, { color: COLORS.light }]}>Perte annuelle estimée</Text>
          </View>
        </View>

        <View style={s.finRow}>
          <View style={[s.finCard, { borderColor: COLORS.green }]}>
            <Text style={[s.finValue, { color: COLORS.green }]}>{formatMoney(computed.potential_recovery)}</Text>
            <Text style={[s.finLabel, { color: COLORS.medium }]}>Récupération potentielle /an</Text>
          </View>
          <View style={[s.finCard, { borderColor: COLORS.medium }]}>
            <Text style={[s.finValue, { color: COLORS.medium }]}>70%</Text>
            <Text style={[s.finLabel, { color: COLORS.medium }]}>Du temps récupérable</Text>
          </View>
        </View>

        <Text style={s.finNote}>
          * Ces estimations sont basées sur un taux horaire moyen de 250$/h et vos réponses concernant le temps consacré aux tâches administratives. Les résultats réels peuvent varier selon votre situation spécifique.
        </Text>

        {/* Action plan */}
        <Text style={[s.actionTitle, { marginTop: 24 }]}>Plan d&apos;action recommandé</Text>

        {computed.priority_recommendations.map((rec, i) => (
          <View key={i} style={s.actionStep}>
            <View style={s.actionNumber}>
              <Text style={s.actionNumberText}>{i + 1}</Text>
            </View>
            <View style={s.actionContent}>
              <Text style={s.actionStepTitle}>{rec}</Text>
              <Text style={s.actionStepDesc}>
                {i === 0
                  ? "Action prioritaire — impact imm\u00e9diat sur votre quotidien."
                  : i === 1
                  ? "Deuxi\u00e8me priorit\u00e9 — consolide les gains de la premi\u00e8re \u00e9tape."
                  : "Troisi\u00e8me priorit\u00e9 — optimise l\u2019ensemble de votre pratique."}
              </Text>
            </View>
          </View>
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>Rapport d&apos;audit — {contactName || "Cabinet"}</Text>
          <Text style={s.footerText}>SAFE — Confidentiel</Text>
        </View>
      </Page>

      {/* ── PAGE 8: CTA ── */}
      <Page size="A4" style={s.ctaPage}>
        <Text style={s.ctaTitle}>Prêt(e) à transformer</Text>
        <Text style={s.ctaTitle}>votre cabinet ?</Text>
        <Text style={s.ctaSubtitle}>
          SAFE est la plateforme tout-en-un conçue spécifiquement{"\n"}pour les avocats du Québec.
        </Text>

        <View style={s.ctaBox}>
          {[
            "Gestion de dossiers centralis\u00e9e et intelligente",
            "Comptabilit\u00e9 juridique native (fid\u00e9icommis inclus)",
            "Facturation automatis\u00e9e et suivi des paiements",
            "Conformit\u00e9 Barreau du Qu\u00e9bec int\u00e9gr\u00e9e",
            "Tableaux de bord en temps r\u00e9el",
          ].map((item, i) => (
            <View key={i} style={s.ctaItem}>
              <View style={s.ctaCheck}>
                <Text style={s.ctaCheckText}>{"\u2713"}</Text>
              </View>
              <Text style={s.ctaItemText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={s.ctaContact}>
          <Text style={s.ctaContactLabel}>Réservez votre démo personnalisée</Text>
          <Text style={s.ctaContactValue}>www.safe-juridique.com/demo</Text>
        </View>

        <View style={s.coverFooter}>
          <Text style={s.coverFooterText}>
            Ce rapport a été généré automatiquement par SAFE le {date}.
          </Text>
          <Text style={s.coverFooterText}>Les informations sont confidentielles et destinées uniquement à {contactEmail || contactName || "vous"}.</Text>
        </View>
      </Page>
    </Document>
  );
}
