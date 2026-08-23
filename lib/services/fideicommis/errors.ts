/**
 * Erreurs de conformité du fidéicommis.
 *
 * Doctrine PR-4 (docs/compliance/PROGRAMME_INSPECTION_READY.md §2) : aucune règle
 * réglementaire ne vit en dur dans le code sans porter sa source. Une erreur de
 * conformité transporte donc son code stable, son article québécois, son article
 * ontarien et un message bilingue.
 *
 * Doctrine PR-2 : un garde-fou sans porte de sortie produit du contournement.
 * Chaque erreur porte donc `remedy` — ce que l'utilisateur doit faire à la place.
 * Un message qui dit seulement « interdit » pousse l'assistante à saisir
 * l'opération autrement, ce qui est pire que de l'avoir laissée passer.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI. Testable directement.
 */

import type { CabinetProvince, Locale } from "@/lib/compliance/rules";

/** Codes stables. Utilisés par les tests d'interdiction (§8.1 du programme). */
export type TrustComplianceCode =
  // ── Retrait (art. 56-59 QC / s. 9-11 ON) ──────────────────────────
  | "WITHDRAWAL_MOTIVE_REQUIRED"
  | "WITHDRAWAL_MOTIVE_REQUIRES_INVOICE"
  | "INVOICE_NOT_ISSUED"
  | "INVOICE_NOT_DELIVERED"
  | "INVOICE_AMOUNT_EXCEEDED"
  | "INVOICE_DATED_AFTER_WITHDRAWAL"
  | "CASH_WITHDRAWAL_PROHIBITED"
  | "CHEQUE_PAYEE_INVALID"
  | "INSUFFICIENT_TRUST_BALANCE"
  | "TRUST_CROSS_ALLOCATION_BLOCKED"
  | "TRUST_CROSS_MATTER_BLOCKED"
  | "TRUST_BANK_ACCOUNT_AMBIGUOUS"
  // ── Correction (art. 59-60 QC / s. 9(3), 14 ON) ───────────────────
  | "CORRECTION_WOULD_CREATE_DEBIT_BALANCE"
  | "CORRECTION_TARGET_NOT_FOUND"
  // ── Dépôt (art. 69 QC / s. 4 ON) ──────────────────────────────────
  | "CASH_DEPOSIT_LIMIT_EXCEEDED"
  // ── Rapprochement (art. 41 QC / s. 18(8) ON) ──────────────────────
  | "RECONCILIATION_ALREADY_CERTIFIED"
  | "RECONCILIATION_BANK_DISCREPANCY"
  | "RECONCILIATION_LEDGER_DISCREPANCY"
  | "RECONCILIATION_NEGATIVE_CLIENT_BALANCE";

interface Bilingual {
  fr: string;
  en: string;
}

interface TrustComplianceRuleMeta {
  /** Article du Règlement sur la comptabilité (RLRQ c. B-1, r. 5). */
  articleQC: string | null;
  /** Article du By-Law 9 (LSO). */
  articleON: string | null;
  message: Bilingual;
  /** PR-2 — la porte de sortie. Ce qu'il faut faire à la place. */
  remedy: Bilingual;
}

/**
 * Registre des règles. Chaque entrée est adossée au texte primaire lu le
 * 2026-07-30 : B-1 r.5 à jour au 1er avril 2026 (LegisQuébec, texte officiel) et
 * By-Law 9 version du 27 avril 2017 (PDF officiel LSO).
 */
