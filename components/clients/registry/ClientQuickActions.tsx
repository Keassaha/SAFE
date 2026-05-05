"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Phone, Mail, Download, MoreHorizontal } from "lucide-react";

interface ClientQuickActionsProps {
  email: string | null;
  telephone: string | null;
  clientId: string;
  canExport?: boolean;
}

const MENU_WIDTH_PX = 224; // matches w-56
const VIEWPORT_MARGIN = 8;

export type MenuPosition = { left: number; top: number; placement: "below" | "above" };

export function computeMenuPosition(
  triggerRect: { top: number; bottom: number; left: number; right: number },
  menuHeight: number,
  viewport?: { width: number; height: number }
): MenuPosition {
  const viewportW = viewport?.width ?? (typeof window !== "undefined" ? window.innerWidth : 1024);
  const viewportH = viewport?.height ?? (typeof window !== "undefined" ? window.innerHeight : 768);

  // Right-align with trigger by default (Actions sits in the right action row).
  let left = triggerRect.right - MENU_WIDTH_PX;
  if (left < VIEWPORT_MARGIN) left = Math.max(VIEWPORT_MARGIN, triggerRect.left);
  if (left + MENU_WIDTH_PX > viewportW - VIEWPORT_MARGIN) {
    left = viewportW - MENU_WIDTH_PX - VIEWPORT_MARGIN;
  }

  let top = triggerRect.bottom + 8;
  let placement: MenuPosition["placement"] = "below";
  if (menuHeight > 0 && top + menuHeight > viewportH - VIEWPORT_MARGIN) {
    const flippedTop = triggerRect.top - menuHeight - 8;
    if (flippedTop > VIEWPORT_MARGIN) {
      top = flippedTop;
      placement = "above";
    } else {
      top = Math.max(VIEWPORT_MARGIN, viewportH - menuHeight - VIEWPORT_MARGIN);
    }
  }
  return { left, top, placement };
}

export function ClientQuickActions({
  email,
  telephone,
  clientId,
  canExport = true,
}: ClientQuickActionsProps) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ left: 0, top: 0, placement: "below" });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const exportHref = `/api/clients/${clientId}/export-dossier`;

  const itemClass =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-neutral-text-secondary transition-colors hover:bg-primary-50 focus:bg-primary-50 focus:outline-none focus-visible:bg-primary-50";

  // SSR-safe portal mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    setPosition(
      computeMenuPosition(
        { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
        menuHeight
      )
    );
  }, []);

  // Recompute position when opening, then on scroll/resize while open.
  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  // Click-outside + Escape close.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Focus first item on open + Arrow / Home / End nav while open.
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
    );
    items[0]?.focus();
    const onArrow = (event: KeyboardEvent) => {
      if (!menuRef.current) return;
      const focusables = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
      );
      if (focusables.length === 0) return;
      const currentIdx = focusables.indexOf(document.activeElement as HTMLElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusables[(currentIdx + 1 + focusables.length) % focusables.length].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusables[(currentIdx - 1 + focusables.length) % focusables.length].focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        focusables[0].focus();
      } else if (event.key === "End") {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      }
    };
    document.addEventListener("keydown", onArrow);
    return () => document.removeEventListener("keydown", onArrow);
  }, [open]);

  const handleSelect = () => setOpen(false);

  const menuStyle: CSSProperties = {
    position: "fixed",
    left: position.left,
    top: position.top,
    width: MENU_WIDTH_PX,
    zIndex: 1000,
  };

  const menu = open ? (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-orientation="vertical"
      style={menuStyle}
      className="overflow-hidden rounded-safe-sm border border-neutral-border bg-white shadow-xl ring-1 ring-black/5"
    >
      {telephone && (
        <a
          href={`tel:${telephone.replace(/\s/g, "")}`}
          onClick={handleSelect}
          className={itemClass}
          role="menuitem"
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{t("call")}</span>
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          onClick={handleSelect}
          className={itemClass}
          role="menuitem"
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{t("emailAction")}</span>
        </a>
      )}
      {canExport ? (
        <Link
          href={exportHref}
          onClick={handleSelect}
          className={itemClass}
          role="menuitem"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{t("exportDossier")}</span>
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={t("exportDossier")}
          className="flex w-full cursor-not-allowed select-none items-center gap-2.5 px-3 py-2 text-left text-sm text-neutral-400"
          role="menuitem"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{t("exportDossier")}</span>
        </button>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            if (!open) {
              event.preventDefault();
              setOpen(true);
            }
          }
        }}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-safe-sm border border-neutral-border bg-white text-neutral-text-secondary text-sm font-medium shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:bg-primary-50 hover:border-primary-200 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden />
        {tc("actions")}
      </button>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
