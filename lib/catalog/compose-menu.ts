/**
 * PROTOTYPE — Moteur de composition.
 *
 * Le cœur de l'inversion : à partir du catalogue + du manifeste d'un cabinet
 * (la liste des outils activés), on COMPOSE l'interface, au lieu de filtrer
 * un menu statique.
 *
 * Fonctions pures, testables, sans dépendance React.
 */

import type {
  Catalog,
  MenuGroup,
  ToolDefinition,
} from "./types";

/** Libellés affichés des groupes de menu, dans l'ordre voulu. */
export const MENU_GROUP_ORDER: { id: MenuGroup; label: string }[] = [
  { id: "aujourdhui", label: "Aujourd'hui" },
  { id: "dashboard", label: "Tableau de bord" },
  { id: "gestion", label: "Pratique" },
  { id: "finances", label: "Finances" },
  { id: "outils", label: "Outils" },
  { id: "conformite", label: "Conformité" },
  { id: "parametres", label: "Paramètres" },
];

export interface ComposedMenuItem {
  id: string;
  label: string;
  route?: string;
  icon?: string;
  status: ToolDefinition["status"];
}

export interface ComposedMenuGroup {
  id: MenuGroup;
  label: string;
  items: ComposedMenuItem[];
}

export interface ComposedHostInjection {
  host: string;
  kind: "widget" | "action";
  toolId: string;
  label: string;
  slotOrLocation: string;
}

export interface ComposeResult {
  /** Le menu, prêt à rendre, groupe par groupe (groupes vides retirés). */
  menu: ComposedMenuGroup[];
  /** Widgets / actions accrochés à leurs pages hôtes. */
  injections: ComposedHostInjection[];
  /** Outils activés dont une dépendance manque (à signaler). */
  missingDependencies: { toolId: string; missing: string[] }[];
}

/**
 * Compose l'interface d'un cabinet.
 *
 * @param catalog        la bibliothèque interne complète
 * @param activatedIds   les outils activés pour ce cabinet (le manifeste)
 */
export function composeInterface(
  catalog: Catalog,
  activatedIds: string[],
): ComposeResult {
  const active = new Set(activatedIds);
  const activeTools = catalog.filter((t) => active.has(t.id));

  // 1. Pages -> menu, regroupées et triées par order.
  const byGroup = new Map<MenuGroup, ComposedMenuItem[]>();
  for (const tool of activeTools) {
    if (tool.placement.kind !== "page") continue;
    const list = byGroup.get(tool.placement.group) ?? [];
    list.push({
      id: tool.id,
      label: tool.label,
      route: tool.route,
      icon: tool.icon,
      status: tool.status,
    });
    byGroup.set(tool.placement.group, list);
  }

  const menu: ComposedMenuGroup[] = MENU_GROUP_ORDER.map((g) => {
    const items = (byGroup.get(g.id) ?? []).sort((a, b) => {
      const oa = pageOrder(catalog, a.id);
      const ob = pageOrder(catalog, b.id);
      return oa - ob;
    });
    return { id: g.id, label: g.label, items };
  }).filter((g) => g.items.length > 0);

  // 2. Widgets / actions -> injections sur leurs hôtes.
  const injections: ComposedHostInjection[] = [];
  for (const tool of activeTools) {
    if (tool.placement.kind === "widget") {
      injections.push({
        host: tool.placement.host,
        kind: "widget",
        toolId: tool.id,
        label: tool.label,
        slotOrLocation: tool.placement.slot,
      });
    } else if (tool.placement.kind === "action") {
      injections.push({
        host: tool.placement.host,
        kind: "action",
        toolId: tool.id,
        label: tool.label,
        slotOrLocation: tool.placement.location,
      });
    }
  }

  // 3. Dépendances manquantes.
  const missingDependencies: { toolId: string; missing: string[] }[] = [];
  for (const tool of activeTools) {
    if (!tool.requires?.length) continue;
    const missing = tool.requires.filter((dep) => !active.has(dep));
    if (missing.length > 0) {
      missingDependencies.push({ toolId: tool.id, missing });
    }
  }

  return { menu, injections, missingDependencies };
}

function pageOrder(catalog: Catalog, toolId: string): number {
  const tool = catalog.find((t) => t.id === toolId);
  if (tool?.placement.kind === "page") return tool.placement.order;
  return Number.MAX_SAFE_INTEGER;
}

/**
 * Helper : quels outils l'audit propose pour un ensemble de domaines.
 * (Aperçu de ce que le moteur audit -> manifeste produirait.)
 */
export function suggestToolsForDomains(
  catalog: Catalog,
  domains: string[],
): string[] {
  const wanted = new Set(domains);
  return catalog
    .filter(
      (t) => t.domains.length === 0 || t.domains.some((d) => wanted.has(d)),
    )
    .map((t) => t.id);
}
