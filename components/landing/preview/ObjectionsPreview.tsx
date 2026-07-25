"use client";

import React from "react";
import { motion } from "framer-motion";
import { Section, NarrativeHeader, CheckDraw, EASE, LINE } from "./kit";

// 08 Objections et sécurité — répondre aux questions avant le contact. Alignées à gauche,
// en séquence, une question par ligne (§08).
const objections = [
  {
    q: "Je n'ai pas le temps de changer de système.",
    a: "La migration est entièrement prise en charge. Vos données sont reprises, vos dossiers continuent, et vous n'avez rien à ressaisir.",
  },
  {
    q: "Mon Excel fonctionne très bien.",
    a: "Jusqu'au jour où l'on vous demande huit critères de conformité en vingt-quatre heures. C'est ce qu'Excel ne produit pas, et ce que SAFE prépare pour vous.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Vos données sont hébergées au Canada, chiffrées et sauvegardées. Vos dossiers ne quittent jamais le pays.",
  },
  {
    q: "Et le fidéicommis ?",
    a: "Le fidéicommis se rapproche dans SAFE, mais l'argent ne transite jamais par un processeur de paiement. Le compte reste chez vous, à la banque.",
  },
  {
    q: "Et mon adjointe, dans tout ça ?",
    a: "SAFE ne la remplace pas. Il lui retire le travail ingrat et lui donne une base solide, pour qu'elle reste une coéquipière encore plus fiable.",
  },
];

export function ObjectionsPreview() {
  return (
    <Section id="objections" className="py-[120px]">
      <NarrativeHeader
        num="08"
        eyebrow="Objections et sécurité"
        title={
          <>
            Vos hésitations sont légitimes.{" "}
            <span className="italic text-forest-600">Reprenons-les une à une.</span>
          </>
        }
        description="Les questions qui reviennent avant une prise de contact, avec une réponse directe pour chacune."
      />

      <div className="mt-14">
        {objections.map((item, i) => (
          <motion.div
            key={item.q}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 2) * 0.06, ease: EASE }}
            className="grid gap-4 border-t border-[0.5px] border-border py-8 md:grid-cols-12 md:gap-10"
          >
            <h3 className="font-serif text-[19px] italic leading-[1.3] text-text-primary md:col-span-5">
              «&nbsp;{item.q}&nbsp;»
            </h3>
            <div className="flex gap-3 md:col-span-7">
              <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600/10">
                <CheckDraw size={11} color="#4F7A63" delay={0.15} />
              </span>
              <p className="max-w-[52ch] font-sans text-[14px] leading-[1.6] text-text-body">{item.a}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
