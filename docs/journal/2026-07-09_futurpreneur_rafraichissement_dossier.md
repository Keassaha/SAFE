# 2026-07-09 — Rafraîchissement du dossier Futurpreneur (plan d'affaires + prévisions)

## Contexte
Le dossier Futurpreneur (`~/Desktop/SAFE Inc./06 - Futurpreneur`) avait été monté en avril 2026. Trois mois plus tard, la stratégie a bougé au point de rendre les projections périmées. Décision CEO : rafraîchir le dossier avant de soumettre le brouillon (Futurpreneur révise gratuitement les brouillons).

## Incohérences repérées entre le dossier d'avril et la réalité de juillet
1. **Tarification** : le plan affichait Solo 99$ / Cabinet 150$ avec un revenu moyen de 115$/mois et des clients payants dès le mois 1. La source de vérité `lib/tarification.ts` dit : Solo 99$, Cabinet 149$, et surtout une **offre fondatrice** (5 places, 12 mois gratuits, 50$/mois à vie ou rachat unique 5000$) qui est le cœur de la mise en marché actuelle.
2. **Préchauffage** : aucune conversion volontaire avant le 2026-09-04. L'ancien plan faisait rentrer du revenu récurrent immédiatement, ce qui contredit la stratégie.
3. **Positionnement** : passé de « remplace l'adjointe » à copilote de l'équipe / partenariat (« on bâtit SAFE avec cinq cabinets »).
4. **Hébergement** : le stockage documentaire est déjà sur stockage privé chiffré (2026-07-06). L'ancien plan décrivait « Vercel US + Supabase US → à migrer », ce qui n'est plus tout à fait exact.

## Décision de modélisation (CEO)
Point d'ancrage retenu : **mois 0 du plan = fin du préchauffage + financement + incorporation ≈ automne 2026**. Donc « mois 1 » = début de l'acquisition payante, ce qui aligne le récit sur le préchauffage.

Scénario d'acquisition choisi par le CEO : **Base** (+2 à 3 clients/mois an 1, +4/mois an 2). Trois scénarios avaient été chiffrés (Conservateur / Base / Ambitieux) avec MRR fin et mois de rentabilité pour chacun.

## Modèle Base (chiffres figés, cohérents plan ↔ prévisions)
- Revenu moyen client régulier : 120$/mois (mix Solo 99$ / Cabinet 149$).
- Cohorte fondatrice : 5 cabinets gratuits 12 mois, puis 50$/mois; hypothèse 2 rachats à 5000$ (mois 4 et 9).
- Clients payants : 18 fin an 1, 55 fin an 2.
- MRR : 2 160$ (M12) → 6 750$ (M24). ARR fin an 2 : 81 000$.
- Seuil de rentabilité : ~25 clients, le MRR couvre les dépenses **à partir du mois 14**.
- An 1 déficitaire (~-10 383$), an 2 bénéficiaire (~+18 342$).
- **Trésorerie jamais sous ~53 649$** (creux au mois 8), fin à 72 959$ → argument de robustesse pour l'analyste.
- Financement 75k$ (Futurpreneur 25k + BDC 50k) inchangé.

## Buildé
- Nouveau script `generate_bp_v4.py` (basé sur v3, même charte SafePDF) qui régénère les deux PDF :
  - `02_Plan_Affaires_SAFE.pdf` (15 pages) : résumé exécutif, tarification, offre fondatrice, marché, concurrence, marketing (approche directe + preuve visuelle), plan financier, hébergement Canada reformulé, financement, jalons, risques, tous réécrits.
  - `03_Previsions_Tresorerie_24_mois.pdf` (5 pages) : cash flow mois par mois scénario Base, avec lignes fondateurs 50$ et rachats 5000$ distinctes.
- Vérifié au rendu : tableaux denses sans débordement, chiffres internes cohérents.

## Reste à faire (dossier)
- **À confirmer** : impôts à jour (critère d'admissibilité Futurpreneur).
- **À fournir par le CEO** : pièce d'identité, carte de résident permanent, captures/vidéo de démo.
- **Lettre d'intention Me Derisier (05)** : à faire signer.
- Checklist (01) : encore datée « Avril 2026 », structure de financement toujours valide (non régénérée cette session).
- Après signature LOI + docs perso : soumettre le brouillon sur futurpreneur.ca pour la révision gratuite.

## Note de cohérence (mémoire corrigée)
La note mémoire `project_pricing_model` indiquait « Setup 5000$/2500$ fondateur ». En réalité (`lib/tarification.ts` + journal 2026-06-29), le **5000$ est un rachat unique** (accès à vie sans abonnement), réservé aux 5 fondateurs, pas un frais de setup. La configuration est incluse dès le palier Solo (aucun frais de setup séparé). Mémoire mise à jour en conséquence.

## Idées à propager (content-bank / posts)
- Build-in-public : « pourquoi mes prévisions de financement montrent zéro revenu récurrent la première année » (la cohorte fondatrice gratuite comme choix stratégique assumé, pas une faiblesse).
- « La trésorerie qui ne descend jamais » : montrer qu'un plan sobre (petites dépenses + offre fondatrice) tient sans lever gros.
