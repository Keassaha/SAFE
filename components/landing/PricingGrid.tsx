"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "./ui/Button";

const steps = [
  {
    num: "01",
    title: "Audit gratuit",
    text: "On commence par comprendre votre cabinet, vos outils actuels et les irritants qui ralentissent vos opérations.",
  },
  {
    num: "02",
    title: "Diagnostic clair",
    text: "Vous recevez les problèmes détectés, les gains possibles et les priorités à corriger selon votre réalité.",
  },
  {
    num: "03",
    title: "Proposition adaptée",
    text: "Le plan d'action et le tarif sont présentés seulement après l'analyse, selon le travail réellement nécessaire.",
  },
];

export function PricingGrid() {
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="py-[100px] px-6 max-w-6xl mx-auto" id="tarification">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-14 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Prix après audit
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary mb-4 max-w-2xl">
          D&apos;abord le diagnostic.{" "}
          <span className="italic text-forest-600">Ensuite seulement, le tarif.</span>
        </h2>
        <p className="text-[15px] text-text-body font-sans leading-[1.6] max-w-xl">
          SAFE ne vous affiche pas un forfait générique sans contexte. L&apos;audit gratuit clarifie votre situation, puis une proposition personnalisée est préparée si des optimisations sont réellement pertinentes.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: index * 0.1, ease }}
            className={`bg-surface border border-[0.5px] rounded-[7px] p-8 flex flex-col h-full ${
              index === 1
                ? "border-forest-600/45 shadow-[0_18px_50px_-28px_rgba(31,58,46,0.45)]"
                : "border-border"
            }`}
          >
            <div
              className="text-[13px] mb-8 text-forest-600"
              style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif", letterSpacing: "0.08em" }}
            >
              — {step.num}
            </div>
            <h3 className="font-sans font-medium text-[16px] text-text-primary mb-3">{step.title}</h3>
            <p className="text-[13px] text-text-body font-sans leading-[1.6] flex-1">
              {step.text}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.25, ease }}
        className="mt-10 rounded-[7px] border border-[0.5px] border-border bg-surface p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
      >
        <div>
          <p className="text-[15px] font-medium text-text-primary mb-1">
            Aucun engagement avant validation.
          </p>
          <p className="text-[13px] text-text-body leading-[1.6] max-w-2xl">
            Vous recevez d&apos;abord votre diagnostic. Le prix vient ensuite, avec un plan clair que vous pouvez accepter ou refuser librement.
          </p>
        </div>
        <Link href="/audit-gratuit" className="shrink-0">
          <Button variant="primary">Faire mon audit gratuit &rarr;</Button>
        </Link>
      </motion.div>
    </section>
  );
}
