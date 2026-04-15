/* ─────────────────────────────────────────────
   Email Admin — Nouveau onboarding SAFE
   Rapport complet : réponses + analyse + offre
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

  const planPrice = calc.plan.price === 0
    ? "Sur devis"
    : `${calc.plan.price}$/mois`;

  const roiSavings = calc.plan.price === 0
    ? "6 000 $+"
    : `${((calc.plan.price === 99 ? 2500 : calc.plan.price === 149 ? 4000 : 6000) - calc.plan.price).toLocaleString("fr-CA")} $`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
<div style="max-width:650px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:#235347;padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">Nouvel Audit Onboarding SAFE</h1>
    <p style="color:#8EB69B;margin:8px 0 0;font-size:14px">Langue du client : ${lang.toUpperCase()} — ${new Date().toLocaleDateString("fr-CA")}</p>
  </div>

  <!-- ════════════════════════════════════════════
       PARTIE 1 : RÉSUMÉ EXÉCUTIF
       ════════════════════════════════════════════ -->

  <div style="background:#F8FDF9;padding:20px 24px;border-bottom:2px solid #235347">
    <table style="width:100%;font-size:14px;color:#333">
      <tr>
        <td><strong>Cabinet :</strong> ${data.firmName}</td>
        <td style="text-align:right"><strong>Avocat :</strong> ${data.leadName}</td>
      </tr>
      <tr>
        <td><strong>Plan recommande :</strong> ${calc.plan.name.fr} — ${planPrice}</td>
        <td style="text-align:right"><strong>Valeur config :</strong> ${calc.totalValue}$</td>
      </tr>
      <tr>
        <td><strong>Courriel :</strong> ${data.email}</td>
        <td style="text-align:right"><strong>Tel :</strong> ${data.phone || "—"}</td>
      </tr>
    </table>
  </div>

  <div style="padding:24px">

  <!-- ════════════════════════════════════════════
       PARTIE 2 : RAPPORT — CE QUE LE PROSPECT A VU
       ════════════════════════════════════════════ -->

  <!-- Section Rapport 1 : Cout de l'inaction -->
  <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin-bottom:20px">
    <h2 style="font-size:15px;color:#DC2626;margin:0 0 12px">⚠️ Cout de l'inaction (affiche au prospect)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:6px 0;border-bottom:1px solid #FECACA;color:#555">Heures perdues en taches admin manuelles</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #FECACA;color:#DC2626;font-weight:600">1 200 $ — 2 500 $</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #FECACA;color:#555">Retards de facturation et paiements en souffrance</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #FECACA;color:#DC2626;font-weight:600">800 $ — 3 000 $</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #FECACA;color:#555">Risque de non-conformite (fideicommis, Loi 25, Barreau)</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #FECACA;color:#DC2626;font-weight:600">Amende jusqu'a 100 000 $/infraction</td></tr>
      <tr style="background:#FEE2E2"><td style="padding:8px 0;font-weight:700;color:#333">Cout estime de l'inaction</td><td style="text-align:right;padding:8px 0;font-weight:700;color:#DC2626">2 000 $ — 5 500 $/mois</td></tr>
    </table>
  </div>

  <!-- Section Rapport 2 : Configuration SAFE (line items) -->
  <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;margin-bottom:20px">
    <h2 style="font-size:15px;color:#235347;margin:0 0 12px">✅ Ce que SAFE configure pour ce cabinet</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${calc.lineItems.map((item) => `<tr><td style="padding:6px 0;border-bottom:1px solid #BBF7D0;color:#555">✓ ${item.label.fr}</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #BBF7D0;color:#333;font-weight:600">${item.amount.toLocaleString("fr-CA")} $</td></tr>`).join("")}
      <tr style="background:#DCFCE7"><td style="padding:8px 0;font-weight:700;color:#333">Valeur totale de la configuration</td><td style="text-align:right;padding:8px 0;font-weight:700;color:#DC2626;text-decoration:line-through">${calc.totalValue.toLocaleString("fr-CA")} $</td></tr>
    </table>
  </div>

  <!-- Section Rapport 3 : Bonus inclus -->
  <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:16px;margin-bottom:20px">
    <h2 style="font-size:15px;color:#9A3412;margin:0 0 12px">🎁 Bonus inclus — Offre Fondateur</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:6px 0;border-bottom:1px solid #FED7AA;color:#555">Migration complete des donnees existantes</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #FED7AA;color:#9A3412;text-decoration:line-through">500 $</td><td style="padding:6px 0 6px 8px;border-bottom:1px solid #FED7AA;color:#16A34A;font-weight:700;font-size:11px">GRATUIT</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #FED7AA;color:#555">Formation personnalisee pour toute l'equipe</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #FED7AA;color:#9A3412;text-decoration:line-through">300 $</td><td style="padding:6px 0 6px 8px;border-bottom:1px solid #FED7AA;color:#16A34A;font-weight:700;font-size:11px">GRATUIT</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #FED7AA;color:#555">Audit de conformite Barreau + Loi 25 inclus</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #FED7AA;color:#9A3412;text-decoration:line-through">400 $</td><td style="padding:6px 0 6px 8px;border-bottom:1px solid #FED7AA;color:#16A34A;font-weight:700;font-size:11px">GRATUIT</td></tr>
      <tr><td style="padding:6px 0;color:#555">Support prioritaire dedie pendant 60 jours</td><td style="text-align:right;padding:6px 0;color:#9A3412;text-decoration:line-through">600 $</td><td style="padding:6px 0 6px 8px;color:#16A34A;font-weight:700;font-size:11px">GRATUIT</td></tr>
    </table>
  </div>

  <!-- Section Rapport 4 : Comparaison concurrence -->
  <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:20px">
    <h2 style="font-size:15px;color:#334155;margin:0 0 12px">📊 SAFE vs la concurrence</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:600;color:#333">CLIO</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;color:#555;font-size:11px">Pas adapte au Barreau canadien</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #E2E8F0;color:#555">89 $ — 139 $/utilisateur</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:600;color:#333">Practice Panther</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;color:#555;font-size:11px">Aucune gestion fideicommis QC</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #E2E8F0;color:#555">59 $ — 99 $/utilisateur</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:600;color:#333">Juris Concept</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;color:#555;font-size:11px">Interface obsolete, pas de cloud</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #E2E8F0;color:#555">200 $ — 500 $/mois</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:600;color:#333">Comptable externe</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;color:#555;font-size:11px">Delais, pas temps reel</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #E2E8F0;color:#555">800 $ — 2 000 $/mois</td></tr>
      <tr style="background:#235347"><td style="padding:8px 0 8px 4px;font-weight:700;color:#fff">SAFE</td><td style="padding:8px 0;color:#8EB69B;font-size:11px">Tout inclus. Concu pour le Barreau canadien.</td><td style="text-align:right;padding:8px 4px 8px 0;font-weight:700;color:#8EB69B">${planPrice}</td></tr>
    </table>
  </div>

  <!-- Section Rapport 5 : Prix + Garantie -->
  <div style="background:#235347;border-radius:8px;padding:20px;margin-bottom:20px;text-align:center">
    <p style="color:#8EB69B;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Investissement du prospect</p>
    <p style="color:#fff;font-size:36px;font-weight:700;margin:0">${planPrice}</p>
    <p style="color:#fff;font-size:14px;margin:4px 0 0">Plan ${calc.plan.name.fr}</p>
    <p style="color:#8EB69B;font-size:12px;margin:4px 0 16px">
      ${calc.plan.price === 99
        ? "Pour avocat solo — 1 utilisateur"
        : calc.plan.price === 149
        ? "Pour cabinet — 2 a 5 utilisateurs"
        : "Pour cabinet etabli — 6 utilisateurs et plus"}
    </p>
    <div style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:10px 16px">
      <p style="color:#4ADE80;font-size:13px;font-weight:600;margin:0">
        ${calc.plan.price === 0
          ? "🛡️ Garantie Conformite — 90 jours"
          : "🛡️ Garantie Satisfait ou Rembourse — 30 jours"}
      </p>
      <p style="color:#8EB69B;font-size:11px;margin:4px 0 0">
        ${calc.plan.price === 0
          ? "Si pas pret pour l'inspection en 90 jours, remboursement integral."
          : "Si SAFE ne transforme pas la gestion en 30 jours, remboursement integral."}
      </p>
    </div>
  </div>

  <!-- Section Rapport 6 : Economie mensuelle -->
  <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center">
    <h2 style="font-size:15px;color:#16A34A;margin:0 0 12px">📈 Economie nette estimee</h2>
    <table style="width:100%;font-size:14px">
      <tr>
        <td style="text-align:center;padding:8px">
          <p style="font-size:24px;font-weight:700;color:#16A34A;margin:0">10-15h</p>
          <p style="font-size:11px;color:#555;margin:4px 0 0">recuperees / mois</p>
        </td>
        <td style="text-align:center;padding:8px">
          <p style="font-size:24px;font-weight:700;color:#16A34A;margin:0">+${roiSavings}</p>
          <p style="font-size:11px;color:#555;margin:4px 0 0">economises / mois</p>
        </td>
      </tr>
    </table>
    <p style="font-size:12px;color:#16A34A;font-weight:600;margin:8px 0 0">
      ${calc.plan.price === 0
        ? "Un conseiller contactera le prospect pour un devis adapte."
        : `L'abonnement de ${calc.plan.price}$/mois se rentabilise des la premiere semaine.`}
    </p>
  </div>

  <!-- ════════════════════════════════════════════
       PARTIE 3 : TOUTES LES RÉPONSES DU PROSPECT
       ════════════════════════════════════════════ -->

  <div style="background:#F1F5F9;border-radius:8px;padding:4px;margin-bottom:8px">
    <h2 style="font-size:16px;color:#235347;margin:12px 12px 8px;text-align:center">Reponses completes du prospect</h2>
  </div>

  <!-- Etape 1 -->
  <h2 style="font-size:15px;color:#235347;margin:16px 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">1. Informations du cabinet</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Cabinet", data.firmName)}
    ${row("Avocat principal", data.leadName)}
    ${row("Courriel", data.email)}
    ${row("Barreau #", data.barNumber)}
    ${row("Province", data.province)}
    ${row("Adresse", data.address)}
    ${row("Telephone", data.phone)}
    ${row("Site web", data.website)}
    ${row("Couleurs", data.firmColors)}
  </table>

  <!-- Etape 2 -->
  <h2 style="font-size:15px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">2. Pratique</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Domaines", (data.practiceAreas ?? []).join(", ") + (data.practiceAreasOther ? ` (${data.practiceAreasOther})` : ""))}
    ${row("Volume mensuel", data.monthlyNewFiles)}
    ${row("Clientele", data.clientType + (data.clientTypeOther ? ` (${data.clientTypeOther})` : ""))}
  </table>

  <!-- Etape 3 -->
  <h2 style="font-size:15px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">3. Facturation</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Mode", data.billingMethod + (data.billingMethodOther ? ` (${data.billingMethodOther})` : ""))}
    ${row("Taux horaire", data.hourlyRate ? `${data.hourlyRate}$/h` : "N/A")}
    ${row("Frequence", data.billingFrequency + (data.billingFrequencyOther ? ` (${data.billingFrequencyOther})` : ""))}
    ${row("Delai paiement", data.paymentTerms + (data.paymentTermsOther ? ` (${data.paymentTermsOther})` : ""))}
    ${row("Methodes", (data.paymentMethods ?? []).join(", ") + (data.paymentMethodsOther ? ` (${data.paymentMethodsOther})` : ""))}
  </table>

  <!-- Etape 4 -->
  <h2 style="font-size:15px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">4. Fideicommis</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Compte fideicommis", data.hasTrustAccount)}
    ${row("Nb comptes", data.trustAccountCount || "N/A")}
    ${row("Reconciliation", data.reconciliationFrequency + (data.reconciliationFrequencyOther ? ` (${data.reconciliationFrequencyOther})` : ""))}
    ${row("Problemes inspection", data.auditIssues)}
  </table>

  <!-- Etape 5 -->
  <h2 style="font-size:15px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">5. Equipe</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Structure", data.teamStructure + (data.teamStructureOther ? ` (${data.teamStructureOther})` : ""))}
    ${row("Nb utilisateurs", data.totalUsers)}
    ${row("Prep factures", data.whoPreparesInvoices + (data.whoPreparesInvoicesOther ? ` (${data.whoPreparesInvoicesOther})` : ""))}
    ${row("Confort tech", data.techComfort)}
  </table>

  <!-- Etape 6 -->
  <h2 style="font-size:15px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">6. Outils & Migration</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Logiciel actuel", data.currentSoftware + (data.currentSoftwareOther ? ` (${data.currentSoftwareOther})` : ""))}
    ${row("Migration", data.hasDataToMigrate)}
    ${row("Format donnees", (data.dataFormat || "N/A") + (data.dataFormatOther ? ` (${data.dataFormatOther})` : ""))}
    ${row("Appareil", data.primaryDevice)}
  </table>

  <!-- Etape 7 -->
  <h2 style="font-size:15px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">7. Priorites</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Defis urgents", (data.urgentChallenges ?? []).join(", ") + (data.urgentChallengesOther ? ` (${data.urgentChallengesOther})` : ""))}
    ${row("Timeline", data.goLiveTimeline)}
  </table>

  <!-- RDV -->
  <h2 style="font-size:15px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">8. Rendez-vous souhaite</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${row("Date souhaitee", data.preferredDate)}
    ${row("Heure", timeLabels[data.preferredTime] || data.preferredTime)}
    ${row("Message", data.optionalMessage)}
  </table>

  <!-- ════════════════════════════════════════════
       PARTIE 4 : CALCUL DE VALEUR DÉTAILLÉ
       ════════════════════════════════════════════ -->

  <h2 style="font-size:15px;color:#235347;margin:0 0 12px;border-bottom:2px solid #8EB69B;padding-bottom:4px">Calcul de valeur (detail)</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
    ${calc.lineItems.map((item) => row(item.label.fr, `${item.amount}$`)).join("")}
    <tr style="background:#235347"><td style="padding:8px 12px;color:#fff;font-weight:700">TOTAL</td><td style="padding:8px 12px;color:#fff;font-weight:700">${calc.totalValue}$</td></tr>
  </table>

  </div>

  <!-- Footer -->
  <div style="background:#F1F5F9;padding:16px 24px;text-align:center;border-top:1px solid #E2E8F0">
    <p style="font-size:11px;color:#94A3B8;margin:0">SAFE — Rapport d'audit genere automatiquement le ${new Date().toLocaleDateString("fr-CA")} a ${new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</p>
  </div>

</div>
</body></html>`;
}
