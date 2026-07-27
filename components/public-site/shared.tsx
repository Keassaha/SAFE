"use client";

/**
 * Système partagé du site public SAFE Inc.
 * Référence copy : PROPOSITIONS_COPY_SITE_CABINET_REVISEES.md
 * Référence design : SPEC_LANDING_RECONCILIEE_2026-07-23.md
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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

/**
 * Entrée douce à l'arrivée dans l'écran.
 * La marge négative est modeste : sur un écran de téléphone, une marge trop
 * grande retarde le déclenchement et le texte paraît manquant.
 */
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
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
    <>
    {/* Le voile vit hors de l'entête : le `backdrop-filter` de la barre crée un
       bloc conteneur qui empêcherait un enfant `fixed` de couvrir la page. */}
    <AnimatePresence>
      {mobileOpen && (
        <motion.button
          type="button"
          aria-label="Fermer la navigation"
          onClick={() => setMobileOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(11,31,25,0.4)" }}
        />
      )}
    </AnimatePresence>
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

      {/* Panneau mobile : voile qui isole du contenu, entrée glissée, rangées
         généreuses au pouce. Les libellés arrivent en cascade. */}
      <AnimatePresence>
        {mobileOpen && (
            <motion.div
              key="menu-mobile"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="relative z-50 border-t px-6 pb-7 pt-2 lg:hidden"
              style={{
                borderColor: LINE,
                background: BG,
                boxShadow: "0 24px 48px -28px rgba(11,31,25,0.45)",
              }}
            >
              <div className="mx-auto max-w-6xl">
                {links.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-14 items-center justify-between border-b font-sans text-[17px]"
                      style={{ color: INK, borderColor: LINE }}
                    >
                      {link.label}
                      <span aria-hidden style={{ color: FAINT }}>›</span>
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + links.length * 0.05, duration: 0.3, ease: EASE }}
                  className="mt-5 grid grid-cols-2 gap-3"
                >
                  <Link
                    href="/connexion"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-12 items-center justify-center rounded-[8px] border font-sans text-[15px]"
                    style={{ color: INK, borderColor: LINE, background: SURFACE }}
                  >
                    Connexion
                  </Link>
                  <Link
                    href={R.diagnostic}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-12 items-center justify-center rounded-[8px] font-sans text-[15px] font-medium"
                    style={{ background: GREEN, color: "#fff" }}
                  >
                    Diagnostic
                  </Link>
                </motion.div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
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
            <ul className="mt-2 space-y-0 sm:mt-4 sm:space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-[40px] items-center font-sans text-[13.5px] transition-colors hover:text-white sm:min-h-0"
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

/* ── Petits utilitaires de scène (mêmes courbes que l'accueil) ── */
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const scenePhase = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Progression amortie d'une zone épinglée (même mécanique que l'accueil).
 * `onFrame` reçoit la progression 0→1 et manipule le DOM directement,
 * sans re-render React. Ne tourne que quand la zone est proche du viewport.
 */
export function useScrollScrub(
  zoneRef: React.RefObject<HTMLElement | null>,
  onFrame: (progress: number, time: number) => void
) {
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;

  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let shown = reduced ? 1 : 0;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -300 || r.top > vh + 300) return;
      const total = r.height - vh;
      const target = reduced || total <= 0 ? 1 : clamp01(-r.top / total);
      shown += (target - shown) * (reduced ? 1 : 0.11);
      if (Math.abs(target - shown) < 0.0005) shown = target;
      cbRef.current(shown, time);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [zoneRef]);
}

/* Galet du mark SAFE, même géométrie que components/branding/SafeLogo.tsx. */
const MARK_PATH =
  "M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z";
/* Centre visuel du galet dans le repère 24×24 et sa largeur nominale. */
const MARK_CX = 9;
const MARK_CY = 7.6;
const MARK_W = 10.4;
const MARK_TINTS = ["rgba(31,58,46,0.30)", "rgba(18,161,80,0.22)", "rgba(90,102,95,0.20)"];

/**
 * Triangles du logo flottants, brassés par le curseur, même langage que le hero
 * de l'accueil. Léger : ~11 pièces, dessin seulement quand le canvas est visible,
 * coupé en prefers-reduced-motion.
 */
