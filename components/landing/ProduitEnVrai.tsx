"use client";

import React from "react";
import { motion } from "framer-motion";
import { BrowserFrame } from "./ui/BrowserFrame";

const ease = [0.16, 1, 0.3, 1] as const;

const ROWS = [
  {
    eyebrow: "Facturation",
    title: "Une facture juste, du temps capturé au PDF.",
    body: "Vos heures deviennent des lignes, la TPS et la TVQ se calculent, le PDF est prêt à envoyer. Sans ressaisie, sans tableur.",
    src: "/images/app/facture.png",
    alt: "Aperçu d'une facture dans SAFE, avec lignes de temps, TPS et TVQ en dollars canadiens.",
    label: "safecabinet.ca/facturation",
  },
  {
    eyebrow: "Fidéicommis",
    title: "L'argent du client, séparé et tracé.",
    body: "Dépôts, retraits, rapprochement. Le solde du client n'est jamais mêlé à celui du cabinet, et chaque mouvement laisse une trace.",
    src: "/images/app/fideicommis.png",
    alt: "Écran des comptes en fidéicommis dans SAFE, avec solde total et mouvements.",
    label: "safecabinet.ca/comptes",
  },
  {
    eyebrow: "Suivi",
    title: "Ce qui est dû, sans avoir à le chercher.",
    body: "Facturables, envoyées, en retard, taux d'encaissement. D'un coup d'œil, vous savez où en est l'argent du cabinet.",
    src: "/images/app/facturation.png",
    alt: "Tableau de suivi de la facturation dans SAFE.",
    label: "safecabinet.ca/facturation",
  },
];

export function ProduitEnVrai() {
  return (
    <section className="py-[100px] px-6 max-w-6xl mx-auto" id="produit-en-vrai">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-16 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          En vrai
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary max-w-2xl mb-4">
          Pas une promesse.{" "}
          <span className="italic text-forest-600">Le produit, tel que vous l&apos;utiliserez.</span>
        </h2>
        <p className="text-[15px] text-text-body font-sans leading-[1.6] max-w-xl">
          Des écrans réels de SAFE, en dollars canadiens, avec la TPS, la TVQ et le fidéicommis. Rien d&apos;inventé pour la photo.
        </p>
      </motion.div>

      <div className="flex flex-col gap-20 md:gap-28">
        {ROWS.map((row, i) => {
          const reversed = i % 2 === 1;
          return (
            <div
              key={row.src}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center"
            >
              <motion.div
                initial={{ opacity: 0, x: reversed ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease }}
                className={`md:col-span-4 ${reversed ? "md:order-2" : ""}`}
              >
                <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-3">
                  {row.eyebrow}
                </span>
                <h3 className="font-serif text-[26px] leading-[1.2] tracking-[-0.01em] text-text-primary mb-3">
                  {row.title}
                </h3>
                <p className="text-[14.5px] text-text-body font-sans leading-[1.65]">
                  {row.body}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease }}
                className={`md:col-span-8 ${reversed ? "md:order-1" : ""}`}
              >
                <BrowserFrame src={row.src} alt={row.alt} label={row.label} />
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