const RULES: Record<TrustComplianceCode, TrustComplianceRuleMeta> = {
  WITHDRAWAL_MOTIVE_REQUIRED: {
    articleQC: "art. 56",
    articleON: "s. 9(1)",
    message: {
      fr: "Motif de retrait obligatoire. Le règlement ne permet que trois retraits du compte général en fidéicommis.",
      en: "A withdrawal reason is required. Only three withdrawals from the general trust account are permitted.",
    },
    remedy: {
      fr: "Choisissez le motif : remise au client ou à un tiers, honoraires et débours facturés, ou transfert vers un autre compte en fidéicommis.",
      en: "Select the reason: payment to the client or a third party on their behalf, billed fees and disbursements, or transfer to another trust account.",
    },
  },
  WITHDRAWAL_MOTIVE_REQUIRES_INVOICE: {
    articleQC: "art. 56(2), 58",
    articleON: "s. 9(1)3",
    message: {
      fr: "Un retrait pour honoraires et débours doit être rattaché à une facture.",
      en: "A withdrawal for fees and disbursements must be linked to an invoice.",
    },
    remedy: {
      fr: "Rattachez la facture concernée, ou choisissez un autre motif de retrait.",
      en: "Link the corresponding invoice, or select a different withdrawal reason.",
    },
  },
  INVOICE_NOT_ISSUED: {
    articleQC: "art. 56(2)",
    articleON: "s. 9(1)3",
    message: {
      fr: "Cette facture n'est pas émise. Les honoraires ne peuvent être retirés du fidéicommis que pour une facture émise.",
      en: "This invoice has not been issued. Fees may only be withdrawn from trust for an issued invoice.",
    },
    remedy: {
      fr: "Émettez la facture, envoyez-la au client, puis reprenez le retrait.",
      en: "Issue the invoice, deliver it to the client, then repeat the withdrawal.",
    },
  },
  INVOICE_NOT_DELIVERED: {
    articleQC: "art. 56(2)",
    articleON: "s. 9(1)3",
    message: {
      // Le texte réglementaire dit « envoyée » (QC) et « delivered » (ON), pas « préparée ».
      fr: "Cette facture n'a pas été envoyée au client. Le règlement exige que la facturation ait été envoyée avant tout retrait d'honoraires.",
      en: "This invoice has not been delivered to the client. A billing must have been delivered before any withdrawal of fees.",
    },
    remedy: {
      fr: "Envoyez la facture au client, puis reprenez le retrait. L'envoi est daté et conservé.",
      en: "Deliver the invoice to the client, then repeat the withdrawal. Delivery is dated and retained.",
    },
  },
  INVOICE_AMOUNT_EXCEEDED: {
    articleQC: "art. 56(2), 59",
    articleON: "s. 9(1)3, 9(3)",
    message: {
      fr: "Le montant retiré dépasse le solde dû de la facture.",
      en: "The withdrawal exceeds the invoice balance due.",
    },
    remedy: {
      fr: "Retirez au plus le solde dû. Le surplus resterait de l'argent du client.",
      en: "Withdraw no more than the balance due. Any excess remains the client's money.",
    },
  },
  INVOICE_DATED_AFTER_WITHDRAWAL: {
    articleQC: "art. 56(2)",
    articleON: "s. 9(1)3",
    message: {
      fr: "La facture est postérieure à la date du retrait : le retrait aurait précédé la facturation.",
      en: "The invoice post-dates the withdrawal: the withdrawal would precede the billing.",
    },
    remedy: {
      fr: "Corrigez la date du retrait, ou vérifiez la date d'émission de la facture.",
      en: "Correct the withdrawal date, or check the invoice issue date.",
    },
  },
  CASH_WITHDRAWAL_PROHIBITED: {
    articleQC: "art. 57",
    articleON: "s. 11(a)",
    message: {
      fr: "Aucun retrait en espèces n'est permis sur un compte général en fidéicommis.",
      en: "Cash withdrawals from a general trust account are not permitted.",
    },
    remedy: {
      // La seule exception est le remboursement de l'art. 72, qui deviendra un flux
      // distinct au chantier CH-05. Tant qu'il n'existe pas, on le dit franchement.
      fr: "Utilisez un chèque nominatif ou un virement. Seul le remboursement d'une somme de 7 500 $ ou plus reçue en espèces fait exception (art. 72) : traitez-le hors système et documentez le reçu signé.",
      en: "Use a cheque payable to a named payee, or an electronic transfer. The only exception is the refund of cash of $7,500 or more (s. 72 QC): handle it outside the system and document the signed receipt.",
    },
  },
  CHEQUE_PAYEE_INVALID: {
    articleQC: "art. 57 al. 2",
    articleON: "s. 11(a)",
    message: {
      fr: "Bénéficiaire de chèque non admis.",
      en: "Cheque payee not permitted.",
    },
    remedy: {
      fr: "Un chèque en fidéicommis doit porter le nom de son bénéficiaire. Il ne peut être payable au porteur, à l'ordre de « caisse » ou « cash », ni être fait en blanc.",
      en: "A trust cheque must name its payee. It cannot be payable to cash or to bearer, nor be left blank.",
    },
  },
  INSUFFICIENT_TRUST_BALANCE: {
    articleQC: "art. 59",
    articleON: "s. 9(3)",
    message: {
      fr: "Solde en fidéicommis insuffisant pour ce dossier.",
      en: "Insufficient trust balance for this matter.",
    },
    remedy: {
      fr: "Un retrait ne peut jamais dépasser le solde détenu pour ce dossier. Vérifiez le solde ou le dossier visé.",
      en: "A withdrawal may never exceed the balance held for this matter. Check the balance or the matter selected.",
    },
  },
  TRUST_CROSS_MATTER_BLOCKED: {
    articleQC: "art. 48 et 59",
    articleON: "s. 9(3)",
    message: {
      fr: "Cette facture appartient à un autre dossier que celui dont les fonds sortent.",
      en: "This invoice belongs to a matter other than the one the funds are withdrawn from.",
    },
    remedy: {
      fr:
        "Les sommes en fidéicommis s'utilisent selon leur affectation : les fonds détenus " +
        "pour un dossier ne règlent pas la facture d'un autre, même chez le même client. " +
        "Retirez depuis le dossier que la facture concerne.",
      en:
        "Trust money must be used for the purpose it was received: funds held for one matter " +
        "do not settle another matter's invoice, even for the same client. Withdraw from the " +
        "matter the invoice relates to.",
    },
  },
  TRUST_BANK_ACCOUNT_AMBIGUOUS: {
    articleQC: "art. 36 et 59",
    articleON: "s. 18(8)ii et 9(3)",
    message: {
      fr: "Plusieurs comptes en fidéicommis sont ouverts : indiquez lequel.",
      en: "Several trust accounts are open: specify which one.",
    },
    remedy: {
      fr:
        "Le plafond d'un retrait est le solde détenu pour ce dossier DANS LE COMPTE visé, " +
        "jamais la somme de tous les comptes. Sans le compte, l'écriture serait aussi " +
        "absente du rapprochement, qui se fait compte par compte.",
      en:
        "A withdrawal is capped by the balance held for that matter IN THE ACCOUNT used, " +
        "never by the sum of all accounts. Without the account, the entry would also be " +
        "missing from reconciliation, which is done account by account.",
    },
  },
  TRUST_CROSS_ALLOCATION_BLOCKED: {
    articleQC: "art. 48, 59",
    articleON: "s. 9(3)",
    message: {
      fr: "Les fonds d'un client ne peuvent pas servir à payer la facture d'un autre client.",
      en: "One client's trust funds cannot be applied to another client's invoice.",
    },
    remedy: {
      fr: "Vérifiez le client de la facture. Un transfert entre cartes-clients est un flux distinct, à motiver.",
      en: "Check the invoice's client. A transfer between client ledgers is a separate, reasoned operation.",
    },
  },
  CORRECTION_WOULD_CREATE_DEBIT_BALANCE: {
    articleQC: "art. 59, 60",
    articleON: "s. 9(3), 14",
    message: {
      fr: "Cette correction rendrait le solde du dossier débiteur. Aucun solde de carte-client ne peut être négatif.",
      en: "This correction would leave the matter with a debit balance. No client ledger balance may be negative.",
    },
    remedy: {
      fr: "Déposez d'abord les fonds manquants, puis passez la correction. Un solde débiteur signifie que les fonds d'un autre client sont utilisés.",
      en: "Deposit the missing funds first, then post the correction. A debit balance means another client's funds are being used.",
    },
  },
  CORRECTION_TARGET_NOT_FOUND: {
    articleQC: "art. 37",
    articleON: "s. 22(1)",
    message: {
      fr: "Transaction à corriger introuvable pour ce client et ce dossier.",
      en: "The transaction to be corrected was not found for this client and matter.",
    },
    remedy: {
      fr: "Sélectionnez la transaction d'origine dans le journal du dossier.",
      en: "Select the original transaction from the matter's journal.",
    },
  },
  CASH_DEPOSIT_LIMIT_EXCEEDED: {
    articleQC: "art. 69",
    articleON: "s. 4(1)",
    message: {
      fr: "Somme en espèces de 7 500 $ ou plus refusée pour ce mandat.",
      en: "Cash of $7,500 or more refused for this client file.",
    },
    remedy: {
      // Les exceptions (art. 69 QC, s. 6 ON) existent mais ne sont pas encore
      // modélisées : elles arrivent au chantier CH-05. On ne prétend pas le contraire.
      fr: "Demandez un chèque ou un virement. Des exceptions existent au règlement (institution financière, organisme public, ordonnance, avance d'honoraires) : elles ne sont pas encore prises en charge par SAFE.",
      en: "Request a cheque or transfer. The regulations provide exceptions (financial institution, public body, court order, retainer): these are not yet supported in SAFE.",
    },
  },
  RECONCILIATION_ALREADY_CERTIFIED: {
    articleQC: "art. 40, 41",
    articleON: "s. 18(8)",
    message: {
      fr: "Cette période est déjà certifiée. Un rapprochement signé ne peut pas être modifié.",
      en: "This period is already certified. A signed reconciliation cannot be modified.",
    },
    remedy: {
      fr: "Portez la correction dans la période ouverte courante. L'historique certifié reste intact, c'est ce qu'un inspecteur vérifie.",
      en: "Post the correction in the current open period. The certified history stays intact, which is what an examiner checks.",
    },
  },
  RECONCILIATION_BANK_DISCREPANCY: {
    articleQC: "art. 41(5)",
    articleON: "s. 18(8)",
    message: {
      fr: "Écart entre le solde bancaire rapproché et le registre.",
      en: "Discrepancy between the reconciled bank balance and the register.",
    },
    remedy: {
      fr: "Ajoutez les chèques en circulation et les dépôts en transit manquants, ou corrigez l'écriture en cause.",
      en: "Add the missing outstanding cheques and deposits in transit, or correct the entry at fault.",
    },
  },
  RECONCILIATION_LEDGER_DISCREPANCY: {
    articleQC: "art. 41(1)",
    articleON: "s. 18(8)i",
    message: {
      fr: "Écart entre la somme des cartes-clients et le solde du registre.",
      en: "Discrepancy between the sum of client ledgers and the register balance.",
    },
    remedy: {
      fr: "C'est la troisième voie du rapprochement. Une divergence ici signale une écriture rattachée au mauvais dossier ou un solde dénormalisé périmé.",
      en: "This is the third leg of the reconciliation. A difference here signals an entry posted to the wrong matter, or a stale cached balance.",
    },
  },
  RECONCILIATION_NEGATIVE_CLIENT_BALANCE: {
    articleQC: "art. 59, 60",
    articleON: "s. 9(3), 14",
    message: {
      fr: "Un ou plusieurs comptes clients ont un solde négatif.",
      en: "One or more client accounts have a negative balance.",
    },
    remedy: {
      fr: "Comblez le solde débiteur sans délai avant de certifier. Certifier par-dessus masquerait l'utilisation des fonds d'un autre client.",
      en: "Cover the debit balance without delay before certifying. Certifying over it would conceal the use of another client's funds.",
    },
  },
};

