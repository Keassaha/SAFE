import Link from "next/link";
import s from "../../../v2.module.css";

export type TabId =
  | "overview"
  | "activity"
  | "time"
  | "billing"
  | "trust"
  | "documents";

export const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Aperçu" },
  { id: "activity", label: "Activité" },
  { id: "time", label: "Temps et débours" },
  { id: "billing", label: "Facturation" },
  { id: "trust", label: "Fidéicommis" },
  { id: "documents", label: "Documents" },
];

export function normalizeTab(raw: string | undefined): TabId {
  return (TABS.some((t) => t.id === raw) ? raw : "overview") as TabId;
}

/**
 * Onglets pilotés par l'URL (?tab=) : la page reste un Server Component et
 * ne charge que l'onglet actif. Compteurs optionnels par onglet (réels).
 */
export function MatterTabsNav({
  dossierId,
  active,
  counts,
}: {
  dossierId: string;
  active: TabId;
  counts?: Partial<Record<TabId, number>>;
}) {
  return (
    <nav className={s.tabs} aria-label="Vues du dossier">
      {TABS.map((item) => {
        const count = counts?.[item.id];
        return (
          <Link
            key={item.id}
            href={
              item.id === "overview"
                ? `/v2/dossiers/${dossierId}`
                : `/v2/dossiers/${dossierId}?tab=${item.id}`
            }
            scroll={false}
            aria-current={active === item.id ? "page" : undefined}
            className={active === item.id ? s.tabActive : ""}
          >
            {item.label}
            {count ? <span>{count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
