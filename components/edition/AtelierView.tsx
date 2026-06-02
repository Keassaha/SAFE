"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FolderOpen, Clock, FileText, ChevronRight, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Couleurs par type de dossier — Vert + Beige clair (Option 2)
// Clés alignées avec l'enum DossierType de Prisma
const DOSSIER_COLORS: Record<string, { bg: string; border: string; tab: string; icon: string }> = {
  droit_famille: { bg: "bg-amber-50",  border: "border-emerald-300", tab: "bg-emerald-600", icon: "text-emerald-600" },
  immobilier:    { bg: "bg-white",     border: "border-emerald-200", tab: "bg-emerald-600", icon: "text-emerald-600" },
  litige_civil:  { bg: "bg-amber-50",  border: "border-emerald-300", tab: "bg-emerald-700", icon: "text-emerald-700" },
  criminel:      { bg: "bg-white",     border: "border-red-200",     tab: "bg-red-600",     icon: "text-red-600" },
  immigration:   { bg: "bg-amber-50",  border: "border-emerald-300", tab: "bg-emerald-600", icon: "text-emerald-600" },
  corporate:     { bg: "bg-white",     border: "border-indigo-200",  tab: "bg-indigo-600",  icon: "text-indigo-600" },
  autre:         { bg: "bg-amber-50",  border: "border-emerald-300", tab: "bg-emerald-600", icon: "text-emerald-600" },
  default:       { bg: "bg-white",     border: "border-emerald-200", tab: "bg-emerald-600", icon: "text-emerald-600" },
};

function getDossierColor(type?: string | null) {
  if (!type) return DOSSIER_COLORS.default;
  return DOSSIER_COLORS[type.toLowerCase()] ?? DOSSIER_COLORS.default;
}

interface RichDocPreview {
  id: string;
  titre: string;
  type: string;
  statut: string;
  updatedAt: string;
}

interface DossierWithDocs {
  id: string;
  intitule: string;
  numeroDossier?: string | null;
  type?: string | null;
  richDocuments: RichDocPreview[];
  _count: { richDocuments: number };
}

interface ClientWithDossiers {
  id: string;
  raisonSociale?: string | null;
  dossiers: DossierWithDocs[];
}

interface ActiveSession {
  id: string;
  richDocument: { id: string; titre: string } | null;
  dossier: { id: string; intitule: string } | null;
  client: { id: string; raisonSociale?: string | null } | null;
  startedAt: string;
}

interface AtelierViewProps {
  clients: ClientWithDossiers[];
  activeSessions: ActiveSession[];
  currentUserId: string;
}

