# 2026-08-08 · Liste de prospection, jeunes cabinets et petits cabinets du Québec

**Demande CEO** : une liste de jeunes cabinets, solos et 2 à 3 employés, pour appeler cinq cabinets
par jour du lundi au vendredi, avec un profil de cible clair et un suivi.

---

## Ce qui a été livré

| Livrable | Fichier |
|---|---|
| Profil de cible détaillé | `docs/marketing/ventes/ICP_JEUNE_CABINET_QC.md` |
| Liste de 163 cabinets + plan des 4 premières semaines | `docs/marketing/ventes/LISTE_PROSPECTION_QC_2026-08-08.md` |
| Fichier de travail | `docs/marketing/ventes/liste_prospection.csv` |
| Système de suivi quotidien | `docs/marketing/ventes/SUIVI_QUOTIDIEN_5_APPELS.md` |
| Scripts de sourcing, reproductibles | `scripts/prospection/` |

L'item bloquant « liste de 50 cabinets scorés » du pipeline d'acquisition est levé.

---

## Décisions prises

**1. Le bottin du Barreau ne sert pas à récolter des coordonnées.**
Le site du Barreau écrit explicitement que les coordonnées du bottin n'ont pas été fournies pour de
la sollicitation commerciale et qu'un tel usage est abusif au sens de ses conditions d'utilisation.
Les fiches individuelles sont d'ailleurs derrière un captcha, qui n'a pas été franchi.

Méthode retenue en conséquence : **le Tableau de l'Ordre identifie et qualifie** (nom du cabinet,
ville, avocats inscrits, domaines de droit, ce qui est l'usage prévu de la recherche par critères),
**les Pages Jaunes fournissent le numéro**, c'est-à-dire l'endroit où le cabinet a lui-même publié
son numéro pour être appelé. Vendre un produit de conformité à des avocats impose que la
provenance de la liste puisse se raconter à voix haute.

**2. L'ICP change d'ancienneté.** L'ancien profil visait 5 à 20 ans de pratique, au motif qu'il
fallait du budget. Le nouveau vise **0 à 8 ans depuis l'ouverture du cabinet** : un cabinet établi
a déjà un système, et le déloger est une deuxième vente. `ICP_CABINET_SOLO_QC.md` est marqué périmé
et pointe vers le nouveau.

**3. La cadence passe de deux blocs hebdomadaires à cinq appels par jour.** Même volume de 25 par
semaine, mais le courriel part le jour même, un bloc de 35 minutes ne se reporte pas, et une
formulation ratée se corrige le lendemain. Environ 3 h par semaine, sous le plafond de 4 h.

**4. L'axe « sous-outillage » a été calculé puis retiré du score.** Il valait 2 points sur 8 et
reposait sur « le cabinet n'a pas de site web listé aux Pages Jaunes ». Vérification faite, c'est
faux une fois sur deux : Morin Daoud, Gilbert Séguin, Mathieu Kellner et Cardinal Laroche ont tous
un site. Le signal poussait en tête de liste des cabinets établis depuis 1996. Retiré.

**5. Les appariements sous 0,85 sont exclus.** Neuf entrées ont été vérifiées à la main. Toutes
celles au-dessus de 0,85 étaient exactes, les trois fausses étaient toutes en dessous. Les 34
lignes concernées ont été retirées : 196 cabinets sont devenus 163. Un mauvais numéro au premier
appel discréditerait la liste entière.

---

## Chiffres de la récolte

| Étape | Volume |
|---|---|
| Lignes récoltées au Tableau de l'Ordre, 5 régions x 3 domaines | 1 882 |
| Cabinets distincts | 813 |
| Après exclusion des S.E.N.C.R.L., aide juridique, contentieux, 4 avocats et plus | 677 |
| Fiches Pages Jaunes récoltées, 30 villes | 1 822 |
| Appariés avec un numéro publié | 339 |
| Après dédoublonnage par numéro | 247 |
| Après resserrement de la règle d'appariement et exclusions | 196 |
| **Après retrait des appariements sous 0,85** | **163** |

Répartition finale : 28 cabinets récents confirmés, 87 d'âge inconnu à demander à l'appel,
48 établis mis en réserve. 126 solos, 31 cabinets de 2 à 3 avocats.

---

## Ce qui n'a pas fonctionné, et pourquoi

- **Le registre des entreprises du Québec.** C'était la meilleure source pour l'âge du cabinet
  (date d'immatriculation) et la taille (nombre de salariés déclarés). Le fichier de données
  ouvertes est en 403 hors navigateur, et la recherche web est en ASP.NET avec acceptation de
  conditions d'utilisation à chaque requête. Non viable pour 677 recherches.
- **L'âge des cabinets n'est pas public au Québec.** Contrairement à l'Ontario, où le répertoire du
  Barreau publie la date d'obtention du permis, le Tableau de l'Ordre du Québec ne publie pas
  l'année d'assermentation. L'âge est approximé par la date de création du nom de domaine web,
  retrouvée par `whois`, et par déduction de domaine pour 22 cabinets qui n'en déclaraient pas aux
  Pages Jaunes. Pour les 87 restants, l'âge se demande à l'appel.
- **Les Pages Jaunes penchent vers les cabinets établis.** Un solo de trois ans est plus souvent sur
  Google que dans un annuaire payant. C'est la limite structurelle de cette liste.

---

## Prochaines actions

1. **Tourner la vidéo de 3 minutes** (`KIT_TOURNAGE_VIDEO_3MIN.md`). Le courriel de l'étage 3
   s'appuie dessus. Reste bloquant.
2. **Vérifier que la landing et `lib/tarification.ts` disent bien 10 places, 50 $ et 75 $.** Un
   prospect qui vérifie ne doit pas lire autre chose. Reste bloquant.
3. **Récolter les régions de Québec, de l'Outaouais, de la Mauricie et de l'Estrie.** Non touchées,
   et de quoi doubler la liste. Une heure avec les scripts de `scripts/prospection/`.
