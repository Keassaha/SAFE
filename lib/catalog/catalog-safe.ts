/**
 * Catalogue grounded sur l'app SAFE réelle (ADR-009).
 *
 * Contrairement à `catalog.ts` (démo pédagogique pour la Console), ce catalogue
 * reproduit le menu de production actuel (components/layout/SidebarNav.tsx,
 * NAV_ITEMS). La parité est garantie par `__tests__/catalog-safe-parity.test.ts`.
 *
 * Objectif : permettre de composer le vrai menu depuis le catalogue, derrière le
 * flag CATALOG_DRIVEN_NAV (par défaut éteint). Quand le flag est éteint, rien ne
 * change en production.
 *
 * Routes tirées de lib/routes.ts (source de vérité des chemins).
 */

import { routes } from "@/lib/routes";
import type { Catalog } from "./types";

/**
 * Ensemble de parité : exactement les feuilles de navigation actuelles.
 * id == id NAV_ITEMS, order == ordre d'apparition dans le groupe.
 */
export const CATALOG_SAFE: Catalog = [
  // ── aujourdhui ───────────────────────────────────────────────────────────
  {
    id: "aujourdhui",
    label: "Aujourd'hui",
    description: "Accueil assistante : alertes et fil d'attente du jour.",
    domains: [],
    placement: { kind: "page", group: "aujourdhui", order: 0 },
    route: routes.aujourdhui,
    icon: "Sunrise",
    status: "ga",
  },

  // ── dashboard ──────────────────────────────────────────────────────────--
  {
    id: "dashboard",
    label: "Tableau de bord",
    description: "Vue de pilotage du cabinet.",
    domains: [],
    placement: { kind: "page", group: "dashboard", order: 0 },
    route: routes.tableauDeBord,
    icon: "LayoutDashboard",
    status: "ga",
  },

  // ── gestion (Pratique) ─────────────────────────────────────────────────--
  {
    id: "clients",
    label: "Clients",
    description: "Répertoire clients, conflits, vérification d'identité.",
    domains: [],
    placement: { kind: "page", group: "gestion", order: 0 },
    route: routes.clients,
    icon: "Users",
    status: "ga",
  },
  {
    id: "dossiers",
    label: "Dossiers",
    description: "Mandats et matières.",
    domains: [],
    placement: { kind: "page", group: "gestion", order: 1 },
    route: routes.dossiers,
    icon: "FolderOpen",
    status: "ga",
  },
  {
    id: "file-assistante",
    label: "File assistante",
    description: "Queue de travail de l'assistante (couche assistante active).",
    domains: [],
    placement: { kind: "page", group: "gestion", order: 2 },
    route: routes.gestionAssistante,
    icon: "ClipboardCheck",
    status: "ga",
  },
  {
    id: "employees",
    label: "Employés",
    description: "Équipe : avocats, assistants, taux.",
    domains: [],
    placement: { kind: "page", group: "gestion", order: 3 },
    route: routes.employees,
    icon: "Users",
    status: "ga",
  },
  {
    id: "mes-heures",
    label: "Mon temps & ma paye",
    description: "Soumission d'heures employé.",
    domains: [],
    placement: { kind: "page", group: "gestion", order: 4 },
    route: routes.mesHeures,
    icon: "Clock",
    status: "ga",
  },

  // ── finances ───────────────────────────────────────────────────────────--
  {
    id: "facturation",
    label: "Facturation",
    description: "Factures, paiements, honoraires, créances.",
    domains: [],
    placement: { kind: "page", group: "finances", order: 0 },
    route: routes.facturation,
    icon: "Receipt",
    status: "ga",
  },
  {
    id: "comptabilite",
    label: "Comptabilité",
    description: "Journaux comptables (dépenses, paiements, général).",
    domains: [],
    placement: { kind: "page", group: "finances", order: 1 },
    route: routes.comptabilite,
    icon: "BookOpen",
    status: "ga",
  },
  {
    id: "comptes",
    label: "Comptes en fidéicommis",
    description: "Suivi et conciliation fidéicommis.",
    domains: [],
    placement: { kind: "page", group: "finances", order: 2 },
    route: routes.comptes,
    icon: "Wallet",
    compliance: ["Barreau / LSO — conciliation mensuelle obligatoire"],
    status: "ga",
  },
  {
    id: "temps",
    label: "Fiche de temps",
    description: "Prestations & honoraires (label varie en mode forfait).",
    domains: [],
    placement: { kind: "page", group: "finances", order: 3 },
    route: routes.temps,
    icon: "Clock",
    overrides: ["label-mode-forfait"],
    status: "ga",
  },

  // ── outils ─────────────────────────────────────────────────────────────--
  {
    id: "edition",
    label: "Édition",
    description: "Documents et templates.",
    domains: [],
    placement: { kind: "page", group: "outils", order: 0 },
    route: routes.edition,
    icon: "FileText",
    status: "ga",
  },
  {
    id: "rapports",
    label: "Rapports",
    description: "Rapports analytiques.",
    domains: [],
    placement: { kind: "page", group: "outils", order: 1 },
    route: routes.rapports,
    icon: "BarChart3",
    status: "ga",
  },
  {
    id: "safe-import",
    label: "SAFE Import",
    description: "Import de données externes (CSV/Excel).",
    domains: [],
    placement: { kind: "page", group: "outils", order: 2 },
    route: routes.safeImport,
    icon: "Upload",
    status: "ga",
  },

  // ── parametres ─────────────────────────────────────────────────────────--
  {
    id: "parametres",
    label: "Paramètres",
    description: "Configuration du cabinet.",
    domains: [],
    placement: { kind: "page", group: "parametres", order: 0 },
    route: routes.parametres,
    icon: "Settings",
    status: "ga",
  },
];

/**
 * Pages réelles repérées par la cartographie mais PAS encore dans le menu
 * principal (backlog d'intégration, hors parité). Documentées pour la suite :
 * - "briefing"        (/briefing)          → groupe dashboard
 * - "securite"        (/securite)          → groupe conformite
 * - "conformite"      (/conformite)        → groupe conformite (pas de route dédiée)
 * - "gestion-lextrack"(/gestion/lextrack)  → groupe gestion
 * - "fiches-de-temps" (/fiches-de-temps)   → page orpheline, candidate à dépréciation
 */