export function AtelierView({ clients, activeSessions }: AtelierViewProps) {
  const t = useTranslations("editorUi");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    clients[0]?.id ?? null
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar — liste des clients */}
      <aside className="w-64 shrink-0 space-y-1">
        <p className="text-xs font-semibold text-[var(--safe-text-secondary)] uppercase tracking-wide px-2 mb-3">
          {t("clientsCount", { count: clients.length })}
        </p>
        {clients.map((client) => (
          <button
            key={client.id}
            onClick={() => setSelectedClientId(client.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all group ${
              selectedClientId === client.id
                ? "bg-[var(--safe-primary)] text-white shadow-sm"
                : "hover:bg-[var(--safe-neutral-bg)] text-[var(--safe-text-title)]"
            }`}
          >
            <span
              className={`text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                selectedClientId === client.id
                  ? "bg-white/20 text-white"
                  : "bg-[var(--safe-neutral-border)] text-[var(--safe-text-secondary)]"
              }`}
            >
              {(client.raisonSociale ?? "?")[0].toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {client.raisonSociale ?? t("noName")}
              </p>
              <p
                className={`text-xs ${
                  selectedClientId === client.id
                    ? "text-white/70"
                    : "text-[var(--safe-text-secondary)]"
                }`}
              >
                {t("matterCount", { count: client.dossiers.length })}
              </p>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 shrink-0 ${
                selectedClientId === client.id ? "text-white/70" : "text-transparent group-hover:text-[var(--safe-text-secondary)]"
              }`}
            />
          </button>
        ))}

        {clients.length === 0 && (
          <p className="text-sm text-[var(--safe-text-secondary)] px-2">
            {t("noActiveClient")}
          </p>
        )}
      </aside>

      {/* Zone principale — dossiers papier */}
      <main className="flex-1 min-w-0">
        {/* Sessions actives */}
        {activeSessions.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center gap-3">
            <Clock className="w-4 h-4 text-orange-500 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-medium text-orange-700">{t("activeTimer")}</span>
              {activeSessions.map((s) => (
                <span key={s.id} className="ml-2 text-orange-600">
                  {s.richDocument?.titre ?? t("document")} —{" "}
                  {s.dossier?.intitule}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedClient ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--safe-text-title)]">
                  {selectedClient.raisonSociale}
                </h2>
                <p className="text-sm text-[var(--safe-text-secondary)]">
                  {t("activeMatterCount", { count: selectedClient.dossiers.length })}
                </p>
              </div>
            </div>

            {/* Grille de dossiers — métaphore chemises papier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedClient.dossiers.map((dossier) => {
                const colors = getDossierColor(dossier.type);
                return (
                  <FolderCard
                    key={dossier.id}
                    dossier={dossier}
                    colors={colors}
                  />
                );
              })}

              {selectedClient.dossiers.length === 0 && (
                <div className="col-span-3 py-12 text-center">
                  <FolderOpen className="w-10 h-10 text-[var(--safe-neutral-border)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--safe-text-secondary)]">
                    {t("noActiveMatterForClient")}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <FolderOpen className="w-12 h-12 text-[var(--safe-neutral-border)] mb-4" />
            <p className="text-[var(--safe-text-secondary)]">
              {t("selectClientToSeeMatters")}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Composant chemise individuelle
function FolderCard({
  dossier,
  colors,
}: {
  dossier: DossierWithDocs;
  colors: ReturnType<typeof getDossierColor>;
}) {
  const t = useTranslations("editorUi");
  const docCount = dossier._count.richDocuments;
  const recentDocs = dossier.richDocuments.slice(0, 3);

  return (
    <Link
      href={`/edition/${dossier.id}`}
      className={`group block rounded-lg border-2 ${colors.bg} ${colors.border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden`}
    >
      {/* Onglet de la chemise */}
      <div className={`h-2 ${colors.tab} w-1/2 rounded-b-sm mx-4`} />

      {/* Corps de la chemise */}
      <div className="p-4 space-y-3">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--safe-text-title)] text-sm leading-tight truncate">
              {dossier.intitule}
            </p>
            {dossier.numeroDossier && (
              <p className="text-xs text-[var(--safe-text-secondary)] mt-0.5">
                #{dossier.numeroDossier}
              </p>
            )}
          </div>
          <FolderOpen className={`w-5 h-5 shrink-0 ${colors.icon} group-hover:scale-110 transition-transform`} />
        </div>

        {/* Aperçu des documents récents — comme des feuilles qui dépassent */}
        {recentDocs.length > 0 ? (
          <div className="space-y-1.5 border-t border-current border-opacity-10 pt-3">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-xs">
                <FileText className="w-3 h-3 text-[var(--safe-text-secondary)] shrink-0" />
                <span className="truncate text-[var(--safe-text-secondary)] flex-1">
                  {doc.titre}
                </span>
                <span className="text-[var(--safe-text-secondary)] shrink-0">
                  {formatDistanceToNow(new Date(doc.updatedAt), {
                    locale: fr,
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-t border-current border-opacity-10 pt-3">
            <p className="text-xs text-[var(--safe-text-secondary)] italic">
              {t("emptyMatterClickToStart")}
            </p>
          </div>
        )}

        {/* Compteur */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-[var(--safe-text-secondary)]">
            {t("documentCount", { count: docCount })}
          </span>
          <span className={`text-xs font-medium ${colors.icon} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
            {t("open")} <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
