"use client";

import { motion } from "framer-motion";
import { Clock, FileSpreadsheet, AlertTriangle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const painPoints = [
  {
    icon: Clock,
    title: "Heures perdues",
    description:
      "Jongler entre Excel, votre agenda et trois logiciels pour facturer un seul dossier. Chaque minute perdue en administration est une minute non facturée.",
  },
  {
    icon: FileSpreadsheet,
    title: "Fichiers éparpillés",
    description:
      "Vos documents sont dispersés entre Google Drive, un serveur local et des courriels. Impossible de retrouver la bonne version rapidement.",
  },
  {
    icon: AlertTriangle,
    title: "Risques de non-conformité",
    description:
      "Le Règlement B-1 r.5 du Barreau exige une tenue rigoureuse des fidéicommis. Un oubli peut mener à une inspection disciplinaire.",
  },
];

export function Problem() {
  return (
    <section className="py-24 landing-glass-section">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="font-sans text-sm font-semibold text-gold-400 uppercase tracking-widest mb-3">
            Le probl&egrave;me
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl font-semibold text-white leading-tight tracking-[-0.04em]">
            G&eacute;rer un cabinet,<br />
            <span className="text-white/60">c&apos;est d&eacute;j&agrave; assez complexe.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {painPoints.map((point) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                variants={fadeUp}
                className="landing-glass-card flex flex-col items-center text-center p-8"
              >
                <div className="w-12 h-12 rounded-safe bg-gold-600/15 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gold-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 tracking-tight">{point.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{point.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
