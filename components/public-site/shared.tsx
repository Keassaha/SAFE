"use client";

/**
 * Système partagé du site public SAFE Inc.
 * Référence copy : PROPOSITIONS_COPY_SITE_CABINET_REVISEES.md
 * Référence design : SPEC_LANDING_RECONCILIEE_2026-07-23.md
 */

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SafeLogo } from "@/components/branding/SafeLogo";

export const BG = "#EFF2ED";
export const SURFACE = "#FBFCFA";
export const INK = "#1F2A24";
export const MUTED = "#5A665F";
export const FAINT = "#7C877F";
export const GREEN = "#12A150";
export const VERIFIED = "#1F6A47";
export const AMBER = "#8A6A1E";
export const LINE = "rgba(31,42,36,0.08)";
export const LINE_SOFT = "rgba(31,42,36,0.05)";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const R = {
  accueil: "/",
  fonctionnalites: "/fonctionnalites",
  tarification: "/tarification",
  aPropos: "/a-propos",
  demo: "/demo",
  diagnostic: "/audit-gratuit",
  faq: "/faq",
  auditReel: "/audit-gratuit",
};

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.45, delay, ease: EASE },
});

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { label: "Fonctionnalités", href: R.fonctionnalites },
    { label: "Tarification", href: R.tarification },
    { label: "À propos", href: R.aPropos },
    { label: "Contact", href: R.demo },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: "rgba(239,242,237,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href={R.accueil} className="inline-flex items-center" style={{ color: INK }}>
          <SafeLogo noPulse size={18} />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[7px] px-3 py-2 font-sans text-[13.5px] transition-colors hover:bg-black/[0.035]"
              style={{ color: MUTED }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/connexion" className="px-2 py-2 font-sans text-[13.5px]" style={{ color: MUTED }}>
            Connexion
          </Link>
          <Link
            href={R.diagnostic}
            className="inline-flex h-9 items-center rounded-[7px] px-4 font-sans text-[13.5px] font-medium transition-colors hover:bg-[#0e8f47]"
            style={{ background: GREEN, color: "#fff" }}
          >
            Faire le diagnostic
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[7px] lg:hidden"
          style={{ color: INK }}
          aria-label={mobileOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t px-6 pb-6 pt-3 lg:hidden" style={{ borderColor: LINE, background: BG }}>
          <div className="mx-auto max-w-6xl">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-12 items-center border-b font-sans text-[15px]"
                style={{ color: INK, borderColor: LINE }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/connexion"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-[7px] border font-sans text-[14px]"
                style={{ color: INK, borderColor: LINE }}
              >
                Connexion
              </Link>
              <Link
                href={R.diagnostic}
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-[7px] font-sans text-[14px] font-medium"
                style={{ background: GREEN, color: "#fff" }}
              >
                Diagnostic
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const cols = [
    {
      titre: "Produit",
      links: [
        { label: "Fonctionnalités", href: R.fonctionnalites },
        { label: "Tarification", href: R.tarification },
        { label: "Diagnostic gratuit", href: R.diagnostic },
      ],
    },
    {
      titre: "Cabinet",
      links: [
        { label: "À propos", href: R.aPropos },
        { label: "Démo et contact", href: R.demo },
        { label: "Questions fréquentes", href: R.faq },
      ],
    },
    {
      titre: "Légal",
      links: [
        { label: "Confidentialité", href: "/confidentialite" },
        { label: "Conditions d’utilisation", href: "/conditions" },
        { label: "Connexion", href: "/connexion" },
      ],
    },
  ];

  return (
    <footer className="px-6 pb-10 pt-20" style={{ background: "#16231D" }}>
      <div className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href={R.accueil} className="inline-flex items-center" style={{ color: "#F3F7F4" }}>
            <SafeLogo noPulse variant="dark" size={18} />
          </Link>
          <p className="mt-3 max-w-[32ch] font-sans text-[13px] leading-[1.55]" style={{ color: "#AAB7AF" }}>
            Votre fidéicommis à jour, vos dossiers en ordre, votre prochaine inspection sans
            mauvaise surprise.
          </p>
        </div>

        {cols.map((col) => (
          <div key={col.titre}>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: "#7F9187" }}>
              {col.titre}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-[13.5px] transition-colors hover:text-white"
                    style={{ color: "#AAB7AF" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-6xl pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="max-w-3xl font-sans text-[11.5px] leading-[1.6]" style={{ color: "#7F9187" }}>
          SAFE est un outil de gestion. Il soutient le suivi des obligations professionnelles sans
          s’y substituer. La responsabilité professionnelle demeure celle du cabinet.
        </p>
        <div
          className="mt-5 flex flex-col gap-2 font-sans text-[11.5px] sm:flex-row sm:items-center sm:justify-between"
          style={{ color: "#7F9187" }}
        >
          <span>© {new Date().getFullYear()} SafeCabinet Inc. Tous droits réservés.</span>
          <span>Gatineau, Québec</span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: BG, color: INK }}>
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      {...fadeUp(0)}
      className="font-mono text-[12px] uppercase tracking-[0.14em]"
      style={{ color: FAINT }}
    >
      {children}
    </motion.p>
  );
}

export function PageHeader({
  eyebrow,
  titre,
  intro,
}: {
  eyebrow: string;
  titre: React.ReactNode;
  intro?: React.ReactNode;
}) {
  return (
    <section className="px-6 pb-16 pt-36" style={{ background: BG }}>
      <div className="mx-auto max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <motion.h1
          {...fadeUp(0.06)}
          className="mt-4 max-w-[22ch] font-serif text-[36px] leading-[1.08] sm:text-[52px]"
          style={{ color: INK, letterSpacing: "-0.018em" }}
        >
          {titre}
        </motion.h1>
        {intro && (
          <motion.p
            {...fadeUp(0.12)}
            className="mt-6 max-w-[54ch] font-sans text-[17px] leading-[1.55] sm:text-[19px]"
            style={{ color: MUTED }}
          >
            {intro}
          </motion.p>
        )}
      </div>
    </section>
  );
}

export function AConfirmer({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="ml-1 inline-block rounded-[5px] px-1.5 py-0.5 font-sans text-[11px] font-medium align-middle"
      style={{ background: "rgba(176,122,28,0.10)", color: AMBER }}
    >
      à confirmer{children ? `: ${children}` : ""}
    </span>
  );
}
