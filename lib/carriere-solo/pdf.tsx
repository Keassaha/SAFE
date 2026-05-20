/**
 * SAFE — Carrière Solo
 * Génération PDF de la checklist personnalisée (serveur, @react-pdf/renderer v4).
 */

import { Document, Page, Text, View, StyleSheet, Svg, Path, renderToBuffer } from "@react-pdf/renderer";
import type { Answers, ChecklistItem, GeneratedChecklist } from "./types";
import { generateChecklist, isHighlightedForFear } from "./generator";

const C = {
  bg:      "#FAFAF8",
  card:    "#FFFFFF",
  ink:     "#2C2C2A",
  muted:   "#5F5E5A",
  soft:    "#888780",
  border:  "#E5E3DA",
  forest:  "#2D6B47",
  forest9: "#1A2E2A",
  forestBg:"#F0F9F4",
  forestL: "#DCEFE3",
  amber:   "#BA7517",
  amber7:  "#854F0B",
  amberBg: "#FEF6E7",
  logoLt:  "#F0F9F4",
};

const PRIORITY_LABEL: Record<ChecklistItem["priority"], string> = {
  critique: "Critique",
  important: "Important",
  recommande: "Recommandé",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg, padding: 44, paddingBottom: 60,
    fontSize: 10, color: C.ink, fontFamily: "Helvetica", lineHeight: 1.55,
  },
  pageCover: {
    backgroundColor: C.forest9, padding: 48,
    fontSize: 10, color: C.card, fontFamily: "Helvetica", lineHeight: 1.55,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 22, paddingBottom: 10,
  },
  confidential: { fontSize: 8, color: C.soft, textTransform: "uppercase", letterSpacing: 1 },
  footer: {
    position: "absolute", bottom: 22, left: 44, right: 44,
    flexDirection: "row", justifyContent: "space-between",
    fontSize: 8, color: C.soft, paddingTop: 8,
  },
  kicker: {
    fontSize: 9, color: C.forest, textTransform: "uppercase",
    letterSpacing: 2, marginBottom: 8, fontFamily: "Helvetica-Bold",
  },
  h1White: { fontSize: 32, fontFamily: "Times-Roman", color: C.card, lineHeight: 1.12 },
  italic: { fontFamily: "Times-Italic" },
  h2: { fontSize: 19, fontFamily: "Times-Roman", marginBottom: 4, color: C.ink },
  sectionSub: { fontSize: 9.5, color: C.soft, marginBottom: 10 },
  p: { fontSize: 10, color: C.muted, marginBottom: 8, lineHeight: 1.6 },

  coverSub: { fontSize: 12, color: "#D4E8D9", marginTop: 16, maxWidth: 420, lineHeight: 1.6 },
  coverMeta: { flexDirection: "row", gap: 26, marginTop: 26, flexWrap: "wrap" },
  coverMetaLabel: { fontSize: 8, color: "#8FA89A", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 },
  coverMetaValue: { fontSize: 11, color: C.card, fontFamily: "Helvetica-Bold" },
  coverStripe: {
    marginTop: 28, padding: 18, borderRadius: 6,
    backgroundColor: "#0E2419", borderLeftWidth: 3, borderLeftColor: C.forestL,
  },
  coverStripeTxt: { fontSize: 11, color: "#E8F0EA", lineHeight: 1.6 },
  coverFooter: {
    position: "absolute", bottom: 36, left: 48, right: 48,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  coverRef: { fontSize: 8, color: "#8FA89A", letterSpacing: 1 },

  item: {
    backgroundColor: C.card, padding: 13, marginBottom: 9,
  },
  badgeRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  badge: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.8,
    textTransform: "uppercase", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 3,
  },
  itemAction: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 4, lineHeight: 1.4 },
  metaLine: { fontSize: 9, color: C.muted, marginBottom: 2, lineHeight: 1.5 },
  metaStrong: { fontFamily: "Helvetica-Bold", color: C.soft },
  piege: { fontSize: 9, color: C.amber7, marginTop: 3, lineHeight: 1.5 },
  autorite: { fontSize: 8.5, color: C.forest, marginTop: 3 },

  sansAvec: {
    marginTop: 8, backgroundColor: C.forestBg, borderLeftWidth: 3, borderLeftColor: C.forest,
    padding: 10,
  },
  saRow: { flexDirection: "row", gap: 12 },
  saCol: { flex: 1 },
  saLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 },
  saText: { fontSize: 9, color: C.ink, lineHeight: 1.5 },
  saChiffre: { fontSize: 9, marginTop: 8, paddingTop: 7, borderTopWidth: 0.5, borderTopColor: C.forestL },

  cta: { backgroundColor: C.forest9, borderRadius: 8, padding: 22, marginTop: 6 },
  ctaKicker: { fontSize: 8, color: "#8FB49F", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  ctaTitle: { fontSize: 20, fontFamily: "Times-Roman", color: C.card, marginBottom: 8, lineHeight: 1.2 },
  ctaTxt: { fontSize: 10, color: "#D4E8D9", lineHeight: 1.6 },
});

