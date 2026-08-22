# Journal de recherche

**Session du 2026-08-19** · Constitution d'une liste de prospects SAFE parmi les avocats entrepreneurs de l'Ontario, avec priorite aux cabinets appartenant a des personnes noires.

---

## Regle d'identite appliquee

Consigne recue : ne jamais deduire l'origine ethnique d'une personne a partir de son nom, de sa photo, de son apparence, de sa langue ou d'une supposition culturelle.

**Traduction operationnelle :** la recherche part des sources communautaires et remonte vers l'avocat. Jamais l'inverse. A aucun moment une liste d'avocats n'a ete parcourue pour y designer qui serait noir.

Cette regle a eu des consequences concretes, documentees plus bas : deux personnes qui correspondaient parfaitement au profil commercial ont ete ecartees parce que la seule chose qui les avait fait remonter etait un patronyme.

---

## Deroulement

### Etape 1 — Cadrage

Strategie posee avant toute recherche : criteres d'inclusion (permis ontarien, cabinet independant, proprietaire de sa pratique, domaine a dossiers volumineux) et d'exclusion (grands cabinets nationaux, salaries, contentieux interne, hors Ontario).

**Precision recue en cours de route :** cibler specifiquement les **avocats entrepreneurs qui travaillent a leur propre compte**. Cette precision a resserre le filtre : le statut `Private Practice` du repertoire du Barreau est devenu obligatoire, et les avocats en statut `Practising Law - Employed` ont ete ecartes meme quand tout le reste correspondait.

### Etape 2 — Sourcing communautaire

Recherche des sources dont l'objet declare est de recenser des personnes ou des entreprises noires.

**Resultats :**
- **CABL** : pas de repertoire public de membres, site en HTTP 403 sur l'acces automatise. Impasse.
- **BFLN** : pas de liste publique de membres. Impasse.
- **ByBlacks** : repertoire d'entreprises exploitable, 58 fiches en trois pages. **Source principale.**
- **Black Business Direct** : section juridique Ontario exploitable. Source secondaire.
- **AfroBiz** : pages de categorie en HTTP 404 sur l'acces automatise ; seules les entrees remontees par recherche ont pu etre exploitees. Source sous-exploitee.

Pool brut constitue : environ 50 candidats.

### Etape 3 — Verification des permis

Chaque candidat a ete verifie au repertoire public du Barreau de l'Ontario, par lots de requetes lancees depuis le navigateur sur l'origine du site.

Note technique : le jeu de resultats complet est integre dans le HTML de la page de resultats, dans un objet `contactsObject`. Les champs courriel et telephone y sont vides, ce qui a impose de chercher les coordonnees ailleurs. Cette contrainte est en fait salutaire : aucune coordonnee de prospection ne provient du repertoire de l'ordre professionnel.

**Ce que la verification a change :**

| Constat | Nombre | Effet |
|---|---|---|
| Permis revoque ou suspendu | 4 | Ecartes |
| Statut `Practising Law - Employed` (salarie) | 1 | Ecarte, ne correspond pas a « a son propre compte » |
| Statut `Not Working` | 2 | Ecartes |
| Introuvable au repertoire des avocats | 5 | Ecartes |

Douze candidats sur environ cinquante n'ont pas passe cette etape. C'est la valeur reelle de la verification : sans elle, un quart de la liste aurait ete inutilisable, dont quatre avocats qui ne peuvent pas legalement exercer aujourd'hui.

### Etape 4 — Enrichissement

Consultation des sites officiels pour le decideur nomme, la taille, les coordonnees publiees et les signaux operationnels observables : prise de rendez-vous en ligne, portail client, formulaire d'admission, paiement en ligne, millesime du pied de page.

**Constat transversal :** sur l'ensemble des sites lus, **aucun portail client** n'a ete repere. Trois cabinets offrent une prise de rendez-vous en ligne.

**Incident notable :** le site mattislaw.ca renvoie une erreur de certificat SSL. Ce n'est pas un echec de la recherche mais un signal observable, conserve tel quel dans la fiche du prospect.

### Etape 5 — Notation et livrables

Application de la grille demandee (taille 25, decision 20, besoins 20, croissance 15, contact 10, communaute 10), avec le detail de chaque composante conserve dans le CSV pour que la note soit auditable.

