"use client";

/** Page publique FAQ, issue du copy révisé. */

import React from "react";
import { motion } from "framer-motion";
import { INK, MUTED, LINE, BG, fadeUp, PageShell, PageHeader } from "./shared";

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
      <PageHeader
        eyebrow="Questions fréquentes"
        titre="Vos questions, avant même de nous parler."
      />

      <section className="px-6 pb-24" style={{ background: BG }}>
        <div className="mx-auto max-w-2xl">
          {FAQ.map((item, i) => (
            <motion.div key={item.q} {...fadeUp(0.04)} className="py-8" style={{ borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
              <h2 className="font-sans text-[18px] font-semibold leading-[1.3]" style={{ color: INK }}>
                {item.q}
              </h2>
              <div className="mt-3 space-y-3 font-sans text-[15.5px] leading-[1.6]" style={{ color: MUTED }}>
                {item.r.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
