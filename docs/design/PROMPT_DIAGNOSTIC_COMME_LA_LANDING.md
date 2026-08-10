# Prompt — Le diagnostic, écrit avec la grammaire de la page d'accueil

> Adaptation du « One-Prompt Website Pack » (Zubair Trabzada, éd. 2026, prompts 06 · 08 · 09)
> au parcours `/audit-gratuit` de SAFE. Le pack d'origine s'adresse à Fable 5 + Higgsfield MCP :
> il commande des clips vidéo IA que le défilement vient scruber. Ici, le modèle est Opus 5
> dans ce dépôt, et le produit existe déjà.
> À lire avec [DESIGN_HUMAIN.md](DESIGN_HUMAIN.md) (§0 et §10 priment) et
> [DIRECTION_DIAGNOSTIC_CINEMATIQUE.md](DIRECTION_DIAGNOSTIC_CINEMATIQUE.md).

---

## 1. Ce qui change entre le pack Fable 5 et notre version Opus 5

| Pack d'origine | Notre version |
|---|---|
| Un agent qui part d'une page blanche | Un agent dans un dépôt vivant : lire `ExperienceCinema.tsx` et `shared.tsx` avant d'écrire une ligne |
| Clips Seedance générés, chaînés start/end frame | **Écarté.** Le produit est réel : maquettes React (`components/public-site/mockups.tsx`), captures réelles (`public/experience-assets/`) |
| « Une image héro référencée partout » pour la cohérence | Un seul système de jetons (`shared.tsx`) référencé partout : mêmes couleurs, mêmes courbes, mêmes filets que l'accueil |
| Fond noir, accent néon, type brutaliste | Albâtre `#EFF2ED`, encre `#1F2A24`, vert `#12A150`, forêt `#1F3A2E`, filets à 8 % |
| « Copy tone: quiet, expensive, very few words » | Voix SAFE : « vous », posé, jamais alarmiste, aucun tiret long en milieu de phrase |
| Compteurs qui montent, HUD, marquee | Gardés seulement quand un vrai chiffre les justifie, et marqués « exemple » |
| « Launch on localhost and verify before telling me it's done » | **Gardé tel quel.** Rien n'est « terminé » sans être vu à l'écran |

## 2. Le prompt

> Refais la page d'entrée du diagnostic (`app/audit-gratuit/page.tsx`) pour qu'elle se lise
> comme la page d'accueil, avec la même grammaire de défilement et les mêmes jetons.
> Lis d'abord `components/public-site/ExperienceCinema.tsx` et `components/public-site/shared.tsx`,
> puis réutilise ce qui existe au lieu d'inventer un style de plus.
>
> STRUCTURE, dans cet ordre, une intention par palier :
> 1. **En-tête** identique à l'accueil : marque, liens, connexion, un seul bouton plein vert
>    qui descend au choix de langue.
> 2. **Scène épinglée** d'environ 380 vh. Au départ : surtitre mono
>    « Diagnostic · gratuit · rapport sous 24 h », titre serif « Ce que votre cabinet laisse
>    passer. » avec « laisse passer » en italique vert, une phrase de contexte, l'indicateur
>    « Faites défiler » en bas. En descendant, le titre s'élève et s'efface, les trois
>    promesses arrivent une par une, chacune précédée d'un filet qui se trace, jamais deux
>    lisibles en même temps. Les galets du logo dérivent en fond et se laissent brasser au curseur.
> 3. **Bande de preuves** sur aplat surface, quatre mentions courtes, une pastille verte chacune.
> 4. **Scène épinglée « Ce qu'on regarde »** : copie à gauche, feuille de rapport à droite qui
>    se remplit au défilement, ligne après ligne, les chiffres montant jusqu'à leur valeur,
>    puis une bande forêt de recommandation et une mention de remise. Même mécanique que la
>    facture de l'accueil. La feuille porte « exemple » : les chiffres du visiteur viendront
>    de ses réponses.
> 5. **Comment ça se passe** : trois étapes numérotées, filets pleine largeur, aucune carte à icône.
> 6. **Questions** : trois objections réelles (données, temps, tarif), en deux colonnes, filets entre elles.
> 7. **Départ** : le choix de la langue, deux blocs, sous une phrase courte. Seul moment centré
>    de la page. C'est ici que le questionnaire prend la main.
> 8. **Pied de page** partagé du site public.
>
> RAIL — un tiret par scène, fixé à droite, celui de la scène en cours s'allonge et se nomme.
> Repère de lecture, jamais cliquable, masqué sous 1024 px.
>
> RYTHME — transitions de 550 à 850 ms, courbe `cubic-bezier(0.16, 1, 0.3, 1)`. Rien ne saute,
> rien ne rebondit. Les scènes épinglées se dessinent hors React, par `useScrollScrub`.
> Sous `prefers-reduced-motion`, tout s'empile et rien ne bouge.
>
> INTERDITS — aucun dégradé, aucune ombre empilée, aucun emoji, aucun tiret long en milieu de
> phrase, aucun tarif avant le rapport, aucun chiffre présenté comme un fait sans être marqué
> comme exemple.
>
> Lance le serveur de développement, ouvre la page, vérifie chaque scène et le mode sans
> animation, et montre-moi une capture avant de me dire que c'est terminé.

## 3. Règles dures conservées

- **Une intention par palier.** Le lecteur ne lit jamais deux idées en même temps.
- **Le vert d'accent ne sert qu'à une chose à la fois** dans un même regard.
- **Le rail ne se clique pas.**
- **Le tarif n'apparaît jamais avant le rapport.**
- **Tout chiffre d'exemple est annoncé comme tel**, y compris dans la feuille de rapport.

## 4. Où c'est implémenté

| Élément | Fichier |
|---|---|
| Page d'entrée complète (scènes, preuves, questions, départ) | `app/audit-gratuit/page.tsx` |
| Jetons, rail, galets dérivants, scrub | `components/public-site/shared.tsx` |
| Grammaire de référence | `components/public-site/ExperienceCinema.tsx` |
| Questionnaire, rapport, envoi | `components/audit-gratuit/AuditForm.tsx` (inchangé) |
