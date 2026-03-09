"use client";

import Link from "next/link";
import { ScrollText, Calculator } from "lucide-react";
import { WIZARD_COLORS as C } from "@/lib/documents/famille/wizard-data";
import { routes } from "@/lib/routes";
import { useTranslations } from "next-intl";

export function OutilsHub() {
  const t = useTranslations("outils");

  const TOOLS = [
    {
      id: "generateur",
      href: routes.outilsGenerateurDocuments,
      label: t("documentGenerator"),
      desc: t("documentGeneratorDesc"),
      icon: ScrollText,
      color: C.bl500,
    },
    {
      id: "calculateur",
      href: routes.outilsCalculateurFamilial,
      label: t("familyCalculator"),
      desc: t("familyCalculatorDesc"),
      icon: Calculator,
      color: C.warn,
    },
  ];
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
