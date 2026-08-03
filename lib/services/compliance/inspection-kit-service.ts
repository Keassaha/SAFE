/**
 * Trousse d'inspection : tout ce qu'un inspecteur demande, en une production.
 *
 * Art. 29 et 30 B-1 r.5 (accès et copie papier immédiate) · art. 33 (reconstitution
 * aux frais de l'avocat) · By-Law 9, par. 21(2).
 *
 * L'art. 33 est ce qui rend cette trousse utile : une reconstitution se fait « aux
 * frais de l'avocat ». Un cabinet qui peut réexporter une période complète, horodatée
 * et empreintée, n'a rien à reconstituer — il produit.
 *
 * ⚠️ LA TROUSSE NE CERTIFIE RIEN. Elle rassemble ce qui existe et dit, pièce par
 * pièce, ce qui manque. Une trousse qui masquerait ses trous serait pire qu'aucune
 * trousse : le cabinet arriverait devant l'inspecteur en croyant être prêt.
 */

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import { getRegisters, type RegisterId } from "@/lib/compliance/registers";
import { loadRegister } from "@/lib/services/fideicommis/register-service";
import { toCsv } from "@/lib/services/fideicommis/register-render";

/* ════════════════════════════════════════════════════════════════
   CE QUE LA TROUSSE CONTIENT
   ════════════════════════════════════════════════════════════════ */

export type KitItemKind = "REGISTER" | "MONTHLY_REPORT" | "ANNUAL_REPORT" | "SHORTFALL_LOG";

export interface KitItem {
  kind: KitItemKind;
  /** Nom de fichier dans la trousse. */
  filename: string;
  titleFr: string;
  /** Article qui rend cette pièce exigible. */
  reference: string;
  /** Contenu produit. `null` quand la pièce est absente. */
  content: string | null;
  /** Empreinte du contenu. `null` quand il n'y a rien à empreindre. */
  fingerprint: string | null;
  rowCount: number;
  /** Pourquoi la pièce manque, quand elle manque. */
  missingReasonFr: string | null;
}

export interface InspectionKit {
  cabinetId: string;
  cabinetName: string;
  province: CabinetProvince;
  periodFrom: Date;
  periodTo: Date;
  generatedAt: Date;
  generatedBy: string;
  items: KitItem[];
  /** Manifeste lisible, listant chaque pièce et son empreinte. */
  manifest: string;
  /** Empreinte du manifeste lui-même : elle scelle l'ensemble. */
  manifestFingerprint: string;
  /** Nombre de pièces attendues qui manquent. Zéro n'est pas garanti, et c'est le but. */
  missingCount: number;
}

function monthsBetween(from: Date, to: Date): string[] {
  const out: string[] = [];
  const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
  while (cur.getTime() <= end.getTime()) {
    out.push(`${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}`);
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

/**
 * Assemble la trousse.
 *
 * Chaque registre applicable à la province est produit. Un registre qui échoue n'arrête
 * PAS la production : il est porté à la trousse comme manquant, avec la raison. Une
 * trousse qui s'interromprait à la première pièce absente ne servirait à rien le jour
 * où elle sert.
 */
export async function buildInspectionKit(params: {
  cabinetId: string;
  periodFrom: Date;
  periodTo: Date;
  generatedBy: string;
  now?: Date;
}): Promise<InspectionKit> {
  const now = params.now ?? new Date();
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: params.cabinetId },
    select: { nom: true },
  });
  const cabinetName = cabinet?.nom ?? params.cabinetId;

  const items: KitItem[] = [];

  // ── Les registres ────────────────────────────────────────────────
  for (const definition of getRegisters(province)) {
    const id = definition.id as RegisterId;
    try {
      const rendered = await loadRegister({
        cabinetId: params.cabinetId,
        registerId: id,
        generatedBy: params.generatedBy,
      });
      items.push({
        kind: "REGISTER",
        filename: `registres/${id}.csv`,
        titleFr: definition.titleFr,
        reference: definition.reference,
        content: toCsv(rendered, "fr"),
        fingerprint: rendered.fingerprint,
        rowCount: rendered.rowCount,
        missingReasonFr: null,
      });
    } catch (e) {
      items.push({
        kind: "REGISTER",
        filename: `registres/${id}.csv`,
        titleFr: definition.titleFr,
        reference: definition.reference,
        content: null,
        fingerprint: null,
        rowCount: 0,
        missingReasonFr: e instanceof Error ? e.message : "Production impossible.",
      });
    }
  }

  // ── Les rapports mensuels de la période ──────────────────────────
  //
  // Un mois sans rapport est porté comme MANQUANT, pas omis. C'est la première chose
  // qu'un inspecteur compte, et un trou silencieux dans la liste ressemblerait à une
  // période sans obligation.
  const reports = await prisma.trustMonthlyReport.findMany({
    where: {
      cabinetId: params.cabinetId,
      periode: { in: monthsBetween(params.periodFrom, params.periodTo) },
    },
    select: { id: true, periode: true, certifiedAt: true, certifiedById: true },
  });
  const byPeriode = new Map(reports.map((r) => [r.periode, r]));
  const refMensuel = province === "QC" ? "B-1 r.5, art. 41" : "By-Law 9, s. 18(8)";

  for (const periode of monthsBetween(params.periodFrom, params.periodTo)) {
    const r = byPeriode.get(periode);
    if (!r) {
      items.push({
        kind: "MONTHLY_REPORT",
        filename: `rapports-mensuels/${periode}.txt`,
        titleFr: `Rapport comptable mensuel ${periode}`,
        reference: refMensuel,
        content: null,
        fingerprint: null,
        rowCount: 0,
        missingReasonFr: "Aucun rapport n'a été produit pour ce mois.",
      });
      continue;
    }
    const certifie = r.certifiedAt
      ? `Certifié le ${r.certifiedAt.toISOString().slice(0, 10)} par ${r.certifiedById ?? "—"}.`
      : null;
    items.push({
      kind: "MONTHLY_REPORT",
      filename: `rapports-mensuels/${periode}.txt`,
      titleFr: `Rapport comptable mensuel ${periode}`,
      reference: refMensuel,
      content: certifie ?? `Rapport ${periode} produit mais NON CERTIFIÉ.`,
      fingerprint: createHash("sha256").update(r.id).digest("hex"),
      rowCount: 1,
      // Un rapport non certifié n'est pas une pièce absente, mais il n'est pas non
      // plus une pièce conforme. Le dire évite qu'il soit compté comme acquis.
      missingReasonFr: certifie ? null : "Rapport produit mais non certifié.",
    });
  }

  // ── Les découverts de la période (CH-10) ─────────────────────────
  //
  // Résolus compris. C'est précisément ce qu'un inspecteur cherche : non pas l'état à
  // une date, mais ce qui s'est passé.
  const shortfalls = await prisma.trustShortfall.findMany({
    where: {
      cabinetId: params.cabinetId,
      detectedAt: { gte: params.periodFrom, lte: params.periodTo },
    },
    orderBy: { detectedAt: "asc" },
  });
  const lignes = shortfalls.map(
    (s) =>
      `${s.detectedAt.toISOString().slice(0, 10)};${s.clientId};${s.dossierId ?? ""};${s.amount.toFixed(2)};${
        s.resolvedAt ? s.resolvedAt.toISOString().slice(0, 10) : "NON COMBLÉ"
      };${s.remediationSource ?? ""}`,
  );
  const contenuDecouverts = [
    "date_detection;client;dossier;montant;date_comblement;source",
    ...lignes,
  ].join("\n");

  items.push({
    kind: "SHORTFALL_LOG",
    filename: "soldes-debiteurs.csv",
    titleFr: "Soldes débiteurs constatés et comblés",
    reference: province === "QC" ? "B-1 r.5, art. 59, 60" : "By-Law 9, s. 9(3), 14",
    content: contenuDecouverts,
    fingerprint: createHash("sha256").update(contenuDecouverts, "utf8").digest("hex"),
    rowCount: lignes.length,
    missingReasonFr: null,
  });

  // ── Le manifeste ────────────────────────────────────────────────
  const missingCount = items.filter((i) => i.missingReasonFr !== null).length;
  const manifest = buildManifest({
    cabinetName,
    province,
    periodFrom: params.periodFrom,
    periodTo: params.periodTo,
    generatedAt: now,
    generatedBy: params.generatedBy,
    items,
    missingCount,
  });

  return {
    cabinetId: params.cabinetId,
    cabinetName,
    province,
    periodFrom: params.periodFrom,
    periodTo: params.periodTo,
    generatedAt: now,
    generatedBy: params.generatedBy,
    items,
    manifest,
    manifestFingerprint: createHash("sha256").update(manifest, "utf8").digest("hex"),
    missingCount,
  };
}

