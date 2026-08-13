"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { computeMenuPosition, MENU_WIDTH_PX, type MenuPosition } from "./menu-position";

interface RowMenuProps {
  /** Nom accessible du déclencheur. Ex. « Actions ». */
  label: string;
  /** Précise de quoi il s'agit pour un lecteur d'écran. Ex. le nom du client. */
  describedBy?: string;
  /** Éléments du menu. Chacun porte `role="menuitem"`. */
  children: ReactNode;
}

/**
 * Menu d'actions d'une ligne de registre.
 *
 * Rendu dans un portail en position fixe : un registre défile dans son propre
 * conteneur, et `overflow-x-auto` force `overflow-y` à `auto`, donc tout menu
 * positionné en absolu s'y ferait rogner sur les dernières lignes.
 *
 * Le déclencheur reste visible en permanence, jamais révélé au seul survol
 * (MB1), et la ligne demeure surlignée tant que le menu est ouvert via
 * `has-[[aria-expanded=true]]` côté appelant (P4).
 */
export function RowMenu({ label, describedBy, children }: RowMenuProps) {
  const [ouvert, setOuvert] = useState(false);
  const [monte, setMonte] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ left: 0, top: 0, placement: "below" });
  const declencheur = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => setMonte(true), []);

  const majPosition = useCallback(() => {
    if (!declencheur.current) return;
    const r = declencheur.current.getBoundingClientRect();
    setPosition(
      computeMenuPosition(
        { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
        menu.current?.offsetHeight ?? 0,
      ),
    );
  }, []);

  useLayoutEffect(() => {
    if (ouvert) majPosition();
  }, [ouvert, majPosition]);

  useEffect(() => {
    if (!ouvert) return;
    const surDeplacement = () => majPosition();
    window.addEventListener("scroll", surDeplacement, true);
    window.addEventListener("resize", surDeplacement);
    return () => {
      window.removeEventListener("scroll", surDeplacement, true);
      window.removeEventListener("resize", surDeplacement);
    };
  }, [ouvert, majPosition]);

  // Clic à l'extérieur et Échap. Échap rend le focus au déclencheur.
  useEffect(() => {
    if (!ouvert) return;
    const surPointeur = (e: PointerEvent) => {
      const cible = e.target as Node;
      if (menu.current?.contains(cible) || declencheur.current?.contains(cible)) return;
      setOuvert(false);
    };
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOuvert(false);
        declencheur.current?.focus();
      }
    };
    document.addEventListener("pointerdown", surPointeur);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("pointerdown", surPointeur);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  // Focus sur le premier élément, puis navigation aux flèches.
  useEffect(() => {
    if (!ouvert || !menu.current) return;
    const elements = () =>
      Array.from(
        menu.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"])',
        ) ?? [],
      );
    elements()[0]?.focus();
    const surFleche = (e: KeyboardEvent) => {
      const items = elements();
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(i + 1 + items.length) % items.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(i - 1 + items.length) % items.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    };
    document.addEventListener("keydown", surFleche);
    return () => document.removeEventListener("keydown", surFleche);
  }, [ouvert]);

  const style: CSSProperties = {
    position: "fixed",
    left: position.left,
    top: position.top,
    width: MENU_WIDTH_PX,
    zIndex: 1000,
  };

  const contenu = ouvert ? (
    <div
      ref={menu}
      id={menuId}
      role="menu"
      aria-orientation="vertical"
      aria-label={describedBy}
      style={style}
      // Un clic sur un élément ferme le menu, quel que soit son type.
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[role="menuitem"]')) setOuvert(false);
      }}
      // `px-1.5` : les entrées s'insèrent, ce qui laisse au zoom souple la
      // place de grandir sans se faire rogner par le bord du menu.
      className="overflow-hidden rounded-xl border border-si-line bg-si-surface px-1.5 py-1.5 shadow-menu"
    >
      {children}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={declencheur}
        type="button"
        onClick={() => setOuvert((v) => !v)}
        onKeyDown={(e) => {
          if (!ouvert && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOuvert(true);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? menuId : undefined}
        aria-label={label}
        title={label}
        className="safe-zoom-menu inline-flex h-8 w-8 items-center justify-center rounded-md text-si-muted hover:text-si-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-si-forest/30"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
      {monte && contenu ? createPortal(contenu, document.body) : null}
    </>
  );
}

/**
 * Forme commune des éléments de menu : lien, bouton et soumission se
 * ressemblent. Le survol soulève l'entrée au lieu de la peindre en gris : c'est
 * la marque de tout ce qui se sélectionne dans SAFE. La couleur est laissée
 * aux deux constantes ci-dessous.
 */
const rowMenuItemBase =
  "safe-zoom-menu flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] focus:outline-none";

/** Élément de menu ordinaire. */
export const rowMenuItemClass = `${rowMenuItemBase} text-si-body hover:text-si-ink focus:text-si-ink`;

/**
 * Élément de menu destructeur : supprimer, révoquer, détruire.
 *
 * Deux classes de couleur sur un même élément ne se départagent pas par
 * l'ordre dans la chaîne, mais par l'ordre dans la feuille compilée. On compose
 * donc une variante entière plutôt que d'écraser `text-si-body` après coup.
 */
export const rowMenuItemDangerClass = `${rowMenuItemBase} text-si-danger-ink hover:text-si-danger focus:text-si-danger`;
