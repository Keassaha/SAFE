"use client";

import React from "react";
import Image from "next/image";

/**
 * Cadre « fenêtre » réutilisable pour présenter une vraie capture de l'app.
 * Captures réelles (cabinet de démo), pas des rendus : montées en CAD, FR, TPS/TVQ.
 */
export function BrowserFrame({
  src,
  alt,
  label,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[14px] border border-[0.5px] border-border-strong bg-surface shadow-[0_50px_130px_-55px_rgba(31,58,46,0.5)] overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2 px-4 h-9 border-b border-[0.5px] border-border bg-canvas">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        {label && (
          <span className="ml-3 text-[11px] text-text-subtle font-sans truncate">{label}</span>
        )}
      </div>
      <Image
        src={src}
        alt={alt}
        width={2880}
        height={1800}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 1080px"
        className="w-full h-auto block"
      />
    </div>
  );
}
