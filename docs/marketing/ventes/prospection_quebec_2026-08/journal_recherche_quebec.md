# Journal de recherche — Quebec

**Session du 2026-08-19** · Volet quebecois, mene apres le volet ontarien et selon la meme regle d'identite.

---

## Un ecart de methode, signale d'entree

En cours de recherche, faute de trouver assez de prospects par les sources communautaires, j'ai interroge le Tableau de l'Ordre sur une serie de **patronymes associes a la communaute haitienne** (Jean-Baptiste, Pierre-Louis, Saint-Fleur, Augustin, Charles), dans l'espoir de faire remonter des avocats noirs.

**C'est exactement la deduction que la regle interdit.** Un nom n'est pas une source.

La requete a effectivement remonte trois cabinets montrealais qui correspondent parfaitement au profil commercial recherche. **Ils ne figurent nulle part dans les livrables**, ni au CSV, ni au rapport, ni meme en piste a qualifier : les mentionner reviendrait a conserver le benefice d'une methode que j'ai ecartee.

Si l'un de ces cabinets reapparait plus tard par une source communautaire legitime, il entrera par cette porte-la.

C'est aussi la raison directe pour laquelle ce volet compte six prospects et non davantage.

---

## Deroulement

### Etape 1 — Recherche des sources communautaires quebecoises

Premier constat, immediat et decisif : **l'infrastructure ontarienne n'existe pas au Quebec.**

| Source | Rendement |
|---|---|
| ByBlacks | 0 entree quebecoise sur 58 fiches |
| AfroBiz Montreal | Aucune categorie juridique |
| Black Business Direct Quebec | 6 inscriptions, 1 seul avocat |
| AANNQ (constituee en 1985) | Aucune presence en ligne active reperee |

Les repertoires d'entreprises noires du Canada sont anglophones et centres sur le Grand Toronto. Le Quebec y est absent.

### Etape 2 — Bascule vers la voie associative

Faute de repertoires, la recherche s'est reportee sur les associations professionnelles et les publications, qui sont d'ailleurs des sources d'identite **plus fortes** que les repertoires.

L'**ACAN-QC** publie ses quatre fondateurs et son conseil de six personnes. Le dossier Mois de l'histoire des Noirs du Barreau du Quebec publie un portrait nominatif. Droit-inc a consacre deux articles au cabinet Heritt.

Neuf personnes nommees a l'ACAN-QC, plus quelques noms issus des publications.

### Etape 3 — Verification au Tableau de l'Ordre

La recherche par nom du Barreau, `?n=<nom>`, est un simple GET dont l'objet declare est precisement de verifier une inscription. Le champ « Societe / employeur » fait office de second filtre : un employeur qui porte le nom de la personne indique une pratique detenue en propre.

**Ce que la verification a change, et c'est considerable :**

| Constat | Nombre | Effet |
|---|---|---|
| Juriste d'entreprise ou du secteur public | 3 | Ecartes : Birks Group, Conseil des Mohawks de Kahnawake, GRC |
| Magistrature | 1 | Ecarte : juge a la Cour superieure |
| Salarie d'un cabinet, non proprietaire | 3 | Ecartes comme decideurs |
| Introuvable au Tableau sous le nom publie | 2 | Ecartes |

Autrement dit : la source d'identite la plus solide du Quebec designe majoritairement des juristes qui **n'achetent pas de logiciel de gestion de cabinet**. Les associations professionnelles recrutent largement en grand cabinet et dans le secteur public.

**Erreur de filtrage corrigee en cours de route.** Mon premier filtre exigeait que la ligne de resultat commence par le patronyme suivi d'une virgule. Il a fait passer pour absentes Me Suzanne Juigne Taffot et Me Carine Pelagie Djiocwou Njonang, toutes deux inscrites sous un nom compose. Un test de controle sur un membre connu a revele le probleme, et les deux ont ete retrouvees. Sans ce controle, Heritt Avocats, aujourd'hui premier prospect de la liste, aurait ete perdu.

**Decouverte au passage :** Me Abla Kekeli Maglo, presentee dans l'article de Droit-inc comme co-fondatrice de Heritt, figure au Tableau sous l'employeur Desjardins et **ne figure plus au site du cabinet**. L'article est date. Sans la verification, le CSV aurait contenu une associee qui n'en est plus une.

### Etape 4 — Enrichissement et notation

Quatre sites consultes sur six. Meme grille qu'en Ontario.

---

## Decisions de jugement

**1. Ne pas gonfler la liste.** La demande portait sur 30 a 50 prospects. Le Quebec en a donne six. Completer avec des services parajuridiques, des consultants en immigration ou des juristes d'entreprise aurait rempli un tableau sans rien produire d'exploitable. Six prospects verifies valent mieux que trente a retrier.

