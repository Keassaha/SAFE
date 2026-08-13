"use client";

/**
 * Portfolio « Jack — 3D Creator ».
 *
 * Adapté du brief Vite + React 18 vers la stack réelle du dépôt : Next.js 15
 * App Router et React 19. Trois écarts assumés, chacun pour une raison :
 *
 * 1. AUCUNE IMAGE DISTANTE. Le brief pointait 33 fichiers hébergés chez trois
 *    tiers (un site Figma publié, les aperçus d'un site de gabarits, et le
 *    dossier personnel d'un autre utilisateur sur un proxy d'images). Les
 *    reprendre, c'est publier le travail d'autrui sans licence, sur leur bande
 *    passante, avec des URL qu'ils peuvent changer sous nos pieds. Les visuels
 *    sont donc générés localement en SVG. Remplacer un visuel par un vrai
 *    fichier se fait en une ligne, voir `Plate`.
 *
 * 2. FOND SOMBRE PORTÉ PAR LA PAGE, PAS PAR `body`. Le brief demandait
 *    #0C0C0C sur html et body ; appliqué ici, il repeindrait tout le site SAFE.
 *
 * 3. La police Kanit est chargée par next/font dans page.tsx, pas par un lien
 *    Google : elle est auto-hébergée au build.
 */

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/* ─────────────────────────── Palette ─────────────────────────── */

/* Cette page n'est pas aux couleurs de SAFE : c'est le portfolio d'un tiers,
   avec sa propre identité sombre. La règle PS-001 impose les jetons si-* pour
   tout ce qui appartient au produit, ce qui est la bonne règle et qu'il ne faut
   pas relâcher ailleurs. On isole donc l'exception ici, en un seul bloc, plutôt
   que de semer des hexadécimales dans tout le fichier. Le reste du composant ne
   référence que ces constantes. */
/* eslint-disable no-restricted-syntax -- palette hors design system SAFE, voir ci-dessus */
const INK = "#0C0C0C";
const MIST = "#D7E2EA";
const PAPER = "#FFFFFF";
const HAIRLINE = "rgba(12, 12, 12, 0.15)";
const CTA_GRADIENT =
  "linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)";
const CTA_SHADOW =
  "0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset";
const HEADING_GRADIENT = "linear-gradient(180deg, #646973 0%, #BBCCD7 100%)";
/* eslint-enable no-restricted-syntax */

const EASE = [0.25, 0.1, 0.25, 1] as const;

/* ─────────────────────────── FadeIn ─────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      transition={{ delay, duration, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── Magnet ─────────────────────────── */

/**
 * Attire l'élément vers le curseur tant que celui-ci est à moins de `padding`
 * du bord. Le déplacement est divisé par `strength` : plus le nombre est grand,
 * plus l'aimant est discret.
 */
function Magnet({
  children,
  padding = 150,
  strength = 3,
  activeTransition = "transform 0.3s ease-out",
  inactiveTransition = "transform 0.6s ease-in-out",
  className,
}: {
  children: ReactNode;
  padding?: number;
  strength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    /* Respecte le réglage système : sans mouvement, l'aimant ne suit pas. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dans =
        Math.abs(e.clientX - cx) < r.width / 2 + padding &&
        Math.abs(e.clientY - cy) < r.height / 2 + padding;

      if (dans) {
        setActive(true);
        setOffset({ x: (e.clientX - cx) / strength, y: (e.clientY - cy) / strength });
      } else {
        setActive(false);
        setOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [padding, strength]);

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: active ? activeTransition : inactiveTransition,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────── AnimatedText ─────────────────────────── */

/**
 * Révèle le texte caractère par caractère selon la progression du défilement.
 * Chaque lettre passe de 0,2 à 1 d'opacité quand le curseur de lecture
 * l'atteint. Le caractère invisible sert de gabarit pour que la ligne ne
 * bouge pas pendant l'animation.
 */
function AnimatedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });
  const chars = useMemo(() => text.split(""), [text]);

  return (
    <p ref={ref} className={className}>
      {chars.map((c, i) => (
        <Char key={i} progress={scrollYProgress} debut={i / chars.length} fin={(i + 1) / chars.length}>
          {c}
        </Char>
      ))}
    </p>
  );
}

