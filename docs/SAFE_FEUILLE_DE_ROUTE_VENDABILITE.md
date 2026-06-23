# SAFE — Feuille de route vers un produit vendable

Date : 2026-06-21
Statut : document maître. À valider une première fois (le plan), puis une seconde fois (les résultats).

> Objectif : rendre SAFE vendable sérieusement, avec toute la cohérence nécessaire.
> SAFE n'est pas QuickBooks. SAFE est SAFE : un outil pensé pour un avocat, qui parle le langage d'un avocat.

---

## 0. Comment ce document fonctionne (la règle du cap unique)

Ce document est la seule feuille de route active. Tant qu'il n'est pas terminé et validé deux fois, on ne part dans aucune autre direction.

La règle est simple :

1. Vous lisez ce document et vous le validez une première fois (le plan est bon).
2. On exécute, un chantier à la fois, dans l'ordre.
3. À la fin de chaque chantier, vous regardez le résultat réel à l'écran.
4. Quand tout est fait, vous validez une seconde fois (les résultats sont concluants).
5. Aucune autre modification du produit n'est faite en dehors de cette liste tant que ces deux validations ne sont pas obtenues.

Pas à gauche, pas à droite. On finit ça d'abord.

---

## 1. Résumé exécutif (en clair)

SAFE est en bien meilleur état qu'un produit en construction. Les fondations tiennent : la facturation fonctionne, le fidéicommis est protégé selon les règles du Barreau, les tests passent, et la plupart des écrans sont propres. Le travail qui reste n'est pas de « réparer ce qui est cassé ». C'est de rendre le produit **cohérent, rassurant et fier d'être montré** à un vrai cabinet.

Quatre choses doivent être améliorées avant de vendre. Voici lesquelles, et surtout **pourquoi elles comptent** :

| # | Ce qu'il faut améliorer | Pourquoi (la conséquence si on ne le fait pas) |
| --- | --- | --- |
| A | **Les courriels envoyés aux clients** (facture, rappel, document) ne disent jamais comment payer, et le ton est parfois froid. | Le client reçoit un montant à payer mais aucune instruction pour le faire. Résultat : il paie en retard, ou il appelle pour demander comment payer. Mauvaise première impression, argent qui rentre plus lentement. |
| B | **L'éditeur de facture que vous voyez dans l'application n'est pas le même document propre que le client reçoit.** | Vous regardez un aperçu chargé et vous doutez de votre propre outil. Pire : si un jour cet aperçu chargé partait au client, l'image du cabinet en souffrirait. |
| C | **L'écran de comptabilité ouvre sur du vocabulaire comptable** (journaux, Entrée/Sortie) au lieu de parler avocat et de mettre le fidéicommis en vedette. | L'avocat a l'impression d'ouvrir un logiciel de comptable, pas un outil juridique. Le seul point qui l'inquiète vraiment, sa conformité au Barreau (le fidéicommis), est caché sur une autre page. |
| D | **L'entrée dans le produit (l'écran de configuration initiale) ne sauvegarde rien.** | Un nouveau cabinet remplit le formulaire de départ, croit s'être configuré, et ne retrouve rien. Il doit tout recommencer. C'est le pire moment pour décevoir. |

**La bonne nouvelle, vérifiée dans le code :**

- La facture finale (le PDF) que reçoit le client est **déjà propre** et respecte vos règles : une seule couleur de marque, jamais de numéro de Barreau dessus.
- **Cinq des six** problèmes d'interface signalés auparavant sont **déjà corrigés** (écrans vides guidés, doublons de menus, découverte des sous-pages de facturation, couleurs centralisées, formulaires unifiés).
- Le fidéicommis est déjà solidement protégé selon les règles du Barreau (séparation des fonds, plafond espèces, certification).

Autrement dit : il reste surtout du travail de **cohérence et de finition**, pas de la reconstruction.

---

## 2. Le coût de l'inaction (pourquoi on fait ça maintenant)

Si on vend SAFE en l'état, voici ce qu'un vrai cabinet vivrait :

