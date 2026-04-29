/**
 * SAFE — Détection de la violation d'idempotence du journal général.
 *
 * L'index UNIQUE PARTIEL `JournalGeneralEntry_idempotency_key` est maintenu
 * via une migration SQL manuelle (Prisma ne supporte pas les index partiels
 * déclaratifs). Voir migration `20260429120000_add_journal_idempotency_unique_index`.
 *
 * Lorsque deux écritures concurrentes tentent d'insérer la même clé
 * `(cabinetId, sourceModule, sourceId)`, Postgres lève une erreur que Prisma
 * remonte sous la forme `PrismaClientKnownRequestError` avec `code = "P2002"`.
 *
 * Ce helper détecte précisément ce cas — pas n'importe quelle violation P2002
 * (ex: unicité du `id`, qui ne devrait jamais survenir avec des cuids).
 */

const JOURNAL_IDEMPOTENCY_INDEX_NAME = "JournalGeneralEntry_idempotency_key";

/**
 * Forme connue d'une erreur Prisma de violation d'unicité.
 * On utilise du duck typing pour rester testable sans construire une vraie
 * `PrismaClientKnownRequestError` (sa signature varie entre versions).
 */
interface PrismaP2002Like {
  code?: string;
  meta?: {
    target?: string | string[];
    /** Postgres expose le nom de l'index dans `constraint`. */
    constraint?: string;
    /** Certaines versions Prisma exposent ici le nom du modèle/de l'index. */
    modelName?: string;
  };
}

function isP2002(error: unknown): error is PrismaP2002Like {
  return Boolean(
    error &&
      typeof error === "object" &&
      (error as PrismaP2002Like).code === "P2002",
  );
}

/**
 * Retourne `true` quand l'erreur est une violation de l'index unique partiel
 * d'idempotence du journal général. Exclut les autres violations P2002 (ex:
 * sur le `id`).
 *
 * Stratégie de détection :
 *   1) `meta.constraint` ou `meta.target` contient le nom canonique de l'index.
 *   2) Si Prisma n'expose que les colonnes (`["cabinetId", "sourceModule", "sourceId"]`),
 *      on vérifie que les trois colonnes attendues sont toutes présentes.
 */
export function isJournalIdempotencyConflict(error: unknown): boolean {
  if (!isP2002(error)) return false;
  const meta = error.meta;
  if (!meta) return false;

  const targetRaw = meta.target;
  const constraintRaw = meta.constraint;

  const candidates: string[] = [];
  if (typeof targetRaw === "string") candidates.push(targetRaw);
  if (Array.isArray(targetRaw)) candidates.push(...targetRaw);
  if (typeof constraintRaw === "string") candidates.push(constraintRaw);
  if (typeof meta.modelName === "string") candidates.push(meta.modelName);

  // 1) Match direct sur le nom canonique de l'index.
  if (candidates.some((c) => c === JOURNAL_IDEMPOTENCY_INDEX_NAME)) return true;

  // 2) Match par composition des colonnes (cas où Prisma expose uniquement
  //    la liste des champs).
  if (Array.isArray(targetRaw)) {
    const set = new Set(targetRaw);
    return set.has("cabinetId") && set.has("sourceModule") && set.has("sourceId");
  }

  return false;
}

export const JOURNAL_IDEMPOTENCY_INDEX = JOURNAL_IDEMPOTENCY_INDEX_NAME;
