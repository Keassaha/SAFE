/**
 * PROTOTYPE — Catalogue d'exemple.
 *
 * Un échantillon de la bibliothèque interne : quelques outils "cœur"
 * (présents partout) + des outils par domaine, dont le calculateur de
 * patrimoine familial qui motivait la réflexion.
 *
 * Chaque entrée se décrit assez pour se placer toute seule dans l'app.
 */

import type { Catalog } from "./types";

export const CATALOG: Catalog = [
  // ── Outils cœur (domains: []) — présents pour tout cabinet ───────────────
  {
    id: "dashboard",
    label: "Tableau de bord",
    description: "Vue de pilotage du cabinet.",
    domains: [],
    placement: { kind: "page", group: "dashboard", order: 0 },
    route: "/tableau-de-bord",
    icon: "LayoutDashboard",
    status: "ga",
  },
  {
    id: "clients",
    label: "Clients",
    description: "Dossiers clients, conflits, identité.",
    domains: [],
    placement: { kind: "page", group: "gestion", order: 0 },
    route: "/clients",
    icon: "Users",
    status: "ga",
  },
  {
    id: "dossiers",
    label: "Dossiers",
    description: "Mandats et matières.",
    domains: [],
    placement: { kind: "page", group: "gestion", order: 1 },
    route: "/dossiers",
    icon: "FolderOpen",
    status: "ga",
  },
  {
    id: "facturation",
    label: "Facturation",
    description: "Factures, paiements, créances.",
    domains: [],
    placement: { kind: "page", group: "finances", order: 0 },
    route: "/facturation",
    icon: "Receipt",
    status: "ga",
  },
  {
    id: "comptes-fideicommis",
    label: "Comptes en fidéicommis",
    description: "Suivi et conciliation fidéicommis.",
    domains: [],
    placement: { kind: "page", group: "finances", order: 1 },
    route: "/comptes",
    icon: "Wallet",
    compliance: ["Barreau — conciliation mensuelle obligatoire"],
    status: "ga",
  },

  // ── Famille ──────────────────────────────────────────────────────────────
  {
    id: "calc-patrimoine-familial",
    label: "Calculateur de patrimoine familial",
    description:
      "Calcul du partage du patrimoine familial (art. 414 et s. C.c.Q.). Le cas concret de la réflexion.",
    domains: ["famille"],
    placement: { kind: "page", group: "outils", order: 10 },
    route: "/outils/patrimoine-familial",
    icon: "Calculator",
    requires: ["dossiers"],
    seeds: ["seed-bareme-patrimoine-qc"],
    overrides: ["taux-actualisation", "categories-biens-affichees"],
    status: "ga",
  },
  {
    id: "widget-echeances-famille",
    label: "Échéances famille (widget dashboard)",
    description:
      "Carte d'échéances propres au droit de la famille, injectée dans le tableau de bord.",
    domains: ["famille"],
    placement: { kind: "widget", host: "dashboard", slot: "main-top" },
    icon: "CalendarClock",
    status: "beta",
  },

  // ── Immobilier ─────────────────────────────────────────────────────────--
  {
    id: "calc-droits-mutation",
    label: "Calculateur de droits de mutation",
    description: "Calcul de la taxe de bienvenue (droits de mutation).",
    domains: ["immobilier"],
    placement: { kind: "page", group: "outils", order: 11 },
    route: "/outils/droits-mutation",
    icon: "Calculator",
    seeds: ["seed-bareme-mutation-qc"],
    status: "ga",
  },
  {
    id: "action-checklist-cloture-immo",
    label: "Lancer checklist de clôture immobilière",
    description:
      "Action sur un dossier immobilier : génère la checklist de clôture.",
    domains: ["immobilier"],
    placement: { kind: "action", host: "dossier-detail", location: "page-actions" },
    icon: "ListChecks",
    seeds: ["seed-checklist-cloture-immo"],
    status: "ga",
  },

  // ── Immigration ────────────────────────────────────────────────────────--
  {
    id: "suivi-expirations-immigration",
    label: "Suivi des expirations (immigration)",
    description: "Tableau des documents et statuts qui expirent (IRCC).",
    domains: ["immigration"],
    placement: { kind: "page", group: "outils", order: 12 },
    route: "/outils/expirations-immigration",
    icon: "CalendarClock",
    status: "beta",
  },
];
