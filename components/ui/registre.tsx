import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

/**
 * Grammaire commune des registres.
 *
 * Clients, dossiers et employés étaient trois tableaux écrits séparément : trois
 * tailles d'en-tête, trois icônes de tri, trois manières de dire « survolé » et
 * « coché ». Passer d'une liste à l'autre demandait de réapprendre l'objet.
 *
 * Ce fichier tient le vocabulaire à un seul endroit. Chaque registre garde ses
 * colonnes — un dossier n'est pas un employé — mais l'en-tête, la rangée, le
 * survol, la sélection et la barre d'outils viennent tous d'ici.
 *
 * Règle unique du survol et de la sélection : `safe-zoom-rang`. Pas d'aplat
 * gris, pas de filet d'encre à gauche. La rangée se soulève, son ombre s'ouvre,
 * et elle retombe. Voir `app/globals.css`, section « Zoom souple ».
 */

/* ── Classes partagées ──────────────────────────────────────────────────── */

/** Rangée d'en-tête : un seul filet, jamais de fond teinté. */
export const registreHeadRowClass = "border-b border-si-line";

/** Cellule d'en-tête. Le remboursage est le même partout : 12 px vertical. */
export const registreHeadCellClass = "px-3 py-2.5 text-left";

/**
 * Rangée de données. Survol, sélection et menu ouvert passent tous par
 * `safe-zoom-rang` : la rangée se soulève, elle ne se peint jamais en gris.
 * Le cas « menu ouvert » compte, sans quoi on perd de vue à quelle ligne
 * appartient le menu qui vient de s'ouvrir.
 */
export const registreRowClass = "safe-zoom-rang border-b border-si-line2";

/** Cellule de données. 13 px : la donnée, pas le titre. */
export const registreCellClass = "px-3 py-2.5 align-middle text-[13px] text-si-ink";

/** Cellule secondaire : responsable, type, date. Présente sans réclamer l'œil. */
export const registreCellMutedClass = "px-3 py-2.5 align-middle text-[13px] text-si-muted";

/** Cellule numérique : chiffres alignés verticalement pour se comparer. */
export const registreCellNumClass =
  "px-3 py-2.5 text-right align-middle font-mono text-[13px] tabular-nums text-si-ink";

/** Lien porteur d'une rangée : le nom, la référence. Jamais souligné au repos. */
export const registreLienClass =
  "block min-w-0 truncate text-[14px] font-medium leading-5 text-si-ink transition-colors hover:text-si-ink-strong";

/**
 * Ouvre la rangée au clic, où qu'on la clique. Le calcul vit à part pour se
 * tester sans navigateur : voir `components/ui/rangee-ouvrable.ts`.
 */
export { rangeeOuvrable } from "./rangee-ouvrable";

/** Case à cocher de registre, identique dans les trois listes. */
export const registreCaseClass =
  "h-4 w-4 rounded border-si-line text-si-ink-strong focus:ring-si-ink-strong/30";

/**
 * Géométrie d'un contrôle de barre d'outils. 36 px de haut : les trois
 * registres tenaient chacun leur propre hauteur (40 px ici, un `py-2` là), et
 * la barre gonflait au détriment de la liste qu'elle sert.
 *
 * Pas de zoom : on tape dans un champ de recherche, on n'y sélectionne rien, et
 * une zone de saisie qui grandit sous le curseur pendant la frappe est une
 * nuisance.
 */
export const registreChampClass =
  "h-9 rounded-md border border-si-line bg-si-surface text-[13px] text-si-ink outline-none transition-[border-color,box-shadow] focus:border-si-ink-strong/40 focus:ring-2 focus:ring-si-ink-strong/20";

/**
 * Contrôle qui sélectionne : liste déroulante, bascule, bouton d'outil. Ceux-là
 * portent le zoom souple, marque de fabrique de tout ce qui se sélectionne.
 */
export const registreSelectClass = `safe-zoom-menu px-2.5 ${registreChampClass}`;

