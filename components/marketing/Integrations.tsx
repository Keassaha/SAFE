"use client";

import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════
   INTEGRATIONS — 5 glass cubes with colored hover
   ═══════════════════════════════════════════════ */

const BRANDS = [
  {
    id: "google",
    name: "Google Workspace",
    color: "#4285F4",
    svg: (
      <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        />
      </svg>
    ),
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    color: "#00A4EF",
    svg: (
      <svg viewBox="0 0 23 23" className="w-9 h-9" aria-hidden>
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#7FBA00" d="M12 1h10v10H12z" />
        <path fill="#00A4EF" d="M1 12h10v10H1z" />
        <path fill="#FFB900" d="M12 12h10v10H12z" />
      </svg>
    ),
  },
  {
    id: "stripe",
    name: "Stripe",
    color: "#635BFF",
    svg: (
      <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden>
        <path
          fill="#635BFF"
          d="M13.479 9.883c-1.626-.604-2.512-1.064-2.512-1.773 0-.596.489-.94 1.364-.94 1.6 0 3.242.613 4.377 1.172l.648-4.015C16.45 3.905 14.676 3.5 12.58 3.5 10.824 3.5 9.356 3.95 8.296 4.79 7.189 5.666 6.604 6.905 6.604 8.401c0 2.724 1.663 3.885 4.367 4.867 1.737.631 2.32 1.076 2.32 1.764 0 .66-.562 1.043-1.564 1.043-1.271 0-3.377-.628-4.763-1.429L6.3 18.706C7.495 19.37 9.704 20 12.046 20c1.865 0 3.421-.437 4.522-1.264 1.221-.914 1.85-2.264 1.85-4.007 0-2.785-1.694-3.945-4.439-4.846z"
        />
      </svg>
    ),
  },
  {
    id: "clio",
    name: "Clio",
    color: "#9b59b6",
    svg: (
      <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#9b59b6" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="10"
          fontFamily="Inter, sans-serif"
          fontWeight="700"
        >
          Clio
        </text>
      </svg>
    ),
  },
  {
    id: "mail",
    name: "Courriel",
    color: "#D4A574",
    svg: (
      <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#D4A574" />
        <path
          d="M3 7l9 6 9-6"
          stroke="#0a1a12"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const;

export function Integrations() {
  return (
    <section className="relative py-24 sm:py-32 bg-[var(--safe-darkest)] overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none opacity-30" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--safe-sage)] mb-4 font-sans"
          >
            Int&eacute;grations
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--safe-white)] leading-[1.1] tracking-tight mb-5"
          >
            S&apos;int&egrave;gre avec{" "}
            <span className="italic text-[var(--safe-sage)]">vos outils</span>.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-base text-[var(--safe-text-muted)] font-sans max-w-xl mx-auto"
          >
            Courriel, paiements, agenda, gestion de dossiers. SAFE se connecte
            en quelques clics.
          </motion.p>
        </div>

        <motion.ul
          role="list"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-5 sm:gap-6"
        >
          {BRANDS.map((b, i) => (
            <motion.li
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
              className="group"
            >
              <div
                data-brand={b.id}
                className="integration-cube w-24 h-24 rounded-[20px] flex items-center justify-center backdrop-blur-xl"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(19,28,22,0.55), rgba(12,18,14,0.3))",
                  border: "1px solid rgba(142,182,155,0.12)",
                }}
                title={b.name}
              >
                {b.svg}
              </div>
              <p className="text-center mt-3 text-xs text-[var(--safe-text-muted)] font-sans">
                {b.name}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
