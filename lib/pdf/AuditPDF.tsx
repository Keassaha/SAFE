"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { OnboardingData, CalculationResult, Lang } from "@/lib/onboarding/types";

/* ── Styles ── */
const S = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#235347",
  },
  logo: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#235347",
  },
  logoSub: {
    fontSize: 9,
    color: "#6B7F78",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a2e2a",
  },
  headerDate: {
    fontSize: 9,
    color: "#6B7F78",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#235347",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#d0e8df",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowLabel: {
    fontSize: 9,
    color: "#4a5a56",
    flex: 1,
  },
  rowValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a2e2a",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    marginTop: 4,
    backgroundColor: "#f0f7f4",
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#235347",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#235347",
  },
  priceBox: {
    backgroundColor: "#235347",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 9,
    color: "#8EB69B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  priceMain: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  priceSub: {
    fontSize: 10,
    color: "#8EB69B",
    marginTop: 2,
  },
  planDesc: {
    fontSize: 9,
    color: "#8EB69B",
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },
  badge: {
    fontSize: 8,
    color: "#8EB69B",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  competitorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  competitorName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a2e2a",
    width: 110,
  },
  competitorPrice: {
    fontSize: 8,
    color: "#6B7F78",
    width: 120,
    textAlign: "center",
  },
  competitorNote: {
    fontSize: 8,
    color: "#c0392b",
    flex: 1,
    textAlign: "right",
  },
  safeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f7f4",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  safeLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#235347",
  },
  safeNote: {
    fontSize: 8,
    color: "#235347",
    flex: 1,
    textAlign: "center",
  },
  safePrice: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#235347",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e0ebe6",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#9aaba6",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  infoCell: {
    width: "50%",
    paddingVertical: 4,
    paddingRight: 12,
  },
  infoCellLabel: {
    fontSize: 8,
    color: "#6B7F78",
    marginBottom: 1,
  },
  infoCellValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a2e2a",
  },
  confidentialBadge: {
    fontSize: 8,
    color: "#8EB69B",
    backgroundColor: "#f0f7f4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d0e8df",
  },
});

interface Props {
  data: Partial<OnboardingData>;
  calc: CalculationResult;
  lang: Lang;
}