/* ── En-têtes ───────────────────────────────────────────────────────────── */

interface SortHeaderProps<F extends string> {
  label: string;
  field: F;
  currentSortBy: F;
  currentSortOrder: "asc" | "desc";
  /** Construit l'URL de tri de la page appelante. */
  getSortUrl: (sortBy: F, sortOrder: "asc" | "desc") => string;
  align?: "left" | "right";
}

/**
 * En-tête triable.
 *
 * 12 px en graisse moyenne : dans un registre à huit colonnes, la hiérarchie se
 * fait par la graisse et la couleur, jamais par un gras criard. L'icône n'est
 * jamais en `opacity-0` — au tactile il n'y a pas de survol, et un en-tête sans
 * repère ne dit pas qu'il trie.
 */
export function RegistreSortHeader<F extends string>({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  getSortUrl,
  align = "left",
}: SortHeaderProps<F>) {
  const actif = currentSortBy === field;
  const ordreSuivant = actif && currentSortOrder === "asc" ? "desc" : "asc";
  const Icon = actif ? (currentSortOrder === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <Link
      href={getSortUrl(field, actif ? ordreSuivant : "asc")}
      aria-sort={actif ? (currentSortOrder === "asc" ? "ascending" : "descending") : undefined}
      className={`group/sort inline-flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.06em] transition-colors ${
        actif ? "text-si-ink" : "text-si-muted hover:text-si-ink"
      } ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      {label}
      <Icon
        className={`h-3 w-3 shrink-0 transition-opacity ${
          actif ? "opacity-100" : "opacity-40 group-hover/sort:opacity-100"
        }`}
        aria-hidden
      />
    </Link>
  );
}

/** En-tête non triable. Même grammaire que `RegistreSortHeader`, sans l'affordance. */
export function RegistrePlainHeader({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "right";
}) {
  return (
    <span
      className={`block text-[12px] font-medium uppercase tracking-[0.06em] text-si-muted ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {label}
    </span>
  );
}

/* ── Enveloppe ──────────────────────────────────────────────────────────── */

/**
 * Feuille du registre : surface blanche, filet, une ombre longue. Le canvas
 * gris la porte au lieu de la contenir, et la barre d'outils appartient
 * visiblement au même objet que le tableau.
 *
 * Pas de titre. « Liste des dossiers » posé au-dessus d'une liste de dossiers,
 * sur une page qui s'appelle déjà Dossiers, dit trois fois la même chose et
 * vole la largeur de la recherche.
 */
export function RegistreFeuille({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={ariaLabel} className="safe-feuille overflow-hidden">
      {children}
    </section>
  );
}

/**
 * Barre d'outils : recherche à gauche, filtres à droite, un seul filet en bas.
 * La recherche reçoit l'espace en premier ; les filtres ne se glissent jamais
 * entre elle et son champ.
 */
export function RegistreBarreOutils({
  recherche,
  filtres,
}: {
  recherche: ReactNode;
  filtres?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-si-line px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1 lg:max-w-sm">{recherche}</div>
      {filtres ? <div className="shrink-0">{filtres}</div> : null}
    </div>
  );
}

/** Message affiché quand les filtres ne laissent rien passer. */
export function RegistreAucunResultat({ message }: { message: string }) {
  return <p className="px-6 py-10 text-center text-sm text-si-muted">{message}</p>;
}

/* ── Pagination ─────────────────────────────────────────────────────────── */

/**
 * Le pied de registre vit dans son propre module « use client » : il utilise
 * `usePathname` et `useSearchParams`, que ce fichier-ci ne peut pas porter
 * puisque `RegistreFeuille` est rendu par des pages serveur. La frontière
 * « use client » étant par module, la ré-exportation la respecte.
 */
export {
  RegistrePagination,
  REGISTRE_TAILLE_PAGE,
  usePaginationLocale,
} from "./registre-pagination";
