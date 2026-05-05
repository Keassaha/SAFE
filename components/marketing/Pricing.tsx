"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

// Le CTA "Réserver un appel" pointe vers la page de contact.
const BOOK_CALL_HREF = "/contact";

const PLANS = [
  {
    name: "Solo",
    monthlyPrice: "99",
    annualPrice: "79",
    annualSaving: "240",
    description: "Vous pratiquez seul et voulez dormir tranquille avant l'inspection.",
    features: [
      "1 avocat + 1 adjoint",
      "Dossiers illimités",
      "Facturation conforme B-1 r.5",
      "1 compte en fidéicommis",
      "Audit de conformité de base",
      "Support par courriel (48h)",
    ],
    popular: false,
    cta: "Faire mon audit gratuit",
    href: "/audit-gratuit",
  },
  {
    name: "Cabinet",
    monthlyPrice: "149",
    annualPrice: "119",
    annualSaving: "360",
    description: "Votre équipe se concentre sur le droit. La paperasse, c'est réglé.",
    features: [
      "Jusqu'à 5 utilisateurs",
      "Dossiers illimités",
      "3 comptes en fidéicommis",
      "Rapports financiers avancés",
      "Audit complet + alertes conformité",
      "Échéanciers & alertes de cour",
      "Onboarding 1-on-1 (30 min)",
      "Support prioritaire (24h)",
    ],
    popular: true,
    cta: "Faire mon audit gratuit",
    href: "/audit-gratuit",
  },
  {
    name: "Cabinet+",
    monthlyPrice: "",
    annualPrice: "",
    annualSaving: "",
    surDevis: true,
    description: "La tranquillité d'esprit totale pour les cabinets établis.",
    features: [
      "6 utilisateurs et plus",
      "Comptes en fidéicommis illimités",
      "Rapport pré-inspection automatisé",
      "Intégrations sur mesure",
      "Migration de données complète",
      "Onboarding concierge (3 sessions)",
      "Support téléphone + Slack dédié",
      "SLA garanti",
    ],
    popular: false,
    cta: "Réserver un appel",
    href: BOOK_CALL_HREF,
  },
];

