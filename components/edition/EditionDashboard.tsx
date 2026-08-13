import Link from "next/link";
import { ArrowRight, Clock, FileText, FolderOpen, FolderPlus, Sparkles } from "lucide-react";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, type StatusVariant } from "@/components/ui/StatusBadge";
import { NewDocumentModal } from "@/components/edition/NewDocumentModal";

/**
 * Accueil de l'atelier d'édition.
 *
 * Cet écran vivait hors du produit : une palette `V1` figée en hexadécimales
 * recopiées à la main, tout le style en attributs `style`, un `margin: -1.5rem`
 * pour repeindre son propre fond par-dessus la coquille, et un titre en Geist
 * 26 px là où toute l'application titre en Instrument Serif 32 px. D'où les
 * deux constats du CEO : « je vois deux couleurs » et « les polices ne matchent
 * pas celles des autres pages ».
 *
 * Les deux couleurs venaient de la même cause. La palette du produit est
 * pilotable depuis `lib/ds/palettes.ts` ; les hexadécimales recopiées ici ne
 * bougeaient plus avec elle, et le fond peint par la page dérivait du canvas
 * servi par la coquille. Il n'y a plus une seule valeur de couleur dans ce
 * fichier : uniquement des jetons `si-*`.
 *
 * La structure est celle des registres : en-tête de page, barre de synthèse,
 * puis les listes. Toute rangée cliquable porte le zoom souple.
 */

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
  clientId: string;
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

/**
 * « Brouillon » appelle un geste, il prend l'ambre. « Final » est un état
 * atteint, il prend le vert. « Archivé » ne demande rien, il reste neutre.
 */
const STATUT_VARIANT: Record<string, StatusVariant> = {
  brouillon: "warning",
  final: "success",
  archive: "neutral",
};

const TYPE_LABEL: Record<string, string> = {
  note: "Note",
  lettre: "Lettre",
  contrat: "Contrat",
  procedure: "Procédure",
  requete: "Requête",
  autre: "Document",
};

/** Étiquette de section. Même petite capitale que la barre de synthèse. */
const LABEL_SECTION = "text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted";

/** Lien discret de fin de section : « Tout voir ». */
const LIEN_SECTION =
  "safe-zoom-menu inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-si-muted hover:text-si-ink";

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
  return new Date().toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Barre de synthèse. Même objet que celle du registre clients : pas de cadre,
 * pas d'icône, pas de mouvement. Quatre mesures, un filet, de l'espace. Les
 * quatre cartes encadrées qui vivaient ici poussaient les listes sous la ligne
 * de flottaison alors que les listes SONT la page.
 */
