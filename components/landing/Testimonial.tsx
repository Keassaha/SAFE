"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../brand/Logo';

type Quote = {
  text: React.ReactNode;
  role: string;
  specialty: string;
  initials: string;
};

const QUOTES: Quote[] = [
  {
    text: (
      <>
        &ldquo;Je passe enfin mes soirées avec mes enfants plutôt qu&apos;à
        saisir des factures. Mes livres sont{" "}
        <span className="italic text-forest-500">toujours</span> prêts pour
        une inspection.&rdquo;
      </>
    ),
    role: "Avocate en pratique privée",
    specialty: "Droit de la famille",
    initials: "A.L.",
  },
  {
    text: (
      <>
        &ldquo;Le fidéicommis n&apos;est plus une{" "}
        <span className="italic text-forest-500">source d&apos;angoisse</span>.
        Je sais où en sont mes comptes, à la minute près.&rdquo;
      </>
    ),
    role: "Avocat · Cabinet de 3",
    specialty: "Droit des affaires",
    initials: "M.R.",
  },
  {
    text: (
      <>
        &ldquo;On a arrêté de perdre des factures. Notre rentabilité par
        dossier est devenue{" "}
        <span className="italic text-forest-500">visible</span>, pour la
        première fois.&rdquo;
      </>
    ),
    role: "Associée directrice",
    specialty: "Litige civil",
    initials: "C.B.",
  },
  {
    text: (
      <>
        &ldquo;Installation simple, support humain. Je me concentre sur mes
        clients, plus sur{" "}
        <span className="italic text-forest-500">la paperasse</span>.&rdquo;
      </>
    ),
    role: "Avocat solo",
    specialty: "Immigration",
    initials: "J.T.",
  },
];

const ROTATION_MS = 7000;

export function Testimonial() {
  const [index, setIndex] = useState(0);
  const ease = [0.16, 1, 0.3, 1] as const;

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % QUOTES.length),
      ROTATION_MS
    );
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[index];

  return (
    <section className="bg-[#0A0A0A] py-[96px] px-6 w-full flex justify-center overflow-hidden">
      <div className="max-w-[760px] w-full text-center flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
          className="w-12 h-12 rounded-[9px] bg-white/[0.04] ring-1 ring-white/10 flex items-center justify-center mb-10"
        >
          <Logo size={22} accentColor="#A9D3B6" />
        </motion.div>

        {/* Citation rotative */}
        <div className="relative w-full min-h-[180px] md:min-h-[150px] flex items-center justify-center mb-12">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-[24px] md:text-[28px] leading-[1.35] tracking-[-0.02em] text-white px-2"
            >
              {q.text}
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* Identité anonyme */}
        <div className="flex items-center gap-4 mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`avatar-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease }}
              className="w-10 h-10 rounded-full bg-[#1F1F1C] ring-1 ring-white/10 flex items-center justify-center font-serif italic text-forest-500 text-[14px]"
            >
              {q.initials}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={`meta-${index}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col items-start text-left"
            >
              <span className="text-[14px] text-white font-medium font-sans">
                {q.role}
              </span>
              <span className="text-[13px] text-white/55 font-sans">
                {q.specialty}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicateurs */}
        <div className="flex items-center gap-2">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Témoignage ${i + 1}`}
              onClick={() => setIndex(i)}
              className="relative h-1 rounded-full overflow-hidden bg-white/15 transition-all"
              style={{ width: i === index ? 32 : 16 }}
            >
              {i === index && (
                <motion.span
                  key={`bar-${index}`}
                  className="absolute inset-y-0 left-0 bg-forest-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: ROTATION_MS / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
