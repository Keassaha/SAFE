"use client";

/**
 * Expérience cinématique de la page d'accueil.
 * Port React du prototype public/experience-cinema.html (journal 2026-07-25).
 * Scroll piloté : assemblage → vraie capture, rapprochement, facture, Navette.
 * Maquette navigable (fiche client → dossier) et brassage des papiers au curseur.
 */

import { useEffect, useRef, useState } from "react";
import { SafeLogo } from "@/components/branding/SafeLogo";

const CSS = `
  .xc {
    --bg: #EFF2ED;
    --surface: #FBFCFA;
    --ink: #1F2A24;
    --muted: #5A665F;
    --faint: #7C877F;
    --green: #12A150;
    --forest: #1F3A2E;
    --verified: #1F6A47;
    --amber: #8A6A1E;
    --line: rgba(31, 42, 36, 0.08);
    --line-soft: rgba(31, 42, 36, 0.05);
    --serif: var(--font-instrument-serif), Georgia, serif;
    --sans: var(--font-geist-sans), -apple-system, "Segoe UI", sans-serif;
    --mono: var(--font-geist-mono), ui-monospace, monospace;
    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    overflow-x: clip;
  }

  .xc a { color: inherit; text-decoration: none; }
  .xc img { display: block; max-width: 100%; }

  .xc .kicker {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--green);
  }

  .xc #nav {
    position: fixed;
    inset: 0 0 auto 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 0 min(4vw, 44px);
    height: 60px;
    background: rgba(239, 242, 237, 0.86);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .xc #nav .brand {
    display: inline-flex;
    align-items: center;
    color: var(--ink);
  }
  .xc #nav .links { display: flex; gap: 26px; font-size: 13px; color: var(--muted); }
  .xc #nav .links a:hover { color: var(--ink); }
  .xc #nav .navright { display: flex; align-items: center; gap: 18px; }
  .xc #nav .signin { font-size: 13px; color: var(--muted); }
  .xc #nav .signin:hover { color: var(--ink); }
  .xc #nav .cta {
    display: inline-flex;
    align-items: center;
    height: 34px;
    padding: 0 16px;
    border-radius: 7px;
    background: var(--green);
    color: #fff;
    font-size: 13px;
    font-weight: 500;
  }

  .xc #rail {
    position: fixed;
    right: 22px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: 18px;
    opacity: 0;
    transition: opacity 0.8s ease;
    pointer-events: none;
  }
  .xc #rail.on { opacity: 1; }
  .xc #rail .stop {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--faint);
  }
  .xc #rail .stop span { opacity: 0; transition: opacity 0.65s ease; }
  /* un tiret par étape : celui de l'étape en cours s'allonge et se nomme */
  .xc #rail .stop i {
    width: 12px; height: 1.5px;
    border-radius: 2px;
    background: var(--faint);
    opacity: 0.4;
    transition: width 0.65s cubic-bezier(0.16, 1, 0.3, 1), background 0.65s ease, opacity 0.65s ease;
  }
  .xc #rail .stop.live span { opacity: 1; color: var(--muted); }
  .xc #rail .stop.live i { width: 26px; background: var(--green); opacity: 1; }

  .xc .pinzone { position: relative; }
  .xc .pinzone .pin {
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100svh;
    overflow: hidden;
  }

  .xc #zone-hero { height: 420vh; }
  .xc #hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .xc #hero-shot {
    position: absolute;
    opacity: 0;
    border-radius: 14px;
    box-shadow: 0 46px 90px -46px rgba(11, 31, 25, 0.55);
    border: 1px solid var(--line);
    object-fit: cover;
    will-change: opacity;
  }
  .xc #hero-copy {
    position: absolute;
    left: 0; right: 0;
    top: 17vh;
    padding: 0 min(6vw, 84px);
    max-width: 1240px;
    margin: 0 auto;
    will-change: transform, opacity;
  }
  .xc #hero-copy h1 {
    margin-top: 20px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: clamp(44px, 7.4vw, 92px);
    line-height: 0.99;
    letter-spacing: -0.026em;
    max-width: 14ch;
  }
  .xc #hero-copy h1 em { font-style: italic; color: var(--green); }
  .xc #hero-copy p.lede {
    margin-top: 26px;
    max-width: 52ch;
    font-size: clamp(15px, 1.35vw, 18px);
    line-height: 1.62;
    color: var(--muted);
  }
  .xc #hero-hint {
    position: absolute;
    left: 0; right: 0;
    bottom: 4.5vh;
    text-align: center;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--faint);
    transition: opacity 0.4s ease;
  }
  .xc #hero-caption {
    position: absolute;
    left: 0; right: 0;
    bottom: 5.5vh;
    text-align: center;
    font-size: 13px;
    color: var(--muted);
    opacity: 0;
    will-change: opacity, transform;
  }

  .xc #preuves {
    display: flex;
    padding: 20px min(6vw, 84px);
    max-width: 1240px;
    margin: 0 auto;
    font-size: 12.5px;
    color: var(--muted);
    overflow: hidden;
  }
  /* Au large : les quatre preuves tiennent sur une ligne, réparties.
     Au téléphone (voir la requête média) : bande qui défile toute seule,
     un seul rang lisible au lieu de quatre libellés à l'étroit. */
  .xc .pv-track {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
  }
  .xc .pv-track.clone { display: none; }
  .xc #preuves span { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
  .xc #preuves i { width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex: none; }
  .xc .strip { background: var(--surface); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }

  .xc #systeme { padding: clamp(84px, 12vh, 150px) min(6vw, 84px); }
  .xc #systeme .inner { max-width: 1240px; margin: 0 auto; }
  .xc #systeme .head { display: grid; gap: 22px; grid-template-columns: 1fr 0.9fr; align-items: end; }
  .xc #systeme h2 {
    margin-top: 16px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: clamp(32px, 3.6vw, 48px);
    line-height: 1.06;
    letter-spacing: -0.02em;
    max-width: 14ch;
  }
  .xc #systeme .head p { max-width: 52ch; font-size: 16px; line-height: 1.65; color: var(--muted); }
  .xc #systeme .shot {
    margin-top: 52px;
    transform: translateY(36px) scale(0.985);
    opacity: 0;
    transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s ease;
  }
  .xc #systeme .shot.seen { transform: none; opacity: 1; }
  .xc #systeme .after { margin-top: 18px; font-size: 13px; color: var(--verified); }

  .xc #demo {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: 0 40px 80px -44px rgba(11, 31, 25, 0.5);
    overflow: hidden;
  }
  .xc #demo .bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: var(--forest);
    color: #E9EFE9;
    font-size: 12.5px;
  }
  .xc #demo .bar .crumb { display: flex; align-items: center; gap: 8px; }
  .xc #demo .bar .crumb b { font-weight: 500; }
  .xc #demo .bar .crumb .sep { opacity: 0.45; }
  .xc #demo .bar .hint {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #9FD5B4;
  }
  .xc #demo .stage { position: relative; min-height: 470px; }
  .xc #demo .screen {
    position: absolute;
    inset: 0;
    padding: 24px 26px;
    opacity: 0;
    transform: translateX(26px);
    pointer-events: none;
    transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-y: auto;
  }
  .xc #demo .screen.on { opacity: 1; transform: none; pointer-events: auto; }
  .xc #demo .screen.off-left { transform: translateX(-26px); }

  .xc #demo h3 { font-family: var(--serif); font-weight: 400; font-size: 22px; }
  .xc #demo .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 11px;
    background: rgba(18, 161, 80, 0.1);
    color: var(--verified);
  }
  .xc #demo .pill.gray { background: rgba(31, 42, 36, 0.06); color: var(--muted); }
  .xc #demo .pill i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

  .xc #demo .client-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 26px; }
  .xc #demo .panel { border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px; background: #fff; }
  .xc #demo .panel + .panel { margin-top: 14px; }
  .xc #demo .panel .ptitle {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--faint);
  }
  .xc #demo .id-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
  .xc #demo .kv { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line-soft); font-size: 13px; }
  .xc #demo .kv:last-child { border-bottom: 0; }
  .xc #demo .kv .k { color: var(--muted); }
  .xc #demo .kv .v { text-align: right; color: var(--ink); }
  .xc #demo .kv .v.num { font-family: var(--mono); }
  .xc #demo .dossier-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 12px;
    padding: 13px 14px;
    margin: 0 -14px;
    border-radius: 9px;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  /* la ligne ouvrable se signale : bord vert, fond teinté, léger relief */
  .xc #demo .dossier-row[data-goto] {
    border: 1px solid rgba(18, 161, 80, 0.4);
    background: rgba(18, 161, 80, 0.05);
    margin: 6px -14px;
  }
  .xc #demo .dossier-row[data-goto]:hover {
    background: rgba(18, 161, 80, 0.1);
    transform: translateY(-1px);
    box-shadow: 0 12px 26px -18px rgba(11, 31, 25, 0.5);
  }
  .xc #demo .dossier-row:hover { background: rgba(18, 161, 80, 0.06); }
  /* le libellé d'action devient un bouton plein, impossible à rater */
  .xc #demo .dossier-row[data-goto] .go {
    background: var(--green);
    color: #fff;
    border-radius: 999px;
    padding: 7px 14px;
    font-weight: 500;
    transition: transform 0.2s ease;
  }
  .xc #demo .dossier-row[data-goto]:hover .go { transform: translateX(2px); }
  .xc #demo .bar .hint {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .xc #demo .bar .hint::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9FD5B4;
    animation: xcpulse 1.8s ease-in-out infinite;
  }
  @keyframes xcpulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(1.5); }
  }
  .xc #demo .dossier-row .num { font-family: var(--mono); font-size: 12px; color: var(--faint); }
  .xc #demo .dossier-row .titre { font-size: 13.5px; color: var(--ink); }
  .xc #demo .dossier-row .go {
    grid-row: span 2;
    align-self: center;
    font-size: 12.5px;
    color: var(--green);
    font-weight: 500;
    white-space: nowrap;
  }
  .xc #demo .dossier-row.closed { cursor: default; }
  .xc #demo .dossier-row.closed:hover { background: transparent; }
  .xc #demo .dossier-row.closed .titre { color: var(--muted); }

  .xc #demo .doss-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; }
  .xc #demo .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--muted);
    cursor: pointer;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 5px 12px;
    background: #fff;
    transition: color 0.2s ease, border-color 0.2s ease;
  }
  .xc #demo .back:hover { color: var(--ink); border-color: rgba(31, 42, 36, 0.2); }
  .xc #demo .doss-head .who { margin-left: auto; font-size: 12px; color: var(--faint); }
  .xc #demo .tabs { display: flex; gap: 4px; margin-top: 16px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .xc #demo .tab {
    padding: 9px 14px;
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.2s ease;
  }
  .xc #demo .tab:hover { color: var(--ink); }
  .xc #demo .tab.on { color: var(--ink); border-bottom-color: var(--green); }
  .xc #demo .tabpane { display: none; padding-top: 16px; }
  .xc #demo .tabpane.on { display: block; }
  .xc #demo .apercu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .xc #demo .stat { border: 1px solid var(--line); border-radius: 10px; padding: 13px 15px; background: #fff; }
  .xc #demo .stat .lbl { font-size: 11.5px; color: var(--faint); }
  .xc #demo .stat .val { margin-top: 3px; font-size: 15px; color: var(--ink); }
  .xc #demo .stat .val.num { font-family: var(--mono); }
  .xc #demo table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .xc #demo th {
    text-align: left;
    font-weight: 500;
    font-size: 11.5px;
    color: var(--faint);
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .xc #demo th.num, .xc #demo td.num { text-align: right; font-family: var(--mono); }
  .xc #demo td { padding: 10px 0; border-bottom: 1px solid var(--line-soft); color: var(--ink); vertical-align: top; }
  .xc #demo td .sub { display: block; font-size: 11.5px; color: var(--faint); margin-top: 2px; }
  .xc #demo tr.total td { border-bottom: 0; font-weight: 500; }
  .xc #demo .note { margin-top: 12px; font-size: 12px; color: var(--verified); }

  .xc .story .pin { display: grid; align-content: center; padding: 0 min(6vw, 84px); }
  .xc .story .grid {
    max-width: 1160px;
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    gap: clamp(32px, 5vw, 76px);
    align-items: center;
  }
  .xc .story.reverse .grid { grid-template-columns: 1.08fr 0.92fr; }
  .xc .story h2 {
    margin-top: 18px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: clamp(30px, 3.3vw, 44px);
    line-height: 1.08;
    letter-spacing: -0.018em;
    max-width: 15ch;
  }
  .xc .story p.body {
    margin-top: 20px;
    max-width: 48ch;
    font-size: clamp(14px, 1.2vw, 16px);
    line-height: 1.65;
    color: var(--muted);
  }
  .xc .story p.result {
    margin-top: 24px;
    padding-left: 16px;
    border-left: 2px solid var(--green);
    font-size: 14px;
    line-height: 1.55;
    max-width: 44ch;
  }

  .xc #zone-verifier { height: 340vh; }
  .xc #zone-encaisser { height: 360vh; }
  .xc #zone-collaborer { height: 340vh; }

  .xc #rapprochement {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 26px 28px;
    box-shadow: 0 30px 60px -38px rgba(11, 31, 25, 0.5);
  }
  .xc #rapprochement .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--line);
    padding-bottom: 15px;
  }
  .xc #rapprochement .head span:first-child { font-size: 13.5px; }
  .xc #rapprochement .head span:last-child { font-family: var(--mono); font-size: 11px; color: var(--faint); }
  .xc #rapprochement .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--line-soft);
    will-change: transform, opacity;
  }
  .xc #rapprochement .row .lbl { font-size: 13.5px; color: var(--muted); }
  .xc #rapprochement .row .amt { display: flex; align-items: center; gap: 9px; font-family: var(--mono); font-size: 14px; }
  .xc #rapprochement .row .amt i {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--green);
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }
  .xc #rapprochement .row.gap .amt { color: #9A6712; }
  .xc #rapprochement .row.gap .amt i { background: #C38A24; box-shadow: 0 0 0 5px rgba(195, 138, 36, 0.10); }
  .xc #rapprochement .row.gap.ok .amt { color: var(--ink); }
  .xc #rapprochement .row.gap.ok .amt i { background: var(--green); box-shadow: none; }
  .xc #rapprochement .banners { position: relative; margin-top: 18px; min-height: 46px; }
  .xc #rapprochement .banner {
    position: absolute;
    inset: 0 0 auto 0;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border-radius: 9px;
    padding: 12px 15px;
    font-size: 12px;
    line-height: 1.5;
    opacity: 0;
    will-change: opacity, transform;
  }
  .xc #rapprochement .banner.warn { background: rgba(195, 138, 36, 0.08); color: #72531B; }
  .xc #rapprochement .banner.okay { background: rgba(18, 161, 80, 0.09); color: var(--verified); }
  .xc #rapprochement .banner i {
    flex: none;
    width: 7px; height: 7px;
    margin-top: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  .xc #facture-wrap { position: relative; }
  .xc #facture {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 30px 32px 26px;
    box-shadow: 0 30px 60px -38px rgba(11, 31, 25, 0.5);
    position: relative;
    overflow: hidden;
  }
  .xc #facture .fhead { display: flex; justify-content: space-between; align-items: baseline; }
  .xc #facture .fhead .t { font-family: var(--serif); font-size: 25px; }
  .xc #facture .fhead .d { font-family: var(--mono); font-size: 11px; color: var(--faint); }
  .xc #facture .fsub {
    margin-top: 6px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--line);
    font-size: 12.5px;
    color: var(--muted);
  }
  .xc #facture .fline {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--line-soft);
    font-size: 13px;
    will-change: transform, opacity;
  }
  .xc #facture .fline .desc { color: var(--ink); }
  .xc #facture .fline .sub { display: block; margin-top: 2px; font-size: 11.5px; color: var(--faint); }
  .xc #facture .fline .amt { font-family: var(--mono); font-size: 13px; white-space: nowrap; }
  .xc #facture .ftotals { margin-top: 14px; margin-left: auto; max-width: 300px; }
  .xc #facture .trow { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12.5px; color: var(--muted); }
  .xc #facture .trow .amt { font-family: var(--mono); color: var(--ink); }
  .xc #facture .trow.grand {
    margin-top: 8px;
    padding-top: 11px;
    border-top: 1px solid var(--line);
    font-size: 14px;
    color: var(--ink);
  }
  .xc #facture .trow.grand .amt { font-size: 17px; }
  .xc #facture .stamp {
    position: absolute;
    left: 34px;
    bottom: 46px;
    padding: 7px 16px;
    border: 2px solid var(--green);
    border-radius: 8px;
    color: var(--green);
    font-family: var(--mono);
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transform: rotate(-8deg) scale(1.6);
    opacity: 0;
    will-change: transform, opacity;
  }
  .xc .chip {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 7px 14px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    box-shadow: 0 14px 28px -18px rgba(11, 31, 25, 0.4);
    white-space: nowrap;
    will-change: transform, opacity;
    opacity: 0;
  }
  .xc .chip i { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }

  .xc #navette { position: relative; height: min(58vh, 460px); }
  .xc .nav-card {
    position: absolute;
    left: 8%;
    width: min(72%, 330px);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 14px 16px;
    box-shadow: 0 22px 44px -30px rgba(11, 31, 25, 0.45);
    will-change: transform, opacity;
  }
  .xc .nav-card .tag {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .xc .nav-card .txt { display: block; margin-top: 5px; font-size: 13px; color: var(--ink); }
  .xc .nav-card .who { display: block; margin-top: 4px; font-size: 11.5px; color: var(--faint); }
  .xc #decision {
    position: absolute;
    right: 0;
    top: 68%;
    width: min(58%, 300px);
    background: var(--forest);
    color: #F4F7F3;
    border-radius: 12px;
    padding: 16px 18px;
    box-shadow: 0 30px 60px -34px rgba(11, 31, 25, 0.7);
    will-change: transform, opacity;
  }
  .xc #decision .tag { color: #9FD5B4; display: block; }
  /* sans display block, « Pour l'avocat » et le titre se collaient */
  .xc #decision .txt { color: #F4F7F3; font-size: 13.5px; display: block; margin-top: 5px; }
  .xc #decision .sub { margin-top: 8px; font-size: 11.5px; color: rgba(244, 247, 243, 0.62); line-height: 1.5; }

  .xc section.flat { padding: clamp(84px, 12vh, 150px) min(6vw, 84px); }
  .xc section.flat .inner { max-width: 1100px; margin: 0 auto; }
  .xc section.flat.surface { background: var(--surface); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }

  .xc #tarifs .head h2 {
    margin-top: 14px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: clamp(30px, 3.4vw, 46px);
    line-height: 1.08;
  }
  .xc #tarifs .plan {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
  }
  .xc #tarifs .plan:first-of-type { margin-top: 34px; border-top: 1px solid var(--line); }
  .xc #tarifs .plan .name { font-size: 15px; }
  .xc #tarifs .plan .detail { margin-top: 4px; font-size: 13px; color: var(--muted); }
  .xc #tarifs .plan .price { font-family: var(--mono); font-size: 25px; text-align: right; }
  .xc #tarifs .plan .price small { font-family: var(--sans); font-size: 11px; color: var(--faint); margin-left: 4px; }
  .xc #tarifs .note { margin-top: 18px; font-size: 12.5px; color: var(--faint); }
  .xc #tarifs .more { margin-top: 18px; font-size: 13.5px; display: inline-block; color: var(--ink); }

  .xc #questions .q {
    display: grid;
    grid-template-columns: 0.86fr 1.14fr;
    gap: 18px;
    padding: 26px 0;
    border-top: 1px solid var(--line);
  }
  .xc #questions .q h3 { font-family: var(--serif); font-weight: 400; font-size: 20px; line-height: 1.35; }
  .xc #questions .q p { max-width: 58ch; font-size: 14px; line-height: 1.65; color: var(--muted); }
  .xc #questions h2 {
    margin-top: 14px;
    font-family: var(--serif);
    font-weight: 400;
    font-size: clamp(30px, 3.4vw, 46px);
    line-height: 1.08;
    max-width: 16ch;
  }
  .xc #questions .more { margin-top: 16px; font-size: 13.5px; display: inline-block; color: var(--ink); }

  .xc #cta { text-align: center; }
  .xc #cta h2 {
    margin: 18px auto 0;
    font-family: var(--serif);
    font-weight: 400;
    font-size: clamp(34px, 4.6vw, 56px);
    line-height: 1.05;
    letter-spacing: -0.02em;
    max-width: 18ch;
  }
  .xc #cta p { margin: 22px auto 0; max-width: 50ch; font-size: 16px; line-height: 1.65; color: var(--muted); }
  .xc #cta .actions { margin-top: 34px; display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; }
  .xc .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    padding: 0 24px;
    border-radius: 7px;
    background: var(--green);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 14px 28px -18px rgba(18, 161, 80, 0.85);
    transition: transform 0.2s ease;
  }
  .xc .btn:hover { transform: translateY(-2px); }
  .xc .btn.ghost { background: transparent; color: var(--ink); box-shadow: none; }

  .xc footer {
    padding: 34px min(6vw, 84px) 44px;
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--faint);
  }
  .xc footer .flinks { display: flex; gap: 18px; flex-wrap: wrap; }
  .xc footer .fbrand { display: inline-flex; align-items: center; gap: 12px; }
  .xc footer a:hover { color: var(--ink); }

  /* ── Bouton et panneau de navigation au téléphone ── */
  .xc #burger {
    display: none;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    cursor: pointer;
    color: var(--ink);
  }
  .xc #burger span { display: block; width: 19px; }
  .xc #burger i {
    display: block;
    height: 1.6px;
    background: currentColor;
    border-radius: 2px;
    transition: transform 0.25s ease, opacity 0.2s ease;
  }
  .xc #burger i + i { margin-top: 4.5px; }
  .xc #burger span.ouvert i:nth-child(1) { transform: translateY(6.1px) rotate(45deg); }
  .xc #burger span.ouvert i:nth-child(2) { opacity: 0; }
  .xc #burger span.ouvert i:nth-child(3) { transform: translateY(-6.1px) rotate(-45deg); }

  .xc #voile {
    position: fixed;
    inset: 0;
    z-index: 55;
    border: 0;
    background: rgba(11, 31, 25, 0.4);
    animation: xcFade 0.25s ease;
  }
  .xc #menu-mobile {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    z-index: 60;
    padding: 6px min(6vw, 44px) 26px;
    background: var(--bg);
    border-bottom: 1px solid var(--line);
    box-shadow: 0 24px 48px -28px rgba(11, 31, 25, 0.45);
    animation: xcSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .xc #menu-mobile a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 56px;
    border-bottom: 1px solid var(--line);
    font-size: 17px;
    color: var(--ink);
  }
  .xc #menu-mobile a span { color: var(--faint); }
  .xc #menu-mobile .mm-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 20px;
  }
  .xc #menu-mobile .mm-actions a {
    justify-content: center;
    min-height: 48px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    font-size: 15px;
  }
  /* sélecteur aussi spécifique que la règle générique juste au-dessus, sinon le
     fond vert du bouton était écrasé et le libellé blanc devenait invisible */
  .xc #menu-mobile .mm-actions a.mm-cta {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
    font-weight: 500;
  }
  @keyframes xcFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes xcSlide { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }
  @keyframes xcMarquee { from { transform: translateX(0); } to { transform: translateX(-100%); } }

  @media (max-width: 860px) {
    .xc #rail, .xc #nav .links, .xc #nav .signin, .xc #nav .cta { display: none; }
    .xc #burger { display: inline-flex; }
    .xc #nav { justify-content: space-between; }
    /* rien sous 11 px au doigt : les libellés de la maquette et l'indice de défilement */
    .xc #demo .panel .ptitle,
    .xc #demo .bar .hint,
    .xc #hero-hint { font-size: 11px; }
    .xc #demo .dossier-row .num,
    .xc #demo .kv,
    .xc #demo .dossier-row .titre { font-size: 12.5px; }
    .xc #demo .dossier-row .go { min-height: 44px; display: inline-flex; align-items: center; }
    .xc .nav-card .tag, .xc #decision .tag { font-size: 11px; }
    /* Bande de preuves : au pouce, elle défile en boucle au lieu de tasser
       quatre libellés sur deux rangs. */
    .xc #preuves {
      padding: 14px 0;
      max-width: none;
      flex-wrap: nowrap;
      /* les libellés s'estompent aux bords au lieu d'être tranchés net */
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 26px, #000 calc(100% - 26px), transparent);
      mask-image: linear-gradient(90deg, transparent, #000 26px, #000 calc(100% - 26px), transparent);
    }
    .xc .pv-track {
      flex: none;
      width: auto;
      /* jamais plus court que l'écran, sinon un trou apparaît à la boucle */
      min-width: 100%;
      gap: 0;
      justify-content: space-around;
      animation: xcMarquee 24s linear infinite;
    }
    .xc .pv-track.clone { display: flex; }
    .xc #preuves span { padding: 0 18px; }
    .xc #systeme .head { grid-template-columns: 1fr; align-items: start; }
    .xc #demo .client-grid { grid-template-columns: 1fr; }
    /* Les écrans de la maquette sont superposés en absolu au large. Au
       téléphone, 979 px de contenu se retrouvaient enfermés dans 560 px avec un
       défilement interne invisible : la fiche cliente était coupée en plein
       milieu. On les remet dans le flux, l'écran actif donne sa hauteur. */
    .xc #demo .stage { min-height: 0; }
    .xc #demo .screen {
      position: static;
      display: none;
      opacity: 1;
      transform: none;
      overflow: visible;
      padding: 20px 16px;
      transition: none;
    }
    .xc #demo .screen.on { display: block; }
    .xc #demo .apercu-grid { grid-template-columns: 1fr; }
    .xc #demo .bar .hint { display: none; }
    /* Chaque scène est épinglée sur un écran de haut. Au téléphone, le texte
       plus la maquette dépassaient cette hauteur et le bas de la scène était
       tranché. On resserre l'ensemble pour que tout tienne d'un coup d'oeil. */
    .xc .story .grid, .xc .story.reverse .grid { grid-template-columns: 1fr; gap: 18px; }
    /* Encaisser est la seule scène inversée : au large la facture est à gauche
       du texte, mais empilée au téléphone elle passait avant le titre. On lit
       d'abord de quoi il s'agit, la facture illustre ensuite, comme dans les
       deux autres scènes. */
    .xc .story.reverse .copy { order: -1; }
    .xc .story .pin { align-content: center; padding-top: 6vh; }
    .xc .story h2 { margin-top: 12px; font-size: 27px; }
    .xc .story p.body { margin-top: 13px; font-size: 14px; line-height: 1.55; }
    .xc .story p.result { margin-top: 15px; font-size: 13px; line-height: 1.5; }
    .xc .chip { display: none; }
    /* on réserve une bande sous le total : le cachet s'y pose au lieu de barrer
       les montants */
    .xc #facture { padding: 18px 15px 58px; }
    .xc #facture .fhead .t { font-size: 21px; }
    .xc #facture .fsub { padding-bottom: 11px; }
    .xc #facture .fline { padding: 9px 0; }
    .xc #facture .ftotals { margin-top: 10px; }
    .xc #facture .trow { padding: 3px 0; }
    /* le cachet est incliné : sa boîte dépasse le bord bas de la carte, qui
       rogne les coins. On le remonte dans la bande réservée. */
    .xc #facture .stamp { left: 16px; bottom: 30px; }
    /* La carte « Pour l'avocat » chevauchait les cartes de la Navette et sortait
       de l'écran. Au téléphone, elle se range dessous, pleine largeur. */
    .xc #navette { height: 396px; }
    .xc .nav-card { padding: 11px 14px; }
    .xc .nav-card { left: 0; width: 100%; }
    .xc #decision {
      top: auto;
      bottom: 0;
      right: auto;
      left: 0;
      width: 100%;
    }
    .xc #questions .q { grid-template-columns: 1fr; gap: 8px; }
    /* Au pouce, chaque scène doit se lire vite : on raccourcit la course
       plutôt que de faire défiler seize écrans. */
    .xc #zone-hero { height: 250vh; }
    .xc #zone-verifier, .xc #zone-encaisser { height: 200vh; }
    .xc #zone-collaborer { height: 190vh; }
    .xc section.flat { padding: clamp(56px, 8vh, 96px) min(6vw, 84px); }
    .xc #systeme { padding: clamp(56px, 8vh, 96px) min(6vw, 84px); }
    .xc #systeme .shot { margin-top: 32px; }
  }

  /* Écrans courts (iPhone SE, mini, ou barre d'adresse déployée) : la scène
     épinglée dispose de moins de 740 px de haut. On resserre encore, sinon le
     dernier paragraphe passe sous le pli et disparaît. */
  @media (max-width: 860px) and (max-height: 740px) {
    .xc .story .pin { padding-top: 0; }
    .xc .story .grid, .xc .story.reverse .grid { gap: 10px; }
    .xc .story h2 { font-size: 24px; margin-top: 6px; }
    .xc .story p.body { margin-top: 8px; }
    .xc .story p.result { margin-top: 6px; padding-left: 12px; }
    .xc #facture { padding: 13px 14px 34px; }
    .xc #facture .fhead .t { font-size: 19px; }
    .xc #facture .fsub { padding-bottom: 9px; }
    .xc #facture .fline { padding: 7px 0; }
    .xc #facture .trow { padding: 2px 0; }
    .xc #facture .stamp { left: 14px; bottom: 31px; }
    .xc #navette { height: 352px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .xc #zone-hero, .xc #zone-verifier, .xc #zone-encaisser, .xc #zone-collaborer { height: auto; }
    .xc .pinzone .pin { position: relative; height: auto; min-height: 100vh; }
    .xc #hero-hint { display: none; }
    .xc #systeme .shot { transform: none; opacity: 1; transition: none; }
    /* pas de défilement automatique : la bande se parcourt au doigt */
    .xc .pv-track { animation: none; }
    .xc #preuves { overflow-x: auto; }
  }
`;

