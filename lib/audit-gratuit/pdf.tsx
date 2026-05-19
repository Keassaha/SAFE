/**
 * SAFE — Rapport d'audit PDF (génération serveur)
 * @react-pdf/renderer v4
 *
 * Structure : Couverture · 01 Synthèse · 02 Ce que vos réponses révèlent ·
 * 03 Conformité · 04 Valeur récupérable · 05 Comparatif et formule ·
 * 06 Prochaines étapes · Annexe Vos réponses.
 *
 * Règles de voix : titres en serif, corps en sans, connecteurs logiques,
 * aucun tiret cadratin en milieu de phrase.
 */

import { Document, Page, Text, View, StyleSheet, Svg, Path, renderToBuffer } from "@react-pdf/renderer";
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
  logoLight:"#F0F9F4",
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
    backgroundColor: C.bg, padding: 48, paddingBottom: 64, fontSize: 10.5, color: C.ink,
    fontFamily: "Helvetica", lineHeight: 1.55,
  },
  pageCover: {
    backgroundColor: C.ink, padding: 48, fontSize: 10.5, color: C.card,
    fontFamily: "Helvetica", lineHeight: 1.55,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 26, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
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
  h1White: { fontSize: 34, fontFamily: "Times-Roman", color: C.card, lineHeight: 1.12 },
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

  bullet: { flexDirection: "row", marginBottom: 8 },
  bulletDot: { width: 12, color: C.green, fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  bulletText: { flex: 1, fontSize: 10.5, color: C.muted, lineHeight: 1.6 },

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
  scorePanel: {
    width: 168, padding: 18, backgroundColor: C.ink, justifyContent: "center",
  },
  scorePanelLabel: { fontSize: 8, color: "#8FB49F", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  scoreVerdictBig: { fontSize: 22, fontFamily: "Times-Roman", color: C.card, lineHeight: 1.15 },
  scoreIndexLine: { fontSize: 8.5, color: "#C8D4CB", marginTop: 8, lineHeight: 1.5 },
  scoreRight: { flex: 1, padding: 16, backgroundColor: C.card },
  scoreTxt: { fontSize: 10.5, color: C.muted, lineHeight: 1.6 },
  scoreLegend: { flexDirection: "row", gap: 12, marginTop: 10, flexWrap: "wrap" },
  scoreLegendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  scoreLegendLabel: { fontSize: 8, color: C.soft, letterSpacing: 0.5 },

  // Calc strip (section 04)
  calcStrip: { flexDirection: "row", gap: 6, marginTop: 6, marginBottom: 12 },
  calcCell: {
    flex: 1, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border,
    borderRadius: 6, padding: 10,
  },
  calcCellAccent: {
    flex: 1, backgroundColor: C.greenBg, borderWidth: 0.5, borderColor: C.green,
    borderRadius: 6, padding: 10,
  },
  calcLabel: { fontSize: 7.5, color: C.soft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  calcValue: { fontSize: 15, fontFamily: "Times-Roman", color: C.ink },
  calcValueAccent: { fontSize: 15, fontFamily: "Times-Roman", color: C.green },
  calcOp: { alignSelf: "center", fontSize: 12, color: C.soft, fontFamily: "Helvetica-Bold" },

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
  planPriceTxt: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3, marginTop: 4 },
  planPriceTxtDark: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.card, marginBottom: 3, marginTop: 4 },
  planSuf: { fontSize: 9, color: C.soft, marginBottom: 8 },
  planSufDark: { fontSize: 9, color: "#A1A1A1", marginBottom: 8 },
  planTagline: { fontSize: 9, color: C.muted, marginBottom: 8, lineHeight: 1.45 },
  planTaglineDark: { fontSize: 9, color: "#D4D4D4", marginBottom: 8, lineHeight: 1.45 },
  planFeat: { flexDirection: "row", marginBottom: 3 },
  planFeatDot: { width: 9, fontSize: 9, color: C.green, fontFamily: "Helvetica-Bold" },
  planFeatDotDark: { width: 9, fontSize: 9, color: "#8FB49F", fontFamily: "Helvetica-Bold" },
  planFeatText: { flex: 1, fontSize: 9, color: C.muted, lineHeight: 1.4 },
  planFeatTextDark: { flex: 1, fontSize: 9, color: "#D4D4D4", lineHeight: 1.4 },

  // Steps
  stepCard: {
    flexDirection: "row", backgroundColor: C.card, padding: 14, borderRadius: 6,
    borderWidth: 0.5, borderColor: C.border, marginBottom: 10, alignItems: "center",
  },
  stepNum: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: C.greenBg,
    color: C.green, fontFamily: "Times-Roman", fontSize: 14,
    textAlign: "center", paddingTop: 6, marginRight: 12,
  },
  stepText: { flex: 1, fontSize: 10.5, color: C.muted, lineHeight: 1.55 },

  // Cover
  coverEyebrow: { fontSize: 9, color: "#C8D4CB", letterSpacing: 3, textTransform: "uppercase", marginBottom: 18 },
  coverSub: { fontSize: 12, color: "#D4E8D9", marginTop: 16, maxWidth: 430, lineHeight: 1.6 },
  coverMeta: { flexDirection: "row", gap: 26, marginTop: 24, flexWrap: "wrap" },
  coverMetaLabel: { fontSize: 8, color: "#8FA89A", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 },
  coverMetaValue: { fontSize: 11, color: C.card, fontFamily: "Helvetica-Bold" },
  coverStripe: {
    marginTop: 26, padding: 18, borderRadius: 6,
    backgroundColor: "#0E2419", borderLeftWidth: 3, borderLeftColor: C.greenLt,
  },
  coverStripeLabel: { fontSize: 8, color: "#8FB49F", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
  coverStripeTxt: { fontSize: 11, color: "#E8F0EA", lineHeight: 1.6 },
  coverIndex: { marginTop: 22, borderTopWidth: 0.5, borderTopColor: "#2B4A3C", paddingTop: 14 },
  coverIndexTitle: { fontSize: 8, color: "#8FA89A", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  coverIndexRow: { flexDirection: "row", marginBottom: 4 },
  coverIndexNum: { width: 22, fontSize: 9, color: "#8FB49F", fontFamily: "Helvetica-Bold" },
  coverIndexText: { fontSize: 9.5, color: "#D4E8D9" },
  coverFooter: {
    position: "absolute", bottom: 36, left: 48, right: 48,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  coverRef: { fontSize: 8, color: "#8FA89A", letterSpacing: 1 },
});

/* ── Logo vectoriel ────────────────────────────────────────────────── */

function BrandLogo({ light = false, size = 20 }: { light?: boolean; size?: number }) {
  const mark = light ? C.logoLight : C.green;
  const word = light ? C.card : C.ink;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z"
          fill={mark}
        />
        <Path
          d="M 19.5,18.5 Q 20.5,20.5 18.5,20 L 11.5,20 Q 9.5,20.5 10.5,18.5 L 14,11.5 Q 15,9.5 16,11.5 Z"
          fill={mark}
          fillOpacity={0.55}
        />
      </Svg>
      <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", letterSpacing: 1.6, color: word, marginLeft: 7 }}>
        SAFE
      </Text>
    </View>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function fmtAnswer(qid: string, raw: unknown): string {
  const q = QUESTIONS.find((x) => x.id === qid);
  if (!q) return String(raw ?? "");
  if (raw == null || raw === "") return "Non renseigné";

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

  if (typeof raw === "string" && raw.startsWith("other:")) {
    const txt = raw.replace(/^other:/, "").trim();
    return txt ? `Autre : ${txt}` : "Autre";
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
    text: "Vos réponses ne révèlent aucune exposition disciplinaire significative. Vous pouvez donc concentrer vos efforts sur l'efficacité plutôt que sur la mise en conformité.",
  },
  a_surveiller: {
    label: "À surveiller",
    text: "Quelques signaux faibles sont à corriger avant qu'ils ne deviennent des problèmes. Rien n'est urgent, mais ces points méritent d'être traités.",
  },
  a_corriger: {
    label: "À corriger",
    text: "Plusieurs points de friction sérieux sont présents. Une remise en ordre sur 30 jours limite donc fortement votre exposition.",
  },
  a_securiser: {
    label: "À sécuriser",
    text: "Des risques critiques sont présents. Une mise en conformité prioritaire est donc requise pour limiter votre exposition disciplinaire.",
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
        <Text style={{ fontSize: 7, color: C.greenLt, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
          Recommandé pour vous
        </Text>
        <Text style={s.planNameDark}>{plan.name}</Text>
        {plan.monthly == null ? (
          <Text style={s.planPriceTxtDark}>{plan.priceLabel}</Text>
        ) : (
          <Text style={s.planPriceDark}>{fmtMoney(plan.monthly)}</Text>
        )}
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
      {plan.monthly == null ? (
        <Text style={s.planPriceTxt}>{plan.priceLabel}</Text>
      ) : (
        <Text style={s.planPrice}>{fmtMoney(plan.monthly)}</Text>
      )}
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
  const raison = String(answers.raison_sociale || "Votre cabinet");
  const localisation = (answers.localisation as { ville?: string; province?: string }) || {};
  const ville = localisation.ville || "";
  const provinceLabel = PROVINCES.find((p) => p.value === localisation.province)?.label || "";

  const dateStr = createdAt.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  const visibleQs = visibleQuestions(answers);
  const fmtMoney = (n: number) => `${n.toLocaleString("fr-CA")} $`;

  const verdict = VERDICT_COPY[riskScore.verdict];
  const recommendedPlan = plans.find((p) => p.recommended);

  const PageHeader = (
    <View style={s.header} fixed>
      <BrandLogo />
      <Text style={s.confidential}>Confidentiel · {dateStr}</Text>
    </View>
  );
  const PageFooter = (
    <View style={s.footer} fixed>
      <Text>SAFE · Rapport d'audit pour {raison}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );

  const COVER_INDEX = [
    "Synthèse du diagnostic",
    "Ce que vos réponses révèlent",
    "Conformité Barreau et LSO",
    "Votre valeur récupérable",
    "Comparatif et formule recommandée",
    "Prochaines étapes",
    "Annexe : vos réponses complètes",
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
        <View style={{ marginBottom: 22 }}>
          <BrandLogo light size={26} />
        </View>

        <Text style={s.coverEyebrow}>Rapport d'audit confidentiel</Text>
        <Text style={s.h1White}>
          Diagnostic de performance{"\n"}
          <Text style={[s.italic, { color: C.greenLt }]}>de votre cabinet.</Text>
        </Text>
        <Text style={s.coverSub}>
          Ce rapport a été préparé par Jérémie Tiahou, fondateur de SAFE, à partir des réponses
          que vous avez transmises. Il chiffre vos opportunités, évalue votre exposition aux
          règles du Barreau et propose une formule adaptée à votre profil.
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

        <View style={s.coverIndex}>
          <Text style={s.coverIndexTitle}>Ce que contient ce rapport</Text>
          {COVER_INDEX.map((t, i) => (
            <View key={i} style={s.coverIndexRow}>
              <Text style={s.coverIndexNum}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={s.coverIndexText}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={s.coverFooter}>
          <BrandLogo light size={18} />
          <Text style={s.coverRef}>Réf · {submissionId}</Text>
        </View>
      </Page>

      {/* ───────── PAGE 2 · SYNTHÈSE ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 01 · Synthèse</Text>
        <Text style={s.h2}>Votre diagnostic en bref</Text>

        <View style={s.scoreBox}>
          <View style={s.scorePanel}>
            <Text style={s.scorePanelLabel}>Verdict</Text>
            <Text style={s.scoreVerdictBig}>{verdict.label}</Text>
            <Text style={s.scoreIndexLine}>
              Indice d'exposition : {riskScore.total} sur 100.{"\n"}
              Plus l'indice est bas, plus votre cabinet est protégé.
            </Text>
          </View>
          <View style={s.scoreRight}>
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
          <Text style={[s.h3, { marginTop: 0 }]}>En quelques mots</Text>
          <Text style={[s.p, { marginBottom: 0 }]}>{narrative.executiveSummary}</Text>
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

        <View style={[s.greenCard, { marginTop: 4 }]}>
          <Text style={[s.h3, { marginTop: 0 }]}>Comment lire ce rapport</Text>
          <Text style={[s.p, { marginBottom: 0 }]}>
            Les chiffres présentés ici proviennent uniquement de vos réponses, car aucun montant
            n'est inventé. Les références réglementaires renvoient au Règlement B-1, r.5 et au
            Code de déontologie des avocats pour le Québec, ainsi qu'au By-Law 9 de la Law Society
            of Ontario pour l'Ontario. Le détail du calcul de la valeur récupérable est présenté
            à la section 04.
          </Text>
        </View>

        {PageFooter}
      </Page>

      {/* ───────── PAGE 3 · CE QUE VOS RÉPONSES RÉVÈLENT ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 02 · Lecture de vos réponses</Text>
        <Text style={s.h2}>Ce que vos réponses révèlent</Text>
        <Text style={s.p}>
          Cette section traduit vos réponses en constats concrets. Chaque point ci-dessous découle
          directement de ce que vous avez indiqué, car l'objectif est de partir de votre réalité
          plutôt que de généralités.
        </Text>

        <Text style={s.h3}>Constats</Text>
        {narrative.diagnostic.map((d, i) => (
          <View key={i} style={s.bullet} wrap={false}>
            <Text style={s.bulletDot}>{String(i + 1)}.</Text>
            <Text style={s.bulletText}>{d}</Text>
          </View>
        ))}

        <Text style={s.h3}>Opportunités identifiées</Text>
        {narrative.opportunites.map((o, i) => (
          <View key={i} style={s.bullet} wrap={false}>
            <Text style={s.bulletDot}>▸</Text>
            <Text style={s.bulletText}>{o}</Text>
          </View>
        ))}

        {PageFooter}
      </Page>

      {/* ───────── PAGE 4 · CONFORMITÉ ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 03 · Conformité Barreau et LSO</Text>
        <Text style={s.h2}>Ce que disent les règles de votre Barreau</Text>
        <Text style={s.p}>
          {riskScore.verdict === "sain"
            ? "Vos réponses ne révèlent pas de manquement réglementaire évident. Le point ci-dessous confirme cette bonne position et indique comment SAFE vous aide à la préserver dans le temps."
            : "Chaque point ci-dessous est déduit directement de vos réponses, puis rattaché à une disposition concrète du cadre professionnel applicable à votre province. Plus le niveau est élevé, plus le risque d'exposition disciplinaire ou de perte financière est important."}
        </Text>

        {risks.map((r) => (
          <RiskCard key={r.id} r={r} />
        ))}

        <Text style={[s.small, { marginTop: 8, fontFamily: "Helvetica-Oblique" }]}>
          Les références aux règlements sont fournies à titre indicatif, afin de faciliter votre
          discussion avec votre syndic ou votre conseiller juridique. Ce rapport ne constitue pas
          un avis juridique.
        </Text>

        {PageFooter}
      </Page>

      {/* ───────── PAGE 5 · VALEUR RÉCUPÉRABLE ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 04 · Votre valeur récupérable</Text>
        <Text style={s.h2}>D'où vient le chiffre</Text>
        <Text style={s.p}>{narrative.roiExplanation}</Text>

        <Text style={s.h3}>Le calcul, étape par étape</Text>
        <View style={s.calcStrip}>
          <View style={s.calcCell}>
            <Text style={s.calcLabel}>Heures admin retenues</Text>
            <Text style={s.calcValue}>{roi.declaredHours} h</Text>
          </View>
          <Text style={s.calcOp}>×</Text>
          <View style={s.calcCell}>
            <Text style={s.calcLabel}>Part automatisée</Text>
            <Text style={s.calcValue}>{Math.round(roi.automationRate * 100)} %</Text>
          </View>
          <Text style={s.calcOp}>=</Text>
          <View style={s.calcCellAccent}>
            <Text style={s.calcLabel}>Heures rendues / sem.</Text>
            <Text style={s.calcValueAccent}>{roi.hoursPerWeek} h</Text>
          </View>
        </View>
        <View style={s.calcStrip}>
          <View style={s.calcCell}>
            <Text style={s.calcLabel}>Heures rendues / sem.</Text>
            <Text style={s.calcValue}>{roi.hoursPerWeek} h</Text>
          </View>
          <Text style={s.calcOp}>×</Text>
          <View style={s.calcCell}>
            <Text style={s.calcLabel}>Votre taux horaire</Text>
            <Text style={s.calcValue}>{fmtMoney(roi.hourlyValue)}</Text>
          </View>
          <Text style={s.calcOp}>×</Text>
          <View style={s.calcCell}>
            <Text style={s.calcLabel}>Semaines travaillées</Text>
            <Text style={s.calcValue}>{roi.weeks}</Text>
          </View>
        </View>

        <View style={s.greenCard}>
          <Text style={[s.h3, { marginTop: 0 }]}>Résultat</Text>
          <View style={{ flexDirection: "row", gap: 24, marginTop: 4 }}>
            <View>
              <Text style={s.kpiLabel}>Valeur récupérée par année</Text>
              <Text style={[s.kpiValue, { color: C.green, fontSize: 22 }]}>{fmtMoney(roi.annualValue)}</Text>
            </View>
            <View>
              <Text style={s.kpiLabel}>Soit par semaine</Text>
              <Text style={[s.kpiValue, { color: C.green, fontSize: 22 }]}>{fmtMoney(roi.weeklyValue)}</Text>
            </View>
          </View>
        </View>

        <Text style={[s.small, { marginTop: 8, fontFamily: "Helvetica-Oblique" }]}>
          Cette estimation est volontairement prudente, car elle ne tient compte que des heures
          administratives, sans inclure le temps facturable aujourd'hui oublié ni les créances
          actuellement non recouvrées.
        </Text>

        {PageFooter}
      </Page>

      {/* ───────── PAGE 6 · COMPARATIF ET FORMULE ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 05 · Comparatif et formule recommandée</Text>
        <Text style={s.h2}>Ce que coûterait une stack comparable</Text>
        <Text style={s.p}>{marketQuote.note}</Text>

        <View style={[s.tableHead, { marginTop: 10 }]}>
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
          <Text style={s.tableTotalLabel}>Total mensuel récurrent</Text>
          <Text style={s.tableTotalDetail}>{fmtMoney(marketQuote.totalAnnual)} / an</Text>
          <Text style={s.tableTotalAmount}>{fmtMoney(marketQuote.totalMonthly)}</Text>
        </View>
        <Text style={[s.small, { marginTop: 6 }]}>
          À ce total récurrent s'ajoutent, la première année seulement, environ {fmtMoney(marketQuote.setupOneTime)} de
          frais d'implantation et de formation. Comme ces frais ne se répètent pas, ils ne sont
          pas inclus dans la comparaison ci-dessus.
        </Text>

        <View style={[s.greenCard, { marginTop: 12 }]}>
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

        {PageFooter}
      </Page>

      {/* ───────── PAGE 7 · VOTRE FORMULE ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 05 · Votre formule</Text>
        <Text style={s.h2}>La formule qui correspond à votre profil</Text>
        <Text style={s.p}>
          SAFE propose trois formules, et vous pouvez passer de l'une à l'autre à tout moment,
          sans frais. La formule encadrée ci-dessous est celle qui couvre votre périmètre réel,
          car elle ne vous fait pas payer pour des sièges inutilisés.
        </Text>

        <View style={[s.planRow, { marginTop: 8 }]} wrap={false}>
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} fmtMoney={fmtMoney} />
          ))}
        </View>

        {recommendedPlan && (
          <View style={s.darkCard} wrap={false}>
            <Text style={[s.confidential, { color: "#C8D4CB", marginBottom: 6 }]}>Pourquoi cette formule</Text>
            <Text style={[s.p, { color: "#E8E2D4", marginTop: 0, marginBottom: 0 }]}>
              D'après vos réponses sur le nombre d'utilisateurs, le volume de dossiers et la
              structure de votre équipe, la formule{" "}
              <Text style={{ fontFamily: "Helvetica-Bold", color: C.card }}>{recommendedPlan.name}</Text>{" "}
              est celle qui correspond à votre situation. La mise en place est offerte, et la
              garantie « satisfait ou remboursé 30 jours » s'applique.
            </Text>
          </View>
        )}

        <View style={s.kpiRow}>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Mise en place</Text>
            <Text style={[s.kpiValue, { fontSize: 14 }]}>Offerte</Text>
            <Text style={s.kpiSuffix}>formation incluse</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Garantie</Text>
            <Text style={[s.kpiValue, { fontSize: 14 }]}>30 jours</Text>
            <Text style={s.kpiSuffix}>satisfait ou remboursé</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiLabel}>Hébergement</Text>
            <Text style={[s.kpiValue, { fontSize: 14 }]}>Canada</Text>
            <Text style={s.kpiSuffix}>conforme PIPEDA et Loi 25</Text>
          </View>
        </View>

        {PageFooter}
      </Page>

      {/* ───────── PAGE 8 · PROCHAINES ÉTAPES ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Section 06 · Prochaines étapes</Text>
        <Text style={s.h2}>Comment on avance ensemble</Text>
        <Text style={s.p}>
          Si ce rapport vous parle, voici les trois étapes concrètes pour démarrer. Aucune ne vous
          engage, car la première reste une simple conversation.
        </Text>

        {narrative.prochainesEtapes.map((e, i) => (
          <View key={i} style={s.stepCard} wrap={false}>
            <Text style={s.stepNum}>{i + 1}</Text>
            <Text style={s.stepText}>{e}</Text>
          </View>
        ))}

        <View style={[s.darkCard, { marginTop: 14 }]}>
          <Text style={[s.confidential, { color: "#C8D4CB" }]}>Mot du fondateur</Text>
          <Text style={[s.p, { color: "#E8E2D4", marginTop: 8, marginBottom: 0 }]}>
            « J'ai construit SAFE après avoir tenu les livres de cabinets d'avocats pendant des
            années. J'ai vu, mois après mois, où le temps et l'argent s'évaporaient. Chaque heure
            passée à chercher une facture, à concilier un fidéicommis ou à relancer un client est
            une heure qui n'est pas facturée. C'est précisément cette heure que SAFE vous rend. »
          </Text>
          <Text style={[s.p, { color: "#C8D4CB", marginTop: 10, marginBottom: 0, fontFamily: "Helvetica-Oblique" }]}>
            Jérémie Tiahou, fondateur de SAFE
          </Text>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={s.kpiLabel}>Référence du rapport</Text>
          <Text style={{ fontFamily: "Courier", fontSize: 10, color: C.ink }}>{submissionId}</Text>
        </View>

        {PageFooter}
      </Page>

      {/* ───────── ANNEXE · VOS RÉPONSES ───────── */}
      <Page size="A4" style={s.page}>
        {PageHeader}
        <Text style={s.kicker}>Annexe · Vos réponses</Text>
        <Text style={s.h2}>L'historique de votre audit</Text>
        <Text style={s.p}>
          Cette annexe reprend l'intégralité des questions posées et des réponses que vous avez
          fournies, organisées par thème. Elle sert de référence partagée entre vous et l'équipe
          SAFE pour assurer le suivi.
        </Text>

        {SECTIONS.map((sec) => {
          const qs = visibleQs.filter((q) => q.section === sec.id);
          if (qs.length === 0) return null;
          return (
            <View key={sec.id} style={{ marginTop: 16 }} wrap={false}>
              <Text style={s.h3}>{sec.number}. {sec.title}</Text>
              {qs.map((q, i) => (
                <View key={q.id} style={s.qaBlock} wrap={false}>
                  <Text style={s.qaNum}>{sec.number}.{i + 1}</Text>
                  <Text style={s.qaQ}>{q.label}</Text>
                  <Text style={s.qaA}>{fmtAnswer(q.id, answers[q.id])}</Text>
                </View>
              ))}
            </View>
          );
        })}

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
