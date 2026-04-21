"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

const CALENDLY_URL = "https://calendly.com/ptiahou/30min";

/* ── Decorative sparkle dots ── */
function SparkleField() {
  const particles = [
    { top: "12%", left: "8%", size: 3, delay: 0 },
    { top: "18%", right: "12%", size: 2, delay: 0.8 },
    { top: "72%", left: "15%", size: 2.5, delay: 1.6 },
    { top: "65%", right: "10%", size: 3, delay: 0.4 },
    { top: "30%", left: "5%", size: 2, delay: 1.2 },
    { top: "85%", right: "18%", size: 2, delay: 2.0 },
    { top: "45%", left: "3%", size: 1.5, delay: 0.6 },
    { top: "50%", right: "5%", size: 2.5, delay: 1.4 },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: p.top,
            left: p.left,
            right: (p as { right?: string }).right,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: "#6ee7b7",
            boxShadow: `0 0 ${p.size * 4}px rgba(110,231,183,0.6)`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

export function FinalCTA() {
  return (
    <section
      style={{ background: "var(--safe-darkest)", overflow: "hidden" }}
      className="relative py-24 sm:py-36 lg:py-44"
    >
      {/* ── Multi-layer glow ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1000px",
          height: "600px",
          background: "radial-gradient(ellipse, rgba(110,231,183,0.12) 0%, transparent 65%)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(110,231,183,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Sparkle particles */}
      <SparkleField />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
        {/* ── Urgency badge ── */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 mb-10"
          style={{
            padding: "8px 24px",
            borderRadius: "9999px",
            background: "rgba(110,231,183,0.06)",
            border: "1px solid rgba(110,231,183,0.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#6ee7b7",
              boxShadow: "0 0 12px rgba(110,231,183,0.6)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#6ee7b7" }}>
            50 places fondatrices, tarif verrouillé à vie pour les premiers inscrits
          </span>
        </motion.div>

        {/* ── Headline ── */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            marginBottom: "1.5rem",
            maxWidth: "900px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Combien d&apos;heures allez-vous encore{" "}
          <span
            style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, #6ee7b7, #34d399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            perdre ce mois-ci ?
          </span>
        </motion.h2>

        {/* ── Subhead ── */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.7 }}
          style={{
            fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.7,
            maxWidth: "680px",
            margin: "0 auto 12px",
          }}
        >
          Pendant que vous réconciliez votre fidéicommis à la main, d&apos;autres
          cabinets l&apos;ont déjà automatisé. La prochaine inspection arrive. Serez-vous prêt ?
        </motion.p>

        {/* ── Triple guarantee ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 mt-8 mb-12 sm:mb-14"
        >
          {[
            { Icon: Shield, text: "30 jours remboursé" },
            { Icon: Clock, text: "Migration assistée" },
            { Icon: Lock, text: "Hébergé au Canada" },
          ].map(({ Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3"
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(110,231,183,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon style={{ width: "13px", height: "13px", color: "#6ee7b7" }} />
              </div>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                {text}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── CTA buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Link
            href="/audit-gratuit"
            className="group"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "18px 40px",
              borderRadius: "9999px",
              fontSize: "17px",
              fontWeight: 700,
              textDecoration: "none",
              background: "linear-gradient(135deg, #6ee7b7, #34d399)",
              color: "#050a0f",
              boxShadow: "0 8px 40px rgba(110,231,183,0.3), 0 0 80px rgba(110,231,183,0.1)",
              transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 12px 50px rgba(110,231,183,0.4), 0 0 100px rgba(110,231,183,0.15)";
              e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 8px 40px rgba(110,231,183,0.3), 0 0 80px rgba(110,231,183,0.1)";
              e.currentTarget.style.transform = "translateY(0) scale(1)";
            }}
          >
            <Sparkles style={{ width: "18px", height: "18px" }} />
            Faire mon audit gratuit
            <ArrowRight
              style={{ width: "18px", height: "18px" }}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>

          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "18px 36px",
              borderRadius: "9999px",
              fontSize: "16px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#6ee7b7",
              border: "1px solid rgba(110,231,183,0.2)",
              background: "transparent",
              transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(110,231,183,0.06)";
              e.currentTarget.style.borderColor = "rgba(110,231,183,0.4)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(110,231,183,0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Réserver un appel
          </a>
        </motion.div>

        {/* ── Final nudge ── */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Le tarif fondateur est réservé aux 50 premières inscriptions. Tarif garanti à vie.
        </motion.p>
      </div>
    </section>
  );
}
