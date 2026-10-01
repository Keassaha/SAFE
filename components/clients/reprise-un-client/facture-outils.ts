import type { FactureSaisie, LigneSaisie } from "@/lib/services/reprise-un-client/saisie";
import type { EntreeFacture } from "./types";

export function nouvelId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ligneVide(tauxMandat: number | null): LigneSaisie {
  return {
    id: nouvelId(),
    date: "",
    description: "",
    nature: "horaire",
    heures: "",
    taux: tauxMandat !== null ? String(tauxMandat).replace(".", ",") : "",
    montant: "",
  };
}

export function factureVide(nbTaxes: number, tauxMandat: number | null): FactureSaisie {
  return {
    numero: "",
    dateEmission: "",
    lignes: [ligneVide(tauxMandat)],
    taxes: Array.from({ length: nbTaxes }, () => ""),
    total: "",
    statutPaiement: null,
    datePaiement: "",
    montantRecu: "",
    modePaiement: null,
  };
}

/** Les champs repris à la main par-dessus la lecture : pour l'ambre, et pour le journal d'audit. */
export function champsCorriges(e: EntreeFacture): string[] {
  if (!e.lu) return [];
  const lu = e.lu;
  const s = e.saisie;
  const diff: string[] = [];
  if (s.numero !== lu.numero) diff.push("numero");
  if (s.dateEmission !== lu.dateEmission) diff.push("dateEmission");
  if (s.total !== lu.total) diff.push("total");
  s.taxes.forEach((v, i) => v !== (lu.taxes[i] ?? "") && diff.push(`taxe${i + 1}`));
  s.lignes.forEach((l, i) => {
    const o = lu.lignes.find((x) => x.id === l.id);
    if (!o) return diff.push(`ligne${i + 1}`);
    (["date", "description", "nature", "heures", "taux", "montant"] as const).forEach((k) => {
      if (l[k] !== o[k]) diff.push(`ligne${i + 1}.${k}`);
    });
  });
  return diff;
}
