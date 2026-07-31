/**
 * Service de rapprochement fidéicommis (B-1 r.5 Barreau QC / By-Law 9 LSO).
 *
 * Rapprochement à TROIS voies, réellement trois depuis CH-00 :
 *   1. relevé bancaire rapproché (banque − chèques en circulation + dépôts en transit)
 *   2. journal de caisse en fidéicommis (registre append-only)
 *   3. somme des soldes inscrits aux cartes-clients (dérivée du même registre)
 *
 * La comparaison 2 ↔ 3 manquait : `soldeParDossier` était calculé, stocké, et
 * jamais confronté. C'est pourtant elle qui attrape une écriture rattachée au
 * mauvais dossier — le cas où la banque concorde parfaitement et où l'argent d'un
 * client est quand même au mauvais endroit.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getGlobalTrustBalance, getTrustBalancesByDossier } from "./trust-balance-service";
import { lockAccountingPeriod } from "@/lib/services/journal/period-lock";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import { TrustComplianceError } from "./errors";
import { resolveDefaultTrustBankAccountId } from "./trust-bank-account-service";

/**
 * Sévérité du retard de rapprochement, PROVINCE-AWARE (fonction pure, testable).
 *
 * Ontario (By-Law 9, art. 22(2)) : le rapprochement mensuel doit être complété au plus
 * tard 25 jours après la fin du mois. On alerte à J+20 (marge) et on marque non-conforme
 * (critique) à J+25.
 *
 * Québec (B-1, r. 5) : l'obligation est un rapprochement mensuel, SANS délai chiffré en
 * jours (livres « à jour »). On garde un RAPPEL doux (overdue) mais on ne déclare JAMAIS
 * « critique / non-conforme » sur un compte de jours qui n'existe pas dans le règlement.
 * Réf. registre TR-QC-06 / TR-ON-02 / STATUS-PROV-01.
 */
export function computeReconciliationSeverity(params: {
  isCurrentPeriodDone: boolean;
  daysSinceMonthEnd: number;
  province?: string | null;
}): { overdue: boolean; critical: boolean } {
  const { isCurrentPeriodDone, daysSinceMonthEnd } = params;
  if (isCurrentPeriodDone) return { overdue: false, critical: false };
  const isQuebec = resolveProvince(params.province) === "QC";
  const overdue = daysSinceMonthEnd > 20; // rappel (les deux provinces)
  // Le seuil critique J+25 est PROPRE À L'ONTARIO. Jamais « critique » au Québec.
  const critical = !isQuebec && daysSinceMonthEnd > 25;
  return { overdue, critical };
}

export interface CreateReconciliationParams {
  cabinetId: string;
  /**
   * Compte bancaire rapproché (CH-01). La s. 18(8)ii By-Law 9 exige un rapprochement
   * détaillé de CHAQUE compte en fiducie, et l'art. 36 B-1 r.5 des livres distincts
   * par compte général. Un rapprochement global sur plusieurs comptes ne satisfait
   * ni l'un ni l'autre : il additionne deux banques dans un seul écart.
   *
   * Facultatif quand le cabinet n'a qu'un compte général ouvert.
   */
  trustBankAccountId?: string | null;
  periode: string; // "YYYY-MM"
  soldeBancaire: number;
  chequesEnCirculation?: number;
  depotsEnTransit?: number;
  interetsLFO?: number;
  notes?: string | null;
  createdById: string;
}

export interface CertifyReconciliationParams {
  reconciliationId: string;
  cabinetId: string;
  certifiedById: string;
}

/**
 * TROISIÈME VOIE — somme des soldes de cartes-clients.
 *
 * CH-00 : cette somme était lue depuis `TrustAccount.currentBalance`, un champ
 * DÉNORMALISÉ. Comparer un cache à un autre cache ne prouve rien. PR-1 : le
 * registre append-only est la seule autorité. On dérive donc la somme des
 * cartes-clients de `TrustTransaction`, ce qui est exactement la « liste des
 * soldes inscrits aux cartes-clients » de l'art. 41(1) B-1 r.5 et le « detailed
 * listing showing the amount of money held in trust for each client » de la
 * s. 18(8)i By-Law 9.
 *
 * Renvoie aussi le détail, qui alimentera le rapport mensuel au chantier CH-03.
 */
async function getClientLedgerSum(
  cabinetId: string,
  trustBankAccountId?: string | null,
): Promise<{
  total: number;
  lines: Array<{ clientId: string; dossierId: string | null; balance: number }>;
}> {
  const lines = await getTrustBalancesByDossier(cabinetId, trustBankAccountId ?? undefined);
  const total = lines.reduce((sum, l) => sum + l.balance, 0);
  return { total: Math.round(total * 100) / 100, lines };
}

