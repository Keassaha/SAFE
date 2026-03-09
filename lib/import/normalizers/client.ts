import type { RawRow, ColumnMapping, NormalizedRow, NormalizedClient, FieldError } from "../types";

function parseClientName(raw: string): { raisonSociale: string; nom?: string; prenom?: string; typeClient: "personne_physique" | "personne_morale" } {
  if (!raw) return { raisonSociale: "", typeClient: "personne_morale" };
  const trimmed = raw.trim();
  if (trimmed.includes(",")) {
    const [nom, prenom] = trimmed.split(",").map((s) => s.trim());
    return {
      raisonSociale: trimmed,
      nom: nom || undefined,
      prenom: prenom || undefined,
      typeClient: "personne_physique",
    };
  }
  return { raisonSociale: trimmed, typeClient: "personne_morale" };
}

function mapStatut(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (["actif", "active", "ouvert", "open"].includes(lower)) return "actif";
  if (["fermé", "ferme", "cloturé", "cloture", "closed", "inactif", "inactive"].includes(lower)) return "inactif";
  if (["archivé", "archive", "archived"].includes(lower)) return "archive";
  return "actif";
}

function mapLangue(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (["français", "francais", "french", "fr"].includes(lower)) return "FR";
  if (["anglais", "english", "en"].includes(lower)) return "EN";
  return raw.toUpperCase().slice(0, 2) || "FR";
}

export function normalizeClientRow(
  row: RawRow,
  mapping: ColumnMapping,
  index: number,
): NormalizedRow<NormalizedClient> {
  const errors: FieldError[] = [];
  const warnings: string[] = [];

  const get = (field: string) => {
    const col = mapping[field];
    return col ? (row[col] ?? "").trim() : "";
  };

  const clientRaw = get("raisonSociale");
  if (!clientRaw) {
    errors.push({ field: "raisonSociale", message: "Client / Raison sociale manquant" });
  }
  const parsed = parseClientName(clientRaw);

  const emailRaw = get("email");
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    warnings.push(`Email possiblement invalide : ${emailRaw}`);
  }

  const dateOuvertureRaw = get("dateOuverture");
  let dateOuverture: string | undefined;
  if (dateOuvertureRaw) {
    const d = new Date(dateOuvertureRaw);
    dateOuverture = Number.isNaN(d.getTime()) ? dateOuvertureRaw : d.toISOString().slice(0, 10);
  }

  const data: NormalizedClient = {
    raisonSociale: parsed.raisonSociale,
    typeClient: parsed.typeClient,
    nom: parsed.nom,
    prenom: parsed.prenom,
    email: emailRaw || undefined,
    telephone: get("telephone") || undefined,
    adresse: get("adresse") || undefined,
    langue: get("langue") ? mapLangue(get("langue")) : undefined,
    numeroDossier: get("numeroDossier") || undefined,
    partieAdverse: get("partieAdverse") || undefined,
    categorieDossier: get("categorieDossier") || undefined,
    typeDossier: get("typeDossier") || undefined,
    dateOuverture,
    statut: get("statut") ? mapStatut(get("statut")) : undefined,
  };

  return { index, data, errors, warnings };
}
