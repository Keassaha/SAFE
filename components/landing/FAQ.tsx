"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const faqs = [
  {
    question: "SAFE est-il vraiment conforme au Règlement B-1, r.5 du Barreau du Québec ?",
    answer:
      "Oui. La gestion des fidéicommis dans SAFE a été architecturée autour du Règlement B-1, r.5 : aucun mouvement ne peut être supprimé (uniquement inversé), chaque mouvement requiert une approbation, et la piste d'audit est immuable et conservée 7 ans.",
  },
  {
    question: "Est-ce que mes données restent au Canada ?",
    answer:
      "Oui. SAFE est hébergé sur Vercel dans la région de Toronto (Canada). Vos données ne quittent jamais le territoire canadien. Les données sensibles sont chiffrées avec AES-256. SAFE est conforme à la Loi 25 du Québec.",
  },
  {
    question: "Combien de temps faut-il pour migrer depuis mon système actuel ?",
    answer:
      "La plupart des cabinets sont opérationnels en moins d'une journée. SAFE propose un assistant d'importation pour vos clients existants et un guide d'onboarding en 4 étapes.",
  },
  {
    question: "Les employés virtuels (Léa et Max) ont-ils accès à mes données ?",
    answer:
      "Les employés virtuels accèdent à vos données uniquement via des appels de fonctions sécurisés — jamais directement à la base de données. Vous contrôlez le niveau d'autonomie de chaque employé virtuel. Toute action de l'employé virtuel est journalisée.",
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer:
      "Oui, sans pénalité. L'annulation s'effectue en un clic dans vos paramètres. Vous conservez l'accès jusqu'à la fin de votre période de facturation. Vos données restent exportables pendant 90 jours.",
  },
  {
    question: "SAFE fonctionne-t-il pour le droit de la famille uniquement ?",
    answer:
      "SAFE est optimisé pour le droit de la famille au Québec (formulaires TUF 2025, fidéicommis, honoraires). Il peut être utilisé par d'autres spécialités, mais certaines fonctionnalités sont orientées droit de la famille.",
  },
  {
    question: "Est-ce que Stripe est sécurisé pour recevoir les paiements ?",
    answer:
      "Oui. SAFE utilise Stripe pour les paiements en ligne. SAFE ne stocke jamais les informations de carte de crédit — celles-ci sont gérées exclusivement par Stripe (certifié PCI DSS niveau 1).",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left text-sm font-medium text-neutral-800 hover:text-gold-700 transition-colors"
      >
        {question}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 ml-4"
        >
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-neutral-600 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="py-24 landing-glass-section">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="font-sans text-sm font-semibold text-gold-400 uppercase tracking-widest mb-3">
            Questions fr&eacute;quentes
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl font-semibold text-white leading-tight tracking-[-0.04em]">
            Vous avez des questions.
            <br />
            <span className="text-white/60">Voici les r&eacute;ponses.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="landing-glass-card px-6"
        >
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
