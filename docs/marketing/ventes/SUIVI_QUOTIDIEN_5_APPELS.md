# Suivi quotidien · cinq appels par jour, du lundi au vendredi

> Créé le 2026-08-08. Remplace la cadence en deux blocs hebdomadaires de
> [PIPELINE_ACQUISITION_COHORTE_10.md](PIPELINE_ACQUISITION_COHORTE_10.md) section 3.
> Le reste du pipeline reste valable : les cinq étages, le courriel, les règles d'arrêt.
>
> Fichier opérationnel : **[liste_prospection.csv](liste_prospection.csv)**.
> Ce document-ci est le rythme. Le CSV est la mémoire.

---

## 1. Pourquoi cinq par jour plutôt que vingt-cinq le mardi

Même volume, 25 cabinets par semaine. Trois différences qui comptent.

- **Le fer reste chaud.** Le courriel doit partir le jour même de l'appel. Vingt-cinq permissions
  le mardi, c'est vingt-cinq courriels le mardi soir, et cinq qui ne partent jamais.
- **Cinq appels, ça ne se reporte pas.** Un bloc de deux heures se déplace. Trente-cinq minutes,
  non.
- **Vous apprenez cinq fois plus vite.** Une formulation qui ne marche pas se corrige mercredi
  matin au lieu de la semaine suivante.

Coût réel : **35 à 40 minutes par jour**, environ 3 h par semaine. Vous restez sous votre plafond
de 4 h, et l'heure qui reste paie les relances et les démos.

---

## 2. Le rituel, tous les jours

Toujours dans cet ordre. Il n'y a aucune décision à prendre pendant le rituel, c'est le but.

```
09 h 00   Ouvrir le CSV. Les cinq lignes du jour sont déjà décidées
          (plan des 4 semaines dans la liste). Ne pas en choisir d'autres.
09 h 02   Carnet ouvert. Une page, cinq lignes, un nom par ligne.
09 h 05   Appel 1. Puis note immédiate. Puis appel 2.
09 h 25   Cinq appels faits.
09 h 25   Les courriels des permissions obtenues. Maintenant, pas ce soir.
09 h 40   Fermé. On ne rouvre pas le fichier avant demain.
```

**Trois règles de bloc, non négociables.**

1. **La note se prend pendant l'appel, jamais après.** Ce qui n'est pas écrit dans les dix secondes
   est perdu.
2. **On n'ouvre pas le code pendant le bloc.** Ouvrir l'éditeur pendant le bloc tue le bloc.
3. **On ne cherche pas un numéro pendant le bloc.** Si une ligne est morte, on l'écrit et on passe.

---

## 3. Les états

Les mêmes que [SUIVI_COHORTE.md](SUIVI_COHORTE.md), pour que les deux fichiers restent compatibles.

| État | Quand | Ce qui suit, automatiquement |
|---|---|---|
| `A_APPELER` | par défaut | rien |
| `VOCAL` | boîte vocale, message laissé | courriel le jour même |
| `PERMISSION` | l'adresse a été donnée | courriel dans l'heure |
| `COURRIEL_ENVOYE` | envoyé | relance à **J+5** |
| `RELANCE` | relance envoyée | plus rien. Une seule relance. |
| `DEMO_PLANIFIEE` | date fixée | rappel la veille |
| `DEMO_FAITE` | tenue | décision sous 10 jours |
| `SIGNE` | 🎉 | rendez-vous J+30 pris **le jour même** |
| `NON` | refus clair | **terminal, on n'y retouche jamais** |
| `PLUS_TARD` | « pas maintenant » | reprise à 6 mois, pas avant |
| `APPEL_MANQUE` | coupure, transfert perdu, personne n'a compris | reprise par écrit, ce n'est pas un refus |
| `LIGNE_MORTE` | numéro invalide, cabinet fermé | rien, on sort la ligne |

`NON` est terminal. C'est ce qui rend la règle de non-confrontation tenable sur six mois.

---

## 4. Les relances, sans y penser

Une seule relance par cabinet, à J+5. Elle se calcule toute seule : la colonne **Date relance** du
CSV se remplit au moment où vous passez en `COURRIEL_ENVOYE`.

**Le lundi, avant les cinq appels du jour**, filtrez le CSV sur `Date relance <= aujourd'hui`.
C'est votre file de relances de la semaine. Cinq minutes.

Texte de la relance, inchangé :