export function PaperDrift({ count = 11 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Sur téléphone ces galets passaient derrière le titre et le rendaient
       pénible à lire : moins nombreux, plus petits, cantonnés à la marge. */
    const petitEcran = window.matchMedia("(max-width: 860px)").matches;
    const nombre = petitEcran ? Math.max(4, Math.round(count * 0.45)) : count;

    let seed = 20260726;
    const rnd = () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const papers = Array.from({ length: nombre }, (_, i) => ({
      /* les galets encadrent le titre : la bande de droite, un peu la marge de
         gauche, jamais la colonne de texte */
      fx: petitEcran
        ? 0.78 + rnd() * 0.26
        : i % 4 === 0
          ? 0.01 + rnd() * 0.13
          : 0.71 + rnd() * 0.31,
      /* réparti sur la hauteur plutôt qu'au hasard : évite les paquets */
      fy: 0.04 + ((i + rnd() * 0.85) / nombre) * 0.9,
      size: (petitEcran ? 20 : 38) + rnd() * (petitEcran ? 26 : 58),
      rot: (rnd() - 0.5) * 1.1,
      /* un galet sur deux pointe vers le haut : les deux moitiés du mark */
      flip: rnd() > 0.45,
      tint: Math.floor(rnd() * 3),
      drift: rnd() * Math.PI * 2,
      ox: 0, oy: 0, vx: 0, vy: 0,
    }));
    const markPath = new Path2D(MARK_PATH);

    const pointer = { x: -9999, y: -9999, speed: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const nx = e.clientX - r.left, ny = e.clientY - r.top;
      pointer.speed = Math.min(40, Math.hypot(nx - pointer.x, ny - pointer.y));
      pointer.x = nx; pointer.y = ny;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; });
    io.observe(canvas);

    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = canvas.getBoundingClientRect();
      const W = r.width, H = r.height;
      const bw = Math.round(W * dpr), bh = Math.round(H * dpr);
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      /* les triangles du logo SAFE, plutôt que des bouts de papier */
      papers.forEach((p) => {
        const dx0 = Math.sin(time * 0.00032 + p.drift) * 10;
        const dy0 = Math.cos(time * 0.00026 + p.drift * 1.7) * 8;
        let x = p.fx * W + dx0, y = p.fy * H + dy0;

        const dx = x - pointer.x, dy = y - pointer.y;
        const d = Math.hypot(dx, dy);
        const R = 150;
        if (d < R && d > 0.001) {
          const force = (1 - d / R) * (0.8 + pointer.speed * 0.1);
          p.vx += (dx / d) * force * 2.6;
          p.vy += (dy / d) * force * 2.6;
        }
        p.vx *= 0.88; p.vy *= 0.88;
        p.ox = (p.ox + p.vx) * 0.96;
        p.oy = (p.oy + p.vy) * 0.96;
        x += p.ox; y += p.oy;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot + p.ox * 0.002 + (p.flip ? Math.PI : 0));
        const breath = 1 + Math.sin(time * 0.0004 + p.drift) * 0.05;
        const s = (p.size / MARK_W) * breath;
        ctx.scale(s, s);
        ctx.translate(-MARK_CX, -MARK_CY);
        ctx.globalAlpha = p.flip ? 0.6 : 1;
        ctx.fillStyle = MARK_TINTS[p.tint];
        ctx.fill(markPath);
        ctx.restore();
      });
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

/**
 * Rail d'étapes à droite, comme sur l'accueil : un tiret par section, celui de
 * la section en cours s'allonge et se nomme. Repères de lecture pendant le
 * défilement, jamais cliquable.
 */
export type RailStop = { id: string; label: string };

export function SceneRail({ stops }: { stops: readonly RailStop[] }) {
  const [live, setLive] = useState<string | null>(null);

  useEffect(() => {
    /* lecture seule de quelques rects : pas de rAF, l'état ne change qu'aux
       changements de section */
    const read = () => {
      const mid = window.innerHeight * 0.5;
      let found: string | null = null;
      for (const s of stops) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { found = s.id; break; }
      }
      setLive((prev) => (prev === found ? prev : found));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [stops]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-[18px] lg:flex"
      style={{ opacity: live ? 1 : 0, transition: "opacity 800ms ease" }}
    >
      {stops.map((s) => {
        const on = s.id === live;
        return (
          <div key={s.id} className="flex items-center justify-end gap-2.5">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.12em] whitespace-nowrap"
              style={{ color: MUTED, opacity: on ? 1 : 0, transition: "opacity 650ms ease" }}
            >
              {s.label}
            </span>
            <span
              style={{
                display: "block",
                height: 1.5,
                borderRadius: 2,
                width: on ? 26 : 12,
                background: on ? GREEN : FAINT,
                opacity: on ? 1 : 0.4,
                transition:
                  "width 650ms cubic-bezier(0.16,1,0.3,1), background 650ms ease, opacity 650ms ease",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Indicateur de défilement au bas d'une scène épinglée. Piloté par la scène. */
export function ScrollHint({ label = "Faites défiler" }: { label?: string }) {
  return (
    <p
      data-scroll-hint
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-[5vh] text-center font-mono text-[11px] uppercase tracking-[0.18em] sm:text-[10px]"
      style={{ color: FAINT, transition: "opacity 700ms ease" }}
    >
      {label}
    </p>
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
    <section className="relative overflow-hidden px-6 pb-14 pt-28 sm:pb-16 sm:pt-36" style={{ background: BG }}>
      <PaperDrift />
      <div className="relative mx-auto max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <motion.h1
          {...fadeUp(0.06)}
          className="mt-4 max-w-[18ch] font-serif text-[33px] leading-[1.1] sm:max-w-[22ch] sm:text-[52px]"
          style={{ color: INK, letterSpacing: "-0.018em" }}
        >
          {titre}
        </motion.h1>
        {intro && (
          <motion.p
            {...fadeUp(0.12)}
            className="mt-5 max-w-[54ch] font-sans text-[16.5px] leading-[1.6] sm:mt-6 sm:text-[19px]"
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
