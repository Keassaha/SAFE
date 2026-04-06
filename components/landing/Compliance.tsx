"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, FileCheck } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const badges = [
  {
    icon: ShieldCheck,
    title: "Règlement B-1, r.5",
    subtitle: "Barreau du Québec",
    description:
      "Registre fidéicommis conforme. Aucun DELETE sur les mouvements. Approbations obligatoires. Piste d'audit complète.",
  },
  {
    icon: Lock,
    title: "Loi 25",
    subtitle: "Hébergement Canada — AES-256",
    description:
      "Vos données restent au Canada (Vercel région Toronto). Chiffrement AES-256 pour les données sensibles.",
  },
  {
    icon: FileCheck,
    title: "Formulaires TUF 2025",
    subtitle: "SJ-1326 à SJ-1329",
    description:
      "Les formulaires de divulgation financière en matière familiale intégrés directement dans l'application.",
  },
];

export function Compliance() {
  return (
    <section id="conformite" className="py-24 landing-glass-section">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="font-sans text-sm font-semibold text-gold-400 uppercase tracking-widest mb-3">
            Conformit&eacute;
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl font-semibold text-white leading-tight tracking-[-0.04em]">
            Con&ccedil;u pour le Barreau.
            <br />
            <span className="text-white/60">Pas adapt&eacute; apr&egrave;s coup.</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-white/60">
            La conformit&eacute; n&apos;est pas une option dans SAFE — c&apos;est l&apos;architecture.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.title}
                variants={fadeUp}
                className="landing-glass-card flex flex-col items-center text-center p-8 hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="w-14 h-14 rounded-safe-md bg-green-700/15 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-green-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-1 tracking-tight">{badge.title}</h3>
                <p className="text-xs text-green-700 font-medium mb-3">{badge.subtitle}</p>
                <p className="text-sm text-neutral-600 leading-relaxed">{badge.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-10 text-center text-xs text-white/50"
        >
          SAFE n&apos;est pas affili&eacute; au Barreau du Qu&eacute;bec ni &agrave; aucun organisme gouvernemental.
        </motion.p>
      </div>
    </section>
  );
}
