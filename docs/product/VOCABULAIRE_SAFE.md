# Le vocabulaire de SAFE

Date : 2026-09-09
Statut : **décidé et appliqué le 2026-09-09.** Les trois questions de métier sont
tranchées (§4), le renommage est en place, les tests passent.
Portée : les mots que l'utilisatrice lit. Pas les noms de fichiers, de tables ni de routes.

---

## Pourquoi ce document existe

Le CEO a dit, le 2026-09-09 : « j'éprouve de la difficulté à expliquer simplement ».

Ce n'est pas un problème d'élocution. **Un produit qui emploie quatorze mots pour une
seule chose ne peut être expliqué simplement par personne**, pas plus par celui qui l'a
construit que par l'avocate qui l'ouvre.

L'audit de l'interface note la facilité d'usage à 2,9 sur 5 et l'accès à l'information
à 2,8. Les deux notes les plus basses. Ce document traite la cause la moins chère et
la plus rentable des deux : le produit parle sa propre langue au lieu de parler celle
du cabinet.

Aucune ligne de moteur n'est touchée. Aucune donnée ne bouge. C'est du renommage.

---

## 1. Le relevé, mesuré dans le code

### Famille 1 : noter ses heures et les facturer

Une seule idée. **Quatorze noms**, relevés dans `messages/fr.json` et dans les deux
navigations :

| Ce que le produit affiche | Où |
|---|---|
| Temps | Menu, onglet du dossier |
| Fiche de temps | Menu latéral |
| Feuilles de temps | Description de menu |
| Entrée de temps | Formulaire, journal d'audit |
| Temps & forfaits | Titre d'écran |
| Mon temps | Menu |
| Mon temps & ma paye | Menu latéral |
| Heures non facturées | Tableau de bord |
| Heures facturables | Tableau de bord |
| Heures soumises | Écran d'approbation |
| Prestation & honoraires | Menu principal |
| Prestations & honoraires | Menu latéral, **au pluriel cette fois** |
| Honoraires | Onglet de facturation |
| Honoraires à facturer | Menu latéral |

Le même élément de menu s'appelle « Prestation & honoraires » à un endroit et
« Prestations & honoraires » à un autre. Personne n'a pu le voir : les deux
navigations ne se lisent jamais côte à côte.

À cela s'ajoutent cinq adresses : `/temps`, `/mes-heures`, `/fiches-de-temps`,
`/facturation/honoraires`, `/facturation/temps-non-facture`. Deux ne sont que des
renvois vers les autres.

### Famille 2 : par où on commence sa journée

| Ce que le produit affiche | Ce qu'il annonce |
|---|---|
| Tableau de bord | « Tour de contrôle opérationnelle » |
| Aujourd'hui | ce qui vous attend |
| Briefing du jour | une synthèse du jour |
| Tableau de sécurité | mélange cybersécurité, échéances et fidéicommis |
| Conformité | **« État d'ensemble du cabinet »** |
| File assistante | « Ce qui attend votre intervention » |
| Navette | le fil interne du dossier |

**Deux écrans revendiquent la vue d'ensemble** : le tableau de bord se dit tour de
contrôle, la conformité se dit état d'ensemble. Trois écrans promettent « ce qui vous
attend » : Aujourd'hui, File assistante, Navette.

### Famille 3 : les documents

| Ce que le produit affiche | Ce que c'est vraiment |
|---|---|
| Édition | l'endroit où on rédige |
| Atelier | le même endroit, autre nom |
| Bibliothèque | la recherche de documents |
| Vue d'ensemble | l'accueil de l'édition |
| Documents | les fichiers reçus |
| Fichier | le même document, autre nom |
| Procédures & documents | un onglet du dossier |
| Cartables | la structure réglementaire du dossier |
| Pièces | les pièces au sens du tribunal (P-1, D-15) |
| Correspondance | ce qui est parti et arrivé |

---

## 2. La règle

**Un mot par chose. Le mot du cabinet, pas celui de la base de données.**

