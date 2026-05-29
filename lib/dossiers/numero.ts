/**
 * Génération du numéro de dossier.
 *
 * - Avec préfixe (taxonomie configurée) : `{année}-{PRÉFIXE}-{séquence padStart}`,
 *   ex. `2026-IMM-00001`. Séquence calculée par **max parsé** (anti-réemploi),
 *   pas par count() — supprimer un dossier ne réutilise jamais un numéro.
 * - Sans préfixe (legacy) : `{année}-{séquence padStart(3)}`, ex. `2026-001`.
 *
 * Module PUR : prend en entrée la liste des numéros existants, ne touche pas la
 * base. La lecture des `numeroDossier` existants est faite par l'appelant.
 *
 * Voir docs/product/SPEC_LOT3_PREFIXES_SUJETS_SOUSMATIERES.md §4.3.
 */

const LEGACY_SEQ_WIDTH = 3;

/**
 * Extrait la plus grande séquence parmi `existingNumeros` qui matchent
 * `^${year}-${prefix}-(\d+)$` (prefix vide → `^${year}-(\d+)$`).
 */
export function maxSequence(
  existingNumeros: Array<string | null | undefined>,
  year: number,
  prefix?: string | null,
): number {
  const re = prefix
    ? new RegExp(`^${year}-${escapeRegex(prefix)}-(\\d+)$`)
    : new RegExp(`^${year}-(\\d+)$`);
  let max = 0;
  for (const n of existingNumeros) {
    if (!n) continue;
    const m = re.exec(n.trim());
    if (!m) continue;
    const seq = parseInt(m[1], 10);
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return max;
}

/**
 * Comme `maxSequence` mais ignore le préfixe : capture les derniers chiffres de
 * tout numéro `^${year}-(?:PREFIXE-)?(\d+)$`. Sert au scope "year" (compteur
 * unique partagé entre toutes les matières d'une même année).
 */
export function maxSequenceAnyPrefix(
  existingNumeros: Array<string | null | undefined>,
  year: number,
): number {
  const re = new RegExp(`^${year}-(?:[A-Za-z]+-)?(\\d+)$`);
  let max = 0;
  for (const n of existingNumeros) {
    if (!n) continue;
    const m = re.exec(n.trim());
    if (!m) continue;
    const seq = parseInt(m[1], 10);
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return max;
}

/**
 * Construit le numéro suivant à partir des numéros existants.
 *
 * @param prefix  préfixe de matière (ex. "IMM"). Vide/absent → format legacy.
 * @param seqWidth largeur de padding (5 avec préfixe, 3 en legacy).
 */
export function buildNumeroDossier(params: {
  year: number;
  existingNumeros: Array<string | null | undefined>;
  prefix?: string | null;
  seqWidth?: number;
}): string {
  const { year, existingNumeros, prefix } = params;
  const next = maxSequence(existingNumeros, year, prefix) + 1;
  if (prefix) {
    const width = params.seqWidth ?? 5;
    return `${year}-${prefix}-${String(next).padStart(width, "0")}`;
  }
  const width = params.seqWidth ?? LEGACY_SEQ_WIDTH;
  return `${year}-${String(next).padStart(width, "0")}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
