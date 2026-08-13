"use client";

/**
 * À propos — le récit de la naissance de SAFE, piloté au défilement.
 *
 * Le texte est VERROUILLÉ. Il est reproduit mot pour mot depuis le script
 * fourni par le CEO le 13 août 2026 : aucune phrase n'est résumée, réécrite,
 * fusionnée ni déplacée. Les seules libertés prises sont celles que le script
 * autorise explicitement : découper une phrase en fragments visuels sans
 * toucher ses mots, répartir les paragraphes sur plusieurs temps de
 * défilement, ajouter les numéros 01 à 05 et l'exergue « À propos de SAFE ».
 *
 * Mécanique reprise d'ExperienceCinema : un chapitre arrive en grand, son
 * texte se révèle dans l'ordre, puis le titre se réduit pendant que le
 * suivant arrive. Rien de ce qui a été raconté ne disparaît : la page reste un
 * article complet, du premier au dernier mot.
 *
 * La marge tient le registre : filet, numéros atteints, et une petite trace
 * qui va de la cellule de tableur au système relié. Elle reste secondaire, le
 * texte porte l'histoire.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { SafeBullet } from "@/components/branding/SafeLogo";
import { PageShell } from "./shared";

const CSS = `
  .ap {
    --ink: var(--si-ink);
    --muted: var(--si-muted);
    --faint: var(--si-subtle);
    --line: var(--si-line);
    --serif: var(--font-instrument-serif), Georgia, serif;
    --sans: var(--font-geist-sans), -apple-system, "Segoe UI", sans-serif;
    --mono: var(--font-geist-mono), ui-monospace, monospace;

    /* Échelle typographique de la page, déclarée en un seul endroit.

       La première version en comptait douze valeurs distinctes, ce qui se lit
       comme un empilement de décisions plutôt que comme un système. Il en reste
       cinq, plus la mono des étiquettes. Chaque taille porte un rôle : si deux
       éléments ont le même rôle, ils ont la même taille, et la hiérarchie entre
       eux passe par la couleur ou la famille.

       T4 sert à la fois au corps et au titre de chapitre une fois réduit : un
       titre déjà lu redevient une ligne de texte, distinguée par son encre
       pleine et non par un corps intermédiaire de plus. */
    --ap-t1: clamp(34px, 4.6vw, 56px);   /* titre de la page */
    --ap-t2: clamp(26px, 2.9vw, 38px);   /* titre de chapitre en cours */
    --ap-t3: clamp(19px, 1.9vw, 24px);   /* accents : phrases fortes, citation, domaines */
    --ap-t4: clamp(15px, 1.35vw, 17.5px);/* corps, constats, titre de chapitre lu */
    --ap-t5: 13px;                       /* marge : jalons et légende */

    background: var(--si-surface);
    color: var(--ink);
    /* Geist est la police principale du site : navigation, corps de texte,
       interface. La serif ne sert qu'aux titres et aux moments éditoriaux, la
       mono qu'aux étiquettes. C'est la répartition du reste des pages, et cette
       page la suit désormais au lieu de mettre toute sa prose en serif. */
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
  }

  .ap-inner {
    max-width: 1160px;
    margin: 0 auto;
    padding: clamp(72px, 11vh, 132px) min(6vw, 84px) clamp(80px, 12vh, 148px);
    display: grid;
    grid-template-columns: 168px minmax(0, 1fr);
    gap: clamp(28px, 5vw, 76px);
    align-items: start;
  }

  /* ── La marge ─────────────────────────────────────────────────────────────
     Elle ne disait pas ce qu'elle était : un dessin muet au-dessus d'une liste
     de titres. Elle a maintenant deux fonctions déclarées.

     La trace porte une légende qui la nomme à chaque étape. Un dessin qui passe
     d'une cellule à un système ne veut rien dire tant que personne ne l'a dit :
     c'est la légende qui fait la démonstration, pas le dessin.

     Les jalons deviennent le sommaire du récit. Cliquables, donc utiles : sur
     une page longue, un registre qui sait où sont les chapitres doit permettre
     d'y aller. */
  .ap-marge {
    position: sticky;
    top: clamp(96px, 16vh, 168px);
    display: grid;
    gap: 24px;
    padding-left: 15px;
    border-left: 1px solid var(--line);
  }
  .ap-etiquette {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--faint);
  }
  .ap-trace-bloc { display: grid; gap: 10px; }
  .ap-legende {
    font-size: var(--ap-t5);
    line-height: 1.3;
    color: var(--muted);
    transition: color 380ms ease;
  }
  .ap-jalons { display: grid; gap: 10px; list-style: none; }
  .ap-jalon a {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    align-items: baseline;
    gap: 10px;
    padding: 3px 0;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    color: var(--faint);
    transition: color 380ms ease;
  }
  /* Le titre du jalon est du texte, pas une étiquette : il quitte la mono du
     numéro qui le précède. */
  .ap-jalon .lb {
    font-family: var(--sans);
    font-size: var(--ap-t5);
    letter-spacing: 0;
    line-height: 1.3;
    color: var(--faint);
    transition: color 380ms ease;
  }
  /* Un chapitre atteint reste inscrit : c'est là que le récit s'accumule. */
  .ap-jalon.atteint a { color: var(--si-verified); }
  .ap-jalon.atteint .lb { color: var(--muted); }
  .ap-jalon.actif .lb { color: var(--ink); }
  .ap-jalon a:hover .lb, .ap-jalon a:focus-visible .lb { color: var(--ink); }

  /* La trace. Une cellule, puis une grille, puis des liens, puis des modules,
     puis le cadre qui les tient ensemble. Elle ne remplace jamais un état par
     un autre : elle s'ajoute, comme le récit. */
  .ap-trace { width: 58px; height: 58px; overflow: visible; }
  .ap-trace rect, .ap-trace line {
    opacity: 0;
    transition: opacity 460ms ease, stroke 460ms ease;
  }
  .ap-trace .t1 { opacity: 1; }
  .ap[data-etape="2"] .ap-trace .t2,
  .ap[data-etape="3"] .ap-trace .t2,
  .ap[data-etape="4"] .ap-trace .t2,
  .ap[data-etape="5"] .ap-trace .t2 { opacity: 1; }
  .ap[data-etape="3"] .ap-trace .t3,
  .ap[data-etape="4"] .ap-trace .t3,
  .ap[data-etape="5"] .ap-trace .t3 { opacity: 1; }
  .ap[data-etape="4"] .ap-trace .t4,
  .ap[data-etape="5"] .ap-trace .t4 { opacity: 1; }
  .ap[data-etape="5"] .ap-trace .t5 { opacity: 1; }

  /* ── Le récit ────────────────────────────────────────────────────────────── */
  .ap-recit { min-width: 0; }
  .ap-kicker {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--si-verified);
  }
  /* La famille est déclarée, pas héritée : une règle globale du site cible les
     titres et l'emporte sur l'héritage du conteneur, quelle que soit sa
     spécificité. Mesuré : sans cette ligne, le titre retombait sur Geist alors
     que toute la prose autour était en serif. */
  .ap-h1 {
    margin-top: 18px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--ap-t1);
    line-height: 1.06;
    letter-spacing: -0.024em;
    max-width: 15ch;
  }

  .ap-chap { margin-top: clamp(64px, 9vh, 112px); }
  .ap-chap:first-of-type { margin-top: clamp(38px, 5vh, 60px); }
  /* Hauteur figée au montage : la réduction du titre ne doit pas faire remonter
     tout ce qui suit sous les yeux du lecteur. */
  .ap-titre-zone { display: flex; align-items: flex-start; }
  .ap-titre {
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--ap-t2);
    line-height: 1.1;
    letter-spacing: -0.02em;
    max-width: 17ch;
    color: var(--ink);
    transition: font-size 440ms cubic-bezier(0.16, 1, 0.3, 1),
                color 380ms ease;
  }
  /* Réduction par la taille du texte, jamais par une mise à l'échelle : une
     lettre transformée devient molle pendant toute la course.

     Un titre déjà lu retombe au corps du texte. Il n'a pas besoin d'un palier
     intermédiaire à lui : son encre pleine suffit à le distinguer des
     paragraphes qui l'entourent. */
  .ap.anime .ap-chap.passe .ap-titre {
    font-size: var(--ap-t4);
    line-height: 1.4;
    color: var(--muted);
  }
  .ap-num {
    display: block;
    margin-bottom: 12px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    color: var(--si-verified);
  }

  .ap-p {
    margin-top: 22px;
    font-size: var(--ap-t4);
    line-height: 1.6;
    color: var(--muted);
    max-width: 54ch;
  }
  .ap-p:first-of-type { margin-top: 26px; }
  /* Les phrases qui portent le propos gardent l'encre pleine et passent à la
     serif : ce sont les moments éditoriaux du récit, comme les accents des
     chapitres de l'accueil. */
  .ap-fort {
    margin-top: 26px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--ap-t3);
    line-height: 1.26;
    letter-spacing: -0.014em;
    color: var(--ink);
    max-width: 30ch;
  }
  .ap-fort.deux-lignes { white-space: pre-line; }

  /* Les trois constats, et plus bas les trois effets du fichier.

     Ils portaient un tiret, qui se lit comme une rature. C'est le chevron de la
     marque qui les ouvre maintenant, celui-là même qui sert de puce sur la page
     Fonctionnalités. Une puce du site plutôt qu'un signe inventé pour cette
     page. */
  .ap-constats { margin-top: 26px; display: grid; gap: 13px; list-style: none; }
  .ap-constats li {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    align-items: baseline;
    gap: 12px;
    font-size: var(--ap-t4);
    line-height: 1.5;
    color: var(--muted);
    max-width: 52ch;
  }
  .ap-constats li .f {
    display: block;
    color: var(--si-verified);
    transform: translateY(0.1em);
  }

  .ap-cite {
    margin-top: 30px;
    padding-left: 22px;
    border-left: 2px solid rgb(var(--si-forest-rgb) / 0.28);
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--ap-t3);
    line-height: 1.34;
    letter-spacing: -0.012em;
    color: var(--ink);
    max-width: 40ch;
  }

  /* Les six domaines. Ils arrivent un par un et restent : un filet les relie à
     mesure, ce qui rend visible le mot « relier » de la phrase suivante. */
  .ap-mots {
    margin-top: 30px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 14px;
    list-style: none;
  }
  .ap-mots li {
    display: flex;
    align-items: center;
    gap: 14px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: var(--ap-t3);
    line-height: 1.6;
    letter-spacing: -0.012em;
    color: var(--ink);
  }
  .ap-mots li .lien {
    display: block;
    width: 0;
    height: 1px;
    background: var(--si-verified);
    opacity: 0.5;
    transition: width 520ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .ap.anime .ap-mots li.vu .lien { width: 18px; }
  .ap-mots li:last-child .lien { display: none; }

  .ap-fin { margin-top: clamp(56px, 8vh, 88px); }
  .ap-cta {
    display: inline-flex;
    align-items: center;
    height: 46px;
    padding: 0 24px;
    border-radius: 7px;
    background: var(--si-forest);
    color: var(--si-surface);
    /* Un bouton est de l'interface : sans, comme partout ailleurs sur le site. */
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 500;
    transition: background-color 160ms ease;
  }
  .ap-cta:hover { background: var(--si-forest-soft); }

  /* ── Le portrait ──────────────────────────────────────────────────────────
     Il arrive au chapitre 05, là où le récit passe à la première personne, et
     nulle part ailleurs. Assez grand pour qu'on voie le visage, pas au point
     de devenir le sujet : le script reste ce qu'on lit. */
  .ap-portrait {
    margin-top: 30px;
    display: grid;
    grid-template-columns: 168px minmax(0, 1fr);
    align-items: center;
    gap: 22px;
    max-width: 54ch;
  }
  .ap-portrait img {
    width: 168px;
    height: 210px;
    object-fit: cover;
    object-position: center top;
    border-radius: 10px;
    display: block;
  }
  /* Aucune légende ajoutée : ce sont les deux phrases du script qui tiennent ce
     rôle, à leur place et dans leur ordre. */
  .ap-portrait .ap-p:first-child { margin-top: 0; }

  /* Révélation. Le script pose la classe une fois : un passage raconté ne
     repart jamais. Sans script, tout est déjà lisible. */
  .ap.anime .rev {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 520ms ease, transform 560ms cubic-bezier(0.16, 1, 0.3, 1);
    will-change: opacity, transform;
  }
  .ap.anime .rev.vu { opacity: 1; transform: none; }

  @media (max-width: 860px) {
    .ap-inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 26px;
      padding: 84px min(6vw, 84px) 76px;
    }
    /* La marge passe au-dessus du récit et se met à l'horizontale : en colonne
       étroite, une colonne de service à gauche vole la largeur de lecture. */
    .ap-marge {
      position: static;
      padding-left: 0;
      padding-bottom: 20px;
      border-left: 0;
      border-bottom: 1px solid var(--line);
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 16px;
    }
    /* Au pouce, le sommaire se réduit à ses numéros : cinq titres à
       l'horizontale prendraient toute la première vue. La légende de la trace
       reste, c'est elle qui porte le sens. */
    .ap-jalons { grid-auto-flow: column; grid-auto-columns: max-content; gap: 14px; }
    .ap-jalon .lb { display: none; }
    .ap-trace-bloc { grid-auto-flow: column; align-items: center; gap: 12px; }
    .ap-trace { width: 44px; height: 44px; }
    .ap-etiquette { display: none; }
    .ap-h1 { max-width: none; }
    .ap-titre { max-width: none; }
    .ap-fort { max-width: none; }
    .ap-cite { padding-left: 16px; }
    /* Le portrait passe au-dessus de ses deux phrases : à 320 px, une image de
       168 px à côté du texte ne laisse plus de mesure de lecture. */
    .ap-portrait { grid-template-columns: minmax(0, 1fr); gap: 16px; max-width: none; }
    .ap-portrait img { width: 148px; height: 186px; }
  }

  @media (prefers-reduced-motion: reduce) {
    /* Sans mouvement, l'article se lit d'un trait : tout est présent, à sa
       taille de lecture, dans l'ordre exact du script. */
    .ap.anime .rev { opacity: 1; transform: none; }
    .ap.anime .ap-chap.passe .ap-titre {
      font-size: var(--ap-t2);
      line-height: 1.1;
      color: var(--ink);
    }
    .ap.anime .ap-mots li .lien { width: 18px; }
    .ap-marge { position: static; }
  }
