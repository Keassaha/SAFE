# Courriel à l'office manager · cabinet n° 4

**Contexte** : appel du 2026-07-30, l'office manager a donné sa permission d'écrire.

**Structure demandée (CEO, 2026-07-30)** : introduction de SAFE et de sa raison d'être,
puis l'élément différenciateur (bâti sur les règles du barreau, Québec et Ontario), puis le
fidéicommis, puis l'offre fondatrice avec la notion de partenariat, puis les liens. Rien
d'autre.

---

## Objet

**Suite à notre appel : SAFE en quelques lignes**

---

## Le courriel

> Bonjour [Prénom],
>
> Merci d'avoir pris le temps ce matin, et merci de m'autoriser à vous écrire.
>
> **Ce qu'est SAFE**
>
> SAFE est un logiciel de gestion pour les cabinets juridiques de petite taille. Il est né
> d'un constat simple : l'administration et la comptabilité prennent le temps qu'on
> voudrait donner aux dossiers, et les règles professionnelles demandent une vigilance de
> tous les jours. SAFE porte cette vigilance à votre place.
>
> **Ce qui le distingue**
>
> SAFE n'est pas un logiciel comptable auquel on aurait ajouté du juridique. Il est fondé
> sur les règles du barreau, de bout en bout. Chaque écriture et chaque blocage vient d'un
> texte, cité dans l'outil.
>
> SAFE couvre aujourd'hui le Barreau du Québec, règlement B-1, r. 5, et le Barreau de
> l'Ontario, By-Law 9. Les deux régimes sont traités séparément, avec ce qui leur est
> propre : le rapprochement dû dans les 25 jours en Ontario, les intérêts des comptes
> groupés versés à la Law Foundation of Ontario, et les obligations québécoises là où elles
> diffèrent.
>
> **Le fidéicommis**
>
> C'est le cœur de l'outil. Les comptes en fiducie sont tenus dans SAFE, pas à côté dans un
> chiffrier. Un geste non conforme est bloqué au moment où il est posé, pas découvert trois
> mois plus tard. Les rapprochements sont datés et suivis, et le dossier reste présentable
> en tout temps.
>
> Côté facturation, l'argent est inscrit une seule fois : la facture et le registre se font
> ensemble, à partir de la même entrée.
>
> **L'offre fondatrice**
>
> Nous ouvrons dix places à des cabinets qui veulent utiliser SAFE et contribuer à son
> amélioration. Ce n'est pas un rabais commercial, c'est un partenariat : vous nous dites ce
> qui manque, vos priorités passent devant, et en échange vous obtenez des conditions qui ne
> reviendront pas.
>
> Vos douze premiers mois sont à 50 $ par mois pour une pratique individuelle, 75 $ pour un
> cabinet avec adjointe. Ensuite votre tarif fondateur reste gelé à 79 $ ou 119 $ tant que
> votre abonnement demeure actif, au lieu des 99 $ ou 149 $ du tarif régulier. La mise en
> route est faite par nous, il n'y a aucun engagement de durée, et vos données s'exportent
> quand vous voulez.
>
> Tout est détaillé ici : https://safecabinet.ca/tarification
> Et le point de départ, un diagnostic de votre cabinet : https://safecabinet.ca/audit-gratuit
>
> Merci encore,
>
> Jérémie Tiahou
> SAFE · 819 271-9656
> https://www.linkedin.com/in/jeremie-tiahou-80a124331/

---

## Vérification faite avant d'écrire

La couverture ontarienne annoncée dans ce courriel a été vérifiée dans le code le
2026-07-30, pas supposée :

| Élément | Où |
|---|---|
| By-Law 9, art. 7 à 14 et 18, PDF officiel du 2017-04-27 | `lib/compliance/trust-bank-account.ts` |
| Délai de 25 jours, marqué propre à l'Ontario et jamais affiché au Québec | `lib/compliance/rules.ts` |
| Intérêts vers la Law Foundation of Ontario, s. 57 Law Society Act | `lib/compliance/trust-bank-account.ts` |
| Bascule QC vers B-1 r.5, sinon LSO | `lib/cabinet/get-province.ts` |
| Compte particulier traité comme québécois seulement | `lib/compliance/trust-bank-account.ts` |

**Réserve à connaître avant une démonstration, volontairement hors du courriel** : le
**Formulaire 9A**, exigé en Ontario pour tout virement électronique en fiducie, n'apparaît
pas dans le code. Si la question vient, la réponse est qu'il n'y est pas encore et que
c'est exactement le genre de priorité qu'un cabinet fondateur fait passer devant.

`[À CORRIGER]` `docs/research/RECHERCHE_clientele_franco_ontarienne_2026-07-26.md`,
constat n° 5, affirme que le moteur ne connaît pas ces règles. C'est faux depuis, ou ça
l'était déjà à l'écriture. Le document induit en erreur tant qu'il n'est pas annoté.

---

## Avant d'envoyer

Vérifiez le titre de votre profil LinkedIn. Elle va cliquer avant de répondre.

## Après l'envoi

[SUIVI_COHORTE.md](SUIVI_COHORTE.md) : état `COURRIEL_ENVOYE`, date, relance unique à J+5.
