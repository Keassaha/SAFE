"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface SafeLogoProps {
  className?: string;
  alt?: string;
  priority?: boolean;
  /** Sans bandeau : fond sombre vs clair pour le « S » et le mot « Safe ». */
  variant?: "light" | "dark";
  noPulse?: boolean;
  /**
   * Bandeau gris type maquette (coins arrondis à gauche) + pastille vert forêt + « Safe » blanc.
   * @default true
   */
  brandBar?: boolean;
}

export function SafeLogo({
  className = "",
  alt = "Logo SAFE",
  priority = false,
  variant = "light",
  noPulse = false,
  brandBar = false,
}: SafeLogoProps) {
  const isDark = variant === "dark";

  const iconShell = brandBar
    ? "bg-[#0f3d2f] ring-1 ring-[#4ade80]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
    : isDark
      ? "bg-[#1a4a3a] ring-1 ring-[#4ade80]/20"
      : "bg-[#e8f5ee] ring-1 ring-[#22c55e]/15";

  const wordmark = brandBar
    ? "text-white"
    : isDark
      ? "text-[#E6F4EF]"
      : "text-[#0e3b2f]";

  const shell = brandBar
    ? "gap-2.5 rounded-l-[1.125rem] rounded-r-lg bg-[#2e343c] px-2.5 py-1.5 shadow-[0_2px_14px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.07]"
    : "gap-2";

  const sFilter = brandBar
    ? "brightness(1.35) saturate(1.85) contrast(1.08) drop-shadow(0 0 7px rgba(74,222,128,0.5))"
    : "brightness(1.6) saturate(2.2)";

  return (
    <motion.span
      role="img"
      aria-label={alt}
      className={`inline-flex items-center ${shell} ${className}`.trim()}
      {...(!noPulse && {
        animate: { opacity: [1, 0.88, 1] },
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
      })}
    >
      <span
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${iconShell}`}
      >
        <Image
          src="/images/safe-mark-s-green.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          style={{ filter: sFilter }}
          priority={priority}
        />
      </span>

      <span
        className={`select-none pr-0.5 font-sans text-[22px] font-bold leading-none tracking-[0.04em] ${wordmark}`}
      >
        Safe
      </span>
    </motion.span>
  );
}
