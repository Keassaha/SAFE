# 2026-07-17 · Signature motion et design de marque : « Encre et sceau »

## Contexte

Le CEO veut une identité d'animation et de design unique pour SAFE : partir de plusieurs
inspirations existantes et en synthétiser une seule, propre à la marque. Le chantier
re-skin safe-interface (forêt/albâtre, tokens `si-*`) fournit déjà la palette ; il manquait
un langage de mouvement.

## Quatre pistes explorées

1. **Encre notariale** : le contenu se dépose comme de l'encre (fondu + montée 8 px),
   traits qui se tracent. Inspiration papeterie juridique, Stripe Press.
2. **Forêt calme** : respiration lente (4 s et plus), rien ne presse. Inspiration Aesop,
   slow design.
3. **Précision comptable** : réponses nettes 150 à 400 ms, chiffres tabulaires qui roulent.
   Inspiration Linear, typographie suisse.
4. **Sceau vivant** : la vérification se dessine comme un sceau apposé (cercle puis coche
   en trait SVG). Inspiration cire à cacheter, certification notariale.

## Synthèse retenue (proposition) : « Encre et sceau »

Deux tempos et un moment héros :

- **Tempo réponse (160 ms, ease-snap)** : tout ce que l'utilisatrice touche répond vite
  (hover, focus, toggles). L'outil est vif.
- **Tempo encre (480 ms, ease-out prononcé, stagger 80 à 120 ms)** : tout ce qui apparaît
  se dépose calmement (entrées de page, cartes, résultats).
- **Moment sceau (900 ms)** : réservé aux confirmations de confiance (facture vérifiée,
  rapprochement concilié, conformité). Cercle qui se trace puis coche, vert `si-verified`.
  C'est l'animation-signature, une seule par écran.
- **Chiffres d'argent** : toujours tabulaires, toujours en roulement ease-out.
- **Interdits** : rebond/élastique, spinners génériques quand un dépôt d'encre suffit,
  plus d'un sceau simultané.

Cohérence marque : l'encre = le métier juridique, le sceau = la conformité Barreau, les
deux tempos = « copilote vif, cabinet serein ». S'aligne sur « preuve visuelle avant
tout » : l'animation ne décore pas, elle montre que le système a vérifié.

## Prochaine étape proposée

Ajouter les tokens motion au namespace `si-*` dans `tailwind.config.ts`
(durées `si-fast` 160 ms / `si-ink` 480 ms / `si-seal` 900 ms + easings) et un composant
`<SceauVerifie>` réutilisable, puis appliquer d'abord sur facturation (écran le plus vu
par Me Dérisier). Aucune décision CEO encore : proposition à valider.

## Statut

**VALIDÉE par le CEO le 2026-07-17** (« je valide ces animations »). La signature
« Encre et sceau » devient le langage de mouvement officiel de SAFE : deux tempos
(réponse 160 ms / encre 480 ms), moment sceau 900 ms réservé aux confirmations de
confiance, chiffres d'argent tabulaires en roulement, jamais de rebond.

Implémentation à venir : tokens motion `si-*` dans tailwind.config.ts + composant
`SceauVerifie` + première application sur facturation.