function Char({
  children,
  progress,
  debut,
  fin,
}: {
  children: ReactNode;
  progress: MotionValue<number>;
  debut: number;
  fin: number;
}) {
  const opacity = useTransform(progress, [debut, fin], [0.2, 1]);
  return (
    <span className="relative inline-block whitespace-pre">
      <span className="opacity-0">{children}</span>
      <motion.span className="absolute left-0 top-0" style={{ opacity }}>
        {children}
      </motion.span>
    </span>
  );
}

/* ─────────────────────────── Boutons ─────────────────────────── */

function ContactButton() {
  return (
    <button
      type="button"
      className="rounded-full font-medium uppercase tracking-widest text-white px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-xs sm:text-sm md:text-base"
      style={{
        background: CTA_GRADIENT,
        boxShadow: CTA_SHADOW,
        outline: `2px solid ${PAPER}`,
        outlineOffset: "-3px",
      }}
    >
      Contact Me
    </button>
  );
}

function LiveProjectButton() {
  return (
    <button
      type="button"
      className="jack-ghost rounded-full border-2 font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base transition-colors duration-200"
      style={{ borderColor: MIST, color: MIST }}
    >
      Live Project
    </button>
  );
}

/* ─────────────────────────── Visuels locaux ─────────────────────────── */

/**
 * Remplace les images distantes du brief. Rend un SVG déterministe à partir
 * d'une graine, pour que chaque emplacement ait sa propre allure sans jamais
 * sortir chercher un fichier chez un tiers.
 *
 * POUR METTRE UN VRAI VISUEL : remplacer ce composant par une balise <img>
 * pointant vers un fichier de `public/`, ou par next/image si vous ajoutez le
 * domaine dans `images.remotePatterns` de next.config.ts.
 */
function Plate({
  seed,
  className,
  style,
  variant = "tile",
}: {
  seed: number;
  className?: string;
  style?: CSSProperties;
  variant?: "tile" | "orb" | "portrait";
}) {
  const teinte = (seed * 47) % 360;
  const id = `pl-${variant}-${seed}`;

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 420 270"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Visuel de démonstration"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${teinte} 42% 22%)`} />
          <stop offset="100%" stopColor={`hsl(${(teinte + 48) % 360} 38% 9%)`} />
        </linearGradient>
        <radialGradient id={`${id}-g`} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0%" stopColor={`hsl(${teinte} 70% 62%)`} stopOpacity="0.55" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Le portrait n'a pas de fond : dans la maquette d'origine c'est un
          personnage détouré qui chevauche le titre. Un rectangle plein le
          masquerait, et masquerait aussi deux entrées du menu. */}
      {variant !== "portrait" && (
        <>
          <rect width="420" height="270" fill={`url(#${id})`} />
          <rect width="420" height="270" fill={`url(#${id}-g)`} />
        </>
      )}
      {variant === "orb" ? (
        <>
          <circle cx="210" cy="135" r="78" fill={`hsl(${teinte} 60% 58%)`} opacity="0.28" />
          <circle cx="210" cy="135" r="46" fill={`hsl(${teinte} 66% 70%)`} opacity="0.34" />
        </>
      ) : variant === "portrait" ? (
        <>
          <circle cx="210" cy="104" r="52" fill={MIST} opacity="0.34" />
          <path d="M126 270c0-52 38-88 84-88s84 36 84 88Z" fill={MIST} opacity="0.34" />
        </>
      ) : (
        <>
          <rect x="34" y="196" width="150" height="10" rx="5" fill={MIST} opacity="0.24" />
          <rect x="34" y="216" width="96" height="10" rx="5" fill={MIST} opacity="0.14" />
          <circle cx="336" cy="88" r="38" fill={`hsl(${teinte} 62% 62%)`} opacity="0.26" />
        </>
      )}
    </svg>
  );
}

