"use client";

import { motion } from "framer-motion";

interface SafeLogoProps {
  className?: string;
  alt?: string;
  priority?: boolean;
  /** "dark" = sur fond sombre (sidebar, topbar). "light" = sur fond clair (landing, auth). */
  variant?: "light" | "dark";
  /** Désactiver l'animation pulse subtile (sidebar/header) */
  noPulse?: boolean;
}

const w = 160;
const h = 40;

export function SafeLogo({
  className = "w-[160px]",
  alt = "Logo SAFE",
  variant = "light",
  noPulse = false,
}: SafeLogoProps) {
  const isDark = variant === "dark";
  const primary = isDark ? "#E6F4EF" : "#0e3b2f";
  const accent = isDark ? "#8EB69B" : "#1a5c3a";

  return (
    <motion.span
      className="block"
      {...(!noPulse && {
        animate: { opacity: [1, 0.88, 1] },
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
      })}
    >
    <svg
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      {/* Cercle ouvert (arc ~310°) */}
      <path
        d="M29 11 A14 14 0 1 0 32 20"
        stroke={primary}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Ligne diagonale centre → haut-droit */}
      <line x1="18" y1="20" x2="29" y2="11" stroke={primary} strokeWidth="1.8" strokeLinecap="round" />
      {/* Ligne horizontale traversante */}
      <line x1="2" y1="20" x2="32" y2="20" stroke={primary} strokeWidth="1.8" strokeLinecap="round" />
      {/* Point */}
      <circle cx="28" cy="20" r="1.8" fill={accent} />
      {/* Texte SAFE — couleur uniforme */}
      <text x="42" y="26" fill={primary} fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="0.04em">
        S
      </text>
      <text x="58" y="26" fill={primary} fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="0.04em">
        A
      </text>
      <text x="74" y="26" fill={primary} fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="0.04em">
        F
      </text>
      <text x="90" y="26" fill={primary} fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="0.04em">
        E
      </text>
    </svg>
    </motion.span>
  );
}
