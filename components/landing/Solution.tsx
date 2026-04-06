"use client";

import { motion } from "framer-motion";
import { FolderOpen, Timer, Landmark, UserCog } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const pillars = [
  {
    icon: FolderOpen,
    title: "Dossiers",
    description:
      "Créez et gérez vos dossiers clients en quelques secondes. Toutes les pièces, entrées de temps et correspondances au même endroit.",
    features: ["Dossiers clients centralisés", "Documents et pièces jointes", "Historique complet"],
  },
  {
    icon: Timer,
    title: "Temps & Facturation",
    description:
      "Du chronomètre intégré à la facture envoyée par courriel — en un clic. Calcul automatique TPS/TVQ inclus.",
    features: ["Chronomètre par dossier", "Calcul TPS/TVQ automatique", "Envoi par courriel"],
  },
  {
    icon: Landmark,
    title: "Fidéicommis",
    description:
      "Un registre conforme au Règlement B-1, r.5. Aucun DELETE, traçabilité complète, approbations obligatoires.",
    features: ["Conforme B-1 r.5 Barreau", "Piste d'audit immuable", "Rapports automatisés"],
  },
  {
    icon: UserCog,
    title: "Employés virtuels",
    description:
      "Léa et Max, vos assistants IA formés sur les règlements du Barreau du Québec et les formulaires TUF 2025.",
    features: ["Agent Finance Léa", "Agent Assistant Max", "Formulaires TUF 2025"],
  },
];

export function Solution() {
  return (
    <section id="fonctionnalites" className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="font-sans text-sm font-semibold text-gold-400 uppercase tracking-widest mb-3">
            La solution
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl font-semibold text-white leading-tight tracking-[-0.04em]">
            Tout ce dont vous avez besoin.
            <br />
            <span className="text-white/50">Rien de plus.</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-white/60">
            SAFE a &eacute;t&eacute; con&ccedil;u avec des avocats, pour des avocats. Chaque
            fonctionnalit&eacute; r&eacute;pond &agrave; un besoin r&eacute;el — aucune fioriture.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                variants={fadeUp}
                className="group flex flex-col p-6 rounded-safe border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] hover:border-white/25 transition-all duration-200 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-safe-sm bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/15 transition-colors">
                  <Icon className="w-5 h-5 text-gold-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{pillar.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4 flex-1">{pillar.description}</p>
                <ul className="space-y-1.5">
                  {pillar.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-white/50">
                      <span className="w-1 h-1 rounded-full bg-gold-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