C'est déjà écrit dans le référentiel de design, règle PS-084 : « Le nom des choses
correspond au vocabulaire du cabinet, pas à celui du schéma de base de données. » Elle
n'a simplement jamais été appliquée aux noms de menus.

Trois tests pour retenir un mot :

1. **Une adjointe le dit-elle à voix haute ?** Elle dit « je rentre mes heures ». Elle
   ne dit pas « je vais dans Prestation & honoraires ».
2. **Le mot désigne-t-il une seule chose dans tout le produit ?** Si « temps » veut
   dire trois choses selon l'écran, il n'en désigne aucune.
3. **Peut-on l'expliquer sans en employer un deuxième ?** Un nom qui a besoin d'une
   note explicative est un mauvais nom.

---

## 3. Ce que je propose

Une colonne est vide : c'est la vôtre.

### Famille 1

| Aujourd'hui | Proposé | Pourquoi | Votre décision |
|---|---|---|---|
| Temps · Fiche de temps · Feuilles de temps · Entrée de temps · Temps & forfaits | **Temps** | Un seul endroit où le travail se note, à l'heure ou au forfait. | |
| Prestation & honoraires · Prestations & honoraires · Honoraires à facturer · Temps non facturé | **(disparaît)** | Ce sont des états du travail déjà noté, donc des filtres de Temps ou de Facturation, pas des destinations. | |
| Honoraires | **Honoraires** | Garde le mot, mais **seulement à l'intérieur d'une facture**, jamais comme lieu où l'on va. | |
| Mon temps · Mon temps & ma paye · Heures soumises | **Ma paye** | Ce que la personne veut vraiment. Et ça ne se confond plus avec Temps. | |
| Prestation | **Forfait** | Le produit dit déjà « Temps & forfaits ». « Prestation » est le mot du comptable, pas celui du cabinet. **Décision métier, voir §4.** | |

### Famille 2

