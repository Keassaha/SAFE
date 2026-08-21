"use client";

/**
 * Système partagé du site public SAFE Inc.
 * Référence copy : PROPOSITIONS_COPY_SITE_CABINET_REVISEES.md
 * Référence design : SPEC_LANDING_RECONCILIEE_2026-07-23.md
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { SafeLogo } from "@/components/branding/SafeLogo";
import { MARK_GEOMETRY, SAFE_MARK_DEFAULT } from "@/components/brand/safe-mark";

export const BG = "var(--si-canvas)";
export const SURFACE = "var(--si-surface)";
export const INK = "var(--si-ink)";
export const MUTED = "var(--si-muted)";
/* L'encre de la prose de la vitrine.
 *
 * Le corps de texte portait `muted`, cinq pour un sur le canvas. C'est la
 * valeur d'une mention à côté d'un contenu ; ici le corps EST le contenu, il
 * porte l'argumentaire de chaque page, et à cinq pour un il se lit comme une
 * note de bas de page (décision CEO du 18 août 2026, appliquée d'abord à
 * « à propos », étendue au reste le 19).
 *
 * `body` donne 9,6 pour un : franchement noir, sans prendre le rang de l'encre
 * des titres. `muted` reste pour ce qui est vraiment secondaire, les méta et
 * les légendes. */
export const PROSE = "var(--si-body)";
export const FAINT = "var(--si-subtle)";
/* L'accent de la vitrine suit désormais l'action de l'application.
 * Il valait #12A150, un vert vif étranger à la palette, déclaré deux fois.
 * Source unique : `si-forest` dans lib/ds/palettes.ts. */
export const GREEN = "var(--si-forest)";
export const VERIFIED = "var(--si-verified)";
export const AMBER = "var(--si-amber-ink)";
export const LINE = "var(--si-line)";
export const LINE_SOFT = "var(--si-line2)";

/* Barre de navigation flottante, en verre.
 *
 * Le verre est ici justifié au sens de P10 : la barre passe AU-DESSUS du
 * contenu pendant tout le défilement, et le contenu doit rester perceptible
 * derrière elle. C'est une relation spatiale, pas un habillage.
 *
 * Elle est claire, et c'est le but : le logo garde sa teinte de charte, le
 * duo forêt et émeraude, qui disparaîtrait sur un fond noir.
 *
 * Opacité 0,82 : assez pour que l'encre tienne au-dessus des scènes les plus
 * sombres de l'accueil, assez peu pour qu'on devine le contenu défiler. */
export const BARRE = "rgb(var(--si-surface-rgb) / 0.82)";
export const BARRE_OPAQUE = "var(--si-surface)";
export const BARRE_FLOU = "blur(18px) saturate(1.35)";
export const BARRE_FILET = "rgb(var(--si-line-ink-rgb) / 0.10)";
export const BARRE_TEXTE = "var(--si-muted)";
export const BARRE_TEXTE_FORT = "var(--si-ink)";
export const BARRE_SURVOL = "rgb(var(--si-line-ink-rgb) / 0.05)";
export const BARRE_OMBRE = "0 16px 36px -26px rgb(var(--si-line-ink-rgb) / 0.45)";

/**
 * Courbe unique des apparitions du site.
 *
 * C'était [0.16, 1, 0.3, 1], une sortie exponentielle : la vitesse de départ
 * y vaut plusieurs fois la vitesse moyenne, donc chaque bloc partait d'un
 * coup avant de traîner sur sa fin. Sur une page qu'on parcourt au défilement,
 * cela donne une suite de déclics.
 *
 * Celle-ci accélère puis ralentit sans à-coup. Le même geste s'y lit comme un
 * glissement (décision CEO du 13 août 2026). Elle est le pendant de `--doux`
 * dans la vitrine animée, qui vaut cubic-bezier(0.33, 0.06, 0.2, 1).
 */
export const EASE = [0.33, 0.06, 0.2, 1] as const;

export const R = {
  accueil: "/",
  fonctionnalites: "/fonctionnalites",
  tarification: "/tarification",
  aPropos: "/a-propos",
  demo: "/demo",
  diagnostic: "/audit-gratuit",
  faq: "/faq",
  auditReel: "/audit-gratuit",
  // La suite d'outils gratuits. Un chemin propre parce qu'elle va s'allonger :
  // le patrimoine familial d'abord, la pension alimentaire ensuite.
  outils: "/calculateurs",
  calcPatrimoineFamilial: "/calculateurs/patrimoine-familial",
};

