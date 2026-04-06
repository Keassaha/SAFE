"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════
   Scroll-linked letter glow (LangGraph-inspired)
   ═══════════════════════════════════════════════ */
function GlowText({
  text,
  className = "",
  scrollYProgress,
  start = 0,
  end = 1,
}: {
  text: string;
  className?: string;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  start?: number;
  end?: number;
}) {
  const chars = text.split("");

  return (
    <span className={className} aria-label={text}>
      {chars.map((char, i) => {
        const charStart = start + (i / chars.length) * (end - start) * 0.6;
        const charEnd = charStart + (end - start) * 0.4;
        return (
          <GlowChar
            key={`${char}-${i}`}
            char={char}
            scrollYProgress={scrollYProgress}
            start={charStart}
            end={charEnd}
          />
        );
      })}
    </span>
  );
}

function GlowChar({
  char,
  scrollYProgress,
  start,
  end,
}: {
  char: string;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  start: number;
  end: number;
}) {
  const opacity = useTransform(scrollYProgress, [start, end], [0.25, 1]);
  const textShadow = useTransform(scrollYProgress, [start, end], [
    "0 0 0px transparent",
    "0 0 20px rgba(142, 182, 155, 0.5)",
  ]);

  return (
    <motion.span
      style={{ opacity, textShadow }}
      className="inline-block transition-none"
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════
   Floating dot-grid canvas (tech/AI aesthetic)
   ═══════════════════════════════════════════════ */
function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const spacing = 40;
      const cols = Math.ceil(w / spacing);
      const rows = Math.ceil(h / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing + spacing / 2;
          const y = j * spacing + spacing / 2;

          // Wave effect
          const dist = Math.sqrt(
            Math.pow(x - w / 2, 2) + Math.pow(y - h / 2, 2)
          );
          const wave = Math.sin(dist * 0.008 - time * 0.6) * 0.5 + 0.5;
          const alpha = 0.04 + wave * 0.08;
          const radius = 1 + wave * 0.5;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(142, 182, 155, ${alpha})`;
          ctx.fill();
        }
      }

      time += 0.016;
      animFrame = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ═══════════════════════════════════════════════
   HERO COMPONENT
   ═══════════════════════════════════════════════ */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax for blobs
  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const blobY3 = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section
      ref={sectionRef}
      className="section-morning relative min-h-[110vh] flex items-center justify-center overflow-hidden"
    >
      {/* Dot grid canvas (tech/AI feel) */}
      <DotGrid />

      {/* Grain texture */}
      <div className="landing-grain absolute inset-0 z-10 pointer-events-none" />

      {/* Gradient mesh blobs — with parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: blobY1 }}
          className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[#8EB69B] opacity-15 blur-[120px] animate-[blob-drift-1_18s_ease-in-out_infinite]"
        />
        <motion.div
          style={{ y: blobY2 }}
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#235347] opacity-8 blur-[100px] animate-[blob-drift-2_22s_ease-in-out_infinite]"
        />
        <motion.div
          style={{ y: blobY3 }}
          className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#DAF1DE] opacity-30 blur-[80px] animate-[blob-drift-3_15s_ease-in-out_infinite]"
        />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-6 lg:px-10 pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Compliance badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full landing-badge mb-8"
          >
            <Shield className="w-4 h-4 text-[var(--safe-sage)]" />
            <span className="text-sm text-[var(--safe-sage)] font-medium font-sans">
              Conforme au Règlement B-1 r.5 et à la Loi 25
            </span>
          </motion.div>

          {/* Headline with scroll-linked glow */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-5xl md:text-7xl lg:text-7xl leading-[1.05] tracking-[-0.02em] text-[var(--safe-white)] mb-8"
          >
            <GlowText
              text="Le logiciel de gestion conçu pour les "
              scrollYProgress={scrollYProgress}
              start={0}
              end={0.25}
            />
            <span className="italic text-[var(--safe-sage)]">
              <GlowText
                text="avocats en droit familial"
                scrollYProgress={scrollYProgress}
                start={0.1}
                end={0.35}
              />
            </span>{" "}
            <GlowText
              text="au Québec"
              scrollYProgress={scrollYProgress}
              start={0.15}
              end={0.4}
            />
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg lg:text-xl text-[var(--safe-text-muted)] max-w-2xl mx-auto mb-12 leading-relaxed font-sans"
          >
            Facturation conforme, comptes en fidéicommis, échéanciers — tout dans une seule
            plateforme pensée pour votre pratique.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/demo"
              className="group flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-full bg-[var(--safe-accent)] text-[var(--safe-lightest)] hover:bg-[var(--safe-sage)] hover:text-[var(--safe-darkest)] transition-all duration-300 shadow-xl shadow-[var(--safe-accent)]/25 font-sans"
            >
              Réserver une démo
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/audit-gratuit"
              className="group flex items-center gap-2 px-8 py-4 text-base font-medium rounded-full border border-[var(--safe-sage)]/30 text-[var(--safe-sage)] hover:border-[var(--safe-sage)]/60 hover:bg-[var(--safe-sage)]/5 transition-all duration-300 font-sans"
            >
              <Sparkles className="w-4 h-4" />
              Audit gratuit par IA
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-20 flex flex-col items-center gap-2"
          >
            <span className="text-xs text-[var(--safe-sage)]/50 font-sans">Défiler</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-5 h-8 rounded-full border border-[var(--safe-sage)]/20 flex items-start justify-center p-1"
            >
              <motion.div className="w-1 h-2 rounded-full bg-[var(--safe-sage)]/40" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
