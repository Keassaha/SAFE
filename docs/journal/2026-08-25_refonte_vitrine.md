# 2026-08-25 — Refonte de la vitrine, jour 2 (pause)

Suite du 24 août. Session close sur une pause décidée par le CEO, avec la
branche `feat/encaissement-interac` poussée et un Preview Vercel en attente de
promotion.

---

## Ce qui est construit et commité

Cinq commits, `017f58b` à `7a74011`, build vert avant la poussée.

**La palette et les jetons.** Fond nuage `#F7F7F6`, encre `#161817`. Le
contraste carte/fond tombait de 1,174 à 1,072 ; la bordure `#E0E3E0` le ramène
à 1,207, exactement sa valeur d'avant. Le vert `#26654A` ne bouge pas, c'est son
nom qui change : `forest` devient `ink-strong`, 137 fichiers.

**`font-serif` rend du Geist.** La classe habillait 197 endroits, presque tous
des titres. On a repointé le jeton plutôt que d'éditer 197 lignes. `font-instrument`
reste le chemin nommé vers la vraie serif, pour le rapport d'audit et `/marque`.

**Le hero.** Il ouvrait sur une animation de logo. L'application y était à
opacité 0 jusqu'à 900 px de défilement, au-delà du premier écran. Elle est
maintenant visible tout de suite, sur les deux formats. Le sous-titre tombe, la
réassurance devient un ruban qui glisse.

**L'échelle du téléphone.** Les extraits gardent les dimensions d'un ordinateur
et rétrécissent, au lieu de se réorganiser. La page passe de 14 382 à 12 850 px.

**Les trois fenêtres de « figures »** deviennent des répliques, chiffres relevés
dans la base de Me Camille Roy.

**`/a-propos`** devient un récit : six chapitres, un résumé collant qui suit la
lecture, six symboles. Un chapitre portait six tailles, il en porte trois.

**Le menu** se simplifie à quatre entrées, les Outils sortent de la navigation,
« À propos » monte au premier rang.

**Une procédure opposable** pour les extraits de vitrine, avec trois scripts et
six critères vérifiés par machine.

---

## Ce qui a été décidé

| Décision | Portée |
|---|---|
| Le hero passe en **Geist**, pas en serif | Charte §3.3 mise à jour le jour même |
| Cran de serrage **C3**, −0,042 em, interligne 1,02 | Choisi sur quatre crans montrés |
| Échelle du titre : **28 px** bureau, 25 px téléphone | Descendue deux fois dans la journée |
| Les illustrations gardent les **dimensions d'un ordinateur** | Rejette le carrousel que j'avais proposé |
| Les **Outils SAFE** sortent de la navigation | Les routes existent toujours et répondent |
| `/calculateurs` est **une porte d'accès**, pas une vitrine | À traiter avec les fonctionnalités |
| Les relevés de référence sont **ignorés par git** | Régénérables, et ils portent des noms de clients |

---

## Ce qui a été observé, et qui n'est pas du design

Trois défauts de produit trouvés en cherchant des chiffres vrais pour les
illustrations. Aucun n'est corrigé.

1. **Solde de fidéicommis négatif.** Simon Lévesque est à **−1 725,00 $**. Ce
   n'est pas un défaut d'affichage, c'est une faute déontologique. À vérifier :
   la surveillance évalue-t-elle par client, ou seulement le total du cabinet ?
2. **`nbDossiersAvecProvision` affiche 0** alors qu'il y a 89 275 $ en
   fidéicommis. Il compte `TrustAccount.currentBalance > 0`, et cette table est
   vide pour ce cabinet : le solde se calcule depuis les transactions.
3. **Aucune facture n'a de ligne de détail.** Zéro `InvoiceLine` sur tout le
   cabinet, et 218 entrées de temps dont aucune rattachée à une facture.

Et un défaut de sécurité, déjà signalé le 24 : le mot de passe
`DemoSafe-2026!` est **dans l'historique git** depuis le commit `15b17a3`,
fichier `scripts/capture-app-shots.mjs`. L'écrire dans un commit ne le retire
pas. Le mot de passe est à changer et le script à supprimer.

---

## Ce qui reste ouvert

- **Le Preview Vercel n'est pas promu.** Pousser ne met rien en ligne. La CLI
  `vercel --prod` téléverse le répertoire de travail, pas un commit : elle
  emporterait les six fichiers de facturation non commités et appliquerait leur
  migration à la base de production. Promouvoir depuis le tableau de bord
  déploie le commit seul.
- **Le chantier B-02/B-03 de facturation** reste dans l'arbre, non commité :
  plafond de note de crédit, charge d'intérêt en attente, deux tests et une
  migration d'unicité.
- **Les pages publiques non traitées** : `/tarification`, `/faq`, `/demo`,
  `/connexion`, `/audit-gratuit` portent encore l'ancien socle gris.
- **Le menu replié du téléphone** a été montré, jamais validé.
- **`/demo` et `/contact` rendent le même composant.** Deux adresses, une page.
- **Les symboles 02 et 06** sont les plus faibles du jeu : une grille de tableur
  et une silhouette décrivent au lieu de raconter.

---

## Une erreur de méthode à ne pas refaire

J'ai calculé un solde de fidéicommis en « dépôts moins retraits » et annoncé un
écart de 5 850 $ avec la vitrine. C'était faux : les retraits sont stockés en
négatif, je les comptais deux fois. La vitrine était juste depuis le début.

La leçon tient en une phrase : **reproduire le calcul de l'application, pas en
inventer un équivalent**. `getGlobalTrustBalance()` est une somme de `amount`.
C'est ce que fait maintenant `scripts/relever-depuis-la-base.mjs`, et c'est
écrit dans son en-tête.