- Il envoie sa première facture. Son client répond « comment je vous paie ? ». L'avocat a l'air mal préparé.
- Il ouvre son outil pour vérifier sa facture, la trouve moins belle que dans son ancien logiciel, et perd confiance.
- Il ouvre la comptabilité et voit des mots de comptable. Il se dit « ce n'est pas pour moi, c'est trop compliqué ».
- Il fait sa configuration de départ, perd ses données, et se demande si le produit est fiable.

Aucun de ces moments n'est un bug technique. Ce sont des **moments de confiance perdue**. Et la confiance, chez un avocat prudent, ne se rattrape pas facilement. C'est exactement ça qu'on corrige.

---

## 3. Ce qui est déjà bon (à protéger, ne pas toucher)

Pour ne pas casser ce qui marche pendant qu'on améliore le reste :

- La **facture PDF finale** envoyée au client respecte déjà la sobriété et vos règles.
- Le **fidéicommis** est protégé (soldes négatifs bloqués, plafond espèces, séparation par client, certification, rapprochement).
- Les **écrans vides** des pages clients, dossiers et facturation guident déjà l'utilisateur.
- Les **sous-pages de facturation** sont déjà accessibles depuis un tableau de cartes.
- Le **vocabulaire des opérations** dans le journal est déjà lisible (Facture, Paiement, Débours), pas en code brut.

On laisse tout ça tel quel.

---

## 4. Les quatre chantiers de vendabilité

Chaque chantier est décrit en clair : l'état vérifié, ce qu'on change, et à quoi ça ressemble une fois terminé.

### Chantier A — Des courriels clients humains, avec le paiement Interac

**État vérifié.** Les courriels existent et sont propres, mais aucun ne dit comment payer. Le courriel de facture donne le montant et l'échéance, jamais le mode de paiement. Le rappel est un peu sec. Les couleurs varient d'un courriel à l'autre (un vert ici, un bleu ailleurs). Détail utile : le cabinet indique déjà ses modes de paiement au moment de la configuration, mais cette information ne se rend jamais jusqu'au courriel.

**Ce qu'on change.**

- On ajoute, dans le courriel de facture et dans la page de facture en ligne, une section claire « Comment payer » qui affiche les modes de paiement que le cabinet a configurés : son adresse de virement Interac et/ou un lien de paiement externe (Stripe, PayPal, Square, etc.) que le cabinet colle lui-même. L'argent va directement dans le compte du cabinet ; pour l'instant SAFE affiche le lien, il ne traite pas le paiement.
- Règle dure : le fidéicommis n'est JAMAIS payé par un lien de processeur. Les liens de paiement ne servent qu'aux factures du compte d'opérations.
- On réchauffe le ton des courriels : humain, doux, respectueux, peu de jargon.
- On uniformise une seule couleur de marque pour tous les courriels.

**À quoi ça ressemble une fois fini.** Le client reçoit un courriel qui ressemble à ceci :

> Objet : Votre facture du cabinet [Cabinet]
>
> Bonjour [Prénom],
>
> Merci de votre confiance. Vous trouverez votre facture en pièce jointe.
>
> Montant : [montant], à régler d'ici le [date].
>
> Pour régler votre facture, selon ce qui vous convient :
> par virement Interac à [courriel], ou par paiement en ligne sécurisé via ce lien : [lien].
>
> Merci d'indiquer le numéro de facture [numéro] dans votre paiement.
>
> Pour toute question sur cette facture, écrivez-nous, nous sommes là pour vous aider.
>
> Au plaisir,
> [Cabinet]

**Définition de terminé.** Le courriel de facture et la facture en ligne affichent les modes de paiement configurés par le cabinet (Interac et/ou lien de paiement), l'argent va directement au cabinet, et le fidéicommis n'est jamais proposé via un lien. Le ton est humain. Une seule couleur de marque sur l'ensemble des courriels.

---

### Chantier B — Une seule facture, propre, partout

**État vérifié.** Surprise utile : le document final envoyé au client (le PDF) est déjà sobre et respecte vos règles. Ce qui a l'air amateur, c'est **l'aperçu affiché dans l'application**, qui est un gabarit différent et plus chargé (plusieurs couleurs, hiérarchie moins nette). Vous regardez donc une version qui n'est pas celle que reçoit le client. Il existe aussi un vieux gabarit inutilisé qui traîne et entretient la confusion.

