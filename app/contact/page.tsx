"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Mail, MapPin, Send, ArrowRight, MessageSquare, Shield, Clock } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/landing/Footer";

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
        { icon: MapPin, x: 78, y: 72, delay: 1.4 },
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
            className="w-9 h-9 rounded-safe bg-surface-2 border border-border flex items-center justify-center"
          >
            <item.icon className="w-4 h-4 text-forest-600/50" />
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
          <div className="w-28 h-20 rounded-safe bg-text-secondary/20 border border-forest-600/20 flex items-center justify-center">
            <Mail className="w-10 h-10 text-forest-600" />
          </div>

          {/* Animated notification badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 1.0, type: "spring", stiffness: 400 }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--safe-sage)] flex items-center justify-center"
          >
            <span className="text-xs font-bold text-text-primary">1</span>
          </motion.div>

          {/* Response time text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.3 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <span className="text-xs text-forest-600 font-sans font-medium">Réponse en 24h</span>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cabinet: "",
    numLawyers: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", cabinet: "", numLawyers: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-canvas text-text-primary scroll-smooth">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-surface-2 sm:border-y border-[0.5px] border-border relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
          
          

          {/* Background glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-text-secondary opacity-10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
              {/* Left — info */}
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-sans italic text-forest-600 mb-4"
                >
                  Contact
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="font-sans text-5xl md:text-6xl text-text-primary mb-6 leading-[1.05] tracking-tight"
                >
                  Parlons de votre{" "}
                  <span className="italic text-forest-600">cabinet</span>.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-lg text-text-body leading-relaxed font-sans mb-10"
                >
                  Si vous voulez savoir si SAFE convient à votre pratique, à votre mode de facturation ou à votre réalité opérationnelle, on peut le voir ensemble simplement.
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
                    { icon: Mail, label: "Courriel", value: "jeremie@safecabinet.ca", href: "mailto:jeremie@safecabinet.ca" },
                    { icon: MapPin, label: "Bureau", value: "Gatineau, QC", href: null },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                      className="flex items-center gap-4 group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="w-11 h-11 rounded-safe bg-text-secondary/15 flex items-center justify-center shrink-0"
                      >
                        <item.icon className="w-5 h-5 text-forest-600" />
                      </motion.div>
                      <div>
                        <p className="text-sm text-text-body font-sans">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-text-primary font-medium font-sans hover:text-forest-600 transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-text-primary font-medium font-sans">{item.value}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Audit gratuit prompt — sober alternative au Calendly */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="mt-8 p-6 rounded-safe-md border border-white/5 bg-surface"
                >
                  <h3 className="text-base font-semibold text-text-primary font-sans tracking-tight mb-3">
                    Préférez commencer par l&apos;audit ?
                  </h3>
                  <p className="text-sm text-text-body font-sans mb-4">
                    Si vous voulez d&apos;abord une lecture claire de votre situation actuelle, l&apos;audit gratuit prend 15 à 20 min et donne un rapport personnalisé.
                  </p>
                  <Link
                    href="/audit-gratuit"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-forest-600 hover:text-[var(--safe-lightest)] transition-colors font-sans"
                  >
                    Faire mon audit gratuit
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
                    className="rounded-safe-md border border-forest-600/20 bg-surface p-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 rounded-full bg-[var(--safe-sage)]/20 flex items-center justify-center mx-auto mb-6"
                    >
                      <Send className="w-7 h-7 text-forest-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-text-primary mb-3 font-sans tracking-tight">
                      Message envoyé !
                    </h3>
                    <p className="text-text-body font-sans">
                      Nous vous répondrons dans les 24 heures ouvrables.
                    </p>
                  </motion.div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="rounded-safe-md border border-white/5 bg-surface p-8 space-y-5"
                  >
                    {error && (
                      <div className="p-4 rounded-safe bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-sans">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-forest-600 mb-2 font-sans">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="w-full px-4 py-3 rounded-safe bg-surface-2 border border-border text-text-primary placeholder-[#2B4A3E]/60 focus:border-forest-600/50 focus:outline-none transition-colors font-sans text-sm disabled:opacity-50"
                          placeholder="Me Prénom Nom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-forest-600 mb-2 font-sans">
                          Courriel
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="w-full px-4 py-3 rounded-safe bg-surface-2 border border-border text-text-primary placeholder-[#2B4A3E]/60 focus:border-forest-600/50 focus:outline-none transition-colors font-sans text-sm disabled:opacity-50"
                          placeholder="courriel@cabinet.ca"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-forest-600 mb-2 font-sans">
                          Cabinet
                        </label>
                        <input
                          type="text"
                          name="cabinet"
                          value={formData.cabinet}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full px-4 py-3 rounded-safe bg-surface-2 border border-border text-text-primary placeholder-[#2B4A3E]/60 focus:border-forest-600/50 focus:outline-none transition-colors font-sans text-sm disabled:opacity-50"
                          placeholder="Nom de votre cabinet"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-forest-600 mb-2 font-sans">
                          Nombre d&apos;avocats
                        </label>
                        <select
                          name="numLawyers"
                          value={formData.numLawyers}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full px-4 py-3 rounded-safe bg-surface-2 border border-border text-text-primary focus:border-forest-600/50 focus:outline-none transition-colors font-sans text-sm disabled:opacity-50"
                        >
                          <option value="">Sélectionnez</option>
                          <option value="1">1 (solo)</option>
                          <option value="2-5">2 à 5</option>
                          <option value="6-10">6 à 10</option>
                          <option value="10+">Plus de 10</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-forest-600 mb-2 font-sans">
                        Message
                      </label>
                      <textarea
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 rounded-safe bg-surface-2 border border-border text-text-primary placeholder-[#2B4A3E]/60 focus:border-forest-600/50 focus:outline-none transition-colors font-sans text-sm resize-none disabled:opacity-50"
                        placeholder="Comment pouvons-nous vous aider ?"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group w-full py-3 rounded-full font-semibold text-sm bg-text-secondary text-[var(--safe-lightest)] hover:bg-[var(--safe-sage)] hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Envoi en cours..." : "Envoyer le message"}
                      {!loading && <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
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
