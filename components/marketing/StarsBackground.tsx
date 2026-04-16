"use client";

import { useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════
   STARS BACKGROUND — canvas twinkle layer
   Global fixed layer behind sections (z-0).
   Respects prefers-reduced-motion.
   ═══════════════════════════════════════════════ */
export function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: {
      x: number;
      y: number;
      r: number;
      phase: number;
      speed: number;
      baseOpacity: number;
    }[] = [];

    function resize() {
      if (!canvas || !ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* Density: 1 star per ~5000px² */
      const count = Math.floor((w * h) / 5000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0006 + Math.random() * 0.0012,
        baseOpacity: 0.1 + Math.random() * 0.7,
      }));
    }

    let frame = 0;
    function draw(t: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const op = reduced
          ? s.baseOpacity * 0.5
          : s.baseOpacity * (0.4 + 0.6 * Math.abs(Math.sin(s.phase + t * s.speed)));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${op.toFixed(3)})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    }

    resize();
    frame = requestAnimationFrame(draw);

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      resize();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="stars-canvas" aria-hidden />;
}