/**
 * Contrôle exécuté au moment de la certification.
 *
 * PR-3 : l'attestation signée est générée à partir de CETTE liste, jamais d'un
 * texte figé plus large. Faire signer à l'avocate « les registres sont exacts et
 * conformes » alors que le système n'a vérifié que l'écart bancaire, c'est
 * l'exposer — et exposer SAFE avec elle.
 */
export interface ExecutedControl {
  /** Identifiant stable, repris dans les tests de conformité. */
  id: string;
  /** Ce qui a été vérifié, en français, tel qu'il apparaîtra dans l'attestation. */
  label: string;
  /** Référence réglementaire. */
  reference: string;
  passed: boolean;
  evidence: string | null;
}

/**
 * Construit le texte de l'attestation À PARTIR des contrôles exécutés (PR-3).
 *
 * L'ancien texte disait « je certifie que ce rapprochement à trois voies est exact,
 * conformément au Règlement B-1, r. 5 » — une affirmation générale sur la conformité
 * au règlement entier, alors que le système ne vérifiait que l'écart bancaire. On
 * énumère désormais ce qui a été vérifié, et rien d'autre. Une attestation étroite
 * et vraie protège mieux l'avocate qu'une attestation large et invérifiable.
 */
export function buildDeclarationText(
  controls: ExecutedControl[],
  periode: string,
  province: CabinetProvince,
): string {
  const isQC = province === "QC";
  const intro = isQC
    ? `Je certifie avoir effectué le rapprochement du compte en fidéicommis pour la période ${periode} et avoir constaté ce qui suit :`
    : `I certify that I have performed the trust account reconciliation for the period ${periode} and have verified the following:`;
  const items = controls
    .filter((c) => c.passed)
    .map((c) => `— ${c.label} (${c.reference}).`)
    .join("\n");
  const outro = isQC
    ? "Cette attestation porte sur les seuls éléments énumérés ci-dessus."
    : "This certification covers only the items listed above.";
  return [intro, items, outro].join("\n");
}

/** Creates or updates a reconciliation for a given period. */
export async function createReconciliation(params: CreateReconciliationParams) {
  const {
    cabinetId,
    trustBankAccountId: providedAccountId,
    periode,
    soldeBancaire,
    chequesEnCirculation = 0,
    depotsEnTransit = 0,
    interetsLFO = 0,
    notes,
    createdById,
  } = params;

  // Validate period format
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    throw new Error("Period must be in YYYY-MM format");
  }

  // CH-00 — une période déjà certifiée est IMMUABLE (PR-5). Avant ce correctif,
  // l'`upsert` ci-dessous remettait `certifiedAt` et `certifiedById` à null : une
  // simple re-saisie effaçait une certification signée par l'avocate, sans qu'elle
  // en soit informée. Un inspecteur qui compare deux exports du même mois y verrait
  // une réécriture de l'historique.
  // Compte rapproché : celui fourni, sinon l'unique compte général du cabinet.
  const trustBankAccountId =
    providedAccountId ?? (await resolveDefaultTrustBankAccountId(cabinetId));

  const existing = await prisma.trustReconciliation.findFirst({
    where: { cabinetId, trustBankAccountId, periode },
    select: { id: true, status: true, certifiedAt: true },
  });
  if (existing?.status === "certified" || existing?.certifiedAt) {
    const province = resolveProvince(await getCabinetProvince(cabinetId));
    throw new TrustComplianceError("RECONCILIATION_ALREADY_CERTIFIED", {
      province,
      detail: `Période ${periode}.`,
    });
  }

  // Les trois voies, toutes dérivées du registre append-only pour les deux
  // internes (PR-1). La banque est la seule donnée externe, saisie par l'utilisateur.
  const soldeRegistre = await getGlobalTrustBalance(cabinetId, trustBankAccountId);
  const { total: soldeParDossier } = await getClientLedgerSum(cabinetId, trustBankAccountId);

  const soldeRapproche = soldeBancaire - chequesEnCirculation + depotsEnTransit;
  // 1ʳᵉ ↔ 2ᵉ voie : banque rapprochée contre journal.
  const ecart = Math.round((soldeRapproche - soldeRegistre) * 100) / 100;
  // 2ᵉ ↔ 3ᵉ voie : journal contre somme des cartes-clients. C'est la comparaison
  // qui manquait, alors qu'elle est annoncée au client (« et les soldes par dossier »).
  const ecartCartesClients = Math.round((soldeParDossier - soldeRegistre) * 100) / 100;

  const balanced = ecart === 0 && ecartCartesClients === 0;

  const reconciliation = existing
    ? await prisma.trustReconciliation.update({
        where: { id: existing.id },
        data: {
          soldeBancaire,
          chequesEnCirculation,
          depotsEnTransit,
          soldeRapproche,
          soldeRegistre,
          soldeParDossier,
          ecart,
          ecartCartesClients,
          interetsLFO,
          notes,
          status: balanced ? "complete" : "draft",
        },
      })
    : await prisma.trustReconciliation.create({
    data: {
      cabinetId,
      trustBankAccountId,
      periode,
      soldeBancaire,
      chequesEnCirculation,
      depotsEnTransit,
      soldeRapproche,
      soldeRegistre,
      soldeParDossier,
      ecart,
      ecartCartesClients,
      interetsLFO,
      notes,
      status: balanced ? "complete" : "draft",
        },
      });

  await createAuditLog({
    cabinetId,
    userId: createdById,
    entityType: "TrustAccount",
    entityId: reconciliation.id,
    action: "create",
    newValues: {
      type: "reconciliation",
      periode,
      soldeBancaire,
      soldeRegistre,
      soldeParDossier,
      ecart,
      ecartCartesClients,
    },
    performedBy: createdById,
    performedAt: new Date(),
  });

  return reconciliation;
}