**Ce qu'on change.**

- On fait en sorte que **l'aperçu dans l'application soit exactement le document propre que le client reçoit**. Ce que vous voyez est ce que le client voit.
- On supprime le vieux gabarit inutilisé.
- On verrouille par un test le fait que l'aperçu, le PDF et la facture en ligne affichent les mêmes montants et la même présentation.

**À quoi ça ressemble une fois fini.** Vous ouvrez une facture dans SAFE, vous voyez le document final, propre, identique à celui que le client recevra. Plus de doute, plus de divergence.

**Définition de terminé.** Une seule présentation de facture, sobre, identique à l'écran, en PDF et en ligne, garantie par un test.

---

### Chantier C — Une comptabilité qui parle avocat (pas QuickBooks)

**État vérifié.** L'écran de comptabilité parle déjà un peu avocat dans ses indicateurs (Facturé, Encaissé, Débours). Mais il ouvre sur des onglets nommés « Journal général » et « Journal des dépenses », avec des colonnes « Entrée » et « Sortie ». Et surtout, le **fidéicommis, qui est LE point de conformité au Barreau, est absent de cet écran** : il faut aller sur une autre page pour le voir. L'avocat ne voit pas d'un coup d'œil si sa conformité fiduciaire est à jour.

**Ce qu'on change.** On ne reconstruit rien, on **recadre**.

- On met en haut de la comptabilité un bandeau clair sur le fidéicommis : « Conformité fiduciaire : à jour » ou « Rapprochement en retard, action requise », avec un lien direct.
- On renomme les onglets et colonnes en langage d'avocat (par exemple « Argent reçu / Argent dépensé » plutôt que « Entrée / Sortie »).
- On garde le détail comptable (les journaux) disponible, mais présenté comme un « mode détaillé », pas comme la première chose qu'on voit.
- On affiche clairement que SAFE prépare et exporte la comptabilité pour le vrai comptable, sans prétendre le remplacer.

**À quoi ça ressemble une fois fini.** L'avocat ouvre la comptabilité et voit d'abord ce qui le rassure : son fidéicommis est conforme, son argent est compréhensible. Le vocabulaire de comptable est rangé dans un coin pour ceux qui le veulent.

**Définition de terminé.** Le fidéicommis et la conformité Barreau sont la première chose visible. Le vocabulaire parle avocat. Le détail comptable reste accessible en second plan.

---

### Chantier D — Une entrée dans le produit qui sauvegarde vraiment

**État vérifié.** L'écran de configuration initiale (onboarding) ne sauvegarde rien : c'est un formulaire qui donne l'illusion d'enregistrer. C'est le seul problème d'interface qui reste vraiment ouvert. À noter aussi : le tableau de bord détecte bien un cabinet neuf, mais n'affiche pas encore le guidage de démarrage prévu.

**Ce qu'on change.**

- D'abord, on cache immédiatement le faux formulaire pour ne plus jamais donner l'illusion de sauvegarder.
- Ensuite, on construit une vraie entrée qui enregistre le cabinet, le profil, la configuration et le premier client, puis amène l'utilisateur vers un tableau de bord qui le guide.
- On termine le petit guidage de démarrage sur le tableau de bord d'un cabinet neuf.

**Portée à ne pas dépasser.** Ce chantier fait une configuration **qui se sauvegarde et qui est modifiable** par le cabinet (Interac, lien de paiement, taxes, logo). Il ne construit PAS le moteur de configuration automatique (audit qui génère tout seul la configuration). Ce moteur appartient à la phase de scalabilité : on configure les premiers cabinets à la main, on observe ce qui revient, puis seulement on automatise. Automatiser avant d'avoir vu plusieurs vrais cabinets, ce serait automatiser des suppositions.

**Définition de terminé.** Un nouveau cabinet se configure, ses données sont sauvegardées, et il arrive sur un tableau de bord qui lui dit quoi faire.

---

## 5. Détails techniques (légers, pour l'exécution)

Cette section est volontairement courte. Elle existe pour l'exécution, pas pour la lecture.