/**
 * Erreur de conformité fidéicommis. Portée jusqu'à l'API, qui renvoie le code et
 * la référence d'article au client HTTP — un message d'erreur qui cite son article
 * est un message qu'un avocat peut vérifier.
 */
export class TrustComplianceError extends Error {
  readonly code: TrustComplianceCode;
  readonly articleQC: string | null;
  readonly articleON: string | null;
  /** Détail contextuel (montants, identifiants) ajouté au message. */
  readonly detail: string | null;
  readonly remedy: string;
  readonly locale: Locale;

  constructor(
    code: TrustComplianceCode,
    options: { province?: CabinetProvince | null; detail?: string | null } = {},
  ) {
    const rule = RULES[code];
    const locale: Locale = options.province === "ON" ? "en" : "fr";
    const detail = options.detail ?? null;
    const reference = formatReference(rule, options.province ?? null);

    super(
      [rule.message[locale], detail, reference, rule.remedy[locale]]
        .filter((part): part is string => Boolean(part))
        .join(" "),
    );

    this.name = "TrustComplianceError";
    this.code = code;
    this.articleQC = rule.articleQC;
    this.articleON = rule.articleON;
    this.detail = detail;
    this.remedy = rule.remedy[locale];
    this.locale = locale;
  }

  /** Charge utile pour une réponse API. */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      remedy: this.remedy,
      articleQC: this.articleQC,
      articleON: this.articleON,
    };
  }
}

/**
 * Référence citée à l'utilisateur. Province-aware (PR-7) : on ne sert jamais un
 * article ontarien à un cabinet québécois. Sans province connue, on cite les deux
 * plutôt que d'en choisir un au hasard.
 */
function formatReference(rule: TrustComplianceRuleMeta, province: CabinetProvince | null): string {
  if (province === "QC" && rule.articleQC) return `(B-1 r.5, ${rule.articleQC})`;
  if (province === "ON" && rule.articleON) return `(By-Law 9, ${rule.articleON})`;
  const parts = [
    rule.articleQC ? `B-1 r.5, ${rule.articleQC}` : null,
    rule.articleON ? `By-Law 9, ${rule.articleON}` : null,
  ].filter(Boolean);
  return parts.length ? `(${parts.join(" — ")})` : "";
}

/** Métadonnées d'une règle, pour les tests et le registre de conformité. */
export function getTrustComplianceRule(code: TrustComplianceCode): TrustComplianceRuleMeta {
  return RULES[code];
}

/** Vrai si l'erreur est une erreur de conformité (garde de type pour les routes). */
export function isTrustComplianceError(e: unknown): e is TrustComplianceError {
  return e instanceof TrustComplianceError;
}
