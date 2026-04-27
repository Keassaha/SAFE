/**
 * SAFE — Rapport d'audit PDF (génération serveur)
 * @react-pdf/renderer v4
 */

import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Recommendation, RiskItem, RiskSeverity, SitePlan } from "./recommendation";
import { QUESTIONS, SECTIONS, visibleQuestions, PROVINCES } from "./questions";

const C = {
  bg:       "#F8F5EF",
  card:     "#FFFFFF",
  ink:      "#111111",
  muted:    "#4A4A4A",
  soft:     "#7A7A7A",
  line:     "#B8B0A0",
  green:    "#1F3A2E",
  green600: "#2E5A49",
  greenLt:  "#D4E8D9",
  greenBg:  "#EEF5F0",
  border:   "#E5E0D5",
  borderLt: "#EEE9DC",
  accent:   "#235347",
  risk: {
    critique: "#7A1F1F",
    eleve:    "#A94A14",
    modere:   "#8A6A12",
    faible:   "#2E5A49",
  },
  riskBg: {
    critique: "#F7E2DF",
    eleve:    "#FBE8D9",
    modere:   "#F7EED7",
    faible:   "#E8F0EA",
  },
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg, padding: 48, fontSize: 10.5, color: C.ink,
    fontFamily: "Helvetica", lineHeight: 1.55,
  },
  pageCover: {
    backgroundColor: C.ink, padding: 48, fontSize: 10.5, color: C.card,
    fontFamily: "Helvetica", lineHeight: 1.55,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 28, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  brand: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink, letterSpacing: 1.5 },
  confidential: { fontSize: 8, color: C.soft, textTransform: "uppercase", letterSpacing: 1 },
  footer: {
    position: "absolute", bottom: 24, left: 48, right: 48,
    flexDirection: "row", justifyContent: "space-between",
    fontSize: 8, color: C.soft, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.border,
  },

  kicker: {
    fontSize: 9, color: C.green, textTransform: "uppercase",
    letterSpacing: 2, marginBottom: 10, fontFamily: "Helvetica-Bold",
  },
  h1: { fontSize: 30, fontFamily: "Times-Roman", color: C.ink, lineHeight: 1.1 },
  h1White: { fontSize: 34, fontFamily: "Times-Roman", color: C.card, lineHeight: 1.1 },
  italic: { fontFamily: "Times-Italic" },
  h2: { fontSize: 20, fontFamily: "Times-Roman", marginBottom: 12, color: C.ink },
  h3: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6, color: C.ink },
  p:  { fontSize: 10.5, color: C.muted, marginBottom: 8, lineHeight: 1.6 },
  small: { fontSize: 9, color: C.soft, lineHeight: 1.55 },

  card: {
    backgroundColor: C.card, padding: 16, borderRadius: 6,
    borderWidth: 0.5, borderColor: C.border, marginBottom: 10,
  },
  greenCard: {
    backgroundColor: C.greenBg, padding: 16, borderRadius: 6,
    borderLeftWidth: 3, borderLeftColor: C.green, marginBottom: 10,
  },
  darkCard: { backgroundColor: C.ink, padding: 18, borderRadius: 6, marginBottom: 10, color: C.card },

  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  kpi: { flex: 1, backgroundColor: C.card, padding: 12, borderRadius: 6, borderWidth: 0.5, borderColor: C.border },
  kpiLabel: { fontSize: 8, color: C.soft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  kpiValue: { fontSize: 18, fontFamily: "Times-Roman", color: C.ink },
  kpiSuffix: { fontSize: 10, color: C.muted, marginTop: 2 },

  bullet: { flexDirection: "row", marginBottom: 6 },
  bulletDot: { width: 10, color: C.green, fontFamily: "Helvetica-Bold" },
  bulletText: { flex: 1, fontSize: 10.5, color: C.muted, lineHeight: 1.55 },

  tableRow: {
    flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.border, paddingVertical: 8,
  },
  tableHead: {
    flexDirection: "row", backgroundColor: C.greenBg,
    paddingVertical: 6, paddingHorizontal: 10,
    fontSize: 8, color: C.green, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", letterSpacing: 1,
  },
  tableCellLabel:  { flex: 3, paddingHorizontal: 10, fontSize: 10, color: C.ink },
  tableCellDetail: { flex: 2, paddingHorizontal: 10, fontSize: 9,  color: C.soft },
  tableCellAmount: { flex: 1, paddingHorizontal: 10, fontSize: 10, color: C.ink, textAlign: "right", fontFamily: "Helvetica-Bold" },
  tableTotal: {
    flexDirection: "row", backgroundColor: C.ink, color: C.card,
    paddingVertical: 10, paddingHorizontal: 10, marginTop: 2,
  },
  tableTotalLabel: { flex: 3, fontSize: 10, color: C.card, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Helvetica-Bold" },
  tableTotalDetail:{ flex: 2, fontSize: 9, color: C.card },
  tableTotalAmount:{ flex: 1, fontSize: 12, color: C.card, textAlign: "right", fontFamily: "Helvetica-Bold" },

  qaBlock: {
    marginBottom: 10, paddingBottom: 8,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  qaNum: { fontSize: 8, color: C.green, fontFamily: "Helvetica-Bold", letterSpacing: 1, marginBottom: 2 },
  qaQ:   { fontSize: 10, color: C.ink, marginBottom: 4 },
  qaA:   { fontSize: 10, color: C.muted, fontFamily: "Helvetica-Oblique" },

  // TOC
  tocRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.borderLt,
  },
  tocNum: {
    width: 38, fontSize: 18, fontFamily: "Times-Roman", color: C.green,
  },
  tocBody: { flex: 1, paddingRight: 12 },
  tocTitle: { fontSize: 13, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  tocSub:   { fontSize: 9.5, color: C.muted, lineHeight: 1.45 },
  tocPage:  { fontSize: 10, color: C.soft, fontFamily: "Helvetica-Bold", letterSpacing: 1 },

  // Risks
  riskCard: {
    borderWidth: 0.5, borderColor: C.border, borderRadius: 6,
    padding: 14, marginBottom: 10, backgroundColor: C.card,
  },
  riskHead: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  riskBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3,
    fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase",
    marginRight: 8,
  },
  riskCat: { fontSize: 8, color: C.soft, letterSpacing: 1, textTransform: "uppercase" },
  riskTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 4 },
  riskRef:   { fontSize: 8, color: C.green, fontFamily: "Helvetica-Oblique", marginBottom: 8 },
  riskLabel: { fontSize: 8, color: C.soft, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2, marginTop: 4 },
  riskBody:  { fontSize: 10, color: C.muted, lineHeight: 1.55 },

  // Score
  scoreBox: {
    flexDirection: "row", borderWidth: 0.5, borderColor: C.border, borderRadius: 6,
    marginBottom: 14, overflow: "hidden",
  },
  scoreNum: {
    width: 110, padding: 18, backgroundColor: C.ink, alignItems: "center", justifyContent: "center",
  },
  scoreNumVal: { fontSize: 46, fontFamily: "Times-Roman", color: C.card, lineHeight: 1 },
  scoreNumSuf: { fontSize: 9, color: "#C8D4CB", marginTop: 4, letterSpacing: 1, textTransform: "uppercase" },
  scoreRight: { flex: 1, padding: 16, backgroundColor: C.card },
  scoreVerdict: { fontSize: 9, color: C.green, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 },
  scoreTxt: { fontSize: 10.5, color: C.muted, lineHeight: 1.55 },
  scoreLegend: { flexDirection: "row", gap: 12, marginTop: 10 },
  scoreLegendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  scoreLegendLabel: { fontSize: 8, color: C.soft, letterSpacing: 0.5 },

  // Plans
  planRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  planCard: {
    flex: 1, borderWidth: 0.5, borderColor: C.border, borderRadius: 6,
    padding: 12, backgroundColor: C.card,
  },
  planCardDark: {
    flex: 1, borderRadius: 6, padding: 12, backgroundColor: C.ink,
    borderWidth: 1, borderColor: C.green,
  },
  planName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 4 },
  planNameDark: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.card, marginBottom: 4 },
  planPrice: { fontSize: 22, fontFamily: "Times-Roman", color: C.ink, marginBottom: 2 },
  planPriceDark: { fontSize: 22, fontFamily: "Times-Roman", color: C.card, marginBottom: 2 },
  planSuf: { fontSize: 9, color: C.soft, marginBottom: 8 },
  planSufDark: { fontSize: 9, color: "#A1A1A1", marginBottom: 8 },
  planTagline: { fontSize: 9, color: C.muted, marginBottom: 8, lineHeight: 1.45 },
  planTaglineDark: { fontSize: 9, color: "#D4D4D4", marginBottom: 8, lineHeight: 1.45 },
  planFeat: { flexDirection: "row", marginBottom: 3 },
  planFeatDot: { width: 9, fontSize: 9, color: C.green, fontFamily: "Helvetica-Bold" },
  planFeatDotDark: { width: 9, fontSize: 9, color: "#8FB49F", fontFamily: "Helvetica-Bold" },
  planFeatText: { flex: 1, fontSize: 9, color: C.muted, lineHeight: 1.4 },
  planFeatTextDark: { flex: 1, fontSize: 9, color: "#D4D4D4", lineHeight: 1.4 },
  planBadge: {
    position: "absolute", top: -8, left: 12,
    backgroundColor: C.green, color: C.card,
    fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 1,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, textTransform: "uppercase",
  },

  // Cover (dark)
  coverEyebrow: { fontSize: 9, color: "#C8D4CB", letterSpacing: 3, textTransform: "uppercase", marginBottom: 18 },
  coverSub: { fontSize: 12, color: "#D4E8D9", marginTop: 18, maxWidth: 420, lineHeight: 1.55 },
  coverMeta: { flexDirection: "row", gap: 28, marginTop: 28 },
  coverMetaLabel: { fontSize: 8, color: "#8FA89A", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 },
  coverMetaValue: { fontSize: 11, color: C.card, fontFamily: "Helvetica-Bold" },
  coverStripe: {
    marginTop: 34, padding: 20, borderRadius: 6,
    backgroundColor: "#0E2419", borderLeftWidth: 3, borderLeftColor: C.greenLt,
  },
  coverStripeLabel: { fontSize: 8, color: "#8FB49F", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
  coverStripeTxt: { fontSize: 11, color: "#E8F0EA", lineHeight: 1.6 },
  coverFooter: {
    position: "absolute", bottom: 36, left: 48, right: 48,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  coverBrand: { fontSize: 13, color: C.card, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  coverRef: { fontSize: 8, color: "#8FA89A", letterSpacing: 1 },
});

/* ── Helpers ───────────────────────────────────────────────────────── */

function fmtAnswer(qid: string, raw: unknown): string {
  const q = QUESTIONS.find((x) => x.id === qid);
  if (!q) return String(raw ?? "");
  if (raw == null || raw === "") return "— Non renseigné —";

  if (q.subfields && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return q.subfields
      .map((sf) => {
        const v = obj[sf.id];
        if (v == null || v === "") return null;
        if (sf.id === "province") {
          const lab = PROVINCES.find((p) => p.value === v)?.label;
          return `${sf.label} : ${lab || v}`;
        }
        if (sf.options) {
          const lab = sf.options.find((o) => o.value === v)?.label;
          return `${sf.label} : ${lab || v}`;
        }
        return `${sf.label} : ${v}`;
      })
      .filter(Boolean)
      .join("  ·  ");
  }

  if (Array.isArray(raw)) {
    if (q.options) {
      return raw.map((v) => q.options!.find((o) => o.value === v)?.label || String(v)).join(", ");
    }
    return raw.join(", ");
  }

  // Gère "other:…"
  if (typeof raw === "string" && raw.startsWith("other:")) {
    const txt = raw.replace(/^other:/, "").trim();
    return txt ? `Autre — ${txt}` : "Autre";
  }

  if (q.options) {
    const lab = q.options.find((o) => o.value === raw)?.label;
    if (lab) return lab;
  }
  if (q.type === "scale10") return `${raw} / 10`;
  return String(raw);
}

const SEV_LABEL: Record<RiskSeverity, string> = {
  critique: "Critique",
  eleve:    "Élevé",
  modere:   "Modéré",
  faible:   "Faible",
};

const VERDICT_COPY: Record<Recommendation["riskScore"]["verdict"], { label: string; text: string }> = {
  sain: {
    label: "Profil sain",
    text: "Aucune exposition disciplinaire significative n'a été détectée. Le potentiel est surtout du côté de l'efficacité.",
  },
  a_surveiller: {
    label: "À surveiller",
    text: "Quelques signaux faibles à corriger avant qu'ils ne deviennent des problèmes. Rien d'urgent, mais à traiter.",
  },
  a_corriger: {
    label: "À corriger",
    text: "Plusieurs points de friction sérieux. Une remise en ordre en 30 jours limite fortement votre exposition.",
  },
  a_securiser: {
    label: "À sécuriser rapidement",
    text: "Des risques critiques sont présents. Une mise en conformité prioritaire est requise pour limiter l'exposition disciplinaire.",
  },
};

/* ── Composants internes ───────────────────────────────────────────── */

function RiskCard({ r }: { r: RiskItem }) {
  const color = C.risk[r.severity];
  const bg = C.riskBg[r.severity];
  return (
    <View style={s.riskCard} wrap={false}>
      <View style={s.riskHead}>
        <Text style={[s.riskBadge, { backgroundColor: bg, color }]}>{SEV_LABEL[r.severity]}</Text>
        <Text style={s.riskCat}>{r.category}</Text>
      </View>
      <Text style={s.riskTitle}>{r.title}</Text>
      <Text style={s.riskRef}>Référence : {r.reference}</Text>

      <Text style={s.riskLabel}>Ce que vos réponses montrent</Text>
      <Text style={s.riskBody}>{r.finding}</Text>

      <Text style={s.riskLabel}>Impact</Text>
      <Text style={s.riskBody}>{r.impact}</Text>

      <Text style={s.riskLabel}>Ce que SAFE corrige</Text>
      <Text style={s.riskBody}>{r.action}</Text>
    </View>
  );
}

function PlanCard({ plan, fmtMoney }: { plan: SitePlan; fmtMoney: (n: number) => string }) {
  const recommended = plan.recommended === true;
  if (recommended) {
    return (
      <View style={s.planCardDark}>
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 7, color: C.greenLt, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "Helvetica-Bold" }}>
            Recommandé pour vous
          </Text>
        </View>
        <Text style={s.planNameDark}>{plan.name}</Text>
        <Text style={s.planPriceDark}>{plan.monthly == null ? plan.priceLabel : fmtMoney(plan.monthly)}</Text>
        <Text style={s.planSufDark}>{plan.monthly == null ? "tarification personnalisée" : `/ mois · ${plan.seats}`}</Text>
        <Text style={s.planTaglineDark}>{plan.tagline}</Text>
        {plan.features.map((f, i) => (
          <View key={i} style={s.planFeat}>
            <Text style={s.planFeatDotDark}>✓</Text>
            <Text style={s.planFeatTextDark}>{f}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={s.planCard}>
      <Text style={s.planName}>{plan.name}</Text>
      <Text style={s.planPrice}>{plan.monthly == null ? plan.priceLabel : fmtMoney(plan.monthly)}</Text>
      <Text style={s.planSuf}>{plan.monthly == null ? "tarification personnalisée" : `/ mois · ${plan.seats}`}</Text>
      <Text style={s.planTagline}>{plan.tagline}</Text>
      {plan.features.map((f, i) => (
        <View key={i} style={s.planFeat}>
          <Text style={s.planFeatDot}>✓</Text>
          <Text style={s.planFeatText}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Composant principal ───────────────────────────────────────────── */

interface Props {
  answers: Record<string, unknown>;
  recommendation: Recommendation;
  submissionId: string;
  createdAt: Date;
}

export function AuditReportDocument({ answers, recommendation, submissionId, createdAt }: Props) {
  const { marketQuote, safeOffer, roi, narrative, risks, riskScore, plans } = recommendation;

  const prospect = (answers.identite as { nom_complet?: string; titre?: string }) || {};
  const nomClient = prospect.nom_complet || "—";
  const titre = prospect.titre || "";
  const raison = String(answers.raison_sociale || "—");
  const localisation = (answers.localisation as { ville?: string; province?: string }) || {};
  const ville = localisation.ville || "";
  const provinceLabel = PROVINCES.find((p) => p.value === localisation.province)?.label || "";

  const dateStr = createdAt.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  const visibleQs = visibleQuestions(answers);
  const fmtMoney = (n: number) => `${n.toLocaleString("fr-CA")} $`;

  const verdict = VERDICT_COPY[riskScore.verdict];

  const PageHeader = (
    <View style={s.header} fixed>
      <Text style={s.brand}>SAFE</Text>
      <Text style={s.confidential}>Confidentiel · {dateStr}</Text>
    </View>
  );
  const PageFooter = (
    <View style={s.footer} fixed>
      <Text>SAFE — Rapport d'audit pour {raison}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );

  const TOC = [
    { num: "01", title: "Synthèse",                  sub: "Votre diagnostic en un coup d'œil, score de risque global et opportunités chiffrées.", page: "P. 03" },
    { num: "02", title: "Vos réponses",              sub: "Intégralité des informations transmises pendant l'audit, par section.",                 page: "P. 04" },
    { num: "03", title: "Analyse des risques",       sub: "Points d'exposition identifiés, référencés aux règles du Barreau et de la LSO.",        page: "P. 06" },
    { num: "04", title: "Devis marché comparable",   sub: "Ce que coûterait une stack équivalente (Clio, QuickBooks, LawPay…) en 2025-2026.",     page: "P. 08" },
    { num: "05", title: "Nos 3 formules",            sub: "Solo, Cabinet et Cabinet+ — avec la formule recommandée pour votre profil.",            page: "P. 09" },
    { num: "06", title: "Prochaines étapes",         sub: "Comment on avance ensemble, échéances et mot du fondateur.",                            page: "P. 10" },
  ];

  return (
    <Document
      title={`Rapport d'audit SAFE — ${raison}`}
      author="SAFE Inc."
      subject="Audit gratuit de cabinet juridique"
      creator="SAFE"
      producer="SAFE"
    >
      {/* ───────── PAGE 1 · COUVERTURE ───────── */}
      <Page size="A4" style={s.pageCover}>
        <View>
          <Text style={s.coverEyebrow}>Rapport d'audit · Confidentiel</Text>
          <Text style={s.h1White}>
            Diagnostic de performance{"\n"}
            <Text style={[s.italic, { color: C.greenLt }]}>de votre cabinet.</Text>
          </Text>
          <Text style={s.coverSub}>
            Préparé à partir de vos réponses par Jérémie Tiahou, fondateur de SAFE.
            Ce rapport chiffre vos opportunités, évalue votre exposition aux règles du Barreau
            et propose une formule adaptée à votre profil.
          </Text>

          <View style={s.coverMeta}>
            <View>
              <Text style={s.coverMetaLabel}>Cabinet</Text>
              <Text style={s.coverMetaValue}>{raison}</Text>
            </View>
            <View>
              <Text style={s.coverMetaLabel}>Destinataire</Text>
              <Text style={s.coverMetaValue}>{nomClient}{titre ? `, ${titre}` : ""}</Text>
            </View>
            <View>
              <Text style={s.coverMetaLabel}>Localisation</Text>
              <Text style={s.coverMetaValue}>{ville}{provinceLabel ? `, ${provinceLabel}` : ""}</Text>
            </View>
            <View>
              <Text style={s.coverMetaLabel}>Date</Text>
              <Text style={s.coverMetaValue}>{dateStr}</Text>
            </View>
          </View>

          <View style={s.coverStripe}>
            <Text style={s.coverStripeLabel}>Verdict préliminaire · {verdict.label}</Text>
            <Text style={s.coverStripeTxt}>{verdict.text}</Text>
            <View style={{ flexDirection: "row", gap: 24, marginTop: 14 }}>
              <View>
                <Text style={s.coverMetaLabel}>Valeur récupérable / an</Text>
                <Text style={[s.coverMetaValue, { fontSize: 16, fontFamily: "Times-Roman" }]}>{fmtMoney(roi.annualValue)}</Text>
              </View>
              <View>
                <Text style={s.coverMetaLabel}>Heures libérées / sem.</Text>
                <Text style={[s.coverMetaValue, { fontSize: 16, fontFamily: "Times-Roman" }]}>{roi.hoursPerWeek} h</Text>
              </View>
              <View>
                <Text style={s.coverMetaLabel}>Économie vs marché</Text>
                <Text style={[s.coverMetaValue, { fontSize: 16, fontFamily: "Times-Roman" }]}>{safeOffer.savings.percent} %</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.coverFooter}>
          <Text style={s.coverBrand}>SAFE</Text>
          <Text style={s.coverRef}>RÉF · {submissionId}</Text>
        </View>
      </Page>

      {/* ───────── PAGE 2 · SOMMAIRE / STRUCTURE ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>— Structure du rapport</Text>
        <Text style={s.h1}>
          Ce que vous allez <Text style={[s.italic, { color: C.green }]}>lire</Text>.
        </Text>
        <Text style={[s.p, { marginTop: 14, maxWidth: 460 }]}>
          Le rapport est construit pour être lu en 10 minutes. Chaque section répond à une
          question concrète que vous vous posez sur votre cabinet.
        </Text>

        <View style={{ marginTop: 18 }}>
          {TOC.map((t) => (
            <View key={t.num} style={s.tocRow} wrap={false}>
              <Text style={s.tocNum}>{t.num}</Text>
              <View style={s.tocBody}>
                <Text style={s.tocTitle}>{t.title}</Text>
                <Text style={s.tocSub}>{t.sub}</Text>
              </View>
              <Text style={s.tocPage}>{t.page}</Text>
            </View>
          ))}
        </View>

        <View style={[s.greenCard, { marginTop: 18 }]}>
          <Text style={[s.h3, { marginTop: 0 }]}>Méthodologie</Text>
          <Text style={s.p}>
            Les opportunités sont chiffrées à partir de vos propres réponses (taux horaire, heures
            administratives, dossiers actifs). Les références réglementaires proviennent du
            Règlement sur la comptabilité et les normes d'exercice du Barreau du Québec (B-1, r.5),
            du Code de déontologie des avocats (B-1, r.3.1) et, pour l'Ontario, du By-Law 9 et des
            Rules of Professional Conduct de la Law Society of Ontario.
          </Text>
        </View>

        {PageFooter}
      </Page>

      {/* ───────── PAGE 3 · SYNTHÈSE ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 01 · Synthèse</Text>
        <Text style={s.h2}>Votre diagnostic en un coup d'œil</Text>

        <View style={s.scoreBox}>
          <View style={s.scoreNum}>
            <Text style={s.scoreNumVal}>{riskScore.total}</Text>
            <Text style={s.scoreNumSuf}>/ 100</Text>
          </View>
          <View style={s.scoreRight}>
            <Text style={s.scoreVerdict}>— {verdict.label}</Text>
            <Text style={s.scoreTxt}>{verdict.text}</Text>
            <View style={s.scoreLegend}>
              <View style={s.scoreLegendItem}>
                <View style={[s.scoreDot, { backgroundColor: C.risk.critique }]} />
                <Text style={s.scoreLegendLabel}>{riskScore.critique} critique{riskScore.critique > 1 ? "s" : ""}</Text>
              </View>
              <View style={s.scoreLegendItem}>
                <View style={[s.scoreDot, { backgroundColor: C.risk.eleve }]} />
                <Text style={s.scoreLegendLabel}>{riskScore.eleve} élevé{riskScore.eleve > 1 ? "s" : ""}</Text>
              </View>
              <View style={s.scoreLegendItem}>
                <View style={[s.scoreDot, { backgroundColor: C.risk.modere }]} />
                <Text style={s.scoreLegendLabel}>{riskScore.modere} modéré{riskScore.modere > 1 ? "s" : ""}</Text>
              </View>
              <View style={s.scoreLegendItem}>
                <View style={[s.scoreDot, { backgroundColor: C.risk.faible }]} />
                <Text style={s.scoreLegendLabel}>{riskScore.faible} faible{riskScore.faible > 1 ? "s" : ""}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.greenCard}>
          <Text style={[s.h3, { marginTop: 0 }]}>En un coup d'œil</Text>
          <Text style={s.p}>{narrative.executiveSummary}</Text>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Valeur récupérable</Text>
            <Text style={s.kpiValue}>{fmtMoney(roi.annualValue)}</Text>
            <Text style={s.kpiSuffix}>par année</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Heures libérées</Text>
            <Text style={s.kpiValue}>{roi.hoursPerWeek}</Text>
            <Text style={s.kpiSuffix}>par semaine</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Économie mensuelle</Text>
            <Text style={s.kpiValue}>{fmtMoney(safeOffer.savings.monthly)}</Text>
            <Text style={s.kpiSuffix}>vs outils du marché</Text>
          </View>
        </View>

        <Text style={s.h3}>Constats</Text>
        {narrative.diagnostic.map((d, i) => (
          <View key={i} style={s.bullet}>
            <Text style={s.bulletDot}>▸</Text>
            <Text style={s.bulletText}>{d}</Text>
          </View>
        ))}

        <Text style={s.h3}>Opportunités identifiées</Text>
        {narrative.opportunites.map((o, i) => (
          <View key={i} style={s.bullet}>
            <Text style={s.bulletDot}>▸</Text>
            <Text style={s.bulletText}>{o}</Text>
          </View>
        ))}

        {PageFooter}
      </Page>

      {/* ───────── PAGE 4+ · VOS RÉPONSES ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 02 · Vos réponses</Text>
        <Text style={s.h2}>Toutes les informations que vous nous avez transmises</Text>
        <Text style={s.p}>
          Cette section reprend l'intégralité de vos réponses, organisées par thème.
          Elle sert de référence partagée entre vous et l'équipe SAFE pour tout le suivi.
        </Text>

        {SECTIONS.map((sec) => {
          const qs = visibleQs.filter((q) => q.section === sec.id);
          if (qs.length === 0) return null;
          return (
            <View key={sec.id} style={{ marginTop: 18 }} wrap={false}>
              <Text style={s.h3}>{sec.number}. {sec.title}</Text>
              {qs.map((q) => (
                <View key={q.id} style={s.qaBlock} wrap={false}>
                  <Text style={s.qaNum}>{q.number}</Text>
                  <Text style={s.qaQ}>{q.label}</Text>
                  <Text style={s.qaA}>{fmtAnswer(q.id, answers[q.id])}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {PageFooter}
      </Page>

      {/* ───────── PAGE 6 · ANALYSE DES RISQUES ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 03 · Analyse des risques</Text>
        <Text style={s.h2}>Ce que disent les règles de votre Barreau</Text>
        <Text style={s.p}>
          Chaque point ci-dessous est déduit directement de vos réponses et rattaché à une
          disposition concrète du cadre professionnel applicable à votre province.
          Plus le niveau est élevé, plus le risque d'exposition disciplinaire ou de perte
          financière est important.
        </Text>

        {risks.map((r) => (
          <RiskCard key={r.id} r={r} />
        ))}

        <Text style={[s.small, { marginTop: 8, fontFamily: "Helvetica-Oblique" }]}>
          Les références aux règlements sont fournies à titre indicatif pour faciliter votre
          discussion avec votre syndic ou votre conseiller juridique. Ce rapport ne constitue
          pas un avis juridique.
        </Text>

        {PageFooter}
      </Page>

      {/* ───────── PAGE 8 · DEVIS MARCHÉ ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 04 · Valeur du marché</Text>
        <Text style={s.h2}>Ce que coûterait une stack comparable</Text>
        <Text style={s.p}>{marketQuote.note}</Text>

        <View style={[s.tableHead, { marginTop: 14 }]}>
          <Text style={[s.tableCellLabel, { color: C.green }]}>Composant</Text>
          <Text style={[s.tableCellDetail, { color: C.green }]}>Détail</Text>
          <Text style={[s.tableCellAmount, { color: C.green }]}>Mensuel</Text>
        </View>
        {marketQuote.lines.map((l, i) => (
          <View key={i} style={s.tableRow} wrap={false}>
            <Text style={s.tableCellLabel}>{l.label}</Text>
            <Text style={s.tableCellDetail}>{l.detail}</Text>
            <Text style={s.tableCellAmount}>{fmtMoney(l.monthly)}</Text>
          </View>
        ))}
        <View style={s.tableTotal}>
          <Text style={s.tableTotalLabel}>Total estimé marché</Text>
          <Text style={s.tableTotalDetail}>{fmtMoney(marketQuote.totalAnnual)} / an</Text>
          <Text style={s.tableTotalAmount}>{fmtMoney(marketQuote.totalMonthly)}</Text>
        </View>

        <View style={[s.greenCard, { marginTop: 14 }]}>
          <Text style={[s.h3, { marginTop: 0 }]}>Votre économie avec SAFE</Text>
          <View style={{ flexDirection: "row", gap: 24, marginTop: 4 }}>
            <View>
              <Text style={s.kpiLabel}>Par mois</Text>
              <Text style={[s.kpiValue, { color: C.green }]}>{fmtMoney(safeOffer.savings.monthly)}</Text>
            </View>
            <View>
              <Text style={s.kpiLabel}>Par année</Text>
              <Text style={[s.kpiValue, { color: C.green }]}>{fmtMoney(safeOffer.savings.annual)}</Text>
            </View>
            <View>
              <Text style={s.kpiLabel}>Soit</Text>
              <Text style={[s.kpiValue, { color: C.green }]}>{safeOffer.savings.percent} %</Text>
            </View>
          </View>
        </View>

        <Text style={[s.small, { marginTop: 12, fontFamily: "Helvetica-Oblique" }]}>
          Estimations basées sur les grilles publiques 2025-2026 (Clio Manage Pro, QuickBooks Online Plus,
          LawPay, Trustbooks). Montants en dollars canadiens, taxes non incluses, hors coûts internes de formation.
        </Text>

        {PageFooter}
      </Page>

      {/* ───────── PAGE 9 · LES 3 FORMULES ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 05 · Nos 3 formules</Text>
        <Text style={s.h2}>
          Moins cher qu'une heure <Text style={[s.italic, { color: C.green }]}>de votre temps.</Text>
        </Text>
        <Text style={s.p}>
          Pas de frais cachés. Pas d'engagement. Satisfait ou remboursé 30 jours.
          La formule encadrée est celle que nous recommandons pour votre profil.
        </Text>

        <View style={[s.planRow, { marginTop: 14 }]}>
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} fmtMoney={fmtMoney} />
          ))}
        </View>

        <View style={s.darkCard}>
          <Text style={[s.confidential, { color: "#C8D4CB", marginBottom: 6 }]}>Pourquoi cette formule</Text>
          <Text style={[s.p, { color: "#E8E2D4", marginTop: 0, marginBottom: 0 }]}>
            D'après vos réponses (nombre d'utilisateurs, volume de dossiers, structure de l'équipe),
            la formule <Text style={{ fontFamily: "Helvetica-Bold", color: C.card }}>{plans.find((p) => p.recommended)?.name}</Text>{" "}
            est celle qui couvre votre périmètre réel sans vous faire payer pour des sièges inutilisés.
            Vous pouvez changer de formule à tout moment sans frais.
          </Text>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Mise en place</Text>
            <Text style={[s.kpiValue, { fontSize: 14 }]}>Offerte</Text>
            <Text style={s.kpiSuffix}>formation 1-on-1 incluse</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Garantie</Text>
            <Text style={[s.kpiValue, { fontSize: 14 }]}>30 jours</Text>
            <Text style={s.kpiSuffix}>satisfait ou remboursé</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Hébergement</Text>
            <Text style={[s.kpiValue, { fontSize: 14 }]}>Canada</Text>
            <Text style={s.kpiSuffix}>conforme PIPEDA / Loi 25</Text>
          </View>
        </View>

        {PageFooter}
      </Page>

      {/* ───────── PAGE 10 · PROCHAINES ÉTAPES ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 06 · Prochaines étapes</Text>
        <Text style={s.h2}>Comment on avance ensemble</Text>

        {narrative.prochainesEtapes.map((e, i) => (
          <View key={i} style={s.card} wrap={false}>
            <Text style={[s.kicker, { marginBottom: 4 }]}>Étape {String(i + 1).padStart(2, "0")}</Text>
            <Text style={[s.qaQ, { marginBottom: 0 }]}>{e}</Text>
          </View>
        ))}

        <View style={[s.darkCard, { marginTop: 14 }]}>
          <Text style={[s.confidential, { color: "#C8D4CB" }]}>Mot du fondateur</Text>
          <Text style={[s.p, { color: "#E8E2D4", marginTop: 8, marginBottom: 0 }]}>
            « J'ai construit SAFE après avoir tenu les livres de cabinets juridiques pendant des années.
            Chaque heure que vous passez à chercher une facture, concilier un fidéicommis ou relancer un
            client, c'est une heure qui n'est pas facturée. SAFE vous la rend. »
          </Text>
          <Text style={[s.p, { color: "#C8D4CB", marginTop: 10, marginBottom: 0, fontFamily: "Helvetica-Oblique" }]}>
            — Jérémie Tiahou, fondateur de SAFE
          </Text>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={s.kpiLabel}>Référence du rapport</Text>
          <Text style={{ fontFamily: "Courier", fontSize: 10, color: C.ink }}>{submissionId}</Text>
        </View>

        {PageFooter}
      </Page>
    </Document>
  );
}

/** Génère le buffer PDF du rapport (côté serveur) */
export async function renderAuditReportPdf(props: Props): Promise<Buffer> {
  const buf = await renderToBuffer(<AuditReportDocument {...props} />);
  return buf as Buffer;
}
