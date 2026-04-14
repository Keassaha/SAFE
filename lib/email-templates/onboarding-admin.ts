/* ─────────────────────────────────────────────
   Email Admin — Nouveau onboarding SAFE
   ───────────────────────────────────────────── */

import type { OnboardingData, CalculationResult } from "@/lib/onboarding/types";
import type { Lang } from "@/lib/onboarding/types";

export function onboardingAdminEmailHtml(
  data: OnboardingData,
  lang: Lang,
  calc: CalculationResult
): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;font-weight:600;color:#333;width:40%;vertical-align:top">${label}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;color:#555">${value || "—"}</td></tr>`;

  const timeLabels: Record<string, string> = {
    morning: "Matin", afternoon: "Apres-midi", evening: "Soir",
  };

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:#235347;padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">Nouvel Audit Onboarding SAFE</h1>
    <p style="color:#8EB69B;margin:8px 0 0;font-size:14px">Langue du client : ${lang.toUpperCase()}</p>
  </div>

  <!-- Plan & Valeur -->
  <div style="background:#F8FDF9;padding:16px 24px;border-bottom:2px solid #235347">
    <table style="width:100%">
      <tr>
        <td style="font-size:14px;color:#333"><strong>Plan :</strong> ${calc.plan.name.fr} — ${calc.plan.price}$/mois</td>
        <td style="text-align:right;font-size:14px;color:#333"><strong>Valeur totale :</strong> ${calc.totalValue}$</td>
      </tr>
    </table>
  </div>

  <div style="padding:24px">

  <!-- Etape 1 -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">1. Informations du cabinet</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Cabinet", data.firmName)}
    ${row("Avocat principal", data.leadName)}
    ${row("Courriel", data.email)}
    ${row("Province", data.province)}
    ${row("Adresse", data.address)}
    ${row("Telephone", data.phone)}
    ${row("Site web", data.website)}
    ${row("Couleurs", data.firmColors)}
  </table>

  <!-- Etape 2 -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">2. Pratique</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Domaines", (data.practiceAreas ?? []).join(", ") + (data.practiceAreasOther ? ` (${data.practiceAreasOther})` : ""))}
    ${row("Volume mensuel", data.monthlyNewFiles)}
    ${row("Clientele", data.clientType + (data.clientTypeOther ? ` (${data.clientTypeOther})` : ""))}
  </table>

  <!-- Etape 3 -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">3. Facturation</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Mode", data.billingMethod + (data.billingMethodOther ? ` (${data.billingMethodOther})` : ""))}
    ${row("Taux horaire", data.hourlyRate ? `${data.hourlyRate}$/h` : "N/A")}
    ${row("Frequence", data.billingFrequency)}
    ${row("Delai paiement", data.paymentTerms)}
    ${row("Methodes", (data.paymentMethods ?? []).join(", "))}
  </table>

  <!-- Etape 4 -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">4. Fideicommis</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Compte fideicommis", data.hasTrustAccount)}
    ${row("Nb comptes", data.trustAccountCount || "N/A")}
    ${row("Reconciliation", data.reconciliationFrequency || "N/A")}
    ${row("Problemes inspection", data.auditIssues)}
  </table>

  <!-- Etape 5 -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">5. Equipe</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Structure", data.teamStructure)}
    ${row("Nb utilisateurs", data.totalUsers)}
    ${row("Prep factures", data.whoPreparesInvoices)}
    ${row("Confort tech", data.techComfort)}
  </table>

  <!-- Etape 6 -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">6. Outils & Migration</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Logiciel actuel", data.currentSoftware)}
    ${row("Migration", data.hasDataToMigrate)}
    ${row("Format donnees", data.dataFormat || "N/A")}
    ${row("Appareil", data.primaryDevice)}
  </table>

  <!-- Etape 7 -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">7. Priorites</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Defis urgents", (data.urgentChallenges ?? []).join(", ") + (data.urgentChallengesOther ? ` (${data.urgentChallengesOther})` : ""))}
    ${row("Timeline", data.goLiveTimeline)}
  </table>

  <!-- RDV -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">Rendez-vous</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Date souhaitee", data.preferredDate)}
    ${row("Heure", timeLabels[data.preferredTime] || data.preferredTime)}
    ${row("Message", data.optionalMessage)}
  </table>

  <!-- Valeur calculee -->
  <h2 style="font-size:16px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">Calcul de valeur</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${calc.lineItems.map((item) => row(item.label.fr, `${item.amount}$`)).join("")}
    <tr style="background:#235347"><td style="padding:8px 12px;color:#fff;font-weight:700">TOTAL</td><td style="padding:8px 12px;color:#fff;font-weight:700">${calc.totalValue}$</td></tr>
  </table>

  </div>
</div>
</body></html>`;
}