function runExperience(root: HTMLElement): () => void {
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COL = {
    bg: "#EFF2ED", surface: "#FBFCFA", line: "rgba(31,42,36,0.08)",
  };

  const $ = (id: string) => root.querySelector<HTMLElement>("#" + id)!;
  const $$ = (sel: string) => Array.prototype.slice.call(root.querySelectorAll(sel)) as HTMLElement[];

  function mulberry32(seed: number) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const phase = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const fmt = (n: number) =>
    n.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";

  function fitCanvas(canvas: HTMLCanvasElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const r = canvas.getBoundingClientRect();
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ── Scène 1 ── */
  const heroZone = $("zone-hero");
  const heroCanvas = $("hero-canvas") as HTMLCanvasElement;
  const heroShot = $("hero-shot");
  const heroCopy = $("hero-copy");
  const heroCaption = $("hero-caption");
  const heroHint = $("hero-hint");

  function dashboardTargets() {
    const t: Array<{ x: number; y: number; w: number; h: number }> = [];
    t.push({ x: 24, y: 20, w: 180, h: 16 });
    t.push({ x: 796, y: 20, w: 74, h: 16 });
    t.push({ x: 884, y: 20, w: 92, h: 16 });
    for (let i = 0; i < 5; i++) t.push({ x: 24, y: 74 + i * 34, w: 132, h: 14 });
    t.push({ x: 188, y: 66, w: 240, h: 108 });
    t.push({ x: 444, y: 66, w: 240, h: 108 });
    t.push({ x: 700, y: 66, w: 276, h: 108 });
    t.push({ x: 188, y: 198, w: 496, h: 252 });
    for (let j = 0; j < 5; j++) t.push({ x: 700, y: 198 + j * 52, w: 276, h: 40 });
    t.push({ x: 188, y: 474, w: 496, h: 26 });
    t.push({ x: 188, y: 512, w: 496, h: 26 });
    t.push({ x: 700, y: 474, w: 276, h: 64 });
    return t;
  }

  const rnd = mulberry32(20260725);
  const papers = dashboardTargets().map((tg, i) => ({
    tg,
    sx: rnd(), sy: rnd(),
    sr: (rnd() - 0.5) * 1.4,
    sw: 34 + rnd() * 52, sh: 22 + rnd() * 30,
    drift: rnd() * Math.PI * 2,
    delay: (i % 7) / 7 * 0.3,
    ox: 0, oy: 0, vx: 0, vy: 0,
  }));

  /* le curseur brasse les papiers tant qu'ils ne sont pas rangés */
  const pointer = { x: -9999, y: -9999, speed: 0 };
  const onPointerMove = (e: PointerEvent) => {
    const r = heroCanvas.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    pointer.speed = Math.min(40, Math.hypot(nx - pointer.x, ny - pointer.y));
    pointer.x = nx; pointer.y = ny;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  function drawHero(p: number, time: number) {
    const f = fitCanvas(heroCanvas);
    const ctx = f.ctx, W = f.w, H = f.h;
    ctx.clearRect(0, 0, W, H);

    let scale = Math.min(W * 0.78 / 1000, H * 0.62 / 625);
    if (W < 860) scale = Math.min(W * 0.92 / 1000, H * 0.5 / 625);
    const frameW = 1000 * scale, frameH = 625 * scale;
    const fx = (W - frameW) / 2;
    const fy = lerp(H * 0.58, (H - frameH) / 2 + H * 0.03, phase(p, 0.35, 0.85));

    const assemble = easeInOut(phase(p, 0.22, 0.82));

    const frameA = phase(p, 0.55, 0.85);
    if (frameA > 0) {
      ctx.save();
      ctx.globalAlpha = frameA;
      ctx.fillStyle = COL.surface;
      ctx.strokeStyle = COL.line;
      roundRect(ctx, fx, fy, frameW, frameH, 14 * scale);
      ctx.shadowColor = "rgba(11,31,25,0.28)";
      ctx.shadowBlur = 60 * scale;
      ctx.shadowOffsetY = 30 * scale;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.stroke();
      ctx.restore();
    }

    papers.forEach((pp) => {
      const local = easeOutCubic(phase(assemble, pp.delay, 1));
      const driftX = Math.sin(time * 0.0004 + pp.drift) * 14 * (1 - local);
      const driftY = Math.cos(time * 0.00032 + pp.drift * 1.7) * 10 * (1 - local);
      const x0 = pp.sx * W * 0.9 + W * 0.05 + driftX;
      const y0 = pp.sy * H * 0.85 + H * 0.05 + driftY;
      const x1 = fx + pp.tg.x * scale, y1 = fy + pp.tg.y * scale;
      const w = lerp(pp.sw, pp.tg.w * scale, local);
      const h = lerp(pp.sh, pp.tg.h * scale, local);
      let x = lerp(x0, x1, local), y = lerp(y0, y1, local);
      let rot = pp.sr * (1 - local);

      const free = 1 - local;
      if (free > 0.02 && !REDUCED) {
        const dx = (x + w / 2 + pp.ox) - pointer.x;
        const dy = (y + h / 2 + pp.oy) - pointer.y;
        const d = Math.hypot(dx, dy);
        const R = 170;
        if (d < R && d > 0.001) {
          const force = (1 - d / R) * (0.9 + pointer.speed * 0.12) * free;
          pp.vx += (dx / d) * force * 3.2;
          pp.vy += (dy / d) * force * 3.2;
        }
        pp.vx *= 0.88; pp.vy *= 0.88;
        pp.ox = (pp.ox + pp.vx) * 0.965;
        pp.oy = (pp.oy + pp.vy) * 0.965;
        x += pp.ox * free;
        y += pp.oy * free;
        rot += pp.ox * 0.0022 * free;
      } else {
        pp.ox *= 0.8; pp.oy *= 0.8; pp.vx = 0; pp.vy = 0;
      }

      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(rot);
      const isCard = pp.tg.h > 60;
      ctx.globalAlpha = lerp(0.85, isCard ? 1 : 0.9, local);
      ctx.fillStyle = local > 0.7 && isCard ? COL.bg : COL.surface;
      ctx.strokeStyle = COL.line;
      roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(8, h * 0.3));
      if (local < 0.7) {
        ctx.shadowColor = "rgba(11,31,25,0.16)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
      }
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.stroke();
      ctx.restore();
    });

    const shotA = phase(p, 0.72, 0.92);
    heroShot.style.left = fx + "px";
    heroShot.style.top = fy + "px";
    heroShot.style.width = frameW + "px";
    heroShot.style.height = frameH + "px";
    heroShot.style.borderRadius = (14 * scale) + "px";
    heroShot.style.opacity = String(easeInOut(shotA));

    const lift = easeInOut(phase(p, 0.3, 0.7));
    heroCopy.style.transform = "translateY(" + (-lift * 9) + "vh)";
    heroCopy.style.opacity = String(1 - phase(p, 0.4, 0.72));
    heroCaption.style.opacity = String(phase(p, 0.9, 0.99));
    heroCaption.style.transform = "translateY(" + ((1 - phase(p, 0.9, 0.99)) * 12) + "px)";
    heroHint.style.opacity = String(p < 0.04 ? 1 : 0);
  }

  /* ── Scène 2 · Vérifier ── */
  const verZone = $("zone-verifier");
  const vrows = $$("#rapprochement .row");
  const vgapRow = $("vrow-gap");
  const vgapAmt = $("vgap-amt");
  const vwarn = $("vbanner-warn");
  const vokay = $("vbanner-okay");

  function drawVerifier(p: number) {
    vrows.forEach((row, i) => {
      const a = easeOutCubic(phase(p, 0.03 + i * 0.09, 0.22 + i * 0.09));
      row.style.opacity = String(a);
      row.style.transform = "translateX(" + ((1 - a) * 18) + "px)";
    });

    const correct = easeInOut(phase(p, 0.58, 0.78));
    vgapAmt.textContent = fmt(20500 + 500 * correct);
    vgapRow.classList.toggle("ok", correct >= 1);

    /* la bannière d'écart s'efface pendant que le montant se corrige : sinon on
       lit « écart de 500 $ » au-dessus de trois soldes déjà concordants */
    const warnA = phase(p, 0.3, 0.38) * (1 - phase(p, 0.58, 0.7));
    vwarn.style.opacity = String(warnA);
    vwarn.style.transform = "translateY(" + ((1 - phase(p, 0.3, 0.38)) * 10) + "px)";

    const okA = phase(p, 0.8, 0.9);
    vokay.style.opacity = String(okA);
    vokay.style.transform = "translateY(" + ((1 - okA) * 10) + "px)";
  }

  /* ── Scène 3 · Encaisser ── */
  const encZone = $("zone-encaisser");
  const flines = $$("#facture .fline");
  const chips = $$("#facture-wrap .chip");
  const fSub = $("f-sub");
  const fTps = $("f-tps");
  const fTvq = $("f-tvq");
  const fTotal = $("f-total");
  const fStamp = $("f-stamp");
  const LINE_AMOUNTS = [2925, 195, 80];

  function drawEncaisser(p: number) {
    let landed = 0;
    flines.forEach((line, i) => {
      const t = phase(p, 0.06 + i * 0.13, 0.3 + i * 0.13);
      const fly = easeInOut(t);

      const chip = chips[i];
      if (chip) {
        const lineTop = line.offsetTop;
        chip.style.top = (lineTop + 10) + "px";
        chip.style.right = lerp(-46, 30, fly) + "px";
        chip.style.transform = "translateY(" + ((1 - fly) * -34) + "px)";
        chip.style.opacity = String(t <= 0 ? 0 : t >= 1 ? 0 : Math.min(1, t * 4));
      }
      const mat = phase(t, 0.75, 1);
      line.style.opacity = String(0.25 + mat * 0.75);
      line.style.transform = "translateX(" + ((1 - mat) * 10) + "px)";
      landed += LINE_AMOUNTS[i] * mat;
    });

    const sub = landed;
    const taxes = easeInOut(phase(p, 0.56, 0.74));
    const tps = sub * 0.05 * taxes;
    const tvq = sub * 0.09975 * taxes;
    const totalReveal = easeInOut(phase(p, 0.62, 0.8));
    fSub.textContent = fmt(sub);
    fTps.textContent = fmt(tps);
    fTvq.textContent = fmt(tvq);
    fTotal.textContent = fmt((sub + tps + tvq) * totalReveal);

    const st = easeOutCubic(phase(p, 0.86, 0.96));
    fStamp.style.opacity = String(st);
    fStamp.style.transform = "rotate(-8deg) scale(" + lerp(1.6, 1, st) + ")";
  }

  /* ── Scène 4 · Collaborer ── */
  const colZone = $("zone-collaborer");
  const navCards = $$(".nav-card");
  const decision = $("decision");
  const cardScatter = [
    { x: -60, y: -30, r: -7 },
    { x: 70, y: 40, r: 5 },
    { x: -30, y: 120, r: -4 },
  ];

  function drawCollaborer(p: number) {
    navCards.forEach((card, i) => {
      const settle = easeOutCubic(phase(p, 0.05 + i * 0.12, 0.45 + i * 0.12));
      const sc = cardScatter[i];
      /* cartes plus rapprochées au téléphone : sinon la carte « Pour l'avocat »
         se retrouve sous la ligne de flottaison */
      const restY = i * (window.innerWidth < 860 ? 88 : 100);
      const x = lerp(sc.x, 0, settle);
      const y = lerp(sc.y + restY, restY, settle);
      const r = lerp(sc.r, 0, settle);
      card.style.transform = "translate(" + x + "px," + y + "px) rotate(" + r + "deg)";
      card.style.opacity = String(0.25 + settle * 0.75);
    });
    const dec = easeOutCubic(phase(p, 0.62, 0.9));
    decision.style.opacity = String(dec);
    decision.style.transform = "translateX(" + ((1 - dec) * 36) + "px)";
  }

  /* ── Maquette navigable ── */
  const demo = $("demo");
  const screenClient = $("screen-client");
  const screenDossier = $("screen-dossier");
  const demoCrumb = $("demo-crumb");

  function showScreen(name: string) {
    const toDossier = name === "dossier";
    screenClient.classList.toggle("on", !toDossier);
    screenClient.classList.toggle("off-left", toDossier);
    screenDossier.classList.toggle("on", toDossier);
    demoCrumb.textContent = toDossier
      ? "Clients / Marie-Claude Tremblay / Dossier 2026-014"
      : "Clients / Marie-Claude Tremblay";
  }

  const onDemoClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const go = target.closest("[data-goto]");
    if (go) { showScreen(go.getAttribute("data-goto")!); return; }
    const tab = target.closest("[data-tab]");
    if (tab) {
      const name = tab.getAttribute("data-tab");
      demo.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t === tab));
      demo.querySelectorAll(".tabpane").forEach((pn) =>
        pn.classList.toggle("on", pn.getAttribute("data-pane") === name)
      );
    }
  };
  const onDemoKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const go = (e.target as HTMLElement).closest("[data-goto]");
    if (go) { e.preventDefault(); showScreen(go.getAttribute("data-goto")!); }
  };
  demo.addEventListener("click", onDemoClick);
  demo.addEventListener("keydown", onDemoKey);

  /* ── Révélation de la section Le système ── */
  const systemeShot = $("systeme-shot");
  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window && !REDUCED) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { systemeShot.classList.add("seen"); io?.disconnect(); }
      });
    }, { threshold: 0.25 });
    io.observe(systemeShot);
  } else {
    systemeShot.classList.add("seen");
  }

  /* ── Rail ── */
  const rail = $("rail");
  const railStops: Record<string, HTMLElement> = {
    hero: rail.querySelector('[data-rail="hero"]')!,
    verifier: rail.querySelector('[data-rail="verifier"]')!,
    encaisser: rail.querySelector('[data-rail="encaisser"]')!,
    collaborer: rail.querySelector('[data-rail="collaborer"]')!,
  };
  const zones: Record<string, HTMLElement> = {
    hero: heroZone, verifier: verZone, encaisser: encZone, collaborer: colZone,
  };
  function zoneVisible(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
  }
  function updateRail() {
    let anyLive = false;
    Object.keys(zones).forEach((key) => {
      const live = zoneVisible(zones[key]);
      railStops[key].classList.toggle("live", live);
      if (live) anyLive = true;
    });
    rail.classList.toggle("on", anyLive);
  }

  /* ── Boucle ── */
  const shown: Record<string, number> = { hero: 0, verifier: 0, encaisser: 0, collaborer: 0 };
  let rafId = 0;

  function frame(time: number) {
    const SMOOTH = REDUCED ? 1 : 0.16;
    const vh = window.innerHeight;
    const near: Record<string, boolean> = {};
    Object.keys(shown).forEach((k) => {
      const r = zones[k].getBoundingClientRect();
      // ne dessiner que les scènes proches du viewport : c'est ce qui garde le défilement fluide
      near[k] = r.bottom > -300 && r.top < vh + 300;
      const total = r.height - vh;
      const target = total <= 0 ? 1 : clamp01(-r.top / total);
      shown[k] += (target - shown[k]) * SMOOTH;
      if (Math.abs(target - shown[k]) < 0.0005) shown[k] = target;
    });

    if (REDUCED) {
      shown.hero = 1; shown.verifier = 1; shown.encaisser = 1; shown.collaborer = 1;
    }

    if (near.hero) drawHero(shown.hero, time);
    if (near.verifier) drawVerifier(shown.verifier);
    if (near.encaisser) drawEncaisser(shown.encaisser);
    if (near.collaborer) drawCollaborer(shown.collaborer);
    updateRail();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("pointermove", onPointerMove);
    demo.removeEventListener("click", onDemoClick);
    demo.removeEventListener("keydown", onDemoKey);
    io?.disconnect();
  };
}