/**
 * Manifeste lisible.
 *
 * Il ouvre sur ce qui MANQUE, pas sur ce qui est présent. Un manifeste qui commencerait
 * par la liste des pièces produites laisserait croire que la trousse est complète, et
 * personne ne lirait jusqu'au bas.
 */
function buildManifest(params: {
  cabinetName: string;
  province: CabinetProvince;
  periodFrom: Date;
  periodTo: Date;
  generatedAt: Date;
  generatedBy: string;
  items: KitItem[];
  missingCount: number;
}): string {
  const l: string[] = [];
  l.push("TROUSSE D'INSPECTION");
  l.push("");
  l.push(`Cabinet : ${params.cabinetName}`);
  l.push(`Régime : ${params.province === "QC" ? "Barreau du Québec" : "Law Society of Ontario"}`);
  l.push(
    `Période : ${params.periodFrom.toISOString().slice(0, 10)} au ${params.periodTo.toISOString().slice(0, 10)}`,
  );
  l.push(`Produite le : ${params.generatedAt.toISOString()}`);
  l.push(`Produite par : ${params.generatedBy}`);
  l.push("");

  if (params.missingCount > 0) {
    l.push(`⚠️ ${params.missingCount} pièce(s) manquante(s) ou incomplète(s) :`);
    for (const i of params.items.filter((x) => x.missingReasonFr)) {
      l.push(`   - ${i.titleFr} (${i.reference}) : ${i.missingReasonFr}`);
    }
    l.push("");
    l.push(
      "Cette trousse ne certifie pas la conformité du cabinet. Elle rassemble ce qui existe",
    );
    l.push("et nomme ce qui manque.");
  } else {
    l.push("Aucune pièce manquante détectée pour la période.");
    l.push("");
    l.push(
      "Cela ne vaut pas attestation de conformité : la trousse constate la présence des",
    );
    l.push("pièces, pas l'exactitude de leur contenu.");
  }

  l.push("");
  l.push("PIÈCES");
  l.push("");
  for (const i of params.items) {
    l.push(`${i.filename}`);
    l.push(`   ${i.titleFr} — ${i.reference}`);
    l.push(`   lignes : ${i.rowCount}`);
    l.push(`   empreinte SHA-256 : ${i.fingerprint ?? "— (pièce absente)"}`);
    l.push("");
  }

  l.push("Les empreintes permettent de vérifier qu'une pièce transmise n'a pas été modifiée");
  l.push("depuis sa production. Elles ne sont exigées par aucun article : c'est un moyen,");
  l.push("choisi ici, de rendre la trousse vérifiable.");

  return l.join("\n");
}
