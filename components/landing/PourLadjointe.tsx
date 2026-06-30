"use client";

import React from "react";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const POINTS = [
  {
    title: "Vous gardez la main",
    body: "Rien ne part sans votre validation. SAFE prépare, vous décidez.",
  },
  {
    title: "Moins de tard le soir",
    body: "Les tâches répétitives se font en arrière-plan. Vos soirées vous reviennent.",
  },
  {
    title: "Vous brillez devant l'avocat",
    body: "Un cabinet en ordre, des chiffres clairs, des échéances tenues. C'est vous qui en récoltez le crédit.",
  },
];

/**
 * Section adressée directement à l'adjointe (positionnement « copilote du copilote »).
 * Règle de copy : la valoriser, jamais la menacer. Aucune promesse de « sans vous »
 * ni d'automatisation qui remplace son rôle.
 */
export function PourLadjointe() {
  return (
    <section className="py-[100px] px-6 max-w-5xl mx-auto" id="adjointe">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-14 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Pour l&apos;adjointe
        </span>
        <h2 className="font-serif text-[34px] leading-[1.12] tracking-[-0.02em] text-text-primary max-w-2xl mb-5">
          C&apos;est vous qui faites tenir le cabinet.{" "}
          <span className="italic text-forest-600">SAFE vous facilite la vie, pas votre poste.</span>
        </h2>
        <p className="text-[15px] text-text-body font-sans leading-[1.7] max-w-xl">
          SAFE ne vous remplace pas, et ce n&apos;est pas le but. Il vous enlève le travail ingrat, les relances, le classement, les conciliations à la main, pour que vous gardiez le contrôle sans le casse-tête. Vous restez la personne qui connaît les dossiers, qui voit les détails, qui tient les délais. SAFE vous donne juste une base solide sous les pieds.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[760px] mx-auto">
        {POINTS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease }}
            className="flex flex-col p-7 bg-surface border border-[0.5px] border-border rounded-[10px]"
          >
            <h3 className="font-serif text-[18px] leading-[1.3] tracking-[-0.01em] text-text-primary mb-3">
              {p.title}
            </h3>
            <p className="text-[13.5px] text-text-body font-sans leading-[1.6]">
              {p.body}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.2, ease }}
        className="mt-12 text-center text-[15px] text-text-body font-sans leading-[1.7] max-w-xl mx-auto"
      >
        Et si vous pensez que ça pourrait aider votre cabinet, montrez-le à votre avocat. C&apos;est souvent l&apos;adjointe qui voit SAFE en premier.
      </motion.p>
    </section>
  );
}