function BarreSynthese({ stats }: { stats: Props["stats"] }) {
  const mesures: {
    label: string;
    valeur: string;
    /** Unité collée au chiffre. En sans, jamais en mono : `tabular-nums`
        réserve à chaque glyphe la largeur d'un chiffre, et un « h » composé de
        cette manière flotte à deux espaces de son nombre. */
    unite: string | null;
    appoint: string | null;
    appel: boolean;
  }[] = [
    {
      label: "Documents",
      valeur: String(stats.totalDocs),
      unite: null,
      appoint: stats.docsThisWeek > 0 ? `+${stats.docsThisWeek} cette semaine` : null,
      appel: false,
    },
    {
      label: "Brouillons",
      valeur: String(stats.drafts),
      unite: null,
      appoint: stats.drafts > 0 ? "à relire" : null,
      appel: stats.drafts > 0,
    },
    {
      label: "Finalisés",
      valeur: String(stats.finalDocs),
      unite: null,
      appoint: null,
      appel: false,
    },
    {
      label: "Temps ce mois",
      valeur: String(stats.hoursThisMonth),
      unite: "h",
      appoint: null,
      appel: false,
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-si-line pb-5 min-[400px]:grid-cols-2 sm:gap-y-5 lg:flex lg:gap-x-12">
      {mesures.map(({ label, valeur, unite, appoint, appel }) => (
        <div key={label} className="min-w-0">
          <dt className={LABEL_SECTION}>{label}</dt>
          <dd className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono text-[18px] font-medium leading-[24px] tabular-nums text-si-ink sm:text-[22px] sm:leading-[26px]">
              {valeur}
              {unite && <span className="ml-1 font-sans text-[14px] text-si-muted">{unite}</span>}
            </span>
            {appoint && (
              <span className={`text-[12px] ${appel ? "text-si-amber-ink" : "text-si-muted"}`}>
                {appoint}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** En-tête d'une colonne de liste : étiquette à gauche, échappatoire à droite. */
function EnteteSection({
  titre,
  lienHref,
  lienLabel,
}: {
  titre: string;
  lienHref?: string;
  lienLabel?: string;
}) {
  return (
    /* Hauteur fixée : une section avec « Tout voir » est plus haute qu'une
       section sans, et les deux colonnes ne démarraient plus sur la même
       ligne. Dans une grille à deux colonnes, l'alignement des feuilles est ce
       qui se voit en premier. */
    <div className="mb-2.5 flex h-6 items-center justify-between gap-3">
      <h2 className={LABEL_SECTION}>{titre}</h2>
      {lienHref && lienLabel && (
        <Link href={lienHref} className={LIEN_SECTION}>
          {lienLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function EditionDashboard({ stats, recent, activeSessions, userName, dossiers }: Props) {
  const draftsLine =
    stats.drafts === 0
      ? "Aucun brouillon en attente."
      : `Vous avez ${stats.drafts} brouillon${stats.drafts > 1 ? "s" : ""} à relire.`;

  /* Les dossiers alimentent deux choses : la liste d'appoint et le choix de
     dossier à la création. Un document appartient toujours à un dossier. */
  const choixDossiers = dossiers.map((d) => ({
    id: d.id,
    intitule: d.intitule,
    clientId: d.clientId,
    clientNom: d.clientNom,
    numeroDossier: d.numeroDossier,
  }));

  const suggestions = [
    stats.drafts > 0
      ? `Relire et finaliser ${stats.drafts} brouillon${stats.drafts > 1 ? "s" : ""}`
      : null,
    activeSessions.length > 0
      ? `Reprendre la session sur « ${activeSessions[0].docTitre ?? "document"} »`
      : null,
    stats.totalDocs === 0 ? "Créer votre premier document depuis la Bibliothèque" : null,
    "Vérifier la cohérence des derniers contrats avec l'IA",
  ].filter((s): s is string => Boolean(s));

  return (
    <div className="space-y-6">
      {/* Le même en-tête que Clients et Dossiers : Instrument Serif 32 px sur la
          surface de travail. La date rejoint la ligne de contexte au lieu de
          former un troisième élément au-dessus du titre. */}
      <PageHeader
        variant="dashboard"
        title={`Bonjour ${userName}.`}
        description={`${formatDate()} · ${draftsLine}`}
        /* Une seule intention par écran, donc un seul bouton plein : écrire.
           La bibliothèque est une consultation, elle passe en second niveau. */
        action={
          <>
            <Link href={routes.editionBibliotheque}>
              <Button type="button" variant="secondary">
                <FolderOpen className="mr-2 inline-block h-4 w-4" aria-hidden />
                Voir la bibliothèque
              </Button>
            </Link>
            <NewDocumentModal dossiers={choixDossiers} />
          </>
        }
      />

      <BarreSynthese stats={stats} />

      {activeSessions.length > 0 && (
        /* Bandeau d'information, pas d'alerte. Il ne prend pas la couleur
           d'action : depuis la bascule de palette du 2026-08-11, `si-forest`
           est l'encre noire et la couleur est réservée aux états. Peindre ce
           bandeau avec le jeton d'action le ferait virer au vert le jour où
           l'accent serait restauré, sans qu'il ait rien changé de son sens.

           Même rayon que `safe-feuille` : deux arrondis différents sur un même
           écran se voient. */
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-si-line bg-si-surface2 px-4 py-2.5">
          <Clock className="h-4 w-4 shrink-0 text-si-muted" strokeWidth={1.8} aria-hidden />
          <span className="text-[13px] text-si-body">
            {activeSessions.length} session{activeSessions.length > 1 ? "s" : ""} de rédaction en
            cours
            {activeSessions[0].docTitre && (
              <span className="text-si-muted"> · {activeSessions[0].docTitre}</span>
            )}
          </span>
          {activeSessions[0].docId && activeSessions[0].dossierId && (
            <Link
              href={routes.editionDocument(activeSessions[0].dossierId, activeSessions[0].docId)}
              className="ml-auto"
            >
              <Button type="button" variant="secondary" size="sm">
                Reprendre
                <ArrowRight className="ml-1.5 inline-block h-3.5 w-3.5" aria-hidden />
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* ── Documents récents ── */}
        <section aria-labelledby="edition-recents">
          <EnteteSection
            titre="Documents récents"
            lienHref={routes.editionBibliotheque}
            lienLabel="Tout voir"
          />
          <div className="safe-feuille overflow-hidden">
            {recent.length === 0 ? (
              /* Un état vide qui ne propose rien laisse la personne chercher
                 le bouton ailleurs. Il porte donc l'action qu'il décrit. */
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <p className="text-sm text-si-muted">Aucun document pour le moment.</p>
                <NewDocumentModal
                  dossiers={choixDossiers}
                  label="Créer un document"
                  variant="secondary"
                />
              </div>
            ) : (
              <div className="divide-y divide-si-line2">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    href={routes.editionDocument(r.dossierId, r.id)}
                    className="safe-zoom-rang flex items-center gap-3 px-4 py-3"
                  >
                    <FileText
                      className="h-4 w-4 shrink-0 text-si-muted"
                      strokeWidth={1.6}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium leading-5 text-si-ink">
                        {r.titre}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] leading-[17px] text-si-muted">
                        {[TYPE_LABEL[r.type] ?? r.type, r.clientNom, formatRelative(r.updatedAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <StatusBadge
                      label={STATUT_LABEL[r.statut] ?? r.statut}
                      variant={STATUT_VARIANT[r.statut] ?? "neutral"}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Colonne d'appoint ── */}
        <div className="space-y-6">
          <section aria-labelledby="edition-ia">
            <EnteteSection titre="Assistant IA" />
            <div className="safe-feuille p-4">
              <div className="mb-3 flex items-center gap-2">
                {/* Décoratif, donc achromatique : la couleur ne sert qu'aux
                    états. Même raison que le bandeau de session. */}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-si-surface2 text-si-muted">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="text-[13px] font-medium text-si-ink">Suggestions du jour</span>
              </div>
              <ul className="space-y-2.5">
                {suggestions.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-[13px] text-si-body">
                    <span
                      className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-si-subtle"
                      aria-hidden
                    />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="edition-dossiers">
            <EnteteSection titre="Mes dossiers" lienHref={routes.dossiers} lienLabel="Tous voir" />
            <div className="safe-feuille overflow-hidden">
              {dossiers.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                  <p className="text-sm text-si-muted">Aucun dossier actif.</p>
                  <Link href={routes.dossierNouveau()}>
                    <Button type="button" variant="secondary">
                      <FolderPlus className="mr-2 inline-block h-4 w-4" aria-hidden />
                      Créer un dossier
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-si-line2">
                  {dossiers.map((d) => (
                    <Link
                      key={d.id}
                      href={routes.editionDossier(d.id)}
                      className="safe-zoom-rang flex items-center gap-3 px-4 py-2.5"
                    >
                      <FolderOpen
                        className="h-4 w-4 shrink-0 text-si-muted"
                        strokeWidth={1.6}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium leading-5 text-si-ink">
                          {d.intitule}
                        </span>
                        <span className="block truncate text-[11.5px] leading-4 text-si-muted">
                          {d.clientNom ?? d.numeroDossier}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-si-muted">
                        {d.docsCount} {d.docsCount > 1 ? "docs" : "doc"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
