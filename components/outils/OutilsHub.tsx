"use client";

import Link from "next/link";
import { Calculator } from "lucide-react";
import { WIZARD_COLORS as C } from "@/lib/documents/famille/wizard-data";

type Tool = {
  id: string;
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  color: string;
};

export function OutilsHub() {
  // Le catalogue déclare cet outil depuis longtemps (`lib/catalog/catalog.ts`,
  // id `calc-patrimoine-familial`). Le hub affichait « aucun outil disponible »
  // pendant que la route n'existait pas. Les deux sont branchés maintenant.
  const TOOLS: Tool[] = [
    {
      id: "calc-patrimoine-familial",
      href: "/outils/patrimoine-familial",
      label: "Patrimoine familial",
      desc: "Le partage, calculé article par article, avec ce qu'il ne tranche pas.",
      icon: Calculator,
      color: C.sl700,
    },
  ];

  if (TOOLS.length === 0) {
    return (
      <div
        style={{
          padding: "32px 20px",
          borderRadius: 12,
          background: C.white,
          border: `1px dashed ${C.sl100}`,
          textAlign: "center",
          color: C.sl400,
          fontSize: 13,
        }}
      >
        Aucun outil disponible pour le moment.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        return (
          <Link
            key={tool.id}
            href={tool.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 20px",
              borderRadius: 12,
              cursor: "pointer",
              background: C.white,
              border: `1px solid ${C.sl100}`,
              transition: "all .2s ease",
              textDecoration: "none",
              color: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${tool.color}08`;
              e.currentTarget.style.borderColor = `${tool.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.white;
              e.currentTarget.style.borderColor = C.sl100;
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: `${tool.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={22} strokeWidth={1.8} style={{ color: tool.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.sl900 }}>{tool.label}</div>
              <div style={{ fontSize: 12, color: C.sl400, marginTop: 2, lineHeight: 1.4 }}>{tool.desc}</div>
            </div>
            <span style={{ color: C.sl300, flexShrink: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
