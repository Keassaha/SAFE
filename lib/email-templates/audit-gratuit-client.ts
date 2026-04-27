/**
 * SAFE — Email de livraison du rapport d'audit gratuit (v2)
 */

interface TemplateVars {
  prospectName: string;
  annualValue: number;          // valeur récupérable / an
  savingsPercent: number;       // économie % vs marché
  offerName: string;            // "SAFE Solo" | "SAFE Duo" | "SAFE Équipe"
  monthlyPrice: number;
  reportId: string;
  reportUrl: string;            // URL PDF publique
}

const fmt = (n: number) => `${n.toLocaleString("fr-CA")} $`;

export function auditGratuitClientEmail({
  prospectName,
  annualValue,
  savingsPercent,
  offerName,
  monthlyPrice,
  reportId,
  reportUrl,
}: TemplateVars): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre rapport d'audit SAFE</title>
</head>
<body style="margin:0;padding:0;background:#F8F5EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:10px;font-weight:700;letter-spacing:2px;font-size:13px;">SAFE</div>
    </div>

    <!-- Card -->
    <div style="background:#FFFFFF;border:1px solid #E5E0D5;border-radius:18px;padding:36px 32px;box-shadow:0 12px 40px -20px rgba(17,17,17,0.18);">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#1F3A2E;font-weight:700;margin-bottom:10px;">
        Votre rapport personnalisé
      </div>
      <h1 style="font-family:'Times New Roman',Georgia,serif;font-weight:normal;font-size:30px;line-height:1.15;color:#111;margin:0 0 18px 0;">
        Bonjour ${escapeHtml(prospectName)},<br/>
        votre rapport est <em style="color:#1F3A2E;">prêt</em>.
      </h1>

      <p style="font-size:15px;color:#4A4A4A;line-height:1.6;margin:0 0 24px 0;">
        Merci d'avoir pris le temps de compléter l'audit SAFE. Vous trouverez ci-joint votre rapport complet
        en PDF, incluant la synthèse de vos réponses, le diagnostic, le devis comparatif et notre recommandation.
      </p>

      <!-- KPI row -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 28px 0;">
        <tr>
          <td style="padding:14px 10px;background:#EEF5F0;border-left:3px solid #1F3A2E;border-radius:6px;width:33%;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#7A7A7A;margin-bottom:4px;">Valeur / an</div>
            <div style="font-family:'Times New Roman',Georgia,serif;font-size:22px;color:#111;">${fmt(annualValue)}</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:14px 10px;background:#EEF5F0;border-left:3px solid #1F3A2E;border-radius:6px;width:33%;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#7A7A7A;margin-bottom:4px;">Économie vs marché</div>
            <div style="font-family:'Times New Roman',Georgia,serif;font-size:22px;color:#111;">${savingsPercent}%</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:14px 10px;background:#EEF5F0;border-left:3px solid #1F3A2E;border-radius:6px;width:33%;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#7A7A7A;margin-bottom:4px;">Offre</div>
            <div style="font-family:'Times New Roman',Georgia,serif;font-size:18px;color:#111;line-height:1.2;">${escapeHtml(offerName)}</div>
            <div style="font-size:11px;color:#4A4A4A;">${fmt(monthlyPrice)} / mois</div>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <div style="text-align:center;margin:22px 0 10px 0;">
        <a href="${reportUrl}" style="display:inline-block;background:#111;color:#fff;padding:14px 26px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:500;">
          Télécharger le rapport PDF
        </a>
      </div>

      <p style="font-size:13px;color:#7A7A7A;line-height:1.6;margin:24px 0 0 0;text-align:center;">
        Je vous contacte dans les 24 h pour convenir d'un appel de 30 minutes<br/>
        afin de revoir ce rapport avec vous en détail.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:22px;font-size:11px;color:#9A9388;line-height:1.6;">
      <div>— Jérémie Tiahou, fondateur de SAFE</div>
      <div style="margin-top:6px;">Référence : <span style="font-family:monospace;">${escapeHtml(reportId)}</span></div>
      <div style="margin-top:10px;">
        SAFE Inc. · Montréal, Québec · safecabinet.ca
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
