"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowRight, Users, Clock } from "lucide-react";

/* ═══════════════════════════════════════════════
   ROI CALCULATOR — interactive section
   Titre : « Combien d'heures perdez-vous en admin ? »
   Sliders : nombre d'avocats · heures admin / semaine
   Résultat : heures/an et coût/an (taux 150 $/h Québec)
   ═══════════════════════════════════════════════ */

const HOURLY_RATE = 150; // $ CAD — taux facturable moyen au Québec
const WEEKS_PER_YEAR = 48;

export function ROICalculator() {
  const [lawyers, setLawyers] = useState(3);
  const [hoursPerWeek, setHoursPerWeek] = useState(6);

  const { annualHours, annualCost } = useMemo(() => {
    const h = lawyers * hoursPerWeek * WEEKS_PER_YEAR;
    return {
      annualHours: h,
      annualCost: h * HOURLY_RATE,
    };
  }, [lawyers, hoursPerWeek]);

  const formatHours = (n: number) => n.toLocaleString("fr-CA");
  const formatDollars = (n: number) =>
    n.toLocaleString("fr-CA", { maximumFractionDigits: 0 });

  return (
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden bg-[var(--safe-darkest)]">
      <div className="landing-grain absolute inset-0 pointer-events-none opacity-30" />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[var(--safe-sage)] opacity-[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[var(--safe-warm)] opacity-[0.06] blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-10">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--safe-warm)] mb-4 font-sans"
          >
            Calculez votre perte
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--safe-white)] leading-[1.1] tracking-tight"
          >
            Combien d&apos;heures perdez-vous{" "}
            <span className="italic text-[var(--safe-sage)]">en admin ?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-base text-[var(--safe-text-muted)] mt-5 font-sans"
          >
            Chaque heure en facturation, saisie et classement est une heure qui
            ne facture pas. Faites le calcul.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl p-8 sm:p-10 backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(19,28,22,0.55), rgba(12,18,14,0.3))",
            border: "1px solid rgba(142,182,155,0.12)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.3), 0 0 30px rgba(90,143,123,0.08)",
          }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[var(--safe-sage)]/10 border border-[var(--safe-sage)]/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[var(--safe-sage)]" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-[var(--safe-white)] font-sans tracking-tight">
              Simulateur d&apos;heures perdues
            </h3>
          </div>

          {/* Sliders */}
          <div className="space-y-7">
            <div>
              <label className="flex items-center justify-between mb-3 font-sans">
                <span className="flex items-center gap-2 text-sm text-[var(--safe-text-muted)]">
                  <Users className="w-4 h-4" aria-hidden />
                  Avocats dans le cabinet
                </span>
                <span className="text-2xl font-bold text-[var(--safe-white)] tabular-nums">
                  {lawyers}
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={lawyers}
                onChange={(e) => setLawyers(Number(e.target.value))}
                className="range-safe"
                aria-label="Nombre d'avocats"
              />
              <div className="flex justify-between text-xs text-[var(--safe-text-muted)] font-sans mt-2">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between mb-3 font-sans">
                <span className="flex items-center gap-2 text-sm text-[var(--safe-text-muted)]">
                  <Clock className="w-4 h-4" aria-hidden />
                  Heures admin / semaine par avocat
                </span>
                <span className="text-2xl font-bold text-[var(--safe-white)] tabular-nums">
                  {hoursPerWeek}&nbsp;h
                </span>
              </label>
              <input
                type="range"
                min={2}
                max={15}
                step={1}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="range-safe"
                aria-label="Heures administratives par semaine"
              />
              <div className="flex justify-between text-xs text-[var(--safe-text-muted)] font-sans mt-2">
                <span>2 h</span>
                <span>15 h</span>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-10 pt-8 border-t border-[rgba(142,182,155,0.12)] text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--safe-text-muted)] font-sans mb-4">
              Votre perte annuelle
            </p>
            <p
              className="font-sans font-bold tracking-tight leading-[1.05]"
              style={{
                fontSize: "clamp(36px, 6vw, 56px)",
                backgroundImage:
                  "linear-gradient(135deg, var(--safe-sage) 0%, var(--safe-warm) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {formatHours(annualHours)} h&nbsp;/&nbsp;an
            </p>
            <p className="mt-3 text-base sm:text-lg text-[var(--safe-text-muted)] font-sans">
              soit{" "}
              <span className="font-bold text-[var(--safe-warm)]">
                {formatDollars(annualCost)}&nbsp;$
              </span>{" "}
              de facturation perdue chaque ann&eacute;e.
            </p>
            <p className="mt-2 text-xs text-[var(--safe-text-muted)]/70 font-sans">
              Base&nbsp;: {HOURLY_RATE}&nbsp;$/h &times; {WEEKS_PER_YEAR}{" "}
              semaines travaill&eacute;es
            </p>

            <Link
              href="/audit-gratuit"
              className="btn-warm group inline-flex items-center gap-2.5 mt-8 px-7 py-3.5 rounded-full text-sm sm:text-base font-sans"
            >
              R&eacute;cup&eacute;rez ces heures &mdash; Audit gratuit
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
