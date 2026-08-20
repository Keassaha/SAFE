"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "./ui/Button";
import { TARIFICATION, prixFr } from "@/lib/tarification";

// Étapes + prix publics en une seule section compacte.
// Question facile avant décision difficile : le seul geste demandé est l'audit gratuit.
const EASE = [0.2, 0, 0, 1] as const;

const etapes = [
  {
    num: "01",
    titre: "Audit gratuit",
    texte: "15 minutes sur votre cabinet, vos outils, vos irritants. Sans engagement.",
  },
  {
    num: "02",
    titre: "Diagnostic chiffré",
    texte: "Vos zones de friction et vos priorités, en chiffres réels, sous 24 h.",
  },
  {
    num: "03",
    titre: "Mise en service accompagnée",
    texte: "Migration, configuration et mise en route faites avec vous.",
  },
];

export function Commencer() {
  const { solo, cabinet } = TARIFICATION.paliers;
  return (
    <section className="border-t border-[0.5px] border-border bg-canvas px-6 py-[110px]" id="tarification">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-14 text-center"
        >
          <span className="mb-4 block font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-forest-600">
            Commencer
          </span>
          <h2 className="mx-auto max-w-2xl font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary">
            Un audit gratuit. <span className="italic text-forest-600">Des prix publics.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] font-sans text-[15px] leading-[1.6] text-text-body">
            Solo {prixFr(solo.prix)}&nbsp;$/mois. Cabinet {prixFr(cabinet.prix)}&nbsp;$/mois. Tout inclus,
            configuration comprise, sans frais cachés.
          </p>
        </motion.div>

        <div className="mx-auto mb-14 grid max-w-4xl grid-cols-1 divide-y divide-border/70 md:grid-cols-3 md:divide-x md:divide-y-0">
          {etapes.map((e, i) => (
            <motion.div
              key={e.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: EASE }}
              className="px-0 py-8 md:px-8 md:py-2 first:md:pl-0 last:md:pr-0"
            >
              <span className="mb-4 block font-serif text-[14px] italic text-forest-600" style={{ letterSpacing: "0.04em" }}>
                &mdash; {e.num}
              </span>
              <h3 className="mb-2 font-serif text-[18px] leading-[1.25] text-text-primary">{e.titre}</h3>
              <p className="font-sans text-[13.5px] leading-[1.6] text-text-body">{e.texte}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          className="flex flex-col items-center gap-3"
        >
          <Link href="/audit-gratuit">
            <Button variant="primary" size="lg" className="px-8">
              Faire mon audit gratuit &rarr;
            </Button>
          </Link>
          <p className="font-sans text-[12px] text-text-body/60">
            Sans engagement, sans carte de crédit.{" "}
            <Link href="/tarification" className="underline underline-offset-2 hover:text-text-primary">
              Voir le détail des prix
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