> Je remonte ce courriel. Il reste [X] places sur dix. Si ce n'est pas pour vous, un simple non
> merci et je ne vous réécris plus.

Le nombre de places restantes est **toujours le vrai**. Jamais inventé.

---

## 5. Les cinq colonnes qui valent plus que tout le reste

Le CSV en a vingt-cinq. Cinq portent la valeur réelle, remplissez celles-là d'abord.

| Colonne | Pourquoi elle compte |
|---|---|
| **Qui a répondu** | Adjointe, avocat, boîte vocale, service externe. Après quarante appels, vous saurez à quelle heure appeler pour tomber sur qui. |
| **Cabinet depuis quand ?** | La donnée qui manque à toute la liste. Chaque appel la fabrique. |
| **Adjointe ?** | Décide si vous vendez 50 $ ou 75 $, et à qui vous parlez ensuite. |
| **Leurs mots exacts** | Vaut plus que n'importe quelle page de vente que vous pourriez écrire. Verbatim, avec la date. |
| **Prochaine action** | Une ligne vide ici est un cabinet perdu. |

Les verbatims se recopient chaque vendredi dans la section « Verbatims à garder » de
[SUIVI_COHORTE.md](SUIVI_COHORTE.md) et alimentent
[la banque de contenu LinkedIn](../linkedin/CONTENT_BANK.md).

---

## 6. Le vendredi, cinq minutes

Trois chiffres, rien d'autre. Toujours les mêmes, dans le même tableau.

| Semaine du | Appelés | Décrochés | Permissions | Courriels | Démos | Signatures |
|---|---|---|---|---|---|---|
| 2026-08-10 | | | | | | |
| 2026-08-17 | | | | | | |
| 2026-08-24 | | | | | | |
| 2026-08-31 | | | | | | |

**Après quatre semaines, ces chiffres remplacent les hypothèses de la section 1 du pipeline**, qui
sont marquées `INFERENCE` et ne valent rien. Cent appels, et vous aurez vos vrais taux. Ce sera le
premier actif commercial mesuré de SAFE.

Ajoutez une colonne si vous testez les deux scripts : **A ou B**. Le chiffre à comparer est le taux
de permission, pas votre impression après l'appel.

---

## 7. Les règles d'arrêt, écrites à froid

Pour ne pas avoir à décider à chaud, un mardi où trois personnes vous ont raccroché au nez.

- **100 appels, moins de 5 démos tenues** : le problème n'est ni le volume ni vous. C'est l'offre
  ou la cible. On arrête une semaine et on va parler à trois cabinets sans rien vendre.
- **6 semaines, moins de 2 signatures** : le bloc quotidien bascule vers la porte tenue de livres
  et les relais associatifs. L'appel à froid passe en secondaire.
- **La liste descend sous 50 cabinets non contactés** : le vendredi sert au sourcing, méthode
  décrite en fin de [LISTE_PROSPECTION_QC_2026-08-08.md](LISTE_PROSPECTION_QC_2026-08-08.md).
- **10 places prises** : on ferme, définitivement. L'offre ne revient pas, et c'est écrit sur le
  site, donc ça doit rester vrai.
- **Plafond de 4 h par semaine.** Une semaine à 8 h se paie la semaine suivante, et elle se paie
  sur le build.

---

## 8. Ce qui doit être prêt avant lundi

| Élément | État au 2026-08-08 | Bloquant |
|---|---|---|
| Liste de 50 cabinets scorés | **fait, 196 cabinets** | levé |
| Fichier de suivi | **fait**, `liste_prospection.csv` | levé |
| Script d'appel | fait, [SCRIPT_APPEL_v3.md](SCRIPT_APPEL_v3.md) | levé |
| Vidéo 3 min sur un vrai dossier | à tourner, [KIT_TOURNAGE_VIDEO_3MIN.md](KIT_TOURNAGE_VIDEO_3MIN.md) | **oui**, le courriel s'appuie dessus |
| Landing et `lib/tarification.ts` alignés sur 10 places / 50 $ / 75 $ | à vérifier | **oui**, un prospect qui vérifie ne doit pas lire autre chose |
| Entente de service fondateur, une page | à écrire | non, avant la première signature |

Les deux bloquants restants représentent environ une journée. Vous pouvez commencer les appels
avant qu'ils soient faits, à une condition : **ne pas promettre la vidéo dans le message vocal**
tant qu'elle n'existe pas.
