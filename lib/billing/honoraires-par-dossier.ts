import { applyTaxes } from "@/lib/billing/taxes";
import type { CabinetTaxConfig } from "@/lib/billing/types";

/**
 * Regroupement des honoraires à facturer PAR DOSSIER.
 *
 * L'écran « Honoraires à facturer » additionnait tout ce qu'un client devait
 * dans une seule ligne, avec un seul bouton. Un client aux trois dossiers ne
 * voyait qu'une option, et une adjointe qui voulait facturer un seul dossier
 * devait aller cocher des fiches une à une dans le détail. Décision CEO du
 * 2026-09-12 : un dossier, une facture.
 *
 * Ce module est pur : il reçoit des fiches, des débours, des tâches, et rend
 * des lignes. Aucun accès à la base, pour se tester sans navigateur ni Prisma.
 */

const NOT_SENT = new Set(["DRAFT", "READY_TO_ISSUE"]);

export type ClientSource = {
  id: string;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
};

export type DossierSource = {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  clientId: string;
  client: ClientSource | null;
};

export type FicheSource = {
  id: string;
  date: Date;
  dureeMinutes: number;
  montant: number;
  feeAmount: number | null;
  taxable: boolean | null;
  clientId: string | null;
  client: ClientSource | null;
  dossierId: string | null;
  dossier: DossierSource | null;
  userNom: string | null;
  invoiceId: string | null;
  invoiceStatus: string | null;
};

/** Débours de la table `Expense` (rattaché au client, dossier facultatif). */
export type ExpenseSource = {
  id: string;
  date: Date;
  amount: number;
  taxable: boolean;
  clientId: string;
  client: ClientSource;
  dossierId: string | null;
  dossier: DossierSource | null;
  invoiceId: string | null;
  invoiceStatus: string | null;
};

/** Débours de dossier (`DeboursDossier`), les vrais débours saisis dans le produit. */
export type DeboursSource = {
  id: string;
  date: Date;
  montant: number;
  taxable: boolean;
  clientId: string;
  dossierId: string;
  dossier: DossierSource;
  invoiceId: string | null;
  invoiceStatus: string | null;
};

export type TacheSource = {
  id: string;
  date: Date;
  montantFinal: number;
  taxable: boolean;
  clientId: string | null;
  dossierId: string;
  dossier: DossierSource;
  invoiceId: string | null;
  invoiceStatus: string | null;
};

export type HonorairesDossierRow = {
  /** `dossierId`, ou `client:<clientId>` pour les fiches sans dossier. */
  key: string;
  dossierId: string | null;
  dossierNumero: string | null;
  dossierIntitule: string | null;
  clientId: string;
  clientName: string;
  /** Fiches + débours + tâches, libres ou déjà en brouillon. */
  count: number;
  totalHeures: number;
  totalHonoraires: number;
  totalDebours: number;
  totalForfaits: number;
  taxesEstimees: number;
  totalAFacturer: number;
  /** Total des seules pièces libres (pas encore dans un brouillon). */
  totalLibre: number;
  /** Vrai quand les pièces libres n'atteignent pas le seuil du cabinet. */
  sousSeuil: boolean;
  lastDate: Date;
  plusAncienneDate: Date;
  ageMaxJours: number;
  /** Noms des professionnels ayant du temps sur le dossier, dédoublonnés. */
  avocats: string[];
  timeEntryIds: string[];
  expenseIds: string[];
  deboursIds: string[];
  registreTacheIds: string[];
  draftInvoiceIds: string[];
};

export function clientDisplayName(c: ClientSource): string {
  const rs = c.raisonSociale?.trim();
  if (rs) return rs;
  return [c.nom, c.prenom].filter((x) => x && x.trim()).join(", ") || "Client";
}

type Brouillon = Omit<
  HonorairesDossierRow,
  "taxesEstimees" | "totalAFacturer" | "sousSeuil" | "ageMaxJours" | "avocats"
> & { totalTaxable: number; totalLibreTaxable: number; avocats: Set<string> };

function estEnBrouillon(invoiceId: string | null, invoiceStatus: string | null): boolean {
  return invoiceId != null && invoiceStatus != null && NOT_SENT.has(invoiceStatus);
}