/* ─────────────────────────── 1 · Hero ─────────────────────────── */

const NAV = ["About", "Price", "Projects", "Contact"];

function HeroSection() {
  return (
    <section className="h-screen flex flex-col" style={{ overflowX: "clip" }}>
      <FadeIn delay={0} y={-20}>
        <nav className="flex justify-between px-6 md:px-10 pt-6 md:pt-8">
          {NAV.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="font-medium uppercase tracking-wider text-sm md:text-lg lg:text-[1.4rem] transition-opacity duration-200 hover:opacity-70"
              style={{ color: MIST }}
            >
              {l}
            </a>
          ))}
        </nav>
      </FadeIn>

      <div className="overflow-hidden">
        <FadeIn delay={0.15} y={40}>
          <h1 className="hero-heading w-full font-black uppercase tracking-tight leading-none whitespace-nowrap text-center text-[14vw] sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw] mt-6 sm:mt-4 md:-mt-5">
            Hi, i&apos;m jack
          </h1>
        </FadeIn>
      </div>

      <div className="relative flex-1">
        <Magnet
          padding={150}
          strength={3}
          className="absolute left-1/2 -translate-x-1/2 z-10 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-0 w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px]"
        >
          <FadeIn delay={0.6} y={30}>
            <Plate seed={7} variant="portrait" className="w-full h-auto rounded-3xl" style={{ aspectRatio: "3 / 4" }} />
          </FadeIn>
        </Magnet>
      </div>

      <div className="flex justify-between items-end px-6 md:px-10 pb-7 sm:pb-8 md:pb-10 relative z-20">
        <FadeIn delay={0.35} y={20}>
          <p
            className="font-light uppercase tracking-wide leading-snug max-w-[160px] sm:max-w-[220px] md:max-w-[260px]"
            style={{ color: MIST, fontSize: "clamp(0.75rem, 1.4vw, 1.5rem)" }}
          >
            a 3d creator driven by crafting striking and unforgettable projects
          </p>
        </FadeIn>
        <FadeIn delay={0.5} y={20}>
          <ContactButton />
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────────────── 2 · Marquee ─────────────────────────── */

function MarqueeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setOffset((window.scrollY - top + window.innerHeight) * 0.3);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Le brief listait 21 GIF hébergés par un tiers. Même compte, même
     répartition 11 / 10, mais rendus localement. */
  const rang1 = Array.from({ length: 11 }, (_, i) => i);
  const rang2 = Array.from({ length: 10 }, (_, i) => i + 11);
  const triple = (r: number[]) => [...r, ...r, ...r];

  const tuile = (seed: number, k: number) => (
    <Plate
      key={k}
      seed={seed}
      className="rounded-2xl shrink-0"
      style={{ width: 420, height: 270 }}
    />
  );

  return (
    <section ref={ref} className="pt-24 sm:pt-32 md:pt-40 pb-10" style={{ background: INK }}>
      <div className="flex flex-col gap-3 overflow-hidden">
        <div
          className="flex gap-3"
          style={{ transform: `translateX(${offset - 200}px)`, willChange: "transform" }}
        >
          {triple(rang1).map(tuile)}
        </div>
        <div
          className="flex gap-3"
          style={{ transform: `translateX(${-(offset - 200)}px)`, willChange: "transform" }}
        >
          {triple(rang2).map(tuile)}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 3 · About ─────────────────────────── */

const DECOR = [
  { seed: 3, cls: "top-[4%] left-[1%] sm:left-[2%] md:left-[4%] w-[120px] sm:w-[160px] md:w-[210px]", d: 0.1, x: -80 },
  { seed: 11, cls: "bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%] w-[100px] sm:w-[140px] md:w-[180px]", d: 0.25, x: -80 },
  { seed: 19, cls: "top-[4%] right-[1%] sm:right-[2%] md:right-[4%] w-[120px] sm:w-[160px] md:w-[210px]", d: 0.15, x: 80 },
  { seed: 27, cls: "bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%] w-[130px] sm:w-[170px] md:w-[220px]", d: 0.3, x: 80 },
];

function AboutSection() {
  return (
    <section
      id="about"
      className="relative min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 md:px-10 py-20"
      style={{ background: INK }}
    >
      {DECOR.map((d) => (
        <FadeIn key={d.seed} delay={d.d} x={d.x} y={0} duration={0.9} className={`absolute ${d.cls}`}>
          <Plate seed={d.seed} variant="orb" className="w-full h-auto rounded-3xl" style={{ aspectRatio: "1 / 1" }} />
        </FadeIn>
      ))}

      <div className="relative z-10 flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
        <FadeIn delay={0} y={40}>
          <h2
            className="hero-heading font-black uppercase leading-none tracking-tight text-center"
            style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}
          >
            About me
          </h2>
        </FadeIn>

        <AnimatedText
          className="font-medium text-center leading-relaxed max-w-[560px]"
          text="With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!"
        />
      </div>

      <div className="relative z-10 mt-16 sm:mt-20 md:mt-24">
        <FadeIn delay={0.2} y={20}>
          <ContactButton />
        </FadeIn>
      </div>
    </section>
  );
}

