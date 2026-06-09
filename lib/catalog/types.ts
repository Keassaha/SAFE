/**
 * PROTOTYPE — Catalogue d'outils SAFE (la "bibliothèque interne").
 *
 * Objectif : prouver l'inversion du modèle de menu.
 *   - AVANT : le menu est un tableau statique (components/layout/SidebarNav.tsx)
 *     que la config peut seulement *cacher* (activeNavIds / hiddenNavIds).
 *   - APRÈS : le catalogue est la source de vérité. Le menu de chaque cabinet
 *     est *composé* à partir des outils qu'il a activés. Activer un outil =
 *     il apparaît tout seul au bon endroit.
 *
 * Ce schéma n'est PAS encore figé. Il sert à valider le concept avant l'ADR.
 * Granularité retenue (décision CEO 2026-06-07) : trois types d'outils
 * — page, widget, action.
 */

/** Domaines de pratique. Vide = outil "cœur" pertinent pour tous les cabinets. */
export type Domaine =
  | "famille"
  | "immobilier"
  | "immigration"
  | "affaires"
  | "travail"
  | "generaliste";

/** Groupes de menu disponibles (alignés sur les sections de SidebarNav). */
export type MenuGroup =
  | "aujourdhui"
  | "dashboard"
  | "gestion"
  | "finances"
  | "outils"
  | "conformite"
  | "parametres";

/** Statut de maturité d'un outil dans la bibliothèque. */
export type ToolStatus = "ga" | "beta" | "custom";

/**
 * Un outil de type "page" : un onglet/page autonome.
 * Il se place lui-même dans un groupe de menu, à une position donnée.
 */
export interface PagePlacement {
  kind: "page";
  group: MenuGroup;
  /** Position relative dans le groupe (plus petit = plus haut). */
  order: number;
}

/**
 * Un outil de type "widget" : une carte injectée dans une page existante.
 * Il n'apparaît pas dans le menu, il s'accroche à un hôte.
 */
export interface WidgetPlacement {
  kind: "widget";
  /** id de la page hôte (ex: "dashboard", "client-detail"). */
  host: string;
  /** emplacement nommé dans la page hôte (ex: "sidebar", "header", "main-top"). */
  slot: string;
}

/**
 * Un outil de type "action" : un bouton / une automatisation.
 * Il s'attache à un hôte (page, ligne de tableau, menu contextuel).
 */
export interface ActionPlacement {
  kind: "action";
  host: string;
  /** où l'action apparaît (ex: "row-menu", "page-actions", "quick-capture"). */
  location: string;
}

export type ToolPlacement = PagePlacement | WidgetPlacement | ActionPlacement;

export interface ToolDefinition {
  id: string;
  label: string;
  description: string;
  /** Domaines où l'outil a du sens. Vide = cœur (toujours pertinent). */
  domains: Domaine[];
  placement: ToolPlacement;
  /** Route servie (pour les pages). */
  route?: string;
  /** Nom d'icône lucide (rendu côté client). */
  icon?: string;
  /** Autres outils requis pour que celui-ci fonctionne. */
  requires?: string[];
  /** Seeds à lancer à l'activation. */
  seeds?: string[];
  /** Implications de conformité à signaler (Barreau, Loi 25, etc.). */
  compliance?: string[];
  /** Surface paramétrable tolérée (overrides). */
  overrides?: string[];
  status: ToolStatus;
}

/** Le catalogue = la bibliothèque interne complète. */
export type Catalog = ToolDefinition[];

/**
 * Manifeste d'activation d'un cabinet : la sortie attendue du moteur
 * audit -> bundle -> configuration. C'est ce que la Console afficherait
 * comme "instructions" et que le rendu consommerait pour composer l'app.
 */
export interface CabinetManifest {
  cabinetId: string;
  bundleId?: string;
  /** Outils activés (ids du catalogue). */
  activatedToolIds: string[];
  /** Overrides validés par outil. */
  overrides?: Record<string, Record<string, unknown>>;
}
