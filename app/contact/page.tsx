"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Phone, MapPin, Send, ArrowRight, Calendar, MessageSquare, Shield, Clock } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

/* ───── Animated envelope illustration ───── */
function EnvelopeIllustration() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="relative w-full max-w-xs mx-auto aspect-square">
      {/* Floating icons around envelope */}
      {[
        { icon: MessageSquare, x: 15, y: 20, delay: 0.8 },
        { icon: Shield, x: 80, y: 25, delay: 1.0 },
        { icon: Clock, x: 20, y: 75, delay: 1.2 },
        { icon: Phone, x: 78, y: 72, delay: 1.4 },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: item.delay, type: "spring", stiffness: 200 }}
          className="absolute"
          style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}
        >
          <motion.div
            animate={inView ? { y: [0, -4, 0] } : {}}
            transition={{ delay: item.delay + 0.5, duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center"
          >
            <item.icon className="w-4 h-4 text-[var(--safe-sage)]/50" />
          </motion.div>
        </motion.div>
      ))}

      {/* Central envelope */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="relative">
          {/* Envelope body */}
          <div className="w-28 h-20 rounded-xl bg-[var(--safe-accent)]/20 border border-[var(--safe-sage)]/20 flex items-center justify-center">
            <Mail className="w-10 h-10 text-[var(--safe-sage)]" />
          </div>

          {/* Animated notification badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 1.0, type: "spring", stiffness: 400 }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--safe-sage)] flex items-center justify-center"
          >
            <span className="text-[9px] font-bold text-[var(--safe-darkest)]">1</span>
          </motion.div>

          {/* Response time text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.3 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <span className="text-[9px] text-[var(--safe-sage)] font-jakarta font-medium">Réponse en 24h</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {[
          { x1: 50, y1: 50, x2: 15, y2: 20 },
          { x1: 50, y1: 50, x2: 80, y2: 25 },
          { x1: 50, y1: 50, x2: 20, y2: 75 },
          { x1: 50, y1: 50, x2: 78, y2: 72 },
        ].map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke="rgba(142, 182, 155, 0.08)"
            strokeWidth="0.3"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--safe-darkest)] text-[var(--safe-white)] scroll-smooth">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 bg-[var(--safe-darkest)] overflow-hidden">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="absolute inset-0 landing-grid opacity-20 pointer-events-none" />

          {/* Background glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--safe-accent)] opacity-10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
              {/* Left — info */}
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4"
                >
                  Contact
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="font-instrument text-5xl md:text-6xl text-[var(--safe-white)] mb-6 leading-[1.05] tracking-tight"
                >
                  Parlons de votre{" "}
                  <span className="italic text-[var(--safe-sage)]">cabinet</span>.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-lg text-[var(--safe-text-muted)] leading-relaxed font-jakarta mb-10"
                >
                  Que vous ayez des questions sur SAFE ou que vous souhaitiez planifier une
                  démonstration, notre équipe est là pour vous accompagner.
                </motion.p>

                {/* Animated illustration */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="mb-10"
                >
                  <EnvelopeIllustration />
                </motion.div>

                {/* Contact info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="space-y-4"
                >
                  {[
                    { icon: Mail, label: "Courriel", value: "bonjour@safe.quebec", href: "mailto:bonjour@safe.quebec" },
                    { icon: Phone, label: "Téléphone", value: "+1 (418) 555-1234", href: "tel:+14185551234" },
                    { icon: MapPin, label: "Bureau", value: "Québec, QC, Canada", href: null },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                      className="flex items-center gap-4 group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-11 h-11 rounded-xl bg-[var(--safe-accent)]/15 flex items-center justify-center shrink-0"
                      >
                        <item.icon className="w-5 h-5 text-[var(--safe-sage)]" />
                      </motion.div>
                      <div>
                        <p className="text-sm text-[var(--safe-text-muted)] font-jakarta">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-[var(--safe-white)] font-medium font-jakarta hover:text-[var(--safe-sage)] transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-[var(--safe-white)] font-medium font-jakarta">{item.value}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Calendly CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="mt-8 p-6 rounded-2xl border border-white/5 bg-[var(--safe-dark)]/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-[var(--safe-sage)]" />
                    <h3 className="text-base font-semibold text-[var(--safe-white)] font-jakarta">
                      Préférez-vous un appel ?
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--safe-text-muted)] font-jakarta mb-4">
                    Réservez un créneau de 30 minutes directement dans notre agenda.
                  </p>
                  <Link
                    href="/demo"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--safe-sage)] hover:text-[var(--safe-lightest)] transition-colors font-jakarta"
                  >
                    Réserver un appel
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              </div>

              {/* Right — form */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl border border-[var(--safe-sage)]/20 bg-[var(--safe-dark)]/50 p-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 rounded-full bg-[var(--safe-sage)]/20 flex items-center justify-center mx-auto mb-6"
                    >
                      <Send className="w-7 h-7 text-[var(--safe-sage)]" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[var(--safe-white)] mb-3 font-jakarta">
                      Message envoyé !
                    </h3>
                    <p className="text-[var(--safe-text-muted)] font-jakarta">
                      Nous vous répondrons dans les 24 heures ouvrables.
                    </p>
                  </motion.div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitted(true);
                    }}
                    className="rounded-2xl border border-white/5 bg-[var(--safe-dark)]/50 p-8 space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-[var(--safe-sage)] mb-2 font-jakarta">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] placeholder-[var(--safe-text-muted)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-jakarta text-sm"
                          placeholder="Me Prénom Nom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--safe-sage)] mb-2 font-jakarta">
                          Courriel
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] placeholder-[var(--safe-text-muted)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-jakarta text-sm"
                          placeholder="courriel@cabinet.ca"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-[var(--safe-sage)] mb-2 font-jakarta">
                          Cabinet
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] placeholder-[var(--safe-text-muted)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-jakarta text-sm"
                          placeholder="Nom de votre cabinet"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--safe-sage)] mb-2 font-jakarta">
                          Nombre d&apos;avocats
                        </label>
                        <select className="w-full px-4 py-3 rounded-xl bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-jakarta text-sm">
                          <option value="">Sélectionnez</option>
                          <option value="1">1 (solo)</option>
                          <option value="2-5">2 à 5</option>
                          <option value="6-10">6 à 10</option>
                          <option value="10+">Plus de 10</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--safe-sage)] mb-2 font-jakarta">
                        Message
                      </label>
                      <textarea
                        rows={5}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] placeholder-[var(--safe-text-muted)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-jakarta text-sm resize-none"
                        placeholder="Comment pouvons-nous vous aider ?"
                      />
                    </div>
                    <button
                      type="submit"
                      className="group w-full py-3.5 rounded-full font-semibold text-sm bg-[var(--safe-accent)] text-[var(--safe-lightest)] hover:bg-[var(--safe-sage)] hover:text-[var(--safe-darkest)] transition-all duration-300 flex items-center justify-center gap-2 font-jakarta"
                    >
                      Envoyer le message
                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
