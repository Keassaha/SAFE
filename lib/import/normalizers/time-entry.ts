import type { RawRow, ColumnMapping, NormalizedRow, NormalizedTimeEntry, FieldError } from "../types";

function parseNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function mapStatut(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (["facturée", "facturee", "billed", "facture", "facturé"].includes(lower)) return "facture";
  if (["validée", "validee", "validated", "valide", "validé"].includes(lower)) return "valide";
  return "brouillon";
}

export function normalizeTimeEntryRow(
  row: RawRow,
  mapping: ColumnMapping,
  index: number,
): NormalizedRow<NormalizedTimeEntry> {
  const errors: FieldError[] = [];
  const warnings: string[] = [];

  const get = (field: string) => {
    const col = mapping[field];
    return col ? (row[col] ?? "").trim() : "";
  };

  const dateRaw = get("date");
  if (!dateRaw) {
    errors.push({ field: "date", message: "Date manquante" });
  }
  let date = "";
  if (dateRaw) {
    const d = new Date(dateRaw);
    date = Number.isNaN(d.getTime()) ? dateRaw : d.toISOString().slice(0, 10);
  }

  const clientName = get("clientName");
  if (!clientName) {
    warnings.push("Nom du client manquant");
  }

  const dureeHeures = parseNumber(get("dureeHeures"));
  if (dureeHeures <= 0) {
    errors.push({ field: "dureeHeures", message: "Durée invalide ou manquante", value: get("dureeHeures") });
  }

  const avocatName = get("avocatName");
  if (!avocatName) {
    warnings.push("Nom de l'avocat manquant");
  }

  const tauxHoraire = parseNumber(get("tauxHoraire"));
  const montantRaw = parseNumber(get("montant"));
  const montant = montantRaw > 0 ? montantRaw : dureeHeures * tauxHoraire;

  const data: NormalizedTimeEntry = {
    date,
    clientName,
    numeroDossier: get("numeroDossier") || undefined,
    description: get("description") || undefined,
    dureeHeures,
    avocatName,
    tauxHoraire,
    montant,
    statut: get("statut") ? mapStatut(get("statut")) : "brouillon",
  };

  return { index, data, errors, warnings };
}