**Chantier A — Courriels.**
- Fichiers : `lib/email.ts` (courriel de facture et rappel), `lib/services/client-send/email-templates.ts` (envoi de document), `app/facture/[token]/` (facture en ligne).
- Ajouter à la configuration du cabinet un champ adresse Interac et un champ lien de paiement (URL libre). Faire passer ces champs jusqu'aux courriels et à la facture en ligne, et n'afficher que les modes réellement remplis. Ajouter le bloc « Comment payer ». Garde-fou : ne jamais afficher de lien de paiement sur un dépôt fidéicommis. Réchauffer les textes. Une seule couleur de marque.
- L'intégration complète Stripe Connect (rapprochement automatique paiement-facture, argent transitant) reste en phase de scalabilité, hors de ce chantier.

**Chantier B — Facture unique.**
- Fichiers : `lib/invoice-template/` (les PDF propres font foi), `components/facturation/InvoiceTemplate*.tsx` (l'aperçu à aligner), `lib/services/billing/invoice-presenter.ts` (source des données).
- Aligner l'aperçu sur le PDF, supprimer le gabarit inutilisé, ajouter un test d'équivalence aperçu / PDF / en ligne.

**Chantier C — Comptabilité.**
- Fichiers : `app/(app)/comptabilite/`, `app/(app)/comptes/` (fidéicommis), `app/(app)/securite/` (alertes Barreau), libellés dans `messages/fr.json` et `messages/en.json`.
- Ajouter un bandeau de conformité fiduciaire en tête de comptabilité, renommer onglets et colonnes, présenter les journaux en mode détaillé.

**Chantier D — Onboarding.**
- Fichiers : `app/onboarding/page.tsx` (formulaire sans sauvegarde aujourd'hui), tableau de bord pour le guidage du cabinet neuf.
- Cacher le faux formulaire, créer la sauvegarde réelle, finir le guidage de démarrage.

Petit nettoyage au passage : le mot « Chargement… » écrit en dur dans la page d'audit gratuit alors qu'une traduction existe déjà.

---

## 6. Où ça s'insère dans le calendrier de production

Le calendrier détaillé semaine par semaine reste dans `SAFE_PRODUCTION_EDITORIAL_CALENDAR.md`. Voici comment ces quatre chantiers s'y rangent, sans casser l'ordre déjà établi :

| Chantier | Semaine | Remarque |
| --- | --- | --- |
| B — Une seule facture propre | Semaine 1 | Se fait avec le test d'équivalence facture déjà prévu. Même sujet, on le complète. |
| A — Courriels Interac | Semaine 1 | Juste après la facture, car les deux touchent au moment « j'envoie et je me fais payer ». |
| D — Onboarding qui sauvegarde | Semaine 2 | C'est déjà la semaine du premier usage. |
| C — Comptabilité qui parle avocat | Semaine 3 | C'est déjà la semaine « l'argent est compréhensible ». On y ajoute le bandeau fidéicommis et le langage avocat. |

Les semaines 4 à 7 (cycle dossier, connexion assistant-avocat, navigation, démo) restent comme prévu.

---

## 7. La double validation (ce que veut dire « terminé »)

On considère le travail vraiment terminé seulement après deux validations distinctes :

**Validation 1, maintenant : le plan.** Vous lisez ce document et vous confirmez que ces quatre chantiers sont les bons, dans cet ordre.

**Validation 2, plus tard : les résultats.** Une fois construits, vous regardez vous-même, à l'écran :

- un courriel de facture réel, avec les instructions Interac, le ton humain ;
- une facture dans l'application, identique au document que reçoit le client ;
- l'écran de comptabilité qui met le fidéicommis en avant et parle avocat ;
- un cabinet neuf qui se configure et dont les données sont bien sauvegardées.

Tant que ces résultats ne sont pas concluants à vos yeux, on ne touche à rien d'autre.

---

## 8. La règle d'or

SAFE n'a pas à être QuickBooks. SAFE n'a pas à être Clio. SAFE doit être **SAFE** : un outil qui donne à un avocat solo la rigueur d'une grande structure, dans un langage qu'il comprend, avec une facture dont il est fier, des courriels qui rassurent ses clients, et une comptabilité qui le garde conforme au Barreau sans le transformer en comptable.

C'est ça, le produit vendable. Et c'est exactement ce que ces quatre chantiers livrent.
