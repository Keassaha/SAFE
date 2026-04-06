"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Brain,
  Shield,
  FileCheck,
  Calculator,
  Bot,
  Workflow,
  ArrowRight,
  Zap,
  Lock,
  CheckCircle2,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   Animated connection line between nodes
   ═══════════════════════════════════════════════ */
function AnimatedLine({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="hidden lg:block absolute w-px bg-gradient-to-b from-transparent via-[var(--safe-sage)]/40 to-transparent"
      style={{ height: "60px", left: "50%", transform: "translateX(-50%)" }}
      initial={{ scaleY: 0, opacity: 0 }}
      whileInView={{ scaleY: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

/* ═══════════════════════════════════════════════
   Pulsing data flow dot
   ═══════════════════════════════════════════════ */
function DataFlowDot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-emerald-400"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: [0, 1, 1, 0] }}
      viewport={{ once: true }}
      transition={{
        delay,
        duration: 2,
        repeat: Infinity,
        repeatDelay: 1,
        times: [0, 0.1, 0.9, 1],
      }}
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        boxShadow: "0 0 8px rgba(52, 211, 153, 0.6)",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════
   Agent node card
   ═══════════════════════════════════════════════ */
function AgentNode({
  icon: Icon,
  label,
  description,
  iconColor,
  borderColor,
  glowColor,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  iconColor: string;
  borderColor: string;
  glowColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="relative p-5 rounded-safe-md bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-500">
        {/* Top glow line */}
        <motion.div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent ${glowColor} to-transparent`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.3, duration: 0.6 }}
        />

        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-safe flex-shrink-0 flex items-center justify-center border ${borderColor} bg-white/[0.03]`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white font-sans mb-1">{label}</h4>
            <p className="text-xs text-white/50 font-sans leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Hover glow */}
        <div className={`absolute -inset-px rounded-safe-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent ${glowColor} to-transparent blur-xl -z-10`} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN SECTION
   ═══════════════════════════════════════════════ */
export function AIArchitecture() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-night relative py-28 lg:py-36 overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[120px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[100px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
          >
            <Brain className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium font-sans">
              Intelligence artificielle + Expertise comptable
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-4xl md:text-5xl text-white mb-6 leading-tight tracking-tight"
          >
            Là où{" "}
            <span className="italic text-emerald-400">
              l&apos;IA rencontre
            </span>{" "}
            la rigueur comptable.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-lg text-white/60 leading-relaxed font-sans"
          >
            Des agents IA spécialisés qui automatisent les tâches répétitives
            tout en respectant les normes du Barreau. Chaque action reste sous
            votre contrôle.
          </motion.p>

          <motion.div
            className="mx-auto mt-8 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: "60%", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Architecture visual */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Agent flow diagram */}
          <div className="space-y-4">
            {/* Central orchestrator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-6 rounded-safe-md bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-400/20 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-safe bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                  <Workflow className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-sans">Orchestrateur SAFE</h3>
                  <p className="text-xs text-emerald-400/70 font-sans">Moteur central de décision</p>
                </div>
                {/* Live indicator */}
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-sans font-medium">ACTIF</span>
                </motion.div>
              </div>

              {/* Data flow visualization */}
              <div className="grid grid-cols-3 gap-2">
                {["Analyse", "Validation", "Exécution"].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className="text-center py-2 rounded-safe-sm bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-white/40 font-sans font-semibold">{step}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Agent nodes */}
            <div className="grid grid-cols-2 gap-4">
              <AgentNode
                icon={Calculator}
                label="Agent Comptable"
                description="Facturation B-1 r.5, calculs TPS/TVQ, rapprochement bancaire"
                iconColor="text-blue-400"
                borderColor="border-blue-400/20"
                glowColor="via-blue-400/40"
                delay={0.2}
              />
              <AgentNode
                icon={FileCheck}
                label="Agent Conformité"
                description="Validation réglementaire, alertes de non-conformité, audit trail"
                iconColor="text-violet-400"
                borderColor="border-violet-400/20"
                glowColor="via-violet-400/40"
                delay={0.3}
              />
              <AgentNode
                icon={Bot}
                label="Agent Rédaction"
                description="Courriels, mises en demeure, procédures — sans conseil juridique"
                iconColor="text-amber-400"
                borderColor="border-amber-400/20"
                glowColor="via-amber-400/40"
                delay={0.4}
              />
              <AgentNode
                icon={Shield}
                label="Agent Fidéicommis"
                description="Mouvements traçables, validation humaine obligatoire"
                iconColor="text-emerald-400"
                borderColor="border-emerald-400/20"
                glowColor="via-emerald-400/40"
                delay={0.5}
              />
            </div>
          </div>

          {/* Right — Key principles */}
          <div className="space-y-8">
            {/* Principle cards */}
            {[
              {
                icon: Zap,
                title: "Automatisation intelligente",
                description:
                  "Les agents IA traitent la saisie, la classification et le rapprochement en temps réel. Vous vous concentrez sur vos clients.",
                stat: "70%",
                statLabel: "de temps administratif économisé",
              },
              {
                icon: Lock,
                title: "Contrôle humain garanti",
                description:
                  "Aucune transaction en fidéicommis, aucune facture n'est envoyée sans votre approbation explicite. L'IA suggère, vous décidez.",
                stat: "100%",
                statLabel: "sous votre contrôle",
              },
              {
                icon: CheckCircle2,
                title: "Conformité native",
                description:
                  "Chaque agent est entraîné sur les normes du Barreau du Québec. Les règles de conformité sont intégrées, pas ajoutées après coup.",
                stat: "B-1 r.5",
                statLabel: "toujours conforme",
              },
            ].map((principle, i) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex gap-5 p-6 rounded-safe-md bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-500"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-safe bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <principle.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-2">
                    <h4 className="text-base font-bold text-white font-sans">
                      {principle.title}
                    </h4>
                    <span className="text-xs font-bold text-emerald-400 font-sans ml-3">
                      {principle.stat}{" "}
                      <span className="text-white/30 font-normal">{principle.statLabel}</span>
                    </span>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    {principle.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <a
                href="/fonctionnalites"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 font-sans transition-colors duration-300"
              >
                Découvrir tous les agents IA
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
