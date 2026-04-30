"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";

const AuditForm = dynamic(
  () => import("@/components/audit-gratuit/AuditForm").then((m) => m.AuditForm),
  {
    loading: () => (
      <div className="min-h-screen audit-v2-bg flex items-center justify-center">
        <div className="animate-pulse text-neutral-400 text-sm tracking-wide">Chargement…</div>
      </div>
    ),
  }
);

type Phase = "intro" | "language" | "form";
type Lang = "fr" | "en";

export default function AuditGratuitPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [lang, setLang] = useState<Lang>("fr");
  const [menuOpen, setMenuOpen] = useState(false);

  if (phase === "form") {
    return <AuditForm lang={lang} />;
  }

  const menuLinks = [
    { href: "/", label: "Accueil" },
    { href: "/#produit", label: "Fonctionnalités" },
    { href: "/tarification", label: "Prix après audit" },
    { href: "/contact", label: "Contact" },
    { href: "/login", label: "Connexion" },
  ];

  return (
    <div className="min-h-screen audit-v2-bg flex flex-col px-4 py-6 relative">
      {/* Top bar: logo + menu button */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between mb-4">
        <Link href="/">
          <LogoMark size={28} />
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Ouvrir le menu"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 border border-[#E5E0D5] text-[13px] font-medium text-[#111] hover:bg-white transition-colors shadow-sm"
          >
            <span className="flex flex-col gap-[3px]">
              <span className={`block w-4 h-[1.5px] bg-[#111] transition-transform ${menuOpen ? "translate-y-[4.5px] rotate-45" : ""}`} />
              <span className={`block w-4 h-[1.5px] bg-[#111] transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-4 h-[1.5px] bg-[#111] transition-transform ${menuOpen ? "-translate-y-[4.5px] -rotate-45" : ""}`} />
            </span>
            Menu
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl bg-white border border-[#E5E0D5] shadow-xl shadow-black/5 p-2 z-50"
              >
                {menuLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block px-4 py-2.5 rounded-lg text-[13px] text-neutral-700 hover:bg-[#F4EFE3] hover:text-[#111] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="h-px bg-[#E5E0D5] my-2 mx-3" />
                <Link
                  href="/contact"
                  className="block px-4 py-2.5 rounded-lg text-[13px] font-medium text-white bg-[var(--safe-green-800)] hover:bg-[var(--safe-green-900)] transition-colors text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Réserver un appel
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-[#E5E0D5] mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--safe-green-800)] animate-pulse" />
              <span className="text-[11px] font-medium text-neutral-600 tracking-wide">
                Audit gratuit · Rapport sous 24 h
              </span>
            </div>

            <h1
              className="text-[40px] sm:text-[48px] font-normal text-[#111] mb-5 leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
            >
              Diagnostic de performance{" "}
              <span className="italic text-[var(--safe-green-800)]">de votre cabinet</span>
            </h1>

            <p className="text-neutral-600 text-[15px] mb-10 leading-relaxed max-w-md mx-auto">
              15 à 20 minutes pour comprendre votre cabinet, identifier vos leviers
              d&apos;efficacité et recevoir d&apos;abord un diagnostic clair.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { num: "01", label: "Plus de revenus", sub: "Fuites de facturation colmatées" },
                { num: "02", label: "Plus de temps",   sub: "8 h / sem en moyenne libérées" },
                { num: "03", label: "Plus tranquille", sub: "Conformité Barreau assurée" },
              ].map((it) => (
                <div key={it.label} className="audit-v2-card text-left">
                  <div
                    className="text-[13px] mb-3 text-[var(--safe-green-800)]"
                    style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif", letterSpacing: "0.08em" }}
                  >
                    — {it.num}
                  </div>
                  <p className="text-[13px] font-semibold text-[#111]">{it.label}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{it.sub}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase("language")}
              className="audit-v2-btn-primary mx-auto text-[15px] px-9 py-4"
            >
              Commencer l&apos;audit →
            </button>

            <p className="mt-5 text-[11px] text-neutral-400 tracking-wide">
              Confidentiel · Aucune carte de crédit · Tarif proposé après l&apos;audit
            </p>
          </motion.div>
        )}

        {phase === "language" && (
          <motion.div
            key="language"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md text-center"
          >
            <button
              onClick={() => setPhase("intro")}
              className="audit-v2-btn-ghost mb-8"
            >
              ← Retour
            </button>
            <h2
              className="text-[28px] font-normal text-[#111] mb-2"
              style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
            >
              Choisissez votre langue
            </h2>
            <p className="text-neutral-500 text-sm mb-8">Choose your language</p>

            <div className="grid grid-cols-2 gap-3">
              {(["fr", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setPhase("form"); }}
                  className="audit-v2-card-lg group hover:border-[var(--safe-green-800)] transition-colors"
                  style={{ padding: "22px 18px" }}
                >
                  <div
                    className="text-[36px] text-[#111] leading-none"
                    style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
                  >
                    {l.toUpperCase()}
                  </div>
                  <div className="mt-2 text-[12px] text-neutral-500">
                    {l === "fr" ? "Français · Québec" : "English · Canada"}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
