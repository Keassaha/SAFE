"use client";

import { createContext, useContext } from "react";

/**
 * Fournit la province du cabinet aux composants clients profonds (écrans
 * fidéicommis / conformité) sans prop-drilling. Branché une fois dans AppChrome.
 *
 * Permet à des composants comme ReconciliationAlert ou LSOReportGenerator de
 * lire la province et d'afficher la bonne réglementation (Barreau du Québec
 * vs LSO Ontario) via getTrustRegulatorCopy().
 */
const CabinetProvinceContext = createContext<string | null>(null);

export function CabinetProvinceProvider({
  province,
  children,
}: {
  province: string | null;
  children: React.ReactNode;
}) {
  return (
    <CabinetProvinceContext.Provider value={province}>
      {children}
    </CabinetProvinceContext.Provider>
  );
}

/** Province du cabinet courant (ex. "QC", "ON") ou null si inconnue. */
export function useCabinetProvince(): string | null {
  return useContext(CabinetProvinceContext);
}