| Aujourd'hui | Proposé | Pourquoi | Votre décision |
|---|---|---|---|
| Aujourd'hui | **Aujourd'hui** | Ce que je fais maintenant. Une file, ordonnée par urgence. | |
| Tableau de bord | **Tableau de bord** | Comment va le cabinet. Chiffres et tendances, aucune tâche. | |
| Conformité (« état d'ensemble du cabinet ») | **Conformité** — *ce que le Barreau attend, et la preuve* | La description change. Elle ne peut pas revendiquer l'ensemble, c'est le rôle du tableau de bord. | |
| Briefing du jour | **(disparaît)** | Devient le premier paragraphe d'Aujourd'hui. | |
| Tableau de sécurité | **(disparaît)** | Ses alertes remontent dans Conformité. Le mot « sécurité » promet de la cybersécurité et livre autre chose. | |
| File assistante | **(devient un filtre d'Aujourd'hui)** | Même idée, vue par un rôle. Pas une destination de plus. | |
| Navette | **Notes internes** | Déjà renommé dans la fiche dossier le 2026-09-06. Le mot « Navette » doit disparaître de l'écran et rester un nom de code interne. | |

### Famille 3

| Aujourd'hui | Proposé | Pourquoi | Votre décision |
|---|---|---|---|
| Édition · Atelier · Bibliothèque · Vue d'ensemble · Fichier | **Documents** | Un seul endroit pour tout ce qui est écrit ou reçu. | |
| (bouton dans Documents) | **Rédiger** | L'acte, pas le lieu. | |
| Cartable | **Cartable** | Vrai mot du métier au Québec. On le garde. | |
| Pièces | **Pièces** | Vrai mot du tribunal. On le garde. | |
| Correspondance | **Correspondance** | Clair, et déjà juste. | |

---

## 4. Les trois décisions de métier, tranchées le 2026-09-09

| Question | Décision CEO | Conséquence appliquée |
|---|---|---|
| « Prestation » désigne-t-il un forfait ? | **Oui** | Un seul mot : **Forfait**. « Prestation » disparaît de l'interface du cabinet. Il reste dans la console SAFE Inc., où « prestations de conseil » a un autre sens. |
| « Ma paye » couvre-t-elle les avocates ? | **Personnel salarié seulement** | Le libellé devient **Ma paye**, sa description **« Vos heures soumises, et votre paye »**. Reste ouvert : l'entrée de menu s'affiche encore pour tout le monde, y compris une associée. Voir §7. |
| Fidéicommis ou Comptes en fiducie ? | **Fidéicommis** | Inchangé. Le mot du Barreau reste. |

---

## 5. Ce que ça donne pour expliquer SAFE

Voici le point qui a déclenché ce document.

La phrase la plus simple qui décrit SAFE existe déjà. Elle est écrite dans votre propre
règle de build, §1, et personne ne s'en sert :

> Un cabinet d'avocats perd de l'argent et du sommeil sur trois choses : l'argent des
> clients qu'il détient en fiducie, les délais qu'il ne doit pas manquer, et les heures
> qu'il oublie de facturer. SAFE tient ces trois registres à sa place.

**Trois choses. Trois mots. C'est tout le produit.**

Si le vocabulaire ci-dessus est adopté, l'explication et le menu disent enfin la même
chose :

| Ce que le cabinet perd | Ce qui le tient dans SAFE |
|---|---|
| L'argent des clients en fiducie | **Fidéicommis** |
| Les délais à ne pas manquer | **Agenda** et **Aujourd'hui** |
| Les heures oubliées | **Temps** et **Facturation** |

Tout le reste (Clients, Dossiers, Documents, Conformité, Rapports, Paramètres) sert ces
trois-là ou les prépare. C'est aussi ce que dit la règle de build.

**La difficulté à expliquer simplement n'était pas un défaut de l'explication. C'était
un défaut du produit expliqué.** Quand le menu portera onze mots au lieu de trente, la
démonstration tiendra en trente secondes sans effort.

---

## 6. Ce qui a été appliqué le 2026-09-09

**Le menu du bureau et celui du téléphone disaient deux mots différents pour le même
lien.** C'était la cause matérielle du désordre, et personne ne pouvait la voir : les
deux navigations ne se lisent jamais côte à côte.

| | Barre du bureau, avant | Tiroir mobile, avant | Les deux, maintenant |
|---|---|---|---|
| Le travail noté | Prestation & honoraires | Fiche de temps | **Temps** |
| Le même, au forfait | *(pas de bascule)* | Prestations & honoraires | **Forfaits** |
| Les heures pour la paye | Mon temps | Mon temps & ma paye | **Ma paye** |
| Écrire et retrouver | Édition | Édition | **Documents** |

Détail : la barre du bureau ne changeait pas de mot selon le mode de facturation du
cabinet, alors que le tiroir mobile le faisait depuis toujours. Elle le fait
désormais (`Header.tsx`, fonction `navLabel`).

Renommés au total : **44 libellés**, dans les deux langues, dans les deux navigations
et à l'intérieur des écrans. Aucune donnée touchée, aucun calcul modifié, aucune
adresse changée. Typecheck vert, 2 061 tests verts, parité FR/EN intacte.

Deux corrections de fond méritent d'être notées, parce qu'elles ne sont pas
cosmétiques :

- **« Fiche de temps » désignait une seule ligne de travail.** Une fiche est une
  feuille, elle porte plusieurs lignes. Le bon mot existait déjà ailleurs dans le
  produit : **entrée de temps**. Il est maintenant employé partout.
- **« Vue d'ensemble » désignait l'accueil de l'édition**, alors que deux autres
  écrans revendiquent la vue d'ensemble du cabinet. Il devient **Documents récents**.

---

## 7. Les portes fermées le 2026-09-09

Instruction CEO : « ferme les portes en trop ». Avant de retirer chaque entrée, une
seule question a été posée : **ce qu'il y a derrière reste-t-il atteignable autrement ?**
Deux fois sur quatre la réponse était non, et la porte est restée ouverte.

### Fermé : le briefing du jour

`/briefing` était le seul vrai doublon du produit. Vérifié dans
`lib/services/briefing/daily-briefing.ts` : il ne compose **que** trois choses, et les
trois ont déjà leur propre destination.

| Ce que le briefing montrait | Où ça vit déjà |
|---|---|
| Les alertes de sécurité | `/securite`, bouton voisin sur le même écran |
| Le temps non facturé | `/facturation/temps-non-facture` |
| Les créances en retard | `/facturation/creances-aging` |

Il n'avait aucune entrée de menu. Sa seule porte était un bouton sur le tableau de
fidéicommis, à côté du bouton qui menait déjà à la moitié de son contenu. Le bouton est
retiré, avec son icône d'étincelle. **Aucune information n'est perdue.** La route reste
servie pour les signets, elle n'est simplement plus annoncée.

### Renommé : le tableau de sécurité

Le mot promettait de la cybersécurité et livrait des échéances, des soldes de fidéicommis
et des trous de conformité. Il devient **« Points à surveiller »**, sur le bouton comme
sur l'écran.

### Pas fermé, et pourquoi

**`/securite` reste.** C'est le seul endroit du produit qui affiche les échéances IRCC,
les délais d'appel et les documents qui expirent. Vérifié : ni Conformité ni Aujourd'hui
ne les reprennent. Le fermer aujourd'hui ferait disparaître des délais, ce qui est
précisément l'inverse du but. Il se fermera quand ces échéances auront une place dans
Aujourd'hui, et pas avant.

**`/gestion/assistante` reste.** L'audit et le §3 de ce document proposaient d'en faire
un filtre d'Aujourd'hui. Vérification faite, ce n'est pas un doublon : l'écran porte deux
choses qu'Aujourd'hui n'a pas, le filtre « mes dossiers » et l'auto-assignation. Le
retirer enlèverait une capacité à l'adjointe.

**Le banc d'essai de l'éditeur était déjà neutralisé.** L'audit le signalait comme une
route de test livrée dans le produit. C'est périmé : le dossier porte un préfixe `_`,
donc Next l'ignore et ce n'est plus une route. Rien à faire.

**Les trois redirections mortes n'ont plus aucun lien** (`/fiches-de-temps`,
`/parametres/equipe`, `/facturation/honoraires`). Elles sont déjà fermées comme
destinations et servent uniquement les anciens signets. Rien à faire non plus.

