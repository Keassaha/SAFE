"use client";

import React from "react";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

export function NotYourFault() {
  return (
    <section className="py-[72px] px-6 max-w-3xl mx-auto text-center" id="pourquoi">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Pourquoi ça arrive
        </span>
        <h2 className="font-serif text-[32px] leading-[1.15] tracking-[-0.02em] text-text-primary max-w-2xl mb-5">
          Si tout devient difficile à suivre,{" "}
          <span className="italic text-forest-600">ce n&apos;est pas une question de rigueur.</span>
        </h2>
        <p className="text-[15.5px] text-text-body font-sans leading-[1.7] max-w-xl">
          Vous et votre adjointe tenez le cabinet à bout de bras, avec des fichiers qui n&apos;ont jamais été conçus pour suivre un fidéicommis ni une facturation. Le problème ne vient pas de vous, il vient de l&apos;outil. Et un outil, ça se change.
        </p>
      </motion.div>
    </section>
  );
}
