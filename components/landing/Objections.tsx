"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "./ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

type QA = { q: string; a: string };

const OBJECTIONS: QA[] = [
  {
    q: "Je n'ai pas le temps de changer de système.",
    a: "La migration est entièrement prise en charge. Vos données sont reprises, vos dossiers continuent, et vous n'avez rien à ressaisir.",
  },
  {
    q: "Mon Excel fonctionne très bien.",
    a: "Tout va bien jusqu'au jour où l'on vous demande huit critères de conformité en vingt-quatre heures. C'est précisément ce qu'Excel ne peut pas produire, et ce que SAFE prépare pour vous.",
  },
  {
    q: "Je suis trop petit pour ça.",
    a: "Ce sont justement les cabinets solos qui sont les plus exposés. Un sur trois ne serait pas en mesure de fournir ses registres à temps.",
  },
  {
    q: "Et mon adjointe, dans tout ça ?",
    a: "SAFE ne remplace pas votre adjointe. Il lui retire le travail ingrat et lui donne une base solide, pour qu'elle devienne une coéquipière encore plus fiable.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Vos données sont hébergées au Canada, chiffrées et sauvegardées. Vos dossiers ne quittent jamais le pays.",
  },
  {
    q: "Et le prix ?",
    a: "Le tarif n'est présenté qu'après l'audit gratuit, une fois la valeur chiffrée pour votre cabinet. Toujours sans engagement.",
  },
];

export function Objections() {
  return (
    <section className="py-[100px] px-6 max-w-5xl mx-auto" id="objections">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-14 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Vos objections
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary max-w-2xl">
          Vos hésitations sont légitimes.{" "}
          <span className="italic text-forest-600">Reprenons-les une à une.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OBJECTIONS.map((item, i) => (
          <motion.div
            key={item.q}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.05 + (i % 2) * 0.08, ease }}
            className="group relative bg-surface border border-[0.5px] border-border rounded-[10px] p-7 transition-[border-color,box-shadow] duration-500 hover:border-forest-600/40 hover:shadow-[0_24px_60px_-40px_rgba(31,58,46,0.3)]"
          >
            <p className="font-serif italic text-[17px] leading-[1.35] text-text-primary mb-3.5">
              «&nbsp;{item.q}&nbsp;»
            </p>
            <div className="flex gap-2.5">
              <span className="mt-[3px] shrink-0 w-5 h-5 rounded-full bg-forest-600/10 border border-[0.5px] border-forest-600/25 flex items-center justify-center">
                <Check className="w-3 h-3 text-forest-600" strokeWidth={2.5} />
              </span>
              <p className="text-[13.5px] text-text-body font-sans leading-[1.6]">
                {item.a}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: 0.2, ease }}
        className="mt-12 flex flex-col items-center gap-5 text-center"
      >
        <p className="font-serif text-[21px] leading-[1.35] tracking-[-0.01em] text-text-primary max-w-xl">
          Il ne vous reste plus vraiment de raison d&apos;attendre la prochaine inspection pour savoir où vous en êtes.
        </p>
        <Link href="/audit-gratuit">
          <Button variant="primary" size="lg">Faire mon audit gratuit &rarr;</Button>
        </Link>
      </motion.div>
    </section>
  );
}