/**
 * Certifie un rapprochement (l'avocat signe).
 *
 * CH-00 — trois contrôles bloquants, et une attestation qui n'affirme QUE ce qui a
 * été vérifié (PR-3) :
 *   1. écart bancaire nul          — art. 41(5) QC / s. 18(8) ON
 *   2. écart cartes-clients nul    — art. 41(1) QC / s. 18(8)i ON  ← 3ᵉ voie, P-1
 *   3. aucun solde client négatif  — art. 59-60 QC / s. 9(3), 14 ON
 *
 * Ce que la certification NE vérifie PAS, et que l'attestation ne doit donc pas
 * affirmer : la présence du relevé bancaire, la liste détaillée des chèques en
 * circulation, les pièces justificatives. Ces contrôles arrivent au chantier CH-03,
 * avec le rapport comptable mensuel de l'art. 41.
 */
export async function certifyReconciliation(params: CertifyReconciliationParams) {
  const { reconciliationId, cabinetId, certifiedById } = params;

  const reconciliation = await prisma.trustReconciliation.findFirst({
    where: { id: reconciliationId, cabinetId },
  });

  if (!reconciliation) throw new Error("Reconciliation not found");

  const province = resolveProvince(await getCabinetProvince(cabinetId));

  if (reconciliation.status === "certified") {
    throw new TrustComplianceError("RECONCILIATION_ALREADY_CERTIFIED", {
      province,
      detail: `Période ${reconciliation.periode}.`,
    });
  }

  const controls: ExecutedControl[] = [];

  // ── Contrôle 1 — banque rapprochée ↔ journal (art. 41(5) QC / s. 18(8) ON) ──
  const ecartBanqueOk = Math.abs(reconciliation.ecart) < 0.005;
  controls.push({
    id: "bank_vs_journal",
    label: "Le solde bancaire rapproché correspond au solde du journal de caisse en fidéicommis",
    reference: "B-1 r.5 art. 41(5) — By-Law 9 s. 18(8)",
    passed: ecartBanqueOk,
    evidence: `Écart : ${reconciliation.ecart.toFixed(2)} $`,
  });
  if (!ecartBanqueOk) {
    throw new TrustComplianceError("RECONCILIATION_BANK_DISCREPANCY", {
      province,
      detail: `Écart de ${reconciliation.ecart.toFixed(2)} $ pour la période ${reconciliation.periode}.`,
    });
  }

  // ── Contrôle 2 — TROISIÈME VOIE : cartes-clients ↔ journal ──────────────────
  // Recalculée maintenant, pas relue : entre la saisie et la signature, une
  // écriture a pu être passée. Certifier sur une valeur périmée ne prouve rien.
  const { total: ledgerSum, lines } = await getClientLedgerSum(cabinetId);
  const ecartCartesClients = Math.round((ledgerSum - reconciliation.soldeRegistre) * 100) / 100;
  const ecartLedgerOk = Math.abs(ecartCartesClients) < 0.005;
  controls.push({
    id: "client_ledgers_vs_journal",
    label:
      "La somme des soldes inscrits aux cartes-clients correspond au solde du journal de caisse",
    reference: "B-1 r.5 art. 41(1) — By-Law 9 s. 18(8)i",
    passed: ecartLedgerOk,
    evidence: `${lines.length} carte(s)-client(s) — écart : ${ecartCartesClients.toFixed(2)} $`,
  });
  if (!ecartLedgerOk) {
    throw new TrustComplianceError("RECONCILIATION_LEDGER_DISCREPANCY", {
      province,
      detail: `Somme des cartes-clients : ${ledgerSum.toFixed(2)} $ ; journal : ${reconciliation.soldeRegistre.toFixed(2)} $ ; écart : ${ecartCartesClients.toFixed(2)} $.`,
    });
  }

  // ── Contrôle 3 — aucun solde de carte-client négatif ────────────────────────
  // R-1 : un agrégat sain peut masquer un compte à −200 $ compensé par un autre à
  // +200 $. On vérifie donc CHAQUE carte-client, dérivée du registre append-only
  // et non du cache `TrustAccount.currentBalance` (PR-1). Certifier par-dessus un
  // solde débiteur masquerait l'utilisation des fonds d'un autre client.
  const negatives = lines.filter((l) => l.balance < -0.005);
  controls.push({
    id: "no_negative_client_balance",
    label: "Aucun solde de carte-client n'est débiteur",
    reference: "B-1 r.5 art. 59, 60 — By-Law 9 s. 9(3), 14",
    passed: negatives.length === 0,
    evidence:
      negatives.length === 0
        ? `${lines.length} carte(s)-client(s) vérifiée(s)`
        : negatives.map((n) => `${n.clientId}/${n.dossierId ?? "—"} : ${n.balance.toFixed(2)} $`).join(", "),
  });
  if (negatives.length > 0) {
    throw new TrustComplianceError("RECONCILIATION_NEGATIVE_CLIENT_BALANCE", {
      province,
      detail: `${negatives.length} carte(s)-client(s) à corriger : ${negatives
        .map((n) => `${n.clientId}/${n.dossierId ?? "—"} (${n.balance.toFixed(2)} $)`)
        .join(", ")}.`,
    });
  }

  const now = new Date();
  const updated = await prisma.trustReconciliation.update({
    where: { id: reconciliationId },
    data: {
      status: "certified",
      certifiedAt: now,
      certifiedById,
      ecartCartesClients,
      verifiedControlsJson: JSON.stringify(controls),
      declarationText: buildDeclarationText(controls, reconciliation.periode, province),
    },
  });

  // Doctrine §9 — une fois le mois certifié, on verrouille la période : plus aucune
  // écriture ne peut être antidatée dedans (cf. createJournalEntry).
  await lockAccountingPeriod({
    cabinetId,
    periode: reconciliation.periode,
    lockedById: certifiedById,
    reason: "reconciliation_certified",
  });

  await createAuditLog({
    cabinetId,
    userId: certifiedById,
    entityType: "TrustAccount",
    entityId: reconciliationId,
    action: "update",
    newValues: { type: "reconciliation_certified", periode: reconciliation.periode },
    performedBy: certifiedById,
    performedAt: now,
  });

  return updated;
}

