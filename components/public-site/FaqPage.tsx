"use client";

/**
 * La page des questions fréquentes.
 *
 * Elle posait ses questions dans une colonne de 672 px centrée, pendant que
 * son titre vivait dans une colonne de 768 px : deux arêtes gauches pour une
 * page de six questions. Elle passe au contrat de section du site : la
 * question à gauche, la réponse à droite, un filet entre deux, sur la seule
 * colonne du site.
 */

import React from "react";
import { PageShell, R } from "./shared";
import { Ouverture, Recit, Tete } from "./recit";

const FAQ = [
  {
    q: "Mes données sont-elles en sécurité ?",
    r: [
      "Votre cabinet demeure propriétaire de ses données. Les données de la plateforme sont hébergées au Canada, chiffrées en transit et au repos, avec des contrôles d’accès et un journal d’audit.",
      "Si vous quittez SAFE, vous pouvez récupérer vos données dans les formats d’export offerts.",
    ],
  },
  {
    q: "SAFE garantit-il ma conformité au Barreau ?",
    r: [
      "Non. La responsabilité professionnelle demeure celle de l’avocate ou de l’avocat.",
      "SAFE est conçu pour soutenir les exigences de tenue du fidéicommis au Québec et en Ontario. Il facilite notamment le rapprochement à trois voies, signale les écarts et aide à préparer les rapports disponibles dans le produit.",
    ],
  },
  {
    q: "Combien de temps faut-il pour commencer ?",
    r: [
      "Nous configurons SAFE avec les renseignements réels de votre cabinet et nous vous accompagnons pendant la prise en main. Le délai dépend du nombre de dossiers et de la qualité des données à reprendre. Après une courte rencontre, nous vous donnons une estimation adaptée à votre situation.",
    ],
  },
  {
    q: "Dois-je signer un contrat annuel ?",
    r: ["Non. Les forfaits réguliers sont mensuels."],
  },
  {
    q: "SAFE est une jeune entreprise. Pourquoi lui faire confiance ?",
    r: [
      "C’est une question légitime.",
      "SAFE a été construit à partir du travail réel d’un cabinet, puis vérifié avec ses utilisatrices et utilisateurs. Nous préférons vous montrer ce qui fonctionne aujourd’hui, ce qui est encore en développement et comment vos données sont protégées.",
      "Pendant la rencontre, vous pouvez voir le produit avec un cas concret et poser toutes vos questions avant de décider.",
    ],
  },
  {
    q: "Est-ce que SAFE remplace mon adjointe juridique ?",
    r: [
      "Non. Votre adjointe connaît vos dossiers, vos clients et votre façon de travailler. SAFE lui donne un cadre pour garder l’information reliée, repérer les écarts et réduire les vérifications répétitives.",
      "L’adjointe reste le copilote du cabinet. SAFE soutient son travail.",
    ],
  },
];

export default function FaqPage() {
  return (
    <PageShell>
      <Ouverture
        titre="Vos questions, avant même de nous parler"
        dire={[
          "Les six qu’on nous pose le plus.",
          "Les autres se répondent en rencontre, sur votre cas.",
        ]}
      />

      <Recit id="questions">
        <div className="liste-q">
          {FAQ.map((item) => (
            <div className="q" key={item.q}>
              <h3>{item.q}</h3>
              <div>
                {item.r.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Recit>

      <Recit>
        <Tete
          titre="Il en reste une ?"
          dire={["Posez-la pendant la rencontre.", "Vingt minutes, sur vos dossiers, sans engagement."]}
        />
        <div className="actions">
          <a className="btn" href={R.diagnostic}>
            Évaluer mon cabinet
          </a>
          <a className="btn ghost" href={R.demo}>
            Réserver une rencontre
          </a>
        </div>
        <p className="note">Gratuit, sans carte de crédit. Rapport sous 24 heures.</p>
      </Recit>
    </PageShell>
  );
}
