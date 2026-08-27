/**
 * Les routes `/ds-preview` sont-elles fermees ?
 *
 * Ce sont des controles visuels : elles rendent des composants reels sur des
 * cas limites inventes, sans authentification et sans toucher la base. Elles
 * n'ont rien a faire sur le site que voient les cabinets, ou elles etaient
 * servies publiquement (sept routes dans le build).
 *
 * Elles restent ouvertes sur les deploiements de PREVIEW : c'est la qu'on juge
 * un ecran depuis un telephone avant de le pousser, et c'est tout leur interet.
 *
 * Hors Vercel, `VERCEL_ENV` n'existe pas : on retombe sur `NODE_ENV`, donc
 * ferme des qu'il s'agit d'un build de production. La regle ferme quand elle
 * ne sait pas, jamais l'inverse.
 */
export function apercuDesignFerme(): boolean {
  const vercel = process.env.VERCEL_ENV;
  if (vercel) return vercel === "production";
  return process.env.NODE_ENV === "production";
}

/** Prefixe des routes concernees, partage par le middleware et le layout. */
export const APERCU_DESIGN_PREFIXE = "/ds-preview";