export function AuditPDF({ data, calc, lang }: Props) {
  const fr = lang === "fr";
  const date = new Date().toLocaleDateString(fr ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const competitors = fr
    ? [
        { name: "Clio", price: "~150 $ CAD/util./mois", note: "Signalé par des utilisateurs : support limité en français, pas adapté aux exigences spécifiques du Barreau du Québec" },
        { name: "PCLaw", price: "~50 à 100 $/util./mois", note: "Signalé par des utilisateurs : interface désuète, pas de version cloud, mises à jour rares, formation longue" },
        { name: "Cosmolex", price: "~120 $ CAD/util./mois", note: "Signalé par des utilisateurs : documentation et support principalement en anglais, moins adapté au marché québécois" },
        { name: "Juris Évolution", price: "Sur devis", note: "Signalé par des utilisateurs : coûts d'implantation élevés, délais de déploiement longs, peu agile" },
      ]
    : [
        { name: "Clio", price: "~$109 USD/user/month", note: "Reported by users: limited French support, not specifically tailored to provincial Bar requirements" },
        { name: "PCLaw", price: "~$50 to $100/user/month", note: "Reported by users: outdated interface, no cloud version, infrequent updates, steep learning curve" },
        { name: "Cosmolex", price: "~$89 USD/user/month", note: "Reported by users: mostly English documentation, limited adaptation for Quebec trust accounting" },
        { name: "Juris Évolution", price: "Quote-based", note: "Reported by users: high implementation costs, long deployment times, limited agility" },
      ];

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.logo}>Safe</Text>
            <Text style={S.logoSub}>
              {fr ? "Gestion de cabinet pour avocats canadiens" : "Practice management for Canadian lawyers"}
            </Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.headerTitle}>
              {fr ? "Résumé d'audit personnalisé" : "Personalized Audit Summary"}
            </Text>
            <Text style={S.headerDate}>{date}</Text>
            <Text style={[S.confidentialBadge, { marginTop: 4 }]}>
              {fr ? "Confidentiel" : "Confidential"}
            </Text>
          </View>
        </View>

        {/* Firm info */}
        <Text style={S.sectionTitle}>{fr ? "Informations du cabinet" : "Firm Information"}</Text>
        <View style={S.infoGrid}>
          {[
            { label: fr ? "Cabinet" : "Firm", value: data.firmName || "" },
            { label: fr ? "Avocat principal" : "Lead attorney", value: data.leadName || "" },
            { label: fr ? "Courriel" : "Email", value: data.email || "" },
            { label: fr ? "Province" : "Province", value: data.province || "" },
            { label: fr ? "Téléphone" : "Phone", value: data.phone || "" },
            { label: fr ? "Mode de facturation" : "Billing method", value: data.billingMethod || "" },
          ].map((item, i) => (
            <View key={i} style={S.infoCell}>
              <Text style={S.infoCellLabel}>{item.label}</Text>
              <Text style={S.infoCellValue}>{item.value || "—"}</Text>
            </View>
          ))}
        </View>

        {/* Value items */}
        <Text style={S.sectionTitle}>
          {fr ? "Configuration SAFE incluse" : "Included SAFE Configuration"}
        </Text>
        {calc.lineItems.map((item, i) => (
          <View key={i} style={S.row}>
            <Text style={S.rowLabel}>{item.label[lang]}</Text>
            <Text style={S.rowValue}>{item.amount.toLocaleString(fr ? "fr-CA" : "en-CA")} $</Text>
          </View>
        ))}
        <View style={S.totalRow}>
          <Text style={S.totalLabel}>{fr ? "Valeur totale de la configuration" : "Total configuration value"}</Text>
          <Text style={S.totalValue}>{calc.totalValue.toLocaleString(fr ? "fr-CA" : "en-CA")} $</Text>
        </View>

        {/* Price box */}
        <View style={S.priceBox}>
          <Text style={S.priceLabel}>{fr ? "Votre abonnement mensuel" : "Your monthly subscription"}</Text>
          <Text style={S.priceMain}>{calc.plan.price} $</Text>
          <Text style={S.priceSub}>{fr ? "/mois" : "/month"}</Text>
          <Text style={S.planDesc}>
            {fr ? `Plan ${calc.plan.name.fr}` : `${calc.plan.name.en} Plan`}
          </Text>
          <View style={S.badgeRow}>
            <Text style={S.badge}>{fr ? "0 $ config." : "$0 setup"}</Text>
            <Text style={S.badge}>{fr ? "Sans engagement" : "No commitment"}</Text>
            <Text style={S.badge}>{fr ? "Résiliable à tout moment" : "Cancel anytime"}</Text>
          </View>
        </View>

        {/* Competitor comparison */}
        <Text style={S.sectionTitle}>{fr ? "Comparaison du marché" : "Market Comparison"}</Text>
        <View style={[S.row, { borderBottomWidth: 0, paddingBottom: 4 }]}>
          <Text style={[S.rowLabel, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
            {fr ? "Logiciel" : "Software"}
          </Text>
          <Text style={[S.competitorPrice, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
            {fr ? "Prix indicatif" : "Indicative price"}
          </Text>
          <Text style={[S.competitorNote, { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#4a5a56" }]}>
            {fr ? "Retours utilisateurs" : "User feedback"}
          </Text>
        </View>
        {competitors.map((c, i) => (
          <View key={i} style={S.competitorRow}>
            <Text style={S.competitorName}>{c.name}</Text>
            <Text style={S.competitorPrice}>{c.price}</Text>
            <Text style={S.competitorNote}>{c.note}</Text>
          </View>
        ))}
        <View style={S.safeRow}>
          <Text style={S.safeLabel}>SAFE</Text>
          <Text style={S.safeNote}>
            {fr
              ? "Conçu pour le Barreau canadien. Fidéicommis, Loi 25, facturation conforme."
              : "Built for the Canadian Bar. Trust, Privacy Law, compliant billing."}
          </Text>
          <Text style={S.safePrice}>{calc.plan.price}$/mois</Text>
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>safecabinet.ca</Text>
          <Text style={S.footerText}>
            {fr ? "Document confidentiel réservé au cabinet" : "Confidential document for firm use only"}
          </Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
