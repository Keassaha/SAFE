"use client";

interface SafeLogoProps {
  className?: string;
  alt?: string;
  priority?: boolean;
  /** "dark" = sur fond sombre (sidebar, topbar). "light" = sur fond clair (landing, auth). */
  variant?: "light" | "dark";
}

const w = 160;
const h = 40;

export function SafeLogo({
  className = "w-[160px]",
  alt = "Logo SAFE",
  variant = "light",
}: SafeLogoProps) {
  const isDark = variant === "dark";
  const primary = isDark ? "#E6F4EF" : "#0e3b2f";
  const accent = isDark ? "#e8b547" : "#c88a1f";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      {/* Bouclier */}
      <path
        d="M8 5l8-3 8 3v9c0 5-4 8-8 10-4-2-8-5-8-10V5z"
        stroke={primary}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Balance (justice) dans le bouclier */}
      <path d="M20 11v6M16 17h8M20 17v2" stroke={primary} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M15 19h10" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 19h6" stroke={primary} strokeWidth="1" strokeLinecap="round" />
      {/* Texte SAFE */}
      <text x="42" y="26" fill={primary} fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="0.04em">
        S
      </text>
      <text x="58" y="26" fill={accent} fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="0.04em">
        A
      </text>
      <text x="74" y="26" fill={primary} fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="0.04em">
        F
      </text>
      <text x="90" y="26" fill={primary} fontFamily="var(--font-sans), system-ui, sans-serif" fontSize="18" fontWeight="700" letterSpacing="0.04em">
        E
      </text>
    </svg>
  );
}
