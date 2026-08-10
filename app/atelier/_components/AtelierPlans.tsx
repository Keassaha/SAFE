"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import s from "../atelier.module.css";
import { Canvas } from "./Canvas";
import { Composer, FocusApproval, Palette } from "./Overlays";
import { Rail } from "./Rail";

/**
 * Atelier des trois plans.
 *
 * Route de spécimens, jamais montée dans le produit. Elle sert à éprouver le
 * système de profondeur avant de l'adopter dans app/(app-v2)/v2.
 *
 * PLAN 1 structure permanente (mat)  : rail, topbar, canvas.
 * PLAN 2 contenu et travail (posé)   : synthèse, blocages, liste, timeline.
 * PLAN 3 surfaces flottantes (verre) : palette, composeur, popovers, approbation.
 */
export function AtelierPlans() {
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [inspect, setInspect] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`${s.root} ${inspect ? s.showPlanes : ""}`}>
      <Rail open={navOpen} onOpenPalette={() => setPaletteOpen(true)} />

      <div className={s.workspace}>
        <header className={s.topbar} data-plane="1">
          <button
            type="button"
            className={`${s.rowMenu} ${s.navToggle}`}
            aria-label="Ouvrir la navigation"
            onClick={() => setNavOpen(!navOpen)}
          >
            <Menu size={17} strokeWidth={1.8} />
          </button>
          <span className={s.crumbs}>
            <span>Cabinet Derisier</span>
            <em>›</em>
            <strong>Aujourd’hui</strong>
          </span>
          <span className={s.topbarRight}>
            <span className={s.specimenFlag}>Atelier de design</span>
          </span>
        </header>

        <Canvas onApprove={() => setApprovalOpen(true)} />
      </div>

      <Composer />

      {paletteOpen ? <Palette onClose={() => setPaletteOpen(false)} /> : null}
      {approvalOpen ? (
        <FocusApproval onClose={() => setApprovalOpen(false)} />
      ) : null}

      {/* Outil d'atelier : marque les trois plans pour pouvoir les discuter.
          Il ne fait pas partie du produit et ne sera pas adopté dans /v2. */}
      <div className={s.inspector}>
        <div className={s.inspectorTitle}>Atelier</div>
        <button
          type="button"
          className={s.inspectorItem}
          aria-pressed={inspect}
          onClick={() => setInspect(!inspect)}
        >
          <span
            className={`${s.inspectorSwatch} ${inspect ? s.inspectorSwatchOn : ""}`}
            aria-hidden
          />
          Marquer les plans
        </button>
        <button
          type="button"
          className={s.inspectorItem}
          onClick={() => setPaletteOpen(true)}
        >
          <span className={s.inspectorSwatch} aria-hidden />
          Palette de commandes
        </button>
        <button
          type="button"
          className={s.inspectorItem}
          onClick={() => setApprovalOpen(true)}
        >
          <span className={s.inspectorSwatch} aria-hidden />
          Verre de focus
        </button>
      </div>
    </div>
  );
}
