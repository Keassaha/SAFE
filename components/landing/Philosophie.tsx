"use client";

import React from "react";
import { motion } from "framer-motion";

// La section différenciateur : la philosophie SAFE en pleine lumière.
// L'assistant prépare, l'humain valide. Le copilote de l'adjointe, pas son remplaçant.
const EASE = [0.2, 0, 0, 1] as const;

const audiences = [
  {
    num: "01",
    titre: "Pour l'avocat",
    texte: "Le risque et l'argent sous contrôle. Rien ne part sans votre validation.",
  },
  {
    num: "02",
    titre: "Pour l'adjointe",
    texte: "Le travail ingrat disparaît. Elle garde la main, et le crédit.",
  },
  {
    num: "03",
    titre: "Pour le cabinet",
    texte: "Conforme au Barreau en continu, pas seulement le jour de l'inspection.",
  },
];

export function Philosophie() {
  return (
    <section className="border-t border-[0.5px] border-border bg-canvas px-6 py-[110px]" id="philosophie">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-4 block font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-forest-600">
            La philosophie
          </span>
          <h2 className="font-serif text-[38px] leading-[1.08] tracking-[-0.015em] text-text-primary sm:text-[44px]">
            SAFE ne remplace personne.
            <br />
            <span className="italic text-forest-600">Il prépare, vous validez.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] font-sans text-[15px] leading-[1.6] text-text-body">
            Votre adjointe est le copilote de votre cabinet. SAFE est le sien.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 divide-y divide-border/70 md:grid-cols-3 md:divide-x md:divide-y-0">
          {audiences.map((a, i) => (
            <motion.div
              key={a.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: EASE }}
              className="px-0 py-8 md:px-10 md:py-2 first:md:pl-0 last:md:pr-0"
            >
              <span className="mb-5 block font-serif text-[14px] italic text-forest-600" style={{ letterSpacing: "0.04em" }}>
                &mdash; {a.num}
              </span>
              <h3 className="mb-2 font-serif text-[19px] leading-[1.25] text-text-primary">{a.titre}</h3>
              <p className="font-sans text-[13.5px] leading-[1.6] text-text-body">{a.texte}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