/** Gets the latest reconciliation for a cabinet. */
export async function getLatestReconciliation(cabinetId: string) {
  return prisma.trustReconciliation.findFirst({
    where: { cabinetId },
    orderBy: { periode: "desc" },
    include: { certifiedBy: { select: { id: true, nom: true } } },
  });
}

/** Gets all reconciliations for a cabinet. */
export async function getReconciliations(cabinetId: string) {
  return prisma.trustReconciliation.findMany({
    where: { cabinetId },
    orderBy: { periode: "desc" },
    include: { certifiedBy: { select: { id: true, nom: true } } },
  });
}

/** Gets a single reconciliation by id. */
export async function getReconciliation(id: string, cabinetId: string) {
  return prisma.trustReconciliation.findFirst({
    where: { id, cabinetId },
    include: { certifiedBy: { select: { id: true, nom: true } } },
  });
}

/**
 * Checks if reconciliation is overdue for the current period.
 * Province-aware (cf. computeReconciliationSeverity) : ON = seuil By-Law 9 J+25 ;
 * QC = rappel doux sans seuil critique (aucun délai chiffré au Québec).
 * `province` est optionnel : s'il n'est pas fourni, il est lu depuis le cabinet.
 */
export async function getReconciliationStatus(
  cabinetId: string,
  province?: string | null,
) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Previous month period (what needs to be reconciled)
  const prevMonth = currentMonth === 0 ? 12 : currentMonth;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const expectedPeriode = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  // Days since end of previous month
  const monthEndDate = new Date(prevYear, prevMonth, 0); // last day of prev month
  const daysSinceMonthEnd = Math.floor(
    (now.getTime() - monthEndDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const [latest, resolvedProvince] = await Promise.all([
    getLatestReconciliation(cabinetId),
    province !== undefined ? Promise.resolve(province) : getCabinetProvince(cabinetId),
  ]);
  const lastCertifiedPeriode = latest?.status === "certified" ? latest.periode : null;
  const isCurrentPeriodDone = latest?.periode === expectedPeriode && latest?.status === "certified";

  const { overdue, critical } = computeReconciliationSeverity({
    isCurrentPeriodDone,
    daysSinceMonthEnd,
    province: resolvedProvince,
  });

  return {
    expectedPeriode,
    daysSinceMonthEnd,
    overdue,
    critical,
    lastCertifiedPeriode,
    lastReconciliation: latest,
  };
}