export function regrouperHonorairesParDossier(
  input: {
    fiches: FicheSource[];
    expenses: ExpenseSource[];
    debours: DeboursSource[];
    taches: TacheSource[];
  },
  taxConfig: CabinetTaxConfig,
  seuil: number,
  now: Date = new Date(),
): HonorairesDossierRow[] {
  const rows = new Map<string, Brouillon>();

  function ligne(
    dossier: DossierSource | null,
    clientId: string,
    client: ClientSource | null,
    date: Date,
  ): Brouillon {
    const key = dossier?.id ?? `client:${clientId}`;
    const existing = rows.get(key);
    if (existing) {
      if (date > existing.lastDate) existing.lastDate = date;
      if (date < existing.plusAncienneDate) existing.plusAncienneDate = date;
      return existing;
    }
    const source = dossier?.client ?? client;
    const created: Brouillon = {
      key,
      dossierId: dossier?.id ?? null,
      dossierNumero: dossier?.numeroDossier ?? null,
      dossierIntitule: dossier?.intitule ?? null,
      clientId,
      clientName: source ? clientDisplayName(source) : "Client",
      count: 0,
      totalHeures: 0,
      totalHonoraires: 0,
      totalDebours: 0,
      totalForfaits: 0,
      totalTaxable: 0,
      totalLibre: 0,
      totalLibreTaxable: 0,
      lastDate: date,
      plusAncienneDate: date,
      avocats: new Set(),
      timeEntryIds: [],
      expenseIds: [],
      deboursIds: [],
      registreTacheIds: [],
      draftInvoiceIds: [],
    };
    rows.set(key, created);
    return created;
  }

  function compter(
    r: Brouillon,
    montant: number,
    taxable: boolean,
    invoiceId: string | null,
    invoiceStatus: string | null,
    libres: string[],
    id: string,
  ) {
    r.count += 1;
    if (taxable) r.totalTaxable += montant;
    if (estEnBrouillon(invoiceId, invoiceStatus)) {
      r.draftInvoiceIds.push(invoiceId as string);
    } else {
      libres.push(id);
      r.totalLibre += montant;
      if (taxable) r.totalLibreTaxable += montant;
    }
  }

  for (const f of input.fiches) {
    const clientId = f.clientId ?? f.dossier?.clientId ?? null;
    if (!clientId) continue;
    const r = ligne(f.dossier, clientId, f.client, f.date);
    const montant = f.feeAmount ?? f.montant;
    r.totalHeures += f.dureeMinutes / 60;
    r.totalHonoraires += montant;
    if (f.userNom) r.avocats.add(f.userNom);
    compter(r, montant, f.taxable ?? true, f.invoiceId, f.invoiceStatus, r.timeEntryIds, f.id);
  }

  for (const e of input.expenses) {
    const r = ligne(e.dossier, e.clientId, e.client, e.date);
    r.totalDebours += e.amount;
    compter(r, e.amount, e.taxable, e.invoiceId, e.invoiceStatus, r.expenseIds, e.id);
  }

  for (const d of input.debours) {
    const r = ligne(d.dossier, d.clientId, d.dossier.client, d.date);
    r.totalDebours += d.montant;
    compter(r, d.montant, d.taxable, d.invoiceId, d.invoiceStatus, r.deboursIds, d.id);
  }

  for (const t of input.taches) {
    const clientId = t.clientId ?? t.dossier.clientId;
    const r = ligne(t.dossier, clientId, t.dossier.client, t.date);
    r.totalForfaits += t.montantFinal;
    compter(r, t.montantFinal, t.taxable, t.invoiceId, t.invoiceStatus, r.registreTacheIds, t.id);
  }

  const nowMs = now.getTime();
  const out: HonorairesDossierRow[] = Array.from(rows.values()).map((r) => {
    const { totalTaxable, totalLibreTaxable, avocats, ...rest } = r;
    const subtotal = r.totalHonoraires + r.totalDebours + r.totalForfaits;
    const taxesEstimees = applyTaxes(totalTaxable, true, taxConfig).taxesTotal;
    const totalLibreTTC =
      r.totalLibre + applyTaxes(totalLibreTaxable, true, taxConfig).taxesTotal;
    return {
      ...rest,
      avocats: Array.from(avocats).sort(),
      draftInvoiceIds: Array.from(new Set(r.draftInvoiceIds)),
      taxesEstimees,
      totalAFacturer: Math.round((subtotal + taxesEstimees) * 100) / 100,
      totalLibre: Math.round(totalLibreTTC * 100) / 100,
      sousSeuil: totalLibreTTC < seuil,
      ageMaxJours: Math.max(0, Math.floor((nowMs - r.plusAncienneDate.getTime()) / 86_400_000)),
    };
  });

  // Client par client (nom), puis numéro de dossier : l'œil lit un client
  // d'un bloc, et ses dossiers dans l'ordre où le cabinet les a ouverts.
  out.sort(
    (a, b) =>
      a.clientName.localeCompare(b.clientName, "fr") ||
      (a.dossierNumero ?? "￿").localeCompare(b.dossierNumero ?? "￿", "fr") ||
      (a.dossierIntitule ?? "").localeCompare(b.dossierIntitule ?? "", "fr"),
  );
  return out;
}