/**
 * Entrée douce à l'arrivée dans l'écran.
 * La marge négative est modeste : sur un écran de téléphone, une marge trop
 * grande retarde le déclenchement et le texte paraît manquant.
 *
 * `data-revele` marque l'élément comme « révélé au défilement ». Au téléphone,
 * une seule règle de globals.css le repose à sa place définitive : un bloc de
 * texte qui apparaît quand on arrive dessus est une idée d'écran large, où le
 * regard a le temps de voir le mouvement. Au pouce, on défile vite et par
 * à-coups, et la page donne l'impression de se charger pendant qu'on la lit.
 *
 * L'attribut est indispensable : framer-motion écrit l'opacité en style en
 * ligne, qu'aucune feuille ne peut reprendre sans cible explicite. Toute
 * révélation écrite à la main ailleurs doit donc le porter aussi.
 */
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  /* Plus long et plus court à la fois : la course dure 780 ms au lieu de 450,
     mais le bloc ne parcourt plus que dix pixels au lieu de quatorze. Un
     mouvement lent sur une courte distance se remarque moins qu'un mouvement
     rapide sur une longue, à durée de lecture égale. */
  transition: { duration: 0.78, delay, ease: EASE },
  "data-revele": "",
});

/* ── L'en-tête du site ────────────────────────────────────────────────────
   Une seule barre pour toute la vitrine (décision CEO du 18 août 2026).

   Le site en portait trois : une pastille flottante à coins arrondis sur
   l'accueil, une pastille de verre sur les pages partagées, et cette
   barre-ci sur le diagnostic gratuit. Trois grammaires pour la même
   fonction, dont la seule qui montre une action est celle du diagnostic.
   C'est donc elle qui est retenue et propagée.

   Ce qui la distingue : elle touche les bords plutôt que de flotter, elle se
   pose sur un filet plutôt que sur une ombre, son bouton de menu est encadré
   donc il se voit, et son action reste visible au téléphone au lieu d'être
   rangée dans le menu. Une page qui a sa propre prochaine étape passe son
   ancre par `cta` ; par défaut l'action mène au diagnostic.

   Le fond emploie `safe-barre-verre` plutôt qu'un rgba écrit en dur : cette
   classe porte déjà les deux replis obligatoires, navigateur sans
   `backdrop-filter` et transparence réduite au niveau du système, et son
   opacité est réglée pour rester claire au-dessus du pied de page vert. */
