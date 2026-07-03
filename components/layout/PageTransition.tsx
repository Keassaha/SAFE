/**
 * Transition d'entrée de page.
 *
 * Garde-fou anti-page-blanche : on utilise une animation CSS (`safe-fade-in`,
 * opacity 0 → 1) plutôt que framer-motion. Une animation CSS se termine TOUJOURS
 * et son état au repos est l'opacité par défaut (1), indépendamment de
 * l'hydratation React et des frontières Suspense.
 *
 * Le wrapper framer-motion précédent rendait `opacity:0` au SSR puis l'animait à
 * 1 côté client ; quand cette animation JS ne se déclenchait pas (page derrière un
 * Suspense qui suspend, ex. /temps ou /comptes), la page restait invisible.
 * En CSS, ce mode d'échec n'existe pas : au pire, le fade ne joue pas mais le
 * contenu reste lisible.
 */
export function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-full w-full animate-fade-in">{children}</div>;
}