function BrandLogo({ light = false, size = 20 }: { light?: boolean; size?: number }) {
  const mark = light ? C.logoLt : C.forest;
  const word = light ? C.card : C.ink;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z" fill={mark} />
        <Path d="M 19.5,18.5 Q 20.5,20.5 18.5,20 L 11.5,20 Q 9.5,20.5 10.5,18.5 L 14,11.5 Q 15,9.5 16,11.5 Z" fill={mark} fillOpacity={0.55} />
      </Svg>
      <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", letterSpacing: 1.6, color: word, marginLeft: 7 }}>
        SAFE
      </Text>
    </View>
  );
}

function coutLabel(item: ChecklistItem, j: "qc" | "on"): string | null {
  if (!item.cout) return null;
  if (item.cout.commun) return item.cout.commun;
  return j === "qc" ? item.cout.qc ?? null : item.cout.on ?? null;
}

const PRIORITY_COLOR: Record<ChecklistItem["priority"], { bg: string; fg: string }> = {
  critique:   { bg: C.amberBg, fg: C.amber7 },
  important:  { bg: C.forestBg, fg: C.forest },
  recommande: { bg: "#F1EFE8", fg: C.muted },
};

function ItemView({ item, generated }: { item: ChecklistItem; generated: GeneratedChecklist }) {
  const j = generated.answers.juridiction;
  const cout = coutLabel(item, j);
  const pc = PRIORITY_COLOR[item.priority];
  const highlighted = isHighlightedForFear(item, generated.answers);
  return (
    <View style={s.item}>
      <View style={s.badgeRow}>
        <Text style={[s.badge, { backgroundColor: pc.bg, color: pc.fg }]}>
          {PRIORITY_LABEL[item.priority]}
        </Text>
        {highlighted && (
          <Text style={[s.badge, { backgroundColor: C.amberBg, color: C.amber7 }]}>Ta priorité</Text>
        )}
      </View>
      <Text style={s.itemAction}>{item.action}</Text>
      <Text style={s.metaLine}>
        <Text style={s.metaStrong}>Quand : </Text>{item.delai}
      </Text>
      {cout && (
        <Text style={s.metaLine}>
          <Text style={s.metaStrong}>Coût : </Text>{cout}
        </Text>
      )}
      {item.piege && (
        <Text style={s.piege}>
          À éviter : {item.piege.texte}{item.piege.chiffre ? ` (${item.piege.chiffre})` : ""}
        </Text>
      )}
      {item.autorite && <Text style={s.autorite}>{item.autorite.label}</Text>}

      {item.sansAvec && (
        <View style={s.sansAvec}>
          <View style={s.saRow}>
            <View style={s.saCol}>
              <Text style={[s.saLabel, { color: C.soft }]}>Sans SAFE</Text>
              <Text style={s.saText}>{item.sansAvec.sansSafe}</Text>
            </View>
            <View style={s.saCol}>
              <Text style={[s.saLabel, { color: C.forest }]}>Avec SAFE</Text>
              <Text style={s.saText}>{item.sansAvec.avecSafe}</Text>
            </View>
          </View>
          {item.sansAvec.chiffre && (
            <Text style={s.saChiffre}>
              <Text style={{ fontFamily: "Helvetica-Bold", color: C.amber7 }}>
                {item.sansAvec.chiffre.valeur}
              </Text>
              <Text style={{ color: C.soft }}> · {item.sansAvec.chiffre.source}</Text>
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

interface Props {
  generated: GeneratedChecklist;
  createdAt: Date;
}

function ChecklistDocument({ generated, createdAt }: Props) {
  const j = generated.answers.juridiction;
  const juriLabel = j === "qc" ? "Québec" : "Ontario";
  const dateStr = createdAt.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });

  const Header = (
    <View style={s.header} fixed>
      <BrandLogo />
      <Text style={s.confidential}>Carrière Solo · {dateStr}</Text>
    </View>
  );
  const Footer = (
    <View style={s.footer} fixed>
      <Text>SAFE · Checklist Carrière Solo</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );

  return (
    <Document
      title="Checklist Carrière Solo — SAFE"
      author="SAFE Inc."
      subject="Checklist de lancement de cabinet d'avocat solo"
      creator="SAFE"
      producer="SAFE"
    >
      {/* Couverture */}
      <Page size="A4" style={s.pageCover}>
        <View style={{ marginBottom: 24 }}>
          <BrandLogo light size={26} />
        </View>
        <Text style={{ fontSize: 9, color: "#C8D4CB", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>
          Checklist Carrière Solo
        </Text>
        <Text style={s.h1White}>
          Ton plan pour ouvrir{"\n"}
          <Text style={[s.italic, { color: C.forestL }]}>ton cabinet.</Text>
        </Text>
        <Text style={s.coverSub}>
          Cette checklist a été générée à partir de tes réponses. Elle réunit les étapes concrètes
          pour lancer ton cabinet solo, de la conformité Barreau jusqu'à tes premiers clients.
        </Text>

        <View style={s.coverMeta}>
          <View>
            <Text style={s.coverMetaLabel}>Juridiction</Text>
            <Text style={s.coverMetaValue}>{juriLabel}</Text>
          </View>
          <View>
            <Text style={s.coverMetaLabel}>Étapes</Text>
            <Text style={s.coverMetaValue}>{generated.totalItems} au total</Text>
          </View>
          <View>
            <Text style={s.coverMetaLabel}>Étapes critiques</Text>
            <Text style={s.coverMetaValue}>{generated.criticalCount}</Text>
          </View>
          <View>
            <Text style={s.coverMetaLabel}>Date</Text>
            <Text style={s.coverMetaValue}>{dateStr}</Text>
          </View>
        </View>

        <View style={s.coverStripe}>
          <Text style={s.coverStripeTxt}>
            Garde ce document à portée pendant tout ton lancement. Chaque étape indique quoi faire,
            quand, à quel coût et auprès de quelle autorité. Les étapes marquées « Critique »
            doivent être traitées en priorité.
          </Text>
        </View>

        <View style={s.coverFooter}>
          <BrandLogo light size={18} />
          <Text style={s.coverRef}>safecabinet.ca</Text>
        </View>
      </Page>

      {/* Une page par section : limite la profondeur de pagination interne
          de react-pdf, qui produit autrement des coordonnées invalides
          sur les longues listes d'items densément stylés. */}
      {generated.sections.map((section, idx) => (
        <Page key={section.meta.id} size="A4" style={s.page}>
          {Header}
          <View wrap={false}>
            <Text style={s.kicker}>Section {String(idx + 1).padStart(2, "0")}</Text>
            <Text style={s.h2}>{section.meta.title}</Text>
            <Text style={s.sectionSub}>{section.meta.subtitle}</Text>
          </View>
          {section.items.map((item) => (
            <ItemView key={item.id} item={item} generated={generated} />
          ))}
          {Footer}
        </Page>
      ))}

      {/* CTA final isolé sur sa propre page. */}
      <Page size="A4" style={s.page}>
        {Header}
        <View style={s.cta}>
          <Text style={s.ctaKicker}>Programme Carrière Solo</Text>
          <Text style={s.ctaTitle}>Tu n'es pas obligé de faire ça seul.</Text>
          <Text style={s.ctaTxt}>
            Cette checklist te montre le chemin. SAFE peut le parcourir avec toi. Nous avons
            construit l'OS du cabinet d'avocat depuis la chaise du teneur de livres, justement pour
            que ton lancement ne ressemble pas à un parcours d'obstacles. Écris-nous à
            safecabinet.ca pour demander à intégrer le Programme Carrière Solo.
          </Text>
        </View>
        {Footer}
      </Page>
    </Document>
  );
}

/** Génère le buffer PDF de la checklist (côté serveur). */
export async function renderChecklistPdf(answers: Answers): Promise<Buffer> {
  const generated = generateChecklist(answers);
  const buf = await renderToBuffer(<ChecklistDocument generated={generated} createdAt={new Date()} />);
  return buf as Buffer;
}
