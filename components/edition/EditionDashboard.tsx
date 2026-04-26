import Link from "next/link";
import { FileText, FolderOpen, Sparkles, ArrowRight, Clock } from "lucide-react";
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
  accentText: "#3730a3",
  success: "#16a34a",
  warn: "#d97706",
};

interface RecentDoc {
  id: string;
  titre: string;
  type: string;
  statut: string;
  updatedAt: string;
  dossierId: string;
  clientNom: string | null;
  dossierIntitule: string | null;
}

interface ActiveSession {
  id: string;
  startedAt: string;
  docId: string | null;
  docTitre: string | null;
  dossierId: string | null;
  dossierIntitule: string | null;
  clientNom: string | null;
}

interface DossierItem {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  clientNom: string | null;
  docsCount: number;
}

interface Props {
  stats: {
    totalDocs: number;
    docsThisWeek: number;
    drafts: number;
    finalDocs: number;
    hoursThisMonth: number;
  };
  recent: RecentDoc[];
  activeSessions: ActiveSession[];
  userName: string;
  dossiers: DossierItem[];
}

const STATUT_LABEL: Record<string, string> = {
  brouillon: "Brouillon",
  final: "Final",
  archive: "Archivé",
};

const TYPE_LABEL: Record<string, string> = {
  note: "Note",
  lettre: "Lettre",
  contrat: "Contrat",
  procedure: "Procédure",
  requete: "Requête",
  autre: "Document",
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

function formatDate(): string {
  const d = new Date();
  return d.toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function EditionDashboard({ stats, recent, activeSessions, userName, dossiers }: Props) {
  const draftsLine =
    stats.drafts === 0
      ? "Aucun brouillon en attente."
      : `Vous avez ${stats.drafts} brouillon${stats.drafts > 1 ? "s" : ""} à relire.`;

  const kpis = [
    {
      label: "Documents",
      value: String(stats.totalDocs),
      detail: stats.docsThisWeek > 0 ? `+${stats.docsThisWeek} cette semaine` : "Aucun cette semaine",
    },
    {
      label: "Brouillons",
      value: String(stats.drafts),
      detail: stats.drafts > 0 ? "À relire / finaliser" : "Tout est final",
    },
    {
      label: "Finalisés",
      value: String(stats.finalDocs),
      detail: "Documents prêts",
    },
    {
      label: "Temps ce mois",
      value: `${stats.hoursThisMonth} h`,
      detail: "Sessions de rédaction",
    },
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
        padding: "32px 40px",
      }}
    >
      <div className="mx-auto max-w-[1280px]">
        <div
          style={{
            fontSize: 11,
            color: V1.textDim,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 6,
          }}
        >
          {formatDate()}
        </div>
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Bonjour {userName}.
            </h1>
            <p style={{ color: V1.textMid, margin: "4px 0 0", fontSize: 14 }}>
              {draftsLine}
            </p>
          </div>
          <Link
            href={routes.editionBibliotheque}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: V1.text,
              color: V1.bgAlt,
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <FolderOpen className="w-4 h-4" strokeWidth={1.8} />
            Voir la bibliothèque
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {kpis.map((s, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${V1.border}`,
                borderRadius: 8,
                padding: 14,
                background: V1.bgAlt,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: V1.textDim,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: V1.textMid, marginTop: 4 }}>
                {s.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Active sessions banner */}
        {activeSessions.length > 0 && (
          <div
            style={{
              background: V1.accentSoft,
              border: `1px solid ${V1.accent}`,
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: V1.accentText,
              fontSize: 13,
            }}
          >
            <Clock className="w-4 h-4" strokeWidth={1.8} />
            <span>
              {activeSessions.length} session{activeSessions.length > 1 ? "s" : ""} en cours
            </span>
            {activeSessions[0].docId && activeSessions[0].dossierId && (
              <Link
                href={routes.editionDocument(activeSessions[0].dossierId, activeSessions[0].docId)}
                style={{
                  marginLeft: "auto",
                  color: V1.accent,
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Reprendre <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            )}
          </div>
        )}

        {/* Two-column: recent docs + AI suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
          <div>
            <div className="flex items-center mb-3">
              <div style={{ fontSize: 13, fontWeight: 600 }}>Documents récents</div>
              <Link
                href={routes.editionBibliotheque}
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: V1.textMid,
                  textDecoration: "none",
                }}
              >
                Tout voir →
              </Link>
            </div>
            <div
              style={{
                border: `1px solid ${V1.border}`,
                borderRadius: 8,
                background: V1.bgAlt,
                overflow: "hidden",
              }}
            >
              {recent.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    textAlign: "center",
                    color: V1.textDim,
                    fontSize: 13,
                  }}
                >
                  Aucun document pour le moment.
                </div>
              ) : (
                recent.map((r, i) => {
                  const statusColor =
                    r.statut === "final"
                      ? V1.success
                      : r.statut === "brouillon"
                      ? V1.warn
                      : V1.textMid;
                  const subtitle = [
                    TYPE_LABEL[r.type] ?? r.type,
                    r.clientNom,
                    formatRelative(r.updatedAt),
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <Link
                      key={r.id}
                      href={routes.editionDocument(r.dossierId, r.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 14px",
                        borderTop: i > 0 ? `1px solid ${V1.border}` : "none",
                        textDecoration: "none",
                        color: V1.text,
                      }}
                    >
                      <FileText
                        className="shrink-0"
                        style={{ color: V1.textDim, width: 16, height: 16 }}
                        strokeWidth={1.6}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {r.titre}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: V1.textDim,
                            marginTop: 2,
                          }}
                        >
                          {subtitle}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 20,
                          border: `1px solid ${V1.border}`,
                          color: statusColor,
                          background: V1.bg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {STATUT_LABEL[r.statut] ?? r.statut}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Assistant IA
            </div>
            <div
              style={{
                border: `1px solid ${V1.border}`,
                borderRadius: 8,
                background: V1.bgAlt,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: V1.accentSoft,
                    color: V1.accent,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                  Suggestions du jour
                </div>
              </div>
              {[
                stats.drafts > 0
                  ? `Relire et finaliser ${stats.drafts} brouillon${stats.drafts > 1 ? "s" : ""}`
                  : null,
                activeSessions.length > 0
                  ? `Reprendre la session sur « ${activeSessions[0].docTitre ?? "document"} »`
                  : null,
                stats.totalDocs === 0
                  ? "Créer votre premier document depuis la Bibliothèque"
                  : null,
                "Vérifier la cohérence des derniers contrats avec l'IA",
              ]
                .filter((s): s is string => Boolean(s))
                .map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 0",
                      borderTop: i > 0 ? `1px dashed ${V1.border}` : "none",
                      fontSize: 12.5,
                      color: V1.textMid,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: V1.accent,
                        marginTop: 7,
                        flexShrink: 0,
                      }}
                    />
                    <div>{s}</div>
                  </div>
                ))}
            </div>

            <div className="mt-4">
              <div className="flex items-center mb-3">
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Mes dossiers
                </div>
                <Link
                  href={routes.dossiers}
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: V1.textMid,
                    textDecoration: "none",
                  }}
                >
                  Tous voir →
                </Link>
              </div>
              <div
                style={{
                  border: `1px solid ${V1.border}`,
                  borderRadius: 8,
                  background: V1.bgAlt,
                  overflow: "hidden",
                }}
              >
                {dossiers.length === 0 ? (
                  <div
                    style={{
                      padding: "24px 16px",
                      textAlign: "center",
                      color: V1.textDim,
                      fontSize: 12.5,
                    }}
                  >
                    Aucun dossier actif. <Link href={routes.dossierNouveau()} style={{ color: V1.accent, textDecoration: "none" }}>Créer un dossier</Link>
                  </div>
                ) : (
                  dossiers.map((d, i) => (
                    <Link
                      key={d.id}
                      href={routes.editionDossier(d.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        fontSize: 12.5,
                        color: V1.text,
                        textDecoration: "none",
                        borderTop: i > 0 ? `1px solid ${V1.border}` : "none",
                      }}
                    >
                      <FolderOpen
                        style={{ color: V1.textDim, width: 15, height: 15, flexShrink: 0 }}
                        strokeWidth={1.6}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {d.intitule}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: V1.textDim,
                            marginTop: 1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {d.clientNom ?? d.numeroDossier}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: V1.textDim,
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                        }}
                      >
                        {d.docsCount} {d.docsCount > 1 ? "docs" : "doc"}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