/* ─────────────────────────── 4 · Services ─────────────────────────── */

const SERVICES = [
  ["01", "3D Modeling", "Creation of detailed objects, characters, or environments tailored to specific client needs, ideal for games, products, and visualizations."],
  ["02", "Rendering", "High-quality, photorealistic renders that showcase designs with custom lighting, textures, and materials to bring concepts to life."],
  ["03", "Motion Design", "Dynamic animations and motion graphics that add energy and storytelling to brands, products, and digital experiences."],
  ["04", "Branding", "Crafting cohesive visual identities, from logos to full brand systems, that communicate a clear and memorable presence."],
  ["05", "Web Design", "Designing clean, modern, and conversion-focused websites with attention to layout, typography, and user experience."],
];

function ServicesSection() {
  return (
    <section
      id="price"
      className="px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px]"
      style={{ background: PAPER }}
    >
      <h2
        className="font-black uppercase text-center mb-16 sm:mb-20 md:mb-28"
        style={{ color: INK, fontSize: "clamp(3rem, 12vw, 160px)" }}
      >
        Services
      </h2>

      <div className="max-w-5xl mx-auto">
        {SERVICES.map(([num, nom, desc], i) => (
          <FadeIn key={num} delay={i * 0.1}>
            <div
              className="flex items-start gap-6 sm:gap-8 md:gap-10 py-8 sm:py-10 md:py-12"
              style={{
                borderTop: i === 0 ? `1px solid ${HAIRLINE}` : undefined,
                borderBottom: `1px solid ${HAIRLINE}`,
              }}
            >
              <span
                className="font-black leading-none shrink-0"
                style={{ color: INK, fontSize: "clamp(3rem, 10vw, 140px)" }}
              >
                {num}
              </span>
              <div className="flex flex-col gap-3 pt-1">
                <span
                  className="font-medium uppercase"
                  style={{ color: INK, fontSize: "clamp(1rem, 2.2vw, 2.1rem)" }}
                >
                  {nom}
                </span>
                <span
                  className="font-light leading-relaxed max-w-2xl"
                  style={{ color: INK, opacity: 0.6, fontSize: "clamp(0.85rem, 1.6vw, 1.25rem)" }}
                >
                  {desc}
                </span>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── 5 · Projects ─────────────────────────── */

const PROJETS = [
  { num: "01", cat: "Client", nom: "Nextlevel Studio", seeds: [31, 37, 41] },
  { num: "02", cat: "Personal", nom: "Aura Brand Identity", seeds: [43, 47, 53] },
  { num: "03", cat: "Client", nom: "Solaris Digital", seeds: [59, 61, 67] },
];

function ProjectCard({
  projet,
  index,
  total,
  progress,
}: {
  projet: (typeof PROJETS)[number];
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  /* Chaque carte se réduit un peu quand les suivantes passent par-dessus :
     la pile reste lisible au lieu de s'empiler à plat. */
  const cible = 1 - (total - 1 - index) * 0.03;
  const scale = useTransform(progress, [index / total, 1], [1, cible]);

  return (
    <div className="h-[85vh] sticky top-24 md:top-32" style={{ top: `${index * 28}px` }}>
      <motion.div
        className="rounded-[40px] sm:rounded-[50px] md:rounded-[60px] border-2 p-4 sm:p-6 md:p-8 h-full flex flex-col gap-4 sm:gap-6"
        style={{ scale, borderColor: MIST, background: INK, transformOrigin: "top center" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 sm:gap-6">
            <span
              className="font-black leading-none"
              style={{ color: MIST, fontSize: "clamp(2.5rem, 8vw, 110px)" }}
            >
              {projet.num}
            </span>
            <div className="flex flex-col gap-1 pt-1">
              <span
                className="font-light uppercase tracking-widest text-xs sm:text-sm"
                style={{ color: MIST, opacity: 0.6 }}
              >
                {projet.cat}
              </span>
              <span
                className="font-medium uppercase"
                style={{ color: MIST, fontSize: "clamp(1rem, 2.2vw, 2.1rem)" }}
              >
                {projet.nom}
              </span>
            </div>
          </div>
          <LiveProjectButton />
        </div>

        <div className="flex gap-3 sm:gap-4 flex-1 min-h-0">
          <div className="w-[40%] flex flex-col gap-3 sm:gap-4">
            <Plate
              seed={projet.seeds[0]}
              className="w-full rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: "clamp(130px, 16vw, 230px)" }}
            />
            <Plate
              seed={projet.seeds[1]}
              className="w-full rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
              style={{ height: "clamp(160px, 22vw, 340px)" }}
            />
          </div>
          <div className="w-[60%]">
            <Plate
              seed={projet.seeds[2]}
              className="w-full h-full rounded-[40px] sm:rounded-[50px] md:rounded-[60px]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProjectsSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section
      id="projects"
      ref={ref}
      className="relative z-10 -mt-10 sm:-mt-12 md:-mt-14 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32"
      style={{ background: INK }}
    >
      <FadeIn delay={0} y={40}>
        <h2
          className="hero-heading font-black uppercase leading-none tracking-tight text-center mb-16 sm:mb-20 md:mb-24"
          style={{ fontSize: "clamp(3rem, 12vw, 160px)" }}
        >
          Project
        </h2>
      </FadeIn>

      {PROJETS.map((p, i) => (
        <ProjectCard key={p.num} projet={p} index={i} total={PROJETS.length} progress={scrollYProgress} />
      ))}
    </section>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export function JackPortfolio() {
  return (
    <main
      className="jack-page min-h-screen"
      style={{ background: INK, overflowX: "clip", fontFamily: "var(--font-kanit), sans-serif" }}
    >
      {/* Le dégradé du titre est scopé à cette page : posé en global, il
          repeindrait les titres du site SAFE. */}
      <style>{`
        /* app/globals.css impose « h1, h2 { font-family: var(--font-sans) } »
           pour le design system SAFE. Sans cette reprise, tous les titres de
           cette page tomberaient en GeistSans au lieu de Kanit, alors que le
           corps de texte, lui, hérite correctement. Sélecteur de spécificité
           supérieure, et scopé à la page pour ne rien changer ailleurs. */
        .jack-page h1,
        .jack-page h2 { font-family: var(--font-kanit), sans-serif; }

        /* Survol du bouton fantôme. Écrit ici plutôt qu'en classe Tailwind
           arbitraire : la teinte vient de la palette de la page, elle n'a rien
           à faire dans le vocabulaire utilitaire du produit. */
        .jack-ghost:hover { background-color: color-mix(in srgb, ${MIST} 10%, transparent); }
        .hero-heading {
          background: ${HEADING_GRADIENT};
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
      `}</style>

      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
    </main>
  );
}