---

## 8. Ce qui reste ouvert

Ces points ne sont pas du vocabulaire. Ils demandent une décision ou un chantier.

1. **L'entrée « Ma paye » s'affiche pour tout le monde**, y compris une associée, alors
   que la décision du §4 la réserve au personnel salarié. C'est une règle d'affichage,
   pas un mot. À trancher : la masquer selon le rôle, ou la laisser visible et vide.
2. **Les portes en trop ne sont pas encore fermées.** Briefing, Sécurité et File
   assistante portent maintenant des descriptions qui ne se contredisent plus, mais ils
   restent des destinations distinctes. Les retirer de la navigation est le chantier
   suivant, et il change ce qui est atteignable, donc il demande un oui explicite.
3. **Le site public n'a pas été touché.** Il emploie encore « fiche de temps » et
   « timesheets » dans sa copie de vente. C'est une décision de marketing, pas
   d'interface, et elle a ses propres contraintes de référencement.

---

## 9. Ce que ça coûte

Le renommage seul : une journée. Aucune donnée touchée, aucun calcul modifié, les
adresses continuent de fonctionner.

Ce qui prendrait des semaines, et qui n'est **pas** dans ce document : fusionner les
quatorze pages de facturation, refaire la fiche dossier, uniformiser les 182 fichiers
en écart visuel. Ces chantiers restent fermés tant qu'aucun cabinet n'ouvre SAFE tous
les jours, conformément au §5 de la règle de build.
