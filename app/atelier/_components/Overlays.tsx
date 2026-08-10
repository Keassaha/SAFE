"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Clock3, Timer } from "lucide-react";
import s from "../atelier.module.css";
import { commands, dossiers } from "../_data";

/**
 * PLAN 3, surfaces flottantes.
 *
 * Trois niveaux de verre, trois justifications distinctes :
 *   - Elevated Glass pour la palette et le composeur, qui flottent au dessus
 *     d'un canvas qui défile;
 *   - Elevated Glass pour le popover d'options, qui sort du composeur;
 *   - Focus Glass, plus opaque, pour l'approbation d'un retrait en fidéicommis,
 *     parce qu'elle porte un montant et une décision irréversible.
 */

/* ---------------------------------------------------------------- Palette */

export function Palette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const results = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={s.overlayRoot}
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
      onClick={onClose}
    >
      <div
        className={s.palette}
        data-plane="3"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          className={s.paletteInput}
          placeholder="Chercher un dossier, un client, une action"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className={s.paletteList}>
          {results.length === 0 ? (
            <div className={s.popoverNote}>
              Aucun résultat. Essayez le nom du client ou la référence du
              dossier.
            </div>
          ) : (
            results.map((c) => (
              <button key={c.id} type="button" className={s.paletteItem}>
                <span>{c.label}</span>
                <span className={s.paletteKind}>{c.kind}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Composeur */

/**
 * La surface vitrée principale de l'écran. Un champ, un sélecteur de dossier
 * en évidence, deux contrôles essentiels, et le reste dans un popover. Jamais
 * une rangée permanente de boutons de même poids sous le champ.
 */
export function Composer() {
  const [dossier, setDossier] = useState(dossiers[0]);
  const [note, setNote] = useState("");
  const [duree, setDuree] = useState("0,50 h");
  const [facturable, setFacturable] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [engaged, setEngaged] = useState(false);

  // Toute surface flottante se referme à l'Échap et au clic extérieur, sinon
  // elle cesse d'être une couche temporaire et devient du décor collant.
  useEffect(() => {
    if (!pickerOpen && !optionsOpen) return;
    const close = () => {
      setPickerOpen(false);
      setOptionsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", close);
    };
  }, [pickerOpen, optionsOpen]);

  return (
    <div
      /* En tactile, la rangée de contrôles reste repliée tant que la saisie n'a
         pas commencé : un composeur qui mange 40 % de l'écran n'est plus une
         couche flottante, c'est un troisième panneau permanent. */
      className={`${s.composer} ${engaged ? s.composerEngaged : ""}`}
      data-plane="3"
      onPointerDown={(e) => e.stopPropagation()}
      onFocusCapture={() => setEngaged(true)}
    >
      <div className={s.composerTop}>
        <Timer size={17} strokeWidth={1.8} aria-hidden />
        <input
          className={s.composerField}
          placeholder="Décrivez le travail effectué, par exemple « Appel avec le client sur la mise en demeure »"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Description du travail"
        />
      </div>

      <div className={s.composerRow}>
        <span style={{ position: "relative" }}>
          <button
            type="button"
            className={`${s.chip} ${s.chipStrong}`}
            aria-expanded={pickerOpen}
            onClick={() => {
              setPickerOpen(!pickerOpen);
              setOptionsOpen(false);
            }}
          >
            {dossier}
            <ChevronDown size={13} strokeWidth={2} />
          </button>
          {pickerOpen ? (
            <div className={`${s.popover} ${s.popoverUp}`} data-plane="3">
              {dossiers.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={s.popoverItem}
                  onClick={() => {
                    setDossier(d);
                    setPickerOpen(false);
                  }}
                >
                  {d === dossier ? (
                    <Check size={13} strokeWidth={2.2} />
                  ) : (
                    <span style={{ width: 13 }} />
                  )}
                  {d}
                </button>
              ))}
            </div>
          ) : null}
        </span>

        <button
          type="button"
          className={`${s.chip} ${s.duration}`}
          onClick={() => setDuree(duree === "0,50 h" ? "1,00 h" : "0,50 h")}
        >
          <Clock3 size={13} strokeWidth={1.8} />
          {duree}
        </button>

        <button
          type="button"
          className={`${s.chip} ${facturable ? s.chipOn : ""}`}
          aria-pressed={facturable}
          onClick={() => setFacturable(!facturable)}
        >
          {facturable ? "Facturable" : "Non facturable"}
        </button>

        <span className={s.composerSpacer} />

        <span style={{ position: "relative" }}>
          <button
            type="button"
            className={s.chip}
            aria-expanded={optionsOpen}
            aria-label="Options avancées"
            onClick={() => {
              setOptionsOpen(!optionsOpen);
              setPickerOpen(false);
            }}
          >
            Options
            <ChevronDown size={13} strokeWidth={2} />
          </button>
          {optionsOpen ? (
            <div
              className={`${s.popover} ${s.popoverUp}`}
              data-plane="3"
              style={{ left: "auto", right: 0 }}
            >
              <button type="button" className={s.popoverItem}>
                Changer la date de l’entrée
              </button>
              <button type="button" className={s.popoverItem}>
                Attribuer à une autre personne
              </button>
              <button type="button" className={s.popoverItem}>
                Appliquer un taux différent
              </button>
              <div className={s.popoverSep} />
              <div className={s.popoverNote}>
                Le taux du dossier s’applique par défaut : 285,00 $ l’heure.
              </div>
            </div>
          ) : null}
        </span>

        <button type="button" className={s.primary} disabled={note.trim() === ""}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Focus Glass */

export function FocusApproval({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={s.overlayRoot}
      role="dialog"
      aria-modal="true"
      aria-labelledby="atelier-focus-titre"
      onClick={onClose}
    >
      <div
        className={s.focusPanel}
        data-plane="3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.focusEyebrow}>Approbation requise</div>
        <h2 className={s.focusTitle} id="atelier-focus-titre">
          Retrait de 24 500,00 $ du compte en fidéicommis
        </h2>
        <p className={s.focusBody}>
          Le montant dépasse le seuil de double signature. Votre approbation
          libère le retrait et inscrit votre nom au registre.
        </p>

        <div className={s.focusFacts}>
          <div className={s.focusFact}>
            <span>Dossier</span>
            <b>2026-0184</b>
          </div>
          <div className={s.focusFact}>
            <span>Client</span>
            <span>Succession Beauchemin-Lapointe</span>
          </div>
          <div className={s.focusFact}>
            <span>Solde avant retrait</span>
            <b>61 200,00 $</b>
          </div>
          <div className={s.focusFact}>
            <span>Solde après retrait</span>
            <b>36 700,00 $</b>
          </div>
          <div className={s.focusFact}>
            <span>Demandé par</span>
            <span>Jean-Philippe Ouellet, il y a 2 j</span>
          </div>
        </div>

        <div className={s.focusActions}>
          <button type="button" className={s.primary} onClick={onClose}>
            Approuver le retrait
          </button>
          <button type="button" className={s.ghost} onClick={onClose}>
            Refuser
          </button>
          <span className={s.composerSpacer} />
          <button type="button" className={s.linkButton} onClick={onClose}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