const PREUVES = [
  "Conçu au Québec",
  "Données hébergées au Canada",
  "Pensé pour le fidéicommis",
  "Utilisé dans un vrai cabinet",
];

export default function ExperienceCinema() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    if (!rootRef.current) return;
    return runExperience(rootRef.current);
  }, []);

  return (
    <div className="xc" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav id="nav">
        <a className="brand" href="#top" aria-label="SAFE, retour au haut de la page">
          <SafeLogo size={20} />
        </a>
        <div className="links">
          <a href="/fonctionnalites">Fonctionnalités</a>
          <a href="/tarification">Tarification</a>
          <a href="/a-propos">À propos</a>
          <a href="/contact">Contact</a>
        </div>
        <div className="navright">
          <a className="signin" href="/connexion">Connexion</a>
          <a className="cta" href="/audit-gratuit">Faire le diagnostic</a>
        </div>
        {/* Au téléphone, les liens étaient simplement masqués : la landing n'offrait
           plus aucun chemin vers le reste du site. */}
        <button
          type="button"
          id="burger"
          aria-label={menuOuvert ? "Fermer la navigation" : "Ouvrir la navigation"}
          aria-expanded={menuOuvert}
          onClick={() => setMenuOuvert((v) => !v)}
        >
          <span className={menuOuvert ? "ouvert" : ""} aria-hidden>
            <i /><i /><i />
          </span>
        </button>
      </nav>

      {menuOuvert ? (
        <>
          <button
            type="button"
            id="voile"
            aria-label="Fermer la navigation"
            onClick={() => setMenuOuvert(false)}
          />
          <div id="menu-mobile">
            {[
              ["/fonctionnalites", "Fonctionnalités"],
              ["/tarification", "Tarification"],
              ["/a-propos", "À propos"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOuvert(false)}>
                {label}
                <span aria-hidden>›</span>
              </a>
            ))}
            <div className="mm-actions">
              <a className="mm-ghost" href="/connexion">Connexion</a>
              <a className="mm-cta" href="/audit-gratuit">Diagnostic</a>
            </div>
          </div>
        </>
      ) : null}

      <div id="rail" aria-hidden="true">
        <div className="stop" data-rail="hero"><span>Assembler</span><i /></div>
        <div className="stop" data-rail="verifier"><span>Vérifier</span><i /></div>
        <div className="stop" data-rail="encaisser"><span>Encaisser</span><i /></div>
        <div className="stop" data-rail="collaborer"><span>Collaborer</span><i /></div>
      </div>

      {/* Scène 1 · L'assemblage → vraie capture */}
      <div className="pinzone" id="zone-hero">
        <div className="pin" id="top">
          <canvas id="hero-canvas" />
          {/* eslint-disable-next-line @next/next/no-img-element -- position pilotée au pixel par le canvas */}
          <img
            id="hero-shot"
            src="/experience-assets/app-tableau-de-bord.jpg"
            alt="Tableau de bord SAFE réel : facturation, encaissements, créances et fidéicommis du cabinet, en langage simple."
          />
          <div id="hero-copy">
            <p className="kicker">SAFE · système de gestion pour cabinets d&apos;avocats</p>
            <h1>SAFE tient votre cabinet <em>ensemble.</em></h1>
            <p className="lede">
              Fidéicommis, dossiers, temps, facturation et conformité partagent enfin le même
              contexte. Vous voyez ce qui est à jour, ce qui attend et ce qui ne concorde pas.
            </p>
          </div>
          <p id="hero-caption">
            Capture réelle de SAFE. Une lecture simple des décisions qui demandent votre attention, dès l&apos;ouverture.
          </p>
          <p id="hero-hint">Faites défiler</p>
        </div>
      </div>

      {/* Bande de preuves */}
      <div className="strip">
        <div id="preuves">
          <div className="pv-track">
            {PREUVES.map((p) => (<span key={p}><i />{p}</span>))}
          </div>
          {/* copie muette : elle prend le relais quand la première sort de
              l'écran, pour un défilement sans rupture au téléphone */}
          <div className="pv-track clone" aria-hidden="true">
            {PREUVES.map((p) => (<span key={p}><i />{p}</span>))}
          </div>
        </div>
      </div>

      {/* Le système */}
      <section id="systeme">
        <div className="inner">
          <div className="head">
            <div>
              <p className="kicker">Un système, pas une collection d&apos;outils</p>
              <h2>Chaque action garde son contexte.</h2>
            </div>
            <p>
              Un dossier ne vit pas séparément de son temps, de sa facture ou de ses fonds en
              fiducie. SAFE relie ces éléments pour que l&apos;information circule sans être recopiée.
            </p>
          </div>
          <div className="shot" id="systeme-shot">
            <div id="demo">
              <div className="bar">
                <span className="crumb"><b>SAFE</b><span className="sep">·</span><span id="demo-crumb">Clients / Marie-Claude Tremblay</span></span>
                <span className="hint">Maquette · cliquez pour explorer</span>
              </div>
              <div className="stage">

                <div className="screen on" id="screen-client">
                  <div className="client-grid">
                    <div>
                      <div className="panel">
                        <p className="ptitle">Fiche client</p>
                        <div className="id-row">
                          <h3>Marie-Claude Tremblay</h3>
                          <span className="pill"><i />Active</span>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <div className="kv"><span className="k">Type</span><span className="v">Particulier · liquidatrice</span></div>
                          <div className="kv"><span className="k">Courriel</span><span className="v">mc.tremblay@exemple.ca</span></div>
                          <div className="kv"><span className="k">Téléphone</span><span className="v">418 555-0142</span></div>
                          <div className="kv"><span className="k">Ville</span><span className="v">Lévis (Québec)</span></div>
                          <div className="kv"><span className="k">Cliente depuis</span><span className="v">2024</span></div>
                        </div>
                      </div>
                      <div className="panel">
                        <p className="ptitle">Soldes</p>
                        <div className="kv"><span className="k">À recevoir</span><span className="v num">0,00 $</span></div>
                        <div className="kv"><span className="k">En fiducie</span><span className="v num">2 225,00 $</span></div>
                        <div className="kv"><span className="k">Dernier paiement</span><span className="v num">3 679,20 $ · 14 juin</span></div>
                      </div>
                    </div>
                    <div>
                      <div className="panel">
                        <p className="ptitle">Dossiers de la cliente</p>
                        <div className="dossier-row" data-goto="dossier" role="button" tabIndex={0}>
                          <span className="num">2026-014 · Succession</span>
                          <span className="go">Ouvrir →</span>
                          <span className="titre">Succession Tremblay</span>
                        </div>
                        <div className="dossier-row closed">
                          <span className="num">2024-032 · Immobilier</span>
                          <span className="pill gray" style={{ alignSelf: "center" }}><i />Clôturé</span>
                          <span className="titre">Vente d&apos;un immeuble locatif</span>
                        </div>
                      </div>
                      <div className="panel">
                        <p className="ptitle">Activité récente</p>
                        <div className="kv"><span className="k">14 juin</span><span className="v">Paiement reçu · Facture 2026-041</span></div>
                        <div className="kv"><span className="k">2 juin</span><span className="v">Facture 2026-041 envoyée</span></div>
                        <div className="kv"><span className="k">28 mai</span><span className="v">6,5 h approuvées</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="screen" id="screen-dossier">
                  <div className="doss-head">
                    <span className="back" data-goto="client" role="button" tabIndex={0}>← Fiche client</span>
                    <h3>Dossier 2026-014 · Succession Tremblay</h3>
                    <span className="pill"><i />Actif</span>
                    <span className="who">Responsable : Me A. Côté</span>
                  </div>
                  <div className="tabs">
                    <span className="tab on" data-tab="apercu">Aperçu</span>
                    <span className="tab" data-tab="temps">Temps</span>
                    <span className="tab" data-tab="facturation">Facturation</span>
                    <span className="tab" data-tab="fiducie">Fiducie</span>
                    <span className="tab" data-tab="documents">Documents</span>
                  </div>

                  <div className="tabpane on" data-pane="apercu">
                    <div className="apercu-grid">
                      <div className="stat"><p className="lbl">Type</p><p className="val">Succession · vérification de testament</p></div>
                      <div className="stat"><p className="lbl">Ouvert le</p><p className="val">8 mai 2026</p></div>
                      <div className="stat"><p className="lbl">Temps au dossier</p><p className="val num">6,5 h</p></div>
                      <div className="stat"><p className="lbl">Prochaine échéance</p><p className="val">30 juin · Production de l&apos;inventaire</p></div>
                    </div>
                    <p className="note">Temps, facture, fiducie et documents vivent dans le même dossier. Parcourez les onglets.</p>
                  </div>

                  <div className="tabpane" data-pane="temps">
                    <table>
                      <tbody>
                        <tr><th>Date</th><th>Description</th><th className="num">Durée</th></tr>
                        <tr><td>12 mai</td><td>Rédaction de la requête en vérification</td><td className="num">2,1 h</td></tr>
                        <tr><td>15 mai</td><td>Appel avec la liquidatrice</td><td className="num">0,8 h</td></tr>
                        <tr><td>21 mai</td><td>Préparation de l&apos;inventaire préliminaire</td><td className="num">2,4 h</td></tr>
                        <tr><td>28 mai</td><td>Révision et corrections</td><td className="num">1,2 h</td></tr>
                        <tr className="total"><td /><td>Total approuvé</td><td className="num">6,5 h</td></tr>
                      </tbody>
                    </table>
                    <p className="note">Ces heures ont remonté dans la facture 2026-041 sans ressaisie.</p>
                  </div>

                  <div className="tabpane" data-pane="facturation">
                    <table>
                      <tbody>
                        <tr><th>Facture 2026-041 · 2 juin</th><th className="num">Montant</th></tr>
                        <tr><td>Honoraires professionnels<span className="sub">6,5 h approuvées · mai 2026</span></td><td className="num">2 925,00 $</td></tr>
                        <tr><td>Débours · Frais de greffe</td><td className="num">195,00 $</td></tr>
                        <tr><td>Débours · Signification par huissier</td><td className="num">80,00 $</td></tr>
                        <tr><td>TPS et TVQ</td><td className="num">479,20 $</td></tr>
                        <tr className="total"><td>Total · payée le 14 juin</td><td className="num">3 679,20 $</td></tr>
                      </tbody>
                    </table>
                    <p className="note">Chaque ligne conserve le dossier et la cliente d&apos;origine.</p>
                  </div>

                  <div className="tabpane" data-pane="fiducie">
                    <table>
                      <tbody>
                        <tr><th>Mouvement</th><th className="num">Montant</th></tr>
                        <tr><td>5 mai · Avance reçue de la cliente</td><td className="num">2 500,00 $</td></tr>
                        <tr><td>12 mai · Frais de greffe payés du compte</td><td className="num">-195,00 $</td></tr>
                        <tr><td>21 mai · Huissier payé du compte</td><td className="num">-80,00 $</td></tr>
                        <tr className="total"><td>Solde en fiducie</td><td className="num">2 225,00 $</td></tr>
                      </tbody>
                    </table>
                    <p className="note">Argent de la cliente, séparé du cabinet. Jamais un revenu.</p>
                  </div>

                  <div className="tabpane" data-pane="documents">
                    <table>
                      <tbody>
                        <tr><th>Document</th><th className="num">Statut</th></tr>
                        <tr><td>Requête en vérification de testament<span className="sub">Déposée au greffe · 12 mai</span></td><td className="num"><span className="pill"><i />Déposée</span></td></tr>
                        <tr><td>Inventaire préliminaire<span className="sub">Préparé par l&apos;adjointe · 21 mai</span></td><td className="num"><span className="pill gray"><i />En révision</span></td></tr>
                        <tr><td>Correspondance du greffe<span className="sub">Classée au dossier · 26 mai</span></td><td className="num"><span className="pill"><i />Classée</span></td></tr>
                      </tbody>
                    </table>
                    <p className="note">Chaque document est rangé dans son dossier, avec son statut.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
          <p className="after">
            Ouvrez le dossier, parcourez les onglets. Maquette manipulable, données
            fictives : le contexte circule d&apos;une action à la suivante sans être ressaisi.
          </p>
        </div>
      </section>

      {/* Scène 2 · Vérifier */}
      <div className="pinzone story" id="zone-verifier">
        <div className="pin">
          <div className="grid">
            <div className="copy">
              <p className="kicker">Vérifier</p>
              <h2>L&apos;écart apparaît avant l&apos;inspection.</h2>
              <p className="body">
                SAFE compare le relevé bancaire, le registre du fidéicommis et les soldes par
                dossier. Lorsqu&apos;un montant ne concorde pas, le système le signale et empêche une
                certification prématurée.
              </p>
              <p className="result">Vous corrigez une différence identifiée, pas un doute diffus.</p>
            </div>
            <div id="rapprochement">
              <div className="head">
                <span>Rapprochement à trois voies</span>
                <span>JUIN 2026</span>
              </div>
              <div className="row" data-vrow="0">
                <span className="lbl">Solde bancaire</span>
                <span className="amt">21 000,00 $ <i /></span>
              </div>
              <div className="row" data-vrow="1">
                <span className="lbl">Registre du fidéicommis</span>
                <span className="amt">21 000,00 $ <i /></span>
              </div>
              <div className="row gap" data-vrow="2" id="vrow-gap">
                <span className="lbl">Soldes par dossier</span>
                <span className="amt"><span id="vgap-amt">20 500,00 $</span> <i /></span>
              </div>
              <div className="banners">
                <div className="banner warn" id="vbanner-warn">
                  <i /><span>Écart de 500 $. La certification reste bloquée jusqu&apos;à la correction.</span>
                </div>
                <div className="banner okay" id="vbanner-okay">
                  <i /><span>Concordance. Les trois soldes s&apos;accordent, la certification peut être produite.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scène 3 · Encaisser */}
      <div className="pinzone story reverse" id="zone-encaisser">
        <div className="pin">
          <div className="grid">
            <div id="facture-wrap">
              <div id="facture">
                <div className="fhead">
                  <span className="t">Facture 2026-041</span>
                  <span className="d">2 JUIN 2026</span>
                </div>
                <p className="fsub">Succession Tremblay · Dossier 2026-014</p>
                <div className="fline" data-frow="0">
                  <span className="desc">Honoraires professionnels<span className="sub">6,5 h approuvées · mai 2026</span></span>
                  <span className="amt">2 925,00 $</span>
                </div>
                <div className="fline" data-frow="1">
                  <span className="desc">Débours · Frais de greffe<span className="sub">Rattaché au dossier le 12 mai</span></span>
                  <span className="amt">195,00 $</span>
                </div>
                <div className="fline" data-frow="2">
                  <span className="desc">Débours · Signification par huissier<span className="sub">Rattaché au dossier le 21 mai</span></span>
                  <span className="amt">80,00 $</span>
                </div>
                <div className="ftotals">
                  <div className="trow"><span>Sous-total</span><span className="amt" id="f-sub">0,00 $</span></div>
                  <div className="trow"><span>TPS (5 %)</span><span className="amt" id="f-tps">0,00 $</span></div>
                  <div className="trow"><span>TVQ (9,975 %)</span><span className="amt" id="f-tvq">0,00 $</span></div>
                  <div className="trow grand"><span>Total</span><span className="amt" id="f-total">0,00 $</span></div>
                </div>
                <div className="stamp" id="f-stamp">Payée · 14 juin</div>
              </div>
              <div className="chip" data-chip="0"><i />Temps approuvé · 6,5 h</div>
              <div className="chip" data-chip="1"><i />Frais de greffe · 195 $</div>
              <div className="chip" data-chip="2"><i />Huissier · 80 $</div>
            </div>
            <div className="copy">
              <p className="kicker">Encaisser</p>
              <h2>Le travail suit son chemin jusqu&apos;au paiement.</h2>
              <p className="body">
                Les heures et les débours sont déjà rattachés au dossier. Ils peuvent remonter
                dans la facture, puis rester visibles jusqu&apos;à l&apos;encaissement, sans reconstruire
                l&apos;historique.
              </p>
              <p className="result">Moins de ressaisie. Moins de travail réalisé qui reste oublié.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scène 4 · Collaborer */}
      <div className="pinzone story" id="zone-collaborer">
        <div className="pin">
          <div className="grid">
            <div className="copy">
              <p className="kicker">Collaborer</p>
              <h2>L&apos;équipe prépare. L&apos;avocat garde le jugement.</h2>
              <p className="body">
                La Navette rassemble les questions, les documents prêts et les éléments à
                valider. L&apos;adjointe sait ce qui avance. L&apos;avocat retrouve les décisions qui
                demandent réellement son attention.
              </p>
              <p className="result">SAFE soutient le copilote du cabinet sans se substituer à lui.</p>
            </div>
            <div id="navette">
              <div className="nav-card" data-card="0">
                <span className="tag" style={{ color: "#A06C16" }}>Question</span>
                <span className="txt">Confirmer la date de signature</span>
                <span className="who">Aaliyah Côté · Dossier 2026-001</span>
              </div>
              <div className="nav-card" data-card="1">
                <span className="tag" style={{ color: "var(--muted)" }}>Document prêt</span>
                <span className="txt">Projet de requête en révision</span>
                <span className="who">Aaliyah Côté · Dossier 2026-001</span>
              </div>
              <div className="nav-card" data-card="2">
                <span className="tag" style={{ color: "var(--verified)" }}>Prêt pour revue</span>
                <span className="txt">Requête prête à valider</span>
                <span className="who">Aaliyah Côté · Dossier 2026-001</span>
              </div>
              <div id="decision">
                <span className="tag">Pour l&apos;avocat</span>
                <span className="txt">Requête prête à valider</span>
                <p className="sub">Une décision, préparée par l&apos;équipe, au moment où elle compte.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarification */}
      <section className="flat" id="tarifs">
        <div className="inner">
          <div className="head">
            <p className="kicker">Tarification</p>
            <h2>Simple dès le départ.</h2>
          </div>
          <div className="plan">
            <div>
              <p className="name">Solo</p>
              <p className="detail">Pour une pratique individuelle.</p>
            </div>
            <p className="price">99 $<small>/ mois</small></p>
          </div>
          <div className="plan">
            <div>
              <p className="name">Cabinet</p>
              <p className="detail">Pour une petite équipe qui travaille ensemble.</p>
            </div>
            <p className="price">149 $<small>/ mois</small></p>
          </div>
          <p className="note">Configuration initiale comprise. Prix en dollars canadiens, taxes en sus.</p>
          <a className="more" href="/tarification">Tous les détails de la tarification →</a>
        </div>
      </section>

      {/* Questions */}
      <section className="flat surface" id="questions">
        <div className="inner">
          <p className="kicker">Avant de nous parler</p>
          <h2>Des réponses précises aux questions importantes.</h2>
          <div style={{ marginTop: 44 }}>
            <div className="q">
              <h3>SAFE garantit-il ma conformité ?</h3>
              <p>
                Non. SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité
                professionnelle demeure celle du cabinet.
              </p>
            </div>
            <div className="q">
              <h3>Est-ce que SAFE remplace mon adjointe ?</h3>
              <p>
                Non. SAFE prépare, relie et signale. Votre équipe conserve le jugement et la
                connaissance du cabinet.
              </p>
            </div>
            <div className="q">
              <h3>À qui appartiennent mes données ?</h3>
              <p>
                À votre cabinet. Les données sont hébergées au Canada et peuvent être exportées dans
                les formats offerts.
              </p>
            </div>
          </div>
          <a className="more" href="/faq">Lire toutes les questions →</a>
        </div>
      </section>

      {/* CTA final */}
      <section className="flat" id="cta">
        <div className="inner">
          <p className="kicker">La prochaine étape</p>
          <h2>Voyons si SAFE convient à votre façon de travailler.</h2>
          <p>
            Commencez par un diagnostic concret de votre cabinet. Vous décidez ensuite si une
            démonstration mérite vingt minutes de votre temps.
          </p>
          <div className="actions">
            <a className="btn" href="/audit-gratuit">Faire le diagnostic</a>
            <a className="btn ghost" href="/demo">Réserver une rencontre</a>
          </div>
        </div>
      </section>

      <footer>
        <span className="fbrand">
          <SafeLogo size={17} />
          <span>Maquettes et captures sur données de démonstration</span>
        </span>
        <span className="flinks">
          <a href="/fonctionnalites">Fonctionnalités</a>
          <a href="/a-propos">À propos</a>
          <a href="/faq">FAQ</a>
          <a href="/contact">Contact</a>
          <a href="/conditions">Conditions</a>
          <a href="/confidentialite">Confidentialité</a>
        </span>
      </footer>
    </div>
  );
}
