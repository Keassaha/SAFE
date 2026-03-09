"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { toIntlLocale } from "@/lib/i18n/locale";

/**
 * Affiche un nombre avec une animation d’entrée (0 → value).
 * Inspiré du dashboard premium — à utiliser pour KPIs et hero.
 */
interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  duration = 1200,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const locale = useLocale();

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - p, 4);
      setDisplay(easeOut * value);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  const formatted = display.toLocaleString(toIntlLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