`;

/**
 * Pilote le récit.
 *
 * Deux observateurs seulement, aucune boucle d'animation : la page est un
 * article, pas une scène. Le premier révèle chaque passage une fois pour
 * toutes, le second suit le chapitre en cours pour le registre de la marge et
 * pour la réduction du titre déjà lu.
 */
function runRecit(root: HTMLElement): () => void {
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("anime");

  const $$ = <T extends HTMLElement>(sel: string) =>
    Array.prototype.slice.call(root.querySelectorAll(sel)) as T[];

  const chapitres = $$(".ap-chap");
  const jalons = $$(".ap-jalon");
  const legende = root.querySelector<HTMLElement>(".ap-legende");
  const titres = $$<HTMLElement>(".ap-titre");
  const zones = $$<HTMLElement>(".ap-titre-zone");

  /* La hauteur du titre est figée à sa taille de lecture avant toute
     réduction. Sans cela, réduire un titre déjà lu ferait remonter tout ce qui
     le suit, et la page sauterait sous les yeux. */
  function figerHauteurs() {
    zones.forEach((zone, i) => {
      zone.style.minHeight = "";
      const t = titres[i];
      if (!t) return;
      const etait = t.style.fontSize;
      t.style.fontSize = "";
      zone.style.minHeight = Math.ceil(t.getBoundingClientRect().height) + "px";
      t.style.fontSize = etait;
    });
  }
  figerHauteurs();
  document.fonts?.ready.then(figerHauteurs).catch(() => {});

  const observateurs: IntersectionObserver[] = [];

  /* ── Révélation des passages ── */
  const aReveler = $$(".rev");
  if ("IntersectionObserver" in window && !reduit) {
    const io = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("vu");
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
    );
    aReveler.forEach((el) => io.observe(el));
    observateurs.push(io);
  } else {
    aReveler.forEach((el) => el.classList.add("vu"));
  }

  /* ── Chapitre en cours ── */
  function poser(index: number) {
    chapitres.forEach((ch, i) => ch.classList.toggle("passe", i < index));
    jalons.forEach((j, i) => {
      j.classList.toggle("atteint", i <= index);
      j.classList.toggle("actif", i === index);
    });
    /* La trace suit le récit : elle gagne un état par chapitre atteint, et sa
       légende le nomme. */
    root.dataset.etape = String(index + 1);
    if (legende) legende.textContent = LEGENDES[index] || "";
  }
  poser(0);

  let courant = 0;
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = chapitres.indexOf(e.target as HTMLElement);
          /* On n'avance jamais à reculons : un chapitre déjà raconté reste
             acquis, même si on remonte pour le relire. */
          if (i > courant) { courant = i; poser(i); }
        });
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    );
    chapitres.forEach((ch) => io.observe(ch));
    observateurs.push(io);
  } else {
    poser(chapitres.length - 1);
  }

  const onResize = () => figerHauteurs();
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    observateurs.forEach((io) => io.disconnect());
    window.removeEventListener("resize", onResize);
    root.classList.remove("anime");
  };
}

const JALONS = [
  { id: "recit-01", titre: "Tout a commencé dans un cabinet." },
  { id: "recit-02", titre: "Alors, j'ai commencé simplement." },
  { id: "recit-03", titre: "Excel est devenu SAFE." },
  { id: "recit-04", titre: "Le produit a changé. L'idée, non." },
  { id: "recit-05", titre: "Et l'histoire ne fait que commencer." },
];

/* Ce que montre la trace, dit en clair. Un dessin qui passe d'une cellule à un
   système ne démontre rien tant que personne ne l'a nommé : c'est la légende
   qui fait la démonstration. Elle décrit le dessin, elle n'ajoute aucune
   affirmation sur le produit. */
const LEGENDES = [
  "Une cellule",
  "Une grille",
  "Des liens",
  "Des modules",
  "Un système",
];

const DOMAINES = ["Temps.", "Facturation.", "Paiements.", "Fidéicommis.", "Comptabilité.", "Rapports."];

export default function AProposPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    return runRecit(rootRef.current);
  }, []);

  return (
    <PageShell>
      <div className="ap" ref={rootRef} data-etape="1">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        <div className="ap-inner">
          {/* La marge a deux fonctions déclarées : nommer ce que la trace
              montre, et servir de sommaire navigable du récit. Elle n'est plus
              masquée aux lecteurs d'écran, puisqu'elle porte maintenant du sens
              et des liens. */}
          <aside className="ap-marge" aria-label="Sommaire du récit">
            <div className="ap-trace-bloc">
            <svg className="ap-trace" viewBox="0 0 58 58" fill="none" aria-hidden="true">
              {/* 01 · la cellule */}
              <rect className="t1" x="1" y="1" width="17" height="13" rx="2"
                stroke="var(--si-verified)" strokeWidth="1" />
              {/* 02 · la grille */}
              <rect className="t2" x="21" y="1" width="17" height="13" rx="2"
                stroke="var(--si-subtle)" strokeWidth="1" />
              <rect className="t2" x="1" y="17" width="17" height="13" rx="2"
                stroke="var(--si-subtle)" strokeWidth="1" />
              <rect className="t2" x="21" y="17" width="17" height="13" rx="2"
                stroke="var(--si-subtle)" strokeWidth="1" />
              {/* 03 · ce qui relie */}
              <line className="t3" x1="18" y1="7.5" x2="21" y2="7.5"
                stroke="var(--si-verified)" strokeWidth="1" />
              <line className="t3" x1="9.5" y1="14" x2="9.5" y2="17"
                stroke="var(--si-verified)" strokeWidth="1" />
              <line className="t3" x1="29.5" y1="14" x2="29.5" y2="17"
                stroke="var(--si-verified)" strokeWidth="1" />
              {/* 04 · les modules */}
              <rect className="t4" x="41" y="1" width="16" height="13" rx="2"
                stroke="var(--si-subtle)" strokeWidth="1" />
              <rect className="t4" x="41" y="17" width="16" height="13" rx="2"
                stroke="var(--si-subtle)" strokeWidth="1" />
              <line className="t4" x1="38" y1="7.5" x2="41" y2="7.5"
                stroke="var(--si-verified)" strokeWidth="1" />
              <line className="t4" x1="38" y1="23.5" x2="41" y2="23.5"
                stroke="var(--si-verified)" strokeWidth="1" />
              {/* 05 · le système qui les tient */}
              <rect className="t5" x="-3" y="-3" width="64" height="37" rx="6"
                stroke="var(--si-verified)" strokeWidth="1" strokeOpacity="0.5" />
            </svg>
              {/* Ce que le dessin montre, dit en clair. Sans cette ligne, la
                  trace n'est qu'un motif. */}
              <p className="ap-legende">Une cellule</p>
            </div>

            <div>
              <p className="ap-etiquette">Le récit</p>
              <ol className="ap-jalons" style={{ marginTop: 12 }}>
                {JALONS.map((j, i) => (
                  <li className="ap-jalon" key={j.id}>
                    <a href={`#${j.id}`}>
                      {String(i + 1).padStart(2, "0")}
                      <span className="lb">{j.titre}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <div className="ap-recit">
            {/* ── Ouverture ── */}
            <p className="ap-kicker rev">À propos de SAFE</p>
            <h1 className="ap-h1 rev">Le logiciel s&apos;adapte au cabinet. Pas l&apos;inverse.</h1>
            <p className="ap-p rev">SAFE n&apos;est pas né d&apos;une idée de logiciel.</p>
            <p className="ap-p rev">
              Il est né d&apos;un problème très concret, observé dans le quotidien d&apos;un
              cabinet juridique.
            </p>

            {/* ── 01 ── */}
            <section className="ap-chap" id="recit-01">
              <div className="ap-titre-zone">
                <h2 className="ap-titre rev">
                  <span className="ap-num">01</span>
                  Tout a commencé dans un cabinet.
                </h2>
              </div>
              <p className="ap-p rev">Le travail juridique avançait.</p>
              <p className="ap-p rev">Mais derrière, la gestion suivait difficilement.</p>
              <ul className="ap-constats">
                <li className="rev"><span className="f" aria-hidden><SafeBullet size={10} /></span>Des informations devaient être saisies plusieurs fois.</li>
                <li className="rev"><span className="f" aria-hidden><SafeBullet size={10} /></span>Certaines se perdaient entre les étapes.</li>
                <li className="rev"><span className="f" aria-hidden><SafeBullet size={10} /></span>Des tâches administratives prenaient du temps sans jamais être facturées.</li>
              </ul>
              <p className="ap-p rev">Les outils existaient.</p>
              <p className="ap-fort rev">
                Mais aucun ne semblait vraiment comprendre la façon dont le cabinet travaillait.
              </p>
            </section>

            {/* ── 02 ── */}
            <section className="ap-chap" id="recit-02">
              <div className="ap-titre-zone">
                <h2 className="ap-titre rev">
                  <span className="ap-num">02</span>
                  Alors, j&apos;ai commencé simplement.
                </h2>
              </div>
              <p className="ap-p rev">Pas avec une application.</p>
              <p className="ap-fort rev">Avec un fichier Excel.</p>
              <p className="ap-p rev">L&apos;objectif était très concret :</p>
              <blockquote className="ap-cite rev">
                Organiser le travail autour du cabinet, plutôt que demander au cabinet de
                s&apos;organiser autour de son logiciel.
              </blockquote>
              <p className="ap-p rev">Petit à petit, le fichier a évolué.</p>
              <ul className="ap-constats">
                <li className="rev"><span className="f" aria-hidden><SafeBullet size={10} /></span>Les tâches ont été reliées.</li>
                <li className="rev"><span className="f" aria-hidden><SafeBullet size={10} /></span>Les informations ont commencé à circuler.</li>
                <li className="rev"><span className="f" aria-hidden><SafeBullet size={10} /></span>Les opérations sont devenues plus structurées.</li>
              </ul>
              <p className="ap-p rev">Et une idée est devenue évidente :</p>
              <p className="ap-fort rev">Ce système pouvait aller beaucoup plus loin.</p>
            </section>

            {/* ── 03 ── */}
            <section className="ap-chap" id="recit-03">
              <div className="ap-titre-zone">
                <h2 className="ap-titre rev">
                  <span className="ap-num">03</span>
                  Excel est devenu SAFE.
                </h2>
              </div>
              <p className="ap-p rev">
                Ce qui était au départ un outil conçu pour répondre aux besoins d&apos;un cabinet
                est progressivement devenu un véritable logiciel.
              </p>
              <ul className="ap-mots">
                {DOMAINES.map((mot) => (
                  <li className="rev" key={mot}>
                    {mot}
                    <i className="lien" aria-hidden />
                  </li>
                ))}
              </ul>
              <p className="ap-fort rev">
                Un même système pour relier ce qui était auparavant dispersé.
              </p>
            </section>

            {/* ── 04 ── */}
            <section className="ap-chap" id="recit-04">
              <div className="ap-titre-zone">
                <h2 className="ap-titre rev">
                  <span className="ap-num">04</span>
                  Le produit a changé. L&apos;idée, non.
                </h2>
              </div>
              <p className="ap-p rev">
                Aujourd&apos;hui, SAFE va bien plus loin que son premier fichier Excel.
              </p>
              <p className="ap-p rev">Mais son principe reste le même :</p>
              <p className="ap-fort deux-lignes rev">
                {"Le logiciel doit comprendre le cabinet.\nPas l'inverse."}
              </p>
              <p className="ap-p rev">
                C&apos;est pourquoi SAFE est pensé pour s&apos;adapter aux réalités des
                différentes pratiques juridiques plutôt que d&apos;imposer une façon unique de
                travailler.
              </p>
            </section>

            {/* ── 05 ── */}
            <section className="ap-chap" id="recit-05">
              <div className="ap-titre-zone">
                <h2 className="ap-titre rev">
                  <span className="ap-num">05</span>
                  Et l&apos;histoire ne fait que commencer.
                </h2>
              </div>
              {/* Le portrait arrive là où le récit passe à la première
                  personne. Les deux phrases du script l'accompagnent telles
                  quelles : rien n'est ajouté pour légender l'image. */}
              <div className="ap-portrait rev">
                <Image
                  src="/images/fondateur/portrait.jpg"
                  alt="Jérémie Tiahou, fondateur de SAFE"
                  width={168}
                  height={210}
                  sizes="168px"
                />
                <div>
                  <p className="ap-p">Je suis Jérémie Tiahou.</p>
                  <p className="ap-p">
                    Ma formation est en administration et en comptabilité de petite entreprise.
                  </p>
                </div>
              </div>
              <p className="ap-p rev">
                SAFE est né à la rencontre de cette expérience et de ce que j&apos;ai observé
                directement dans les opérations quotidiennes d&apos;un cabinet.
              </p>
              <p className="ap-p rev">
                Je n&apos;ai pas commencé avec l&apos;ambition de créer « un autre logiciel
                juridique ».
              </p>
              <p className="ap-fort rev">J&apos;ai commencé avec un problème à résoudre.</p>
              <p className="ap-p rev">
                Et c&apos;est encore comme ça que nous construisons SAFE aujourd&apos;hui.
              </p>
            </section>

            {/* Une seule action, après le récit. Elle ne l'interrompt pas. */}
            <div className="ap-fin rev">
              <a className="ap-cta" href="/audit-gratuit">Faire le diagnostic</a>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
