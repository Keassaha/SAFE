"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Crumb = {
  label: string;
  href?: string;
  /** Dernier segment mis en évidence (ex. la référence du dossier). */
  strong?: boolean;
};

type CrumbsState = {
  crumbs: Crumb[] | null;
  setCrumbs: (crumbs: Crumb[] | null) => void;
};

const CrumbsContext = createContext<CrumbsState>({
  crumbs: null,
  setCrumbs: () => {},
});

/** Provider monté dans ShellV2 — la topbar consomme, les pages publient. */
export function CrumbsProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null);
  return (
    <CrumbsContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </CrumbsContext.Provider>
  );
}

export function useCrumbs(): CrumbsState {
  return useContext(CrumbsContext);
}

/**
 * Publié par une page (server component) pour alimenter le fil d'ariane de la
 * topbar — le design « Calme opérationnel » porte le contexte là, pas dans
 * l'en-tête de page (le breadcrumb du header est masqué par la passe Linear).
 */
export function SetCrumbs({ items }: { items: Crumb[] }) {
  const { setCrumbs } = useCrumbs();
  const serialized = JSON.stringify(items);
  useEffect(() => {
    setCrumbs(JSON.parse(serialized) as Crumb[]);
    return () => setCrumbs(null);
  }, [serialized, setCrumbs]);
  return null;
}
