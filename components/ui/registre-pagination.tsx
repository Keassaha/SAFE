"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Nombre de lignes par page dans tout le produit. */
export const REGISTRE_TAILLE_PAGE = 20;

/**
 * Pied de registre : « 1–20 sur 27 · Précédent · Page 1 / 2 · Suivant ».
 *
 * Une seule implémentation pour toutes les listes. Il en existait trois,
 * recopiées, chacune codant en dur le chemin de sa page (`/clients`,
 * `/dossiers`, `/employees`) — d'où l'impossibilité de la réutiliser ailleurs,
 * et des listes entières qui se parcouraient donc au défilement.
 *
 * Deux modes :
 * - **URL** (défaut) : des liens `?page=N` sur le chemin courant. La page est
 *   partageable, le retour arrière fonctionne, et le serveur ne renvoie que la
 *   tranche demandée.
 * - **local** : passer `onPageChange` quand les données sont déjà en mémoire.
 *   Ce sont alors des boutons, sans aller-retour réseau.
 *
 * `resume` est fourni par l'appelant : « 27 client(s) » et « 27 entrée(s) » ne
 * se traduisent pas au même endroit.
 */
export function RegistrePagination({
  totalCount,
  currentPage,
  pageSize = REGISTRE_TAILLE_PAGE,
  resume,
  labelPage,
  labelPrecedent,
  labelSuivant,
  onPageChange,
}: {
  totalCount: number;
  currentPage: number;
  pageSize?: number;
  /** Ex. « 1–20 sur 27 client(s) ». */
  resume: string;
  /** Ex. « Page 1 / 2 ». */
  labelPage: string;
  labelPrecedent: string;
  labelSuivant: string;
  /** Fourni → pagination locale par boutons. Absent → liens `?page=`. */
  onPageChange?: (page: number) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Une seule page : le pied n'apprend rien et vole une rangée.
  if (totalCount <= pageSize) return null;

  function urlPage(page: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    return `${pathname}?${next.toString()}`;
  }

  const classeControle = (actif: boolean) =>
    `safe-zoom-menu inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] font-medium ${
      actif ? "text-si-ink" : "pointer-events-none text-si-muted/50"
    }`;

  function Controle({
    page,
    actif,
    children,
  }: {
    page: number;
    actif: boolean;
    children: ReactNode;
  }) {
    if (onPageChange) {
      return (
        <button
          type="button"
          onClick={() => actif && onPageChange(page)}
          disabled={!actif}
          className={classeControle(actif)}
        >
          {children}
        </button>
      );
    }
    return (
      <Link
        href={actif ? urlPage(page) : "#"}
        aria-disabled={!actif}
        className={classeControle(actif)}
      >
        {children}
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-si-line px-3 py-3">
      <p className="text-[13px] text-si-muted">{resume}</p>
      <div className="flex items-center gap-2">
        <Controle page={currentPage - 1} actif={hasPrev}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {labelPrecedent}
        </Controle>
        <span className="text-[13px] text-si-muted">{labelPage}</span>
        <Controle page={currentPage + 1} actif={hasNext}>
          {labelSuivant}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Controle>
      </div>
    </div>
  );
}

/**
 * Pagination locale d'une liste déjà chargée en mémoire.
 *
 * Beaucoup d'écrans du produit reçoivent leur liste complète d'un coup et la
 * rendaient entièrement : sur un cabinet qui travaille, cela fait des centaines
 * de rangées à parcourir au défilement. Ce crochet fournit la tranche et l'état
 * de page sans rien changer au chargement des données.
 *
 * `pageSure` borne la page au nombre réel de pages : un filtre qui raccourcit
 * la liste alors qu'on est en page 4 afficherait sinon du vide.
 */
export function usePaginationLocale<T>(items: T[], pageSize = REGISTRE_TAILLE_PAGE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageSure = Math.min(page, totalPages);
  const debut = (pageSure - 1) * pageSize;
  return {
    page: pageSure,
    setPage,
    totalPages,
    debut,
    fin: Math.min(debut + pageSize, items.length),
    total: items.length,
    tranche: items.slice(debut, debut + pageSize),
  };
}