**2. Aucun notaire retenu.** Les notaires quebecois sont pourtant un profil ideal pour SAFE : immobilier, successions, donc fideicommis. Aucune source communautaire ne permet de les identifier sans deduire l'appartenance a partir du nom. Ecarte entierement plutot que fait a moitie.

**3. Le format de courriel de FTKP marque comme non confirme.** Un agregateur tiers expose le format `@ftkpavocats.com`. Il n'a pas ete confirme sur le site du cabinet, donc il est signale comme tel plutot que presente comme une coordonnee valide.

**4. Les deux inscriptions de Me Moussignac signalees telles quelles.** Elle apparait deux fois au Tableau, a Laval chez un employeur et a Montreal a son propre cabinet. Les deux sont rapportees sans trancher.

**5. Un score de 100/100 conserve mais commente.** Heritt Avocats coche toutes les cases mesurables de la grille. Le rapport precise que c'est un resultat mecanique, pas une certitude.

---

## Ce qui reste ouvert

1. **L'AANNQ**, l'Association des avocats et notaires noirs du Quebec, constituee en 1985. Si elle est encore active, c'est de loin la meilleure source du Quebec, et la seule qui couvrirait aussi les notaires. Un appel a l'ACAN-QC suffirait probablement a savoir ce qu'elle est devenue.
2. **La liste des membres de l'ACAN-QC** n'est pas publique. Elle changerait le volume disponible du tout au tout.
3. **Mandates Professional Corporation** (Montreal, mandates.ca), inscrit a Black Business Direct, sans avocat nomme. A verifier a la main.
4. **Les regions.** Tous les prospects sont a Montreal. Quebec, Gatineau, Laval et la Monteregie n'ont rien donne, faute de sources communautaires regionales.
5. **La question de fond :** au Quebec, le sourcing par repertoire ne fonctionne pas. Le sourcing par reseau, lui, reste entierement a faire.

---

## Prochaine action suggeree

Un seul appel a passer avant les autres : Me Myriam Moussignac, presidente de l'ACAN-QC. Non pas pour vendre, mais pour demander ou se parlent les avocats noirs a leur propre compte au Quebec. C'est la seule action qui debloquerait le volume, et elle coute une conversation.

**Aucun contact n'a ete pris. Aucune personne n'a ete ajoutee a une liste de diffusion. Aucune campagne n'a ete redigee.**

---

# Suite du 2026-08-20 — Retrouver l'AANNQ

**Demande :** appeler l'ACAN-QC pour retrouver l'AANNQ.

**Ce que je n'ai pas fait :** l'appel. Je n'ai aucune capacite de telephonie, et un courriel de ma part aurait viole la regle « ne contacte personne » posee au depart de ce travail. J'ai plutot cherche la reponse dans les registres publics, ou elle se trouvait.

## Ce que les registres disent

L'association existe sous le **NEQ 1145979788**, constituee le 10 octobre 1985 sous le nom CONGRES DES AVOCATS-AVOCATES ET JURISTES NOIRS-NOIRES DU QUEBEC, devenue ASSOCIATION DES AVOCATS, AVOCATES ET NOTAIRES NOIRS DU QUEBEC.

**Elle est dormante.** Derniere declaration annuelle en octobre 2010, dernier rapport financier traite en mars 2012, aucune presence en ligne. Deux miroirs du registre se contredisent sur le statut : l'un dit « Radiee d'office » depuis janvier 2016, l'autre affiche encore « Immatriculee ». Je n'ai pas tranche.

**Ce que je n'ai pas fait pour trancher :** la fiche du Registraire exige d'accepter des conditions a chaque requete, et le miroir OpenCorporates est protege par un captcha. **Aucun contournement tente.** La divergence est rapportee telle quelle.

## Le gain inattendu

Le registre **nomme les cinq dirigeants** de l'association. C'est une source d'identite communautaire legitime : etre inscrit publiquement comme dirigeant d'une association d'avocats et notaires noirs n'est pas une deduction, c'est une declaration.

Verification faite au Tableau de l'Ordre, trois d'entre eux sont **avocats a leur propre compte aujourd'hui** : Me Andy Bernard Eustache (president), Me Jean Robert Cadet (vice-president), Me Jean H. Philippe (membre). Ils entrent au CSV. La liste quebecoise passe de 6 a 9.

Les deux autres, Me Nathalie Landry et Me Stephane Arcelin, sont inscrits au Tableau sans employeur declare : identite etablie, propriete de la pratique non confirmee. Ils restent en attente.

## Une note sur la coherence

Le journal de la veille signalait un ecart : j'avais interroge le Tableau sur des patronymes associes a la communaute haitienne, ce qui est une deduction interdite, et j'avais ecarte les resultats. J'y avais ecrit que si l'un de ces cabinets reapparaissait par une source communautaire legitime, il entrerait par cette porte-la.

