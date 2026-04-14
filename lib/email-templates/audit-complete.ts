export function auditCompleteEmailHtml(
  prospectName: string,
  scoreGlobal: number,
  nbAnomalies: number
): string {
  const scoreColor = scoreGlobal >= 70 ? "#16A34A" : scoreGlobal >= 40 ? "#EA580C" : "#DC2626";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #F8FDF9;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #051F20, #235347); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://safecabinet.ca/images/safe-mark-s-green.png" alt="SAFE" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
        <h1 style="color: #DAF1DE; font-size: 24px; margin: 0 0 8px 0; font-weight: 700;">SAFE</h1>
        <p style="color: #8EB69B; font-size: 14px; margin: 0;">Votre audit de cabinet est termine</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px; background: #FFFFFF;">
        <p style="font-size: 16px; color: #1a2e28; margin: 0 0 16px 0;">
          Bonjour ${prospectName},
        </p>

        <p style="font-size: 15px; color: #4a6a5c; line-height: 1.6; margin: 0 0 24px 0;">
          Felicitations ! Vous avez complete votre audit gratuit de cabinet. Voici un apercu de vos resultats :
        </p>

        <!-- Score Card -->
        <div style="background: #F8FDF9; border: 1px solid #d0ddd6; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
          <p style="font-size: 13px; color: #6B8F7B; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Score de conformite</p>
          <p style="font-size: 48px; font-weight: 800; color: ${scoreColor}; margin: 0 0 8px 0;">${scoreGlobal}<span style="font-size: 24px; color: #6B8F7B;">/100</span></p>
          <p style="font-size: 14px; color: #4a6a5c; margin: 0;">
            ${nbAnomalies} anomalie${nbAnomalies > 1 ? "s" : ""} detectee${nbAnomalies > 1 ? "s" : ""} dans votre pratique
          </p>
        </div>

        <!-- Next Steps -->
        <h2 style="font-size: 18px; color: #1a2e28; margin: 0 0 16px 0; font-weight: 600;">
          Prochaines etapes
        </h2>

        <div style="margin: 0 0 24px 0;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
            <div style="min-width: 28px; height: 28px; border-radius: 50%; background: #235347; color: #DAF1DE; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">1</div>
            <div>
              <p style="font-size: 14px; color: #1a2e28; font-weight: 600; margin: 0 0 4px 0;">Consultez votre rapport complet</p>
              <p style="font-size: 13px; color: #6B8F7B; margin: 0;">Vous pouvez telecharger votre rapport PDF detaille directement depuis la page d'audit.</p>
            </div>
          </div>

          <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
            <div style="min-width: 28px; height: 28px; border-radius: 50%; background: #235347; color: #DAF1DE; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">2</div>
            <div>
              <p style="font-size: 14px; color: #1a2e28; font-weight: 600; margin: 0 0 4px 0;">Un membre de notre equipe vous contactera sous 24h</p>
              <p style="font-size: 13px; color: #6B8F7B; margin: 0;">Pour discuter de vos resultats et vous montrer comment SAFE peut corriger les anomalies detectees.</p>
            </div>
          </div>

          <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
            <div style="min-width: 28px; height: 28px; border-radius: 50%; background: #235347; color: #DAF1DE; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">3</div>
            <div>
              <p style="font-size: 14px; color: #1a2e28; font-weight: 600; margin: 0 0 4px 0;">Essayez SAFE gratuitement pendant 14 jours</p>
              <p style="font-size: 13px; color: #6B8F7B; margin: 0;">Aucune carte de credit requise. On configure votre cabinet sur mesure selon les resultats de votre audit.</p>
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://safecabinet.ca/demo" style="background: #235347; color: #DAF1DE; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            Demarrer mon essai gratuit
          </a>
        </div>

        <p style="font-size: 13px; color: #6B8F7B; line-height: 1.6; margin: 0;">
          Si vous avez des questions, n'hesitez pas a repondre directement a ce courriel.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 24px; text-align: center; border-top: 1px solid #d0ddd6;">
        <p style="font-size: 12px; color: #6B8F7B; margin: 0;">
          SAFE — Le logiciel de gestion pour avocats du Quebec
        </p>
        <p style="font-size: 11px; color: #8EB69B; margin: 4px 0 0 0;">
          safecabinet.ca | Donnees hebergees 100% au Canada
        </p>
      </div>
    </div>
  `;
}