/* ── card spring for stagger ── */
const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      delay: i * 0.15,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section
      style={{ background: "var(--safe-darkest)" }}
      className="relative py-20 sm:py-32 lg:py-40 overflow-hidden"
    >
      {/* Background ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(110,231,183,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* ── Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
            style={{
              background: "rgba(110,231,183,0.08)",
              border: "1px solid rgba(110,231,183,0.15)",
              borderRadius: "9999px",
              padding: "6px 18px",
            }}
          >
            <Sparkles style={{ width: 14, height: 14, color: "#6ee7b7" }} />
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#6ee7b7", letterSpacing: "0.04em" }}>
              Tarification
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
            }}
          >
            Moins cher qu&apos;une heure de votre temps.{" "}
            <span style={{ fontStyle: "italic", color: "#6ee7b7" }}>
              Rentable dès le jour 1.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.7,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Pas de frais cachés. Pas d&apos;engagement. Annulez en tout temps.
            Satisfait ou remboursé 30 jours.
          </motion.p>

          {/* ── Pill toggle ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10 inline-flex items-center"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "9999px",
              padding: "4px",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding: "10px 24px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                border: "none",
                cursor: "pointer",
                background: !annual ? "#6ee7b7" : "transparent",
                color: !annual ? "#050a0f" : "rgba(255,255,255,0.45)",
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                padding: "10px 24px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: annual ? "#6ee7b7" : "transparent",
                color: annual ? "#050a0f" : "rgba(255,255,255,0.45)",
              }}
            >
              Annuel
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: annual ? "rgba(5,10,15,0.2)" : "rgba(110,231,183,0.15)",
                  color: annual ? "#050a0f" : "#6ee7b7",
                }}
              >
                -20%
              </span>
            </button>
          </motion.div>
        </div>

        {/* ── Pricing cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {PLANS.map((plan, idx) => {
            const isPopular = plan.popular;

            return (
              <motion.div
                key={plan.name}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                whileHover={{
                  y: -6,
                  scale: 1.02,
                  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                }}
                style={{
                  position: "relative",
                  borderRadius: "24px",
                  padding: isPopular ? "3px" : "1px",
                  background: isPopular
                    ? "linear-gradient(160deg, rgba(110,231,183,0.4), rgba(110,231,183,0.08) 50%, rgba(110,231,183,0.25))"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                {/* Inner card */}
                <div
                  style={{
                    borderRadius: "22px",
                    padding: "36px 32px 32px",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    background: isPopular
                      ? "linear-gradient(180deg, rgba(110,231,183,0.06) 0%, rgba(5,10,15,0.98) 30%)"
                      : "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                  }}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-14px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "linear-gradient(135deg, #6ee7b7, #34d399)",
                        color: "#050a0f",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "6px 20px",
                        borderRadius: "9999px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 20px rgba(110,231,183,0.3)",
                      }}
                    >
                      Le plus populaire
                    </div>
                  )}

                  {/* Plan name */}
                  <h3
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: "-0.02em",
                      marginBottom: "8px",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.45)",
                      lineHeight: 1.6,
                      marginBottom: "28px",
                    }}
                  >
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div style={{ marginBottom: "8px", display: "flex", alignItems: "baseline", gap: "4px" }}>
                    {(plan as { surDevis?: boolean }).surDevis ? (
                      <span
                        style={{
                          fontSize: "clamp(2rem, 4vw, 2.8rem)",
                          fontWeight: 800,
                          color: "#ffffff",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        Sur devis
                      </span>
                    ) : (
                      <>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={annual ? "annual" : "monthly"}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.25 }}
                            style={{
                              fontSize: "clamp(2.8rem, 5vw, 3.5rem)",
                              fontWeight: 800,
                              color: "#ffffff",
                              letterSpacing: "-0.03em",
                              lineHeight: 1,
                            }}
                          >
                            {annual ? plan.annualPrice : plan.monthlyPrice}$
                          </motion.span>
                        </AnimatePresence>
                        <span
                          style={{
                            fontSize: "15px",
                            color: "rgba(255,255,255,0.35)",
                            marginBottom: "4px",
                          }}
                        >
                          /mois
                        </span>
                      </>
                    )}
                  </div>

                  {/* Savings line */}
                  {annual && plan.annualSaving ? (
                    <p style={{ fontSize: "13px", color: "#6ee7b7", fontWeight: 500, marginBottom: "28px" }}>
                      Économisez {plan.annualSaving}$/an
                    </p>
                  ) : (
                    <div style={{ marginBottom: "28px" }} />
                  )}

                  {/* Divider */}
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.06)",
                      marginBottom: "24px",
                    }}
                  />

                  {/* Features */}
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                    {plan.features.map((feat, fi) => (
                      <li
                        key={feat}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          marginBottom: fi === plan.features.length - 1 ? 0 : "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: isPopular ? "rgba(110,231,183,0.15)" : "rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "1px",
                          }}
                        >
                          <Check
                            style={{
                              width: "12px",
                              height: "12px",
                              color: isPopular ? "#6ee7b7" : "rgba(255,255,255,0.5)",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "rgba(255,255,255,0.7)",
                            lineHeight: 1.5,
                          }}
                        >
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  {plan.href.startsWith("http") ? (
                    <a
                      href={plan.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="safe-site-cta-primary group mt-8 w-full px-6 py-4 text-[15px]"
                    >
                      {plan.cta}
                      <ArrowRight
                        style={{ width: "16px", height: "16px" }}
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      />
                    </a>
                  ) : (
                    <Link
                      href={plan.href}
                      className="safe-site-cta-primary group mt-8 w-full px-6 py-4 text-[15px]"
                    >
                      {plan.cta}
                      <ArrowRight
                        style={{ width: "16px", height: "16px" }}
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Guarantee badges ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-center"
        >
          {[
            { icon: Shield, text: "30 jours satisfait ou remboursé" },
            { text: "Aucun engagement, annulez en 2 clics" },
            { text: "Vos données exportables en tout temps" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.icon && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(110,231,183,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <item.icon style={{ width: "14px", height: "14px", color: "#6ee7b7" }} />
                </div>
              )}
              {!item.icon && i > 0 && (
                <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.08)", marginRight: "8px" }}>
                  |
                </span>
              )}
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                {item.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
