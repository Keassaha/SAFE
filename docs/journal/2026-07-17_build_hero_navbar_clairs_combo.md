# 2026-07-17 · BUILD : hero + navbar clairs façon Combo (implémenté dans le code)

## Contexte

Après 5 analyses de références et un pivot CEO (« le design que tu proposes est loin de
ce que je cherche » → cible = Combo, jeter le vert forêt foncé), le CEO a validé la
direction claire + le mot tournant d'Altee + l'animation de méga-menu de Combo, puis :
« J'aime beaucoup, on peut construire maintenant ». Passage des maquettes au vrai code.

## Ce qui a été construit (working tree, NON commité)

Deux fichiers réécrits, palette scoped en local (PAS de bascule des tokens forêt
globaux, le reste du site reste inchangé) :

**components/landing/Hero.tsx**
- Fond crème #F6F3ED (au lieu de bannière/albâtre forêt), encre chaude #23201B.
- Grand serif éditorial « Votre cabinet, toujours [en ordre / conforme / payé à temps /
  serein / prêt] » — mot tournant en vert #12A150, dépôt d'encre via framer-motion
  AnimatePresence (y:10→0 / exit y:-8, 400ms, cycle 2400ms).
- Double CTA pilule : « Faire mon audit gratuit » (pilule encre #23201B → /audit-gratuit)
  + « Voir la vidéo de 3 minutes » (pilule contour → /demo). Réassurance dessous.
- Rangée preuve : ★★★★★ 4.9 · Conforme B-1 r.5 · Données au Canada.
- Produit encadré dans carte BLANCHE claire (ombre douce #23201B, plus de forêt),
  capture /images/app/comptabilite.png.
- `-mt-20` pour que le crème couvre le haut sous la navbar (évite la couture avec
  bg-canvas du wrapper).

**components/marketing/Navbar.tsx**
- Barre claire crème translucide (#F6F3ED/0.82 → blanc/0.9 au scroll), encre, logo
  serif accent #23201B (au lieu de la pill noire #0A0A0A).
- Méga-menu « Produit » façon Combo : hover ouvre un panneau blanc pleine largeur qui
  FOND + GLISSE vers le bas (framer-motion opacity + y:-10→0, 240ms cubic-bezier
  .22,1,.36,1), chevron pivote 180°. 3 colonnes (Facturation / Comptabilité /
  Conformité), liens icône+label, icône carrée #F6F3ED→#EAF7EF au hover + icône verte.
- Bande verte #EAF7EF « Parlez à un expert SAFE » + bouton vert #12A150 « Réserver un
  appel » (repris du bandeau promo Combo).
- CTA principal pilule encre. Menu mobile re-colorié clair.

## Vérification (dev port 3020)

- Compile, HTTP 200, zéro erreur console. Mot tournant confirmé rendu en #12A150
  (rgb 18,161,80) Instrument Serif. Méga-menu ouvre/ferme au hover, chevron pivote,
  bande verte OK. Captures desktop + étroit prises.
- Warnings console « container non-static position » = framer-motion whileInView
  d'AUTRES sections (FeaturesGrid…), PRÉEXISTANTS, pas des erreurs, hors périmètre.

## Gap honnête à signaler

- La capture produit dans le cadre est la vraie capture de l'app, qui a encore sa
  bannière forêt foncé « Comptabilité ». Le hero clair PROMET donc une app plus claire
  que ce qu'il y a dedans. Cohérent tant qu'on ne re-skin pas l'app (gros chantier
  séparé). Option : refaire une capture ou un mock clair plus tard.
- Le RESTE de la landing (ProblemSection, FeaturesGrid, etc.) et toute l'app interne
  sont ENCORE en forêt. Seuls hero + navbar sont passés au clair ce soir. Transition
  visible entre le hero crème et la section suivante = attendue, à traiter au prochain
  chantier.

## Statut

Hero + navbar clairs IMPLÉMENTÉS et vérifiés en dev, non commités. Direction de marque
« clair façon Combo + mot Altee + méga-menu Combo » actée et en code. Prochain chantier
proposé : décliner le clair sur le reste de la landing (sections), puis planifier
séparément l'app interne. Voir project_design_reskin_state (mémoire) + journaux
2026-07-17_analyse_{altee,agendrix,7shifts,combohr}*.md.
