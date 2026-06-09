import { AuditReport } from "@/components/audit-report/AuditReport";
import { exampleReport } from "@/lib/audit-report/example";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Démo rapport d'audit SAFE",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ variant?: string }>;
}

export default async function AuditDemoPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const variant = sp.variant === "cream" ? "cream" : ("white" as const);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: variant === "cream" ? "#F4EEE1" : "#F7F4EF",
        padding: "32px 16px",
      }}
    >
      {/* Variant switcher */}
      <div
        style={{
          maxWidth: "816px",
          margin: "0 auto 24px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#587567",
            letterSpacing: "0.1em",
          }}
        >
          Variante :
        </span>
        <a
          href="?variant=white"
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            padding: "4px 12px",
            borderRadius: "4px",
            backgroundColor: variant === "white" ? "#163B2E" : "transparent",
            color: variant === "white" ? "#EEF4EF" : "#587567",
            border: "1px solid #587567",
            textDecoration: "none",
          }}
        >
          Blanc dégradé
        </a>
        <a
          href="?variant=cream"
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            padding: "4px 12px",
            borderRadius: "4px",
            backgroundColor: variant === "cream" ? "#163B2E" : "transparent",
            color: variant === "cream" ? "#EEF4EF" : "#587567",
            border: "1px solid #587567",
            textDecoration: "none",
          }}
        >
          Crème
        </a>
      </div>

      {/* Report */}
      <div
        style={{
          maxWidth: "816px",
          margin: "0 auto",
        }}
      >
        <AuditReport data={exampleReport} variant={variant} />
      </div>
    </div>
  );
}