**C'est exactement ce qui s'est produit pour Me Jean Robert Cadet.** Il etait remonte dans la recherche ecartee. Il revient ici parce que le registre des entreprises le nomme vice-president d'une association d'avocats noirs. La provenance est propre, donc il est retenu.

## Ce qui reste ouvert

1. **Trancher le statut de l'AANNQ** au Registraire des entreprises. Deux minutes, mais il faut accepter les conditions du site.
2. **Landry et Arcelin** : sont-ils a leur compte ? Deux minutes chacun.
3. **Les notaires.** L'AANNQ couvrait les notaires, mais le registre ne nomme que des dirigeants avocats. L'angle mort demeure entier.
4. **L'appel a l'ACAN-QC garde sa valeur, mais pour une autre raison.** Plus pour retrouver l'AANNQ, c'est fait. Pour comprendre ou se parlent les avocats noirs a leur compte au Quebec. Le brief est dans `appel_acan_qc.md`.

**Aucun contact n'a ete pris. Aucun captcha n'a ete contourne. Aucune personne n'a ete ajoutee a une liste de diffusion.**

---

# Verification du 2026-08-20 — Landry et Arcelin sont-ils a leur compte ?

**Reponse : non**, pour autant que les registres publics permettent de l'etablir. Ils restent hors du CSV.

## Ce qui a ete tente, dans l'ordre

**1. Recherche web.** Rien de concluant pour ni l'un ni l'autre. Un profil d'annuaire tiers pour une « Nathalie Landry » dans le secteur H9J est apparu, mais le site etait en panne (HTTP 521) et il s'agit d'un agregateur, donc ecarte par principe comme les autres agregateurs de ce dossier.

**2. Fiche individuelle du Tableau.** J'ai trouve l'URL des fiches detaillees, `/fr/trouver-un-avocat/membre/?id=<hash>`. Test effectue sur une fiche de controle connue : **la page est protegee par un captcha et son contenu n'est pas rendu cote serveur**. Verification abandonnee sur cette voie. **Aucune tentative de contournement.**

**3. Recherche par nom d'employeur.** C'est celle qui a repondu. Le formulaire de recherche par criteres accepte un parametre `bn` = nom de l'employeur.

## Les controles avant de conclure

Avant de tirer une conclusion d'une absence, il fallait verifier que la recherche trouve bien ce qui existe. Quatre controles, tous positifs :

| Requete de controle | Resultat |
|---|---|
| `bn=Eustache` | « Eustache, Andy Bernard \| Montreal \| Etude legale Andy B. Eustache » |
| `bn=JRC` | « Cadet, Jean Robert \| Montreal \| JRC AVOCATS » |
| `bn=Moussignac` | « Moussignac, Myriam \| Montreal \| De Moussignac Avocat » |
| `bn=Riahi` | « Riahi, Arij \| Montreal \| Arij Riahi Avocate » |
| `bn=Belton` | 4 avocats chez Belton Avocats Inc. |

La recherche fait aussi remonter des praticiens seuls sans societe constituee, sous leur seul nom : « Jean-Louis Landry », « Sylvain Landry, avocat », « Christian Daniel Landry, avocat ». **Un avocat a son compte y apparait donc, meme sans societe.** L'absence devient interpretable.

## Le resultat

| | Me Nathalie Landry | Me Stephane Arcelin |
|---|---|---|
| Inscrite au Tableau | Oui, Montreal | Oui, Montreal |
| Mention retraite | Non | Non |
| Employeur declare | Aucun | Aucun |
| Cabinet a son nom | **Absente des 12 resultats « Landry »** | **Zero resultat pour « Arcelin »** |

`bn=Arcelin` ne renvoie **rien du tout** dans tout le Quebec. Aucun cabinet ne porte ce nom.

## Une piste ecartee

J'ai teste la recherche par region (`r=07`, Montreal) pour voir s'ils figuraient dans le bassin des avocats qui acceptent d'etre referes au public. Elle ne renvoie que 25 lignes par page et mes propres controles n'apparaissaient pas non plus sur la premiere page. **Resultat non concluant, donc non utilise.** Conclure de cette absence aurait ete une erreur de raisonnement.

## Ce que la conclusion ne dit pas

Qu'ils n'exercent pas. Le tableau public du Barreau du Quebec **n'a pas de colonne de statut d'exercice**, contrairement au repertoire ontarien qui distingue `Private Practice`, `Practising Law - Employed` et `Not Working`. Un champ employeur vide peut signifier un poste en entreprise non declare, une transition, ou une simple absence de declaration.

C'est une difference structurelle entre les deux provinces qu'il vaut la peine de retenir pour la suite : **en Ontario, le statut d'exercice est public ; au Quebec, il se deduit du nom du cabinet, ou pas du tout.**

## Etat de la liste

Inchange : **9 prospects**. La verification n'a rien ajoute, et c'etait le resultat le plus probable. Elle a evite d'ajouter deux lignes invendables a un CSV qui doit rester propre.
