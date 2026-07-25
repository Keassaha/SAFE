# Refonte complète de la landing : 7 sections, philosophie en pleine lumière

Date : 2026-07-22

## Contexte

Diagnostic CEO : « Je n'aime pas ma landing page ». Causes identifiées ensemble : patchwork
de 3 styles, différenciateur/philosophie SAFE invisible, trop long, pas assez distinctif.
Souhait : une page simple qui respire la simplicité et le professionnalisme. Méthode validée :
refonte complète en une passe, Claude prend le volant.

## Ce qui a été construit

**Nouvelle colonne vertébrale (7 sections au lieu de 12)** dans `app/page.tsx` :
1. `Hero` — serif SAFE + produit rejoué en vrai DOM (tableau de dossiers + assistant
   « 0 écart, vous validez »), animations mesurées chez Attio (500 ms, cascade 120 ms,
   easing 0.2,0,0,1). Titre : « Votre cabinet, tenu sans faille. »
2. `Philosophie` (NOUVEAU) — le différenciateur en pleine lumière : « SAFE ne remplace
   personne. Il prépare, vous validez. » + « Votre adjointe est le copilote de votre
   cabinet. SAFE est le sien. » + 3 colonnes avocat/adjointe/cabinet.
3. `ProblemSection` — L'enjeu (conformité → fidéicommis → facturation), colonnes éditoriales.
4. `Piliers` (NOUVEAU) — la réponse, miroir de l'enjeu, mêmes 3 sujets même ordre.
5. `Commencer` (NOUVEAU) — étapes (audit → diagnostic → mise en service) + prix publics
   99/149 fusionnés, CTA audit unique.
6. `FoundingOffer` — conservé (50 $/mois ou 500 $/an, gelé à vie).
7. `FinalCta` — conservé (ton assurance tranquille).

**Sections retirées de la home** (fichiers conservés, plus importés) : NotYourFault,
VirtualEmployees, PourLadjointe (essence remontée dans Philosophie), FeaturesGrid,
ProduitEnVrai (le produit vit dans le hero), Objections, ProcessTimeline, PricingGrid.

**Une seule DA partout** : serif Instrument (titres) + sans (UI/données), canvas verdâtre,
colonnes à filets (pas de cartes-boîtes), folios « — 01 », vert réservé à l'action et au
vérifié, système d'animation unifié.

## Vérifié

- Compilation sans erreur, 7 sections rendues dans l'ordre, console propre.
- Hauteur de page : ~8 300 px (vs ~15 000+ avant), la page respire.
- Captures : hero serif + tableau vivant OK, Philosophie OK.

## Reste à faire

- Avis CEO sur la page complète (jugement sur un tout fini, pas des fragments).
- Candidats à suppression : les 8 composants orphelins + Solution/AgentsIA/FAQ (morts avant).
- Phases suivantes du plan Attio si validé : moment sombre fondateur, rail scrollytelling
  (optionnel maintenant que la page est courte).
- Décision en suspens : garanties 30 jours (tenues ?) ; témoignage Me Derisier à insérer
  quand accord obtenu.