Deux corrections apportees en cours de generation :
1. Le premier classement placait deux associes du meme cabinet dans le top 10. Deduplique par cabinet.
2. Les prospects dont le site n'a pas ete consulte recevaient une note de « besoins » identique a ceux dont les signaux avaient ete verifies. Corrige : sans site consulte, la note de besoins tombe a 6 sur 20, parce qu'une hypothese non etayee ne vaut pas un fait observe.

---

## Decisions de jugement, et leur raison

**1. Deux statuts d'identite distincts plutot qu'un seul.**
« Identite communautaire publiquement confirmee » (2 prospects) exige une association professionnelle noire documentee ou une auto-identification du cabinet. « Affiliation communautaire confirmee » (29 prospects) signifie que le cabinet est inscrit dans un repertoire a objet explicite. Les confondre aurait laisse croire a une certitude qui n'existe pas : une inscription au repertoire est un acte de l'entreprise, pas une declaration d'identite de la personne.

**2. Efe Maris Jesuorobo et Kerry-ann Mattis-Harrison ecartees.**
Toutes deux sont avocates en pratique privee en Ontario et correspondent au profil commercial. Toutes deux sont remontees uniquement parce que leur patronyme ressemblait a celui d'un prospect deja identifie. Aucune source communautaire ne les concerne. Les retenir aurait ete exactement la deduction interdite.

**3. Les associes d'un meme cabinet gardes comme lignes distinctes, mais signales.**
Taiwo Olalere et Benito Palomino apparaissent au CSV comme seconds contacts de cabinets deja listes. Leur fiche le dit explicitement. Pour Benito Palomino, le statut communautaire individuel est marque « Non verifie » : le cabinet est inscrit au repertoire, pas la personne.

**4. Aucune adresse civique dans les livrables.**
Le repertoire du Barreau publie des adresses d'affaires qui, pour un praticien a domicile, sont des adresses residentielles. Seule la ville a ete conservee. Un prospect a d'ailleurs une adresse d'affaires de type residentiel ; le fait est mentionne comme signal, l'adresse ne l'est pas.

**5. Les agregateurs de donnees de contact ecartes.**
ZoomInfo, ContactOut et Lawyer.com sont apparus dans les resultats. Leurs coordonnees ne sont pas publiees par les cabinets eux-memes. Seules les coordonnees que le cabinet a lui-meme mises en ligne pour etre joint ont ete retenues.

---

## Ce qui reste ouvert

1. **Sept cabinets** figurent dans un repertoire communautaire sans qu'aucun avocat nomme ait pu etre identifie, donc sans verification de permis possible. Ils sont listes a part dans le rapport et **ne sont pas dans le CSV**. Cinq minutes sur chaque site suffiraient probablement a les recuperer.
2. **AfroBiz est sous-exploite** faute d'acces automatise a ses pages de categorie. Une consultation manuelle des pages Toronto, Brampton, Mississauga, Scarborough et North York ajouterait vraisemblablement des prospects.
3. **Aucun prospect confirme a Hamilton, London, Windsor et Kitchener-Waterloo**, alors que ces villes faisaient partie de la zone demandee. Les repertoires communautaires consultes sont fortement centres sur le Grand Toronto et Ottawa.
4. **La date d'assermentation n'a pas ete collectee**, alors que le repertoire du Barreau la publie sur les fiches individuelles. C'est le meilleur indicateur public de l'anciennete d'une pratique, et il permettrait de mieux departager les priorites A.
5. **Le champ « Real estate insured » du repertoire du Barreau n'a pas ete recolte.** Il indique qu'un avocat a souscrit l'assurance immobiliere, donc qu'il fait reellement de l'immobilier, donc qu'il a du volume en fideicommis. C'est le meilleur signal public d'exposition disponible pour SAFE.

---

## Prochaine action suggeree

Reprendre les cinq premiers du top 10, verifier a la main leur site en cinq minutes chacun, et confirmer que le decideur identifie est bien la personne qui decide des outils. C'est le seul point que ni le repertoire du Barreau ni les sites ne permettent d'etablir.

**Aucun contact n'a ete pris. Aucune personne n'a ete ajoutee a une liste de diffusion. Aucune campagne n'a ete redigee.**
