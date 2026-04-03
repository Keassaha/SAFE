"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Me Sophie Tremblay",
    title: "Avocate solo, Sherbrooke",
    quote:
      "SAFE a complètement transformé ma pratique. Fini le stress de fin de mois pour les registres de fidéicommis. Tout est clair, net et conforme.",
    initials: "ST",
    color: { bg: "bg-emerald-500/20", border: "border-emerald-400/25", text: "text-emerald-400" },
  },
  {
    name: "Me Jean-François Lavoie",
    title: "Associé, cabinet 3 avocats, Québec",
    quote:
      "L'interface est d'une fluidité remarquable. Nous avons migré depuis un vieux logiciel serveur et l'équipe a gagné au moins 5 heures par semaine en gestion administrative.",
    initials: "JL",
    color: { bg: "bg-blue-500/20", border: "border-blue-400/25", text: "text-blue-400" },
  },
  {
    name: "Marie-Ève Gagnon",
    title: "Adjointe juridique, Gatineau",
    quote:
      "La facturation est devenue un jeu d'enfant. Le calcul automatique des taxes et la génération des états de compte PDF sont parfaits.",
    initials: "MG",
    color: { bg: "bg-violet-500/20", border: "border-violet-400/25", text: "text-violet-400" },
  },
  {
    name: "Me Alexandre Dubois",
    title: "Avocat en droit familial, Montréal",
    quote:
      "Le système d'échéanciers intégré aux dossiers est un filet de sécurité indispensable. Je ne pourrais plus m'en passer.",
    initials: "AD",
    color: { bg: "bg-amber-500/20", border: "border-amber-400/25", text: "text-amber-400" },
  },
  {
    name: "Me Catherine Bergeron",
    title: "Avocate, médiation familiale, Laval",
    quote:
      "Enfin un logiciel qui comprend la réalité d'un petit cabinet québécois. Le support est réactif et l'outil évolue constamment.",
    initials: "CB",
    color: { bg: "bg-cyan-500/20", border: "border-cyan-400/25", text: "text-cyan-400" },
  },
];

export function TestimonialSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setDragWidth(containerRef.current.scrollWidth - containerRef.current.offsetWidth);
    }
  }, []);

  return (
    <section className="section-night relative py-28 lg:py-36 overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 mb-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4"
        >
          Témoignages
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-instrument text-4xl md:text-5xl text-[var(--safe-white)] leading-tight tracking-tight"
        >
          Ce que disent nos confrères.
        </motion.h2>
      </div>

      {/* Draggable carousel */}
      <div className="relative z-10 pl-6 lg:pl-10 2xl:pl-0 2xl:max-w-7xl 2xl:mx-auto">
        {/* Gradient fades */}
        <div className="absolute right-0 top-0 bottom-0 w-32 z-20 bg-gradient-to-l from-[#051F20] to-transparent pointer-events-none" />

        <motion.div
          ref={containerRef}
          className="cursor-grab active:cursor-grabbing overflow-hidden"
        >
          <motion.div
            drag="x"
            dragConstraints={{ right: 0, left: -dragWidth }}
            className="flex gap-6 pr-6"
          >
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="card-dark min-w-[320px] md:min-w-[420px] max-w-[420px] bg-[var(--safe-darkest)] border border-[var(--safe-sage)]/10 rounded-2xl p-8 flex flex-col justify-between hover:border-[var(--safe-sage)]/30 transition-colors duration-500 shrink-0"
              >
                <div>
                  <Quote className="w-8 h-8 text-[var(--safe-sage)] opacity-30 mb-6" />
                  <p className="text-lg text-[var(--safe-white)] mb-8 leading-relaxed font-jakarta">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                  <div className={`w-12 h-12 rounded-full ${t.color.bg} border ${t.color.border} flex items-center justify-center font-instrument text-lg ${t.color.text}`}>
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="text-[var(--safe-white)] font-semibold font-jakarta text-sm">
                      {t.name}
                    </h4>
                    <p className="text-xs text-[var(--safe-text-muted)] font-jakarta">
                      {t.title}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
