"use client";

import { Shield, Scale, Eye, MapPin, Lock, Accessibility } from "lucide-react";

const badges = [
  { icon: Scale, label: "Compatible Barreau du Québec" },
  { icon: Shield, label: "Conforme Loi 25" },
  { icon: Accessibility, label: "WCAG 2.1 AA" },
  { icon: MapPin, label: "Hébergé au Canada" },
  { icon: Lock, label: "Chiffrement AES-256" },
  { icon: Eye, label: "Audit de conformité intégré" },
];

export function LogosTicker() {
  const doubled = [...badges, ...badges];

  return (
    <section className="section-morning relative py-12 border-y border-[var(--safe-sage)]/10 overflow-hidden">
      {/* Section label */}
      <p className="text-center text-xs uppercase tracking-[0.2em] text-[var(--safe-text-muted)] font-jakarta mb-8">
        Conçu pour les professionnels du droit
      </p>

      {/* Gradient fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#F8FDF9] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#F8FDF9] to-transparent pointer-events-none" />

      {/* Scrolling track */}
      <div className="flex ticker-scroll w-max">
        {doubled.map((badge, i) => (
          <div key={i} className="flex items-center gap-2.5 px-8 shrink-0">
            <badge.icon className="w-4 h-4 text-[var(--safe-sage)] opacity-70" />
            <span className="text-sm text-[var(--safe-sage)] opacity-80 font-medium whitespace-nowrap font-jakarta">
              {badge.label}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-scroll {
          animation: ticker-scroll 30s linear infinite;
        }
      `}</style>
    </section>
  );
}
