# 2026-08-03 — CH-11 livré : conservation, accès d'inspection, trousse

Douzième chantier du [Programme Inspection Ready](../compliance/PROGRAMME_INSPECTION_READY.md).
Ferme **QC-16, QC-18, QC-19, QC-20, ON-42, ON-43** et la s. 23(3).

## Deux régimes de conservation qui ne se ressemblent pas

| | Durée | Point de départ |
|---|---|---|
| QC, art. 31 | 7 ans | **fermeture du dossier** |
| QC, art. 32 | 7 ans | **fin de l'exercice** |
| ON, s. 23(1) | 6 ans | fin d'exercice |
| ON, s. 23(2) | **10 ans** | fin d'exercice |
| ON, s. 23(3) | 10 ans | fin d'exercice |

Au Québec la durée est commune et c'est **l'ancre** qui change. En Ontario l'ancre est
commune et c'est **la durée** qui change, selon que le paragraphe figure ou non dans la
liste de la s. 23(2) — les par. 18(1)(2)(3)(8)(9)(10)(11).

Aplatir l'un ou l'autre régime détruirait des pièces encore exigibles. Une purge à six
ans en Ontario effacerait le journal du fidéicommis, qui en vaut dix. Une purge ancrée
sur l'exercice au Québec effacerait les registres d'un dossier fermé l'an dernier, dont
les sept ans commencent à peine.

La liste des paragraphes à dix ans est écrite telle quelle dans le code, pas résumée.
« Les registres importants » n'est pas une catégorie du texte, et quelqu'un finirait par
y ranger la mauvaise pièce.

## Le défaut, c'est non

Le moteur refuse de purger quand :

- le dossier n'est pas fermé, ou sa date de fermeture est inconnue ;
- la fin d'exercice du cabinet n'est pas réglée ;
- l'échéance n'est pas atteinte, fût-ce d'un jour.

`updatedAt` ne sert **jamais** de date de fermeture de substitution : ce serait dater un
dossier sur la dernière fois que quelqu'un l'a touché.

Se tromper en conservant coûte du stockage. Se tromper en détruisant est irréversible et
constitue le manquement lui-même.

**La destruction n'est pas implémentée, et c'est délibéré.** Aucun cabinet servi par
SAFE n'a de pièce arrivée à échéance : le produit est trop jeune. Écrire aujourd'hui du
code de suppression que personne ne peut éprouver sur des données réelles créerait un
risque irréversible pour un besoin qui n'existe pas. Ce qui sert maintenant, c'est
l'inverse : prouver qu'on conserve, et savoir jusqu'à quand.

## L'inspecteur n'est pas un utilisateur du cabinet

Le réflexe aurait été d'ajouter `inspecteur` à l'enum des rôles et de le refuser partout
où l'on écrit. Décision contraire, prise sur une base mesurée : le dépôt compte plus de
**330 endroits** qui consultent le rôle, et une partie des écritures ne vérifient que
l'authentification, pas le rôle.

Un rôle « lecture seule » ne serait donc étanche qu'au prix d'un audit exhaustif de ces
330 sites, et le moindre oubli donnerait à un tiers extérieur le droit d'écrire dans la
comptabilité d'un cabinet.

L'accès d'inspection est donc une **session distincte** : aucun compte créé, aucun rôle,
aucun chemin d'écriture. Ce qu'elle ne peut pas atteindre, elle ne peut pas le casser.

- Trois champs obligatoires — nom, organisme, motif. Un accès anonyme donnerait un
  journal qui ne prouve rien, et le cabinet reste tenu au secret professionnel.
- Le jeton n'est **jamais** conservé en clair : seule son empreinte SHA-256 l'est.
- Une session expirée ou révoquée est refusée, pas tolérée avec un avertissement.
- Chaque consultation est consignée **avant** d'être servie.
- Le périmètre de lecture est une liste blanche : une ressource ajoutée plus tard n'est
  pas visible tant que personne ne l'a décidé.
- Une session révoquée n'est pas supprimée, sinon son historique disparaîtrait avec elle.

L'article qui fonde tout cela est l'**art. 29** : les livres sont accessibles en tout
temps au syndic, à ses enquêteurs, au directeur de l'inspection professionnelle et à ses
experts. Ce que l'article n'impose pas, c'est la **forme** du dispositif. La durée de
trente jours ne vient d'aucun texte, et le module le dit.

## La trousse nomme ce qui manque

L'art. 33 rend la trousse utile : une reconstitution se fait « aux frais de l'avocat ».
Un cabinet qui peut réexporter une période complète, horodatée et empreintée, n'a rien à
reconstituer — il produit.

- Registres applicables à la province, rapports mensuels de la période, journal des
  soldes débiteurs. Chaque pièce porte son article et son empreinte SHA-256.
- Un registre indisponible **n'interrompt pas** la production : il figure à la trousse
  comme manquant, avec sa raison. Une trousse qui s'arrêterait à la première pièce
  absente ne servirait à rien le jour où elle sert.
- Un mois sans rapport est porté comme manquant, pas omis. Un trou silencieux dans la
  liste ressemblerait à une période sans obligation.
- Un rapport produit mais non certifié est distingué d'un rapport absent.
- Le manifeste **ouvre sur ce qui manque**. Commencer par les pièces produites
  laisserait croire à une trousse complète, et personne ne lirait jusqu'au bas.
- Le manifeste dit lui-même qu'il ne vaut pas attestation de conformité, et que les
  empreintes ne sont exigées par aucun article.

## Deux citations corrigées en cours de route

Deux références écrites de mémoire étaient fausses et ont été recoupées avec l'audit
sourcé avant d'être commitées :

- l'obligation de produire immédiatement une **copie papier** relève de l'**art. 30**
  QC et du **par. 21(2)** ON, pas de l'art. 29 ;
- l'**art. 29** est précisément l'article de l'**accès** du syndic et de l'inspection —
  c'est lui qui fonde le module d'accès, là où j'avais d'abord écrit qu'aucun article
  n'imposait ce mécanisme.

## Vérification

`tsc --noEmit` propre. **115 fichiers de tests, 1 313 tests, tous verts.**
44 nouveaux tests sur ce chantier. Migration additive appliquée en local.

## Scores

| | Départ | CH-08 | CH-09 | CH-10 | CH-11 |
|---|---|---|---|---|---|
| Barreau du Québec | 48 | 96 | 98 | 99 | **99** |
| Law Society of Ontario | 42 | 95 | 95 | 97 | **99** |
| Global | 45 | 96 | 97 | 98 | **99** |

Le Québec ne bouge pas, et c'est voulu : le point qui manque est tenu par CH-12
(art. 7, 9, 15, 19 et 74-82). Tant qu'il est ouvert, écrire 100 serait faux.

## Reste

**CH-12** : registre de conformité vivant (activation et correction de
`lib/compliance/rules.ts`, dont les huit entrées erronées relevées au §0.3 de l'audit),
rappels de prescription (art. 7), liste des dossiers fermés (art. 9), registre des codes
(art. 15), originaux du client (art. 19), cessation d'exercice (art. 74-82).

Et les écrans, qui restent le vrai reste : le moteur est bâti, le cabinet ne le voit pas
encore.