export function Nav({ cta }: { cta?: { href: string; label: string } } = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const action = cta ?? { href: R.diagnostic, label: "Faire le diagnostic" };
  const links = [
    { label: "Fonctionnalités", href: R.fonctionnalites },
    { label: "Outils", href: R.outils },
    { label: "Tarification", href: R.tarification },
    { label: "À propos", href: R.aPropos },
    { label: "Contact", href: R.demo },
  ];

  return (
    <>
      {/* Le voile vit hors de l'entête : le `backdrop-filter` de la barre crée
         un bloc conteneur qui empêcherait un enfant `fixed` de couvrir la
         page. Il ferme le menu au toucher n'importe où ailleurs, ce que la
         barre du diagnostic ne savait pas encore faire. */}
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
            style={{ background: "rgb(var(--si-ink-rgb) / 0.45)" }}
          />
        )}
      </AnimatePresence>

      <header
        className="safe-barre-verre fixed inset-x-0 top-0 z-50 flex h-[60px] items-center justify-between px-6 sm:px-11"
        /* Le flou est en ligne, pas seulement dans la feuille : le minifieur
           CSS retire la propriété non préfixée et ne laisse que `-webkit-`,
           sans effet sur les navigateurs actuels. Le style en ligne ne passe
           pas par lui. */
        style={{
          borderBottom: `1px solid ${LINE}`,
          backdropFilter: BARRE_FLOU,
          WebkitBackdropFilter: BARRE_FLOU,
        }}
      >
        <Link href={R.accueil} className="inline-flex items-center">
          <SafeLogo size={20} />
        </Link>

        <div className="hidden items-center gap-[26px] lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-[13px] transition-colors duration-300"
              style={{ color: BARRE_TEXTE }}
              onMouseEnter={(e) => { e.currentTarget.style.color = BARRE_TEXTE_FORT; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = BARRE_TEXTE; }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/connexion"
            className="hidden font-sans text-[13px] transition-colors duration-300 lg:inline"
            style={{ color: BARRE_TEXTE }}
            onMouseEnter={(e) => { e.currentTarget.style.color = BARRE_TEXTE_FORT; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = BARRE_TEXTE; }}
          >
            Connexion
          </Link>
          <Link
            href={action.href}
            className="inline-flex h-[34px] items-center rounded-[7px] px-4 font-sans text-[13px] font-medium transition-colors duration-300"
            style={{ background: GREEN, color: "var(--si-surface)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--si-forest-soft)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = GREEN; }}
          >
            {action.label}
          </Link>

          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] border"
              style={{ borderColor: LINE, background: SURFACE }}
            >
              <span className="flex flex-col gap-[3px]">
                <span className={`block h-[1.5px] w-4 transition-transform duration-300 ${mobileOpen ? "translate-y-[4.5px] rotate-45" : ""}`} style={{ background: INK }} />
                <span className={`block h-[1.5px] w-4 transition-opacity duration-300 ${mobileOpen ? "opacity-0" : ""}`} style={{ background: INK }} />
                <span className={`block h-[1.5px] w-4 transition-transform duration-300 ${mobileOpen ? "-translate-y-[4.5px] -rotate-45" : ""}`} style={{ background: INK }} />
              </span>
            </button>

            <AnimatePresence>
              {mobileOpen && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="absolute right-0 top-[calc(100%+10px)] w-60 rounded-[12px] border p-2"
                  style={{ background: SURFACE, borderColor: LINE, boxShadow: BARRE_OMBRE }}
                >
                  {[...links, { href: "/connexion", label: "Connexion" }].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center rounded-[8px] px-4 py-2.5 font-sans text-[13px] transition-colors duration-300"
                      style={{ color: BARRE_TEXTE }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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
            <SafeLogo size={19} variant="dark" />
          </Link>
          <p className="mt-3 font-sans text-[13px] leading-[1.55] sm:max-w-[32ch]" style={{ color: "#AAB7AF" }}>
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
          <span>© {new Date().getFullYear()} SAFE Inc. Tous droits réservés.</span>
          <span>Gatineau, Québec</span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    /* `safe-vitrine` marque les pages publiques. Elle ne peint rien par
       elle-même : elle sert d'ancrage aux règles qui ne valent QUE pour la
       vitrine, à commencer par le repli du mono sur le sans au téléphone
       (globals.css). L'intérieur de l'application ne la porte pas, et ses
       chiffres gardent leur mono tabulaire comme l'exige la loi L1. */
    <div
      className="safe-vitrine min-h-screen font-sans antialiased"
      style={{ background: BG, color: INK }}
    >
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
    /* Les scènes pilotées au défilement jouent aussi au téléphone.

       Elles y étaient posées d'emblée à leur fin, avec un argument de coût :
       une scène scrubbée demande une longue course, et au pouce cette course
       vaut des écrans entiers. L'argument valait tant que la vitrine n'avait
       rien de tel ; l'accueil en a maintenant une, réglée pour le pouce et
       validée, et la garder seule laissait le reste du site figé (décision CEO
       du 19 août 2026).

       Le coût est traité là où il se pose, dans la hauteur de la scène : la
       page en règle la course par sa propre feuille au téléphone, sans que ce
       crochet ait à en connaître le détail. Seul « mouvement réduit » pose
       encore la scène à sa fin, et c'est le bon endroit pour le faire. */
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

/* Fragment de la marque servie. Forme importée, jamais recopiée. */
const FRAGMENT = MARK_GEOMETRY[SAFE_MARK_DEFAULT];
const MARK_TINTS = ["rgba(31,58,46,0.30)", "rgb(var(--si-forest-rgb) / 0.22)", "rgba(90,102,95,0.20)"];

/**
 * Fragments du logo flottants, brassés par le curseur, même langage que le hero
 * de l'accueil. Léger : ~11 pièces, dessin seulement quand le canvas est visible,
 * coupé en prefers-reduced-motion et au téléphone.
 */
export function PaperDrift({ count = 11 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Rien au téléphone.

       Ces galets sont brassés par le CURSEUR : c'est tout leur propos, et il
       n'y a pas de curseur au doigt. Une première tentative les avait réduits
       et repoussés dans la bande de droite plutôt que supprimés ; il en restait
       une animation permanente, des formes tronquées au bord de l'écran, et un
       décor qui passait derrière le titre sans jamais répondre à rien.

       Sur 375 px, la largeur est le budget le plus rare de la page. Elle va au
       texte. */
    if (window.matchMedia("(max-width: 860px)").matches) return;
    const nombre = count;

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
      fx: i % 4 === 0 ? 0.01 + rnd() * 0.13 : 0.71 + rnd() * 0.31,
      /* réparti sur la hauteur plutôt qu'au hasard : évite les paquets */
      fy: 0.04 + ((i + rnd() * 0.85) / nombre) * 0.9,
      /* Taille de référence, calée sur le galet. Une forme plus pleine pèse
         davantage à surface égale : `fragmentWeight` la ramène au même calme. */
      size: (38 + rnd() * 58) * FRAGMENT.fragmentWeight,
      rot: (rnd() - 0.5) * 1.1,
      /* un galet sur deux pointe vers le haut : les deux moitiés du mark */
      flip: rnd() > 0.45,
      tint: Math.floor(rnd() * 3),
      drift: rnd() * Math.PI * 2,
      ox: 0, oy: 0, vx: 0, vy: 0,
    }));
    const markPath = new Path2D(FRAGMENT.fragmentPath);

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
        const s = (p.size / FRAGMENT.fragmentW) * breath;
        ctx.scale(s, s);
        ctx.translate(-FRAGMENT.fragmentCx, -FRAGMENT.fragmentCy);
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
          className="mt-4 font-serif text-[33px] leading-[1.1] sm:max-w-[22ch] sm:text-[52px]"
          style={{ color: INK, letterSpacing: "-0.018em" }}
        >
          {titre}
        </motion.h1>
        {intro && (
          <motion.p
            {...fadeUp(0.12)}
            className="mt-5 max-w-[54ch] font-sans text-[16.5px] leading-[1.6] sm:mt-6 sm:text-[19px]"
            style={{ color: PROSE }}
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
