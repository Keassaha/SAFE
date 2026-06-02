"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Grid as GridIcon, List as ListIcon, Search } from "lucide-react";
import { routes } from "@/lib/routes";

const V1 = {
  bg: "#fafaf9",
  bgAlt: "#ffffff",
  border: "#ececea",
  text: "#18181b",
  textMid: "#52525b",
  textDim: "#a1a1aa",
  accent: "#4f46e5",
  accentSoft: "#eef2ff",
  success: "#16a34a",
  warn: "#d97706",
};

interface Doc {
  id: string;
  titre: string;
  type: string;
  statut: string;
  updatedAt: string;
  dossierId: string;
  clientNom: string | null;
  dossierIntitule: string | null;
}

const TYPE_LABEL_KEY: Record<string, string> = {
  note: "biblioTypeNote",
  lettre: "biblioTypeLettre",
  contrat: "biblioTypeContrat",
  procedure: "biblioTypeProcedure",
  requete: "biblioTypeRequete",
  autre: "biblioTypeAutre",
};

const STATUT_LABEL_KEY: Record<string, string> = {
  brouillon: "statutBrouillon",
  final: "statutFinal",
  archive: "statutArchive",
};

const TYPE_COLOR: Record<string, string> = {
  contrat: "#eef2ff",
  procedure: "#fef3c7",
  requete: "#fee2e2",
  lettre: "#ecfdf5",
  note: "#f1f5f9",
  autre: "#fce7f3",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

export function EditionBibliotheque({ docs }: { docs: Doc[] }) {
  const t = useTranslations("editorUi");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: docs.length };
    for (const d of docs) c[d.type] = (c[d.type] ?? 0) + 1;
    return c;
  }, [docs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (filter !== "all" && d.type !== filter) return false;
      if (!q) return true;
      const hay = `${d.titre} ${d.clientNom ?? ""} ${d.dossierIntitule ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [docs, filter, query]);

  const tabs = [
    { id: "all", label: `${t("tabAll")} · ${counts.all ?? 0}` },
    { id: "contrat", label: `${t("tabContrats")} · ${counts.contrat ?? 0}` },
    { id: "lettre", label: `${t("tabLettres")} · ${counts.lettre ?? 0}` },
    { id: "procedure", label: `${t("tabProcedures")} · ${counts.procedure ?? 0}` },
    { id: "requete", label: `${t("tabRequetes")} · ${counts.requete ?? 0}` },
    { id: "note", label: `${t("tabNotes")} · ${counts.note ?? 0}` },
    { id: "autre", label: `${t("tabAutre")} · ${counts.autre ?? 0}` },
  ];

  return (
    <div
      className="font-sans"
      style={{
        background: V1.bg,
        color: V1.text,
        fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
        minHeight: "calc(100vh - 80px)",
        margin: "-1.5rem",
        padding: "28px 40px",
      }}
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <div
              style={{
                fontSize: 11,
                color: V1.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              {t("editionLabel")}
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {t("library")}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                border: `1px solid ${V1.border}`,
                borderRadius: 6,
                background: V1.bgAlt,
                width: 240,
              }}
            >
              <Search style={{ width: 14, height: 14, color: V1.textDim }} strokeWidth={1.8} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  flex: 1,
                  color: V1.text,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                border: `1px solid ${V1.border}`,
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setView("grid")}
                style={{
                  border: "none",
                  background: view === "grid" ? V1.bg : V1.bgAlt,
                  padding: "6px 10px",
                  color: view === "grid" ? V1.text : V1.textMid,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                aria-label={t("gridView")}
              >
                <GridIcon style={{ width: 14, height: 14 }} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setView("list")}
                style={{
                  border: "none",
                  background: view === "list" ? V1.bg : V1.bgAlt,
                  padding: "6px 10px",
                  color: view === "list" ? V1.text : V1.textMid,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  borderLeft: `1px solid ${V1.border}`,
                }}
                aria-label={t("listView")}
              >
                <ListIcon style={{ width: 14, height: 14 }} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-5 mb-5 overflow-x-auto"
          style={{ fontSize: 12.5, color: V1.textMid }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                background: "transparent",
                border: "none",
                padding: "0 0 6px",
                cursor: "pointer",
                color: filter === t.id ? V1.text : V1.textMid,
                borderBottom:
                  filter === t.id ? `1.5px solid ${V1.text}` : "1.5px solid transparent",
                fontWeight: filter === t.id ? 500 : 400,
                fontFamily: "inherit",
                fontSize: 12.5,
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              border: `1px solid ${V1.border}`,
              borderRadius: 8,
              background: V1.bgAlt,
              padding: "60px 20px",
              textAlign: "center",
              color: V1.textDim,
              fontSize: 13,
            }}
          >
            {t("noDocumentMatch")}
          </div>
        ) : view === "grid" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((d) => {
              const cover = TYPE_COLOR[d.type] ?? "#f1f5f9";
              return (
                <Link
                  key={d.id}
                  href={routes.editionDocument(d.dossierId, d.id)}
                  style={{
                    background: V1.bgAlt,
                    border: `1px solid ${V1.border}`,
                    borderRadius: 10,
                    overflow: "hidden",
                    textDecoration: "none",
                    color: V1.text,
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      height: 140,
                      background: cover,
                      position: "relative",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 78,
                        height: 104,
                        background: "#fff",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        padding: "8px 10px",
                        fontSize: 5,
                        lineHeight: 1.4,
                        color: "#888",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 6,
                          fontWeight: 700,
                          color: "#333",
                          marginBottom: 4,
                          fontFamily: "Georgia, serif",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {d.titre}
                      </div>
                      {Array(7)
                        .fill(0)
                        .map((_, j) => (
                          <div
                            key={j}
                            style={{
                              height: 2,
                              background: "#eee",
                              marginBottom: 2,
                              width: `${95 - (j % 3) * 10}%`,
                            }}
                          />
                        ))}
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {d.titre}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: V1.textDim,
                        marginTop: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {TYPE_LABEL_KEY[d.type] ? t(TYPE_LABEL_KEY[d.type]) : d.type}
                        {d.clientNom ? ` · ${d.clientNom}` : ""}
                      </span>
                      <span style={{ flexShrink: 0 }}>{formatDate(d.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              border: `1px solid ${V1.border}`,
              borderRadius: 8,
              background: V1.bgAlt,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                padding: "8px 16px",
                fontSize: 11,
                color: V1.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontWeight: 500,
                borderBottom: `1px solid ${V1.border}`,
              }}
            >
              <div>{t("columnName")}</div>
              <div>{t("columnType")}</div>
              <div>{t("columnModified")}</div>
              <div>{t("columnStatus")}</div>
              <div />
            </div>
            {filtered.map((d, i) => {
              const statusColor =
                d.statut === "final"
                  ? V1.success
                  : d.statut === "brouillon"
                  ? V1.warn
                  : V1.textMid;
              return (
                <Link
                  key={d.id}
                  href={routes.editionDocument(d.dossierId, d.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                    padding: "10px 16px",
                    fontSize: 13,
                    alignItems: "center",
                    borderTop: i > 0 ? `1px solid ${V1.border}` : "none",
                    textDecoration: "none",
                    color: V1.text,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <FileText
                      style={{ color: V1.textDim, width: 16, height: 16, flexShrink: 0 }}
                      strokeWidth={1.6}
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {d.titre}
                    </span>
                  </div>
                  <div style={{ color: V1.textMid }}>{TYPE_LABEL_KEY[d.type] ? t(TYPE_LABEL_KEY[d.type]) : d.type}</div>
                  <div style={{ color: V1.textMid }}>{formatDate(d.updatedAt)}</div>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 20,
                        border: `1px solid ${V1.border}`,
                        color: statusColor,
                      }}
                    >
                      {STATUT_LABEL_KEY[d.statut] ? t(STATUT_LABEL_KEY[d.statut]) : d.statut}
                    </span>
                  </div>
                  <div style={{ textAlign: "right", color: V1.textDim }}>⋯</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
